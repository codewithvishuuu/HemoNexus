# AI_ML_STRATEGY.md — HemoNexus

**Status:** Target design. No model has been trained yet (see `PROJECT_AUDIT.md`).
**Governing rule:** *An LLM must never be used as a substitute for numerical forecasting.*

---

## 1. What we are actually predicting

Three distinct tasks, deliberately separated:

| Task | Output | Horizon | Method family |
|---|---|---|---|
| **T1 Demand forecast** | Expected units consumed per `(region, blood_group, component)` per week | 1–12 weeks | Time-series statistics (+ optional ML challenger) |
| **T2 Shortage risk** | Band `CRITICAL / HIGH / MODERATE / STABLE` per `(institution, group, component)` | As-of now + horizon | Deterministic rule/composite score over forecast + stock + supply |
| **T3 Explanation** | Natural-language reason from a structured factor object | On demand | Templates + optional LLM phrasing (no numbers invented) |

T2 is **not** a black-box classifier in v1. A transparent composite score is more defensible, easier to validate, and impossible to "hallucinate". A classifier is a P2 challenger, not the primary.

**Why not per-institution independent models:** with 8–12 institutions × 8 groups × 3 components = 192–288 series, most would be too sparse to fit reliably. We use a **hierarchical** approach: fit demand at the `(region, group, component)` level (24–72 series), then allocate to institutions by their historical share. This is standard hierarchical forecasting practice and matches realistic data availability.

---

## 2. Data requirements (minimum viable)

| Signal | Granularity | Source in demo | Why needed |
|---|---|---|---|
| Consumption events | Weekly count by group/component/institution | Synthetic generator | Target series for T1 |
| Stock on hand | Batch-level quantity + expiry date | Synthetic generator | Denominator for days-of-cover |
| Donation arrivals | Weekly count by group, lead time to availability | Synthetic generator | Inbound supply term |
| Expiry schedule | Batch expiry dates | Synthetic generator | Wastage risk and effective usable stock |
| Calendar | Week of year, festivals/holidays, exam/monsoon periods | Synthetic calendar + Open-Meteo weather (optional) | Seasonality covariates |
| Emergency events | Scripted spikes with start/end/delta | Synthetic scenario table | Stress-test and simulation truth |
| Transport time | Distance matrix between institutions | PostGIS `ST_Distance` + assumed speed | Matching rank, not clinical decision |

**Data volume target:** ≥24 months (ideally 36) of weekly consumption across ≥3 regions; ~150–250 weekly observations per aggregate series. This is enough for seasonal decomposition and a honest backtest. If fewer periods exist, the system must say "insufficient history" rather than emit a confident forecast.

**No real hospital data is used.** See `DATA_STRATEGY.md`.

---

## 3. Model selection (recommended, with justification)

### 3.1 Baselines — mandatory
- **Seasonal naive:** value from the same week 52 weeks ago (or 4-week average for short history).
- **Rolling mean:** trailing 4 and 13 weeks.
- Baselines are the benchmark every "advanced" model must beat. If it doesn't, ship the baseline.

### 3.2 Primary model — ETS / STL + Theta
- **Holt-Winters Exponential Smoothing** with additive trend and weekly/annual seasonal component, or **STL decomposition + Theta** for robustness.
- Implemented in Python with `statsmodels` (well-documented, deterministic, no GPU, fast on 100s of series).
- Why: 2–3 years of weekly data with strong seasonality is exactly the regime where classical methods are reliable and interpretable; they need far less data than deep learning and are auditable.
- Output: point forecast + residual-based prediction interval (e.g. empirical 80% interval from backtest residuals).

### 3.3 ML challenger (P2, conditional)
- `GradientBoostingRegressor` / `HistGradientBoostingRegressor` on engineered features:
  - lags 1, 2, 4, 13, 52; rolling mean/std 4 and 13; week-of-year sin/cos; holiday/festival flags; region and group one-hots; emergency-event flag.
- Promoted only if it beats ETS on the rolling-origin backtest by a material margin on WAPE **and** has stable errors across groups. Otherwise it stays as a research artifact.
- Explainability: SHAP values mapped onto the same human-readable factor names used by T2 so the UI stays consistent.

### 3.4 Risk classification (P2 only)
- Label a shortage event when `ending_stock < policy_days × forecast_daily_demand` (policy days configurable, default 3–5).
- Candidate: regularized logistic regression or gradient boosting with probability calibration (Platt/isotonic).
- Report precision, recall, PR-AUC and Brier score. **Do not display a "confidence %"** — display calibrated probability only if it passes a Brier-score check, and label it a probability, never "AI confidence".

### 3.5 Explicitly rejected approaches
- **LLMs for numeric forecasting** — no.
- **Deep learning / LSTMs / Transformers** — not enough real data; unjustifiable complexity for this stage.
- **Uncalibrated "risk percentage" from an LLM** — the reference app demonstrates this failure mode; prohibited.

---

## 4. The Blood Intelligence Score (transparent, reproducible)

For each `(institution, group, component)` at time `t`, compute standardized factors in `[0, 1]` where higher = more risk:

| Factor | Definition | Direction |
|---|---|---|
| `cover_risk` | `clamp((policy_days − days_of_cover) / policy_days)` where `days_of_cover = usable_stock / forecast_daily_demand` | ↑ when cover low |
| `demand_pressure` | `clamp((forecast_demand_next_week − trailing_4wk_demand) / trailing_4wk_demand)` | ↑ when demand rising |
| `supply_gap` | `clamp(1 − inbound_donations / forecast_demand_next_week)` | ↑ when inbound low |
| `expiry_pressure` | `clamp(expiring_units_next_14d / usable_stock)` | ↑ when stock about to expire |
| `network_scarcity` | `clamp(1 − verified_surplus_nearby / forecast_demand_next_week)` | ↑ when neighbours can't help |

Composite:

```
raw = w1*cover_risk + w2*demand_pressure + w3*supply_gap
    + w4*expiry_pressure + w5*network_scarcity
```

Default weights (documented, versioned, tunable — must be recorded with each score):
`w = [0.40, 0.20, 0.15, 0.10, 0.15]`.

Bands (policy thresholds, not learned):

| Band | `raw` range | Operational meaning |
|---|---|---|
| STABLE | < 0.30 | Routine monitoring |
| MODERATE | 0.30–0.49 | Watch; confirm inbound donations |
| HIGH | 0.50–0.69 | Prepare a transfer request; notify coordinator |
| CRITICAL | ≥ 0.70 | Escalate now; activate matching engine |

**Hard override:** `days_of_cover < 1` forces `CRITICAL` regardless of composite. Overrides are logged with reason.

**Explainability contract:** every stored score persists `factors`, `weights_version`, `input_snapshot`, and `band`. The UI renders factor contributions as a labelled bar list. A score without this payload is never shown. We do **not** invent a confidence percentage — we show the input timestamp, data mode, and backtest metrics instead.

---

## 5. Simulation engine (major differentiator)

**Design rule:** simulation reruns the *same deterministic functions* as the forecast path, on a cloned state. No separate "AI" is involved.

```
simulated_state = clone(current_state)
apply_scenario(simulated_state, scenario_delta)
sim_forecast = forecast(simulated_state.history_with_delta)
sim_score = intelligence_score(sim_forecast, simulated_state.stock)
```

| Scenario | Delta applied |
|---|---|
| Demand surge | Multiply consumption by `1 + p` for group/region over N days |
| O− emergency | Inject a one-off demand spike of size S at institution I |
| Inventory loss | Zero out a configurable fraction of batches at institution I |
| Regional shortage | Apply surge to all institutions in a region and reduce inbound donations |
| Added donations | Increase inbound arrivals by S over N days |

**Guardrails:**
- Simulation writes only to a `simulation_runs` table (or in-memory state for the demo); never to `inventory_batch`.
- Every response includes `assumptions[]`, `generated_at`, and `"mode": "SIMULATION"`.
- UI compares `actual_forecast` vs `simulated_forecast` in a two-column layout with explicit labels.
- Scenario deltas are validated (positive numbers, bounded horizon) so a typo cannot produce nonsense.

---

## 6. Evaluation plan

### 6.1 Backtest protocol
- **Rolling-origin evaluation** (time-series aware; never random k-fold, which leaks future into past).
- Minimum 4 folds, each with ≥8 weeks train / 4 weeks test.
- Evaluate per aggregate series and report macro-average plus group-level breakdown (O− and AB− deserve their own rows).
- Always report baseline alongside challenger.

### 6.2 Metrics
| Metric | Use | Target |
|---|---|---|
| MAE / RMSE | Absolute error in units | Report; no arbitrary threshold |
| WAPE = Σ|err| / Σactual | Comparable across groups | Challenger must beat seasonal naive |
| sMAPE | Percentage error | Report with caveat for low-volume groups |
| Bias (mean signed error) | Detect systematic over/under-forecast | |bias| small; document sign |
| Interval coverage | Honesty of uncertainty | Empirical coverage near nominal 80% |
| Shortage detection lead time | **The headline metric** | Risk engine flags seeded events ≥N days before stock-threshold rule (target: ≥5 days in demo) |
| Precision/recall (P2 classifier) | Event detection quality | Report PR-AUC, not just accuracy |

### 6.3 Synthetic stress events
The generator injects known shortage events with known onset dates. Detection lead time is measured against those labels. This is the single most persuasive evidence in the demo.

### 6.4 Acceptance gate for implementation
The pipeline is "done" only when a `backtest_report.csv` exists, is reproducible from the seed, and shows the chosen model beating the seasonal-naive baseline on WAPE. If it doesn't, we ship the baseline and say so.

---

## 7. Explainable assistant grounding

- Assistant receives **structured objects only** from read-only endpoints:
  `/api/intelligence/explain`, `/api/inventory/summary`, `/api/scores/history`, `/api/scenarios/list`.
- Tool outputs contain `{ values, factors, as_of, data_mode, source }`.
- Prompt instructs: use only supplied values; if a value is absent, say "data not available"; never compute clinical suitability; never present simulated values as real.
- Post-generation validation: any numeric token in the reply must appear in the tool payload (or be a clearly labelled arithmetic result from a whitelisted calculation). Violations are rejected/regenerated.
- No write tools are exposed to the assistant, ever.

---

## 8. Operational pipeline

```
Authorized inventory/donation events (API or CSV)
        │
        ▼
PostgreSQL (append-only event tables; current stock as materialized view)
        │
        ├── nightly job: aggregate → forecast (Python) → score → persist snapshot
        │                                      │
        │                                      ├── alerts on band change
        │                                      └── map hotspot refresh
        │
        └── on demand: simulation run (clone state) → side-by-side result
```

Idempotency: each run keyed by `(as_of_date, data_version)`; rerunning does not duplicate scores. Failures are logged and the last good snapshot remains visible with a "stale as of …" banner.

---

## 9. Honest limitations to state in the demo

- All data is simulated; no clinical validation.
- Forecast accuracy on synthetic data proves the pipeline works, not that it works in a real hospital.
- Weights and thresholds are policy choices, not learned clinical truths.
- Prediction intervals are empirical on simulated residuals; real-world uncertainty would be larger.
- The assistant explains; it does not decide.

---

## 10. Phase 0.1 — advanced validation, versioning and data sufficiency

### 10.1 Metric set (mandatory, all reported together)

| Metric | Formula / meaning | Why |
|---|---|---|
| **Seasonal-naive baseline** | Value from same week last year (or 4-week mean if <52 weeks) | Mandatory comparator |
| **Moving-average baseline** | Trailing 4- and 13-week mean | Second comparator; robust to sparse history |
| **MAE** | mean(\|actual − forecast\|) | Absolute error in units |
| **WAPE** | Σ\|err\| / Σactual | Comparable across high/low-volume groups |
| **MASE** | MAE / MAE of seasonal-naive on training data | Scale-free; <1 means better than baseline |
| **Forecast bias** | mean(forecast − actual) | Detects systematic over/under-supply |
| **Prediction-interval coverage** | fraction of actuals inside nominal 80% interval | Honesty of uncertainty; must be near nominal |
| **Event precision / recall** | Of predicted shortage events, how many were real; of real events, how many were caught | Decision quality, not just point accuracy |
| **Shortage detection lead time** | Days between first HIGH/CRITICAL alert and seeded event onset | Headline impact metric |
| **False alarm rate** | Predicted events with no real shortage / total predictions | Trust; too many alarms cause fatigue |
| **Missed shortage events** | Real events with no alert before onset | Safety; must be reported explicitly |

**MAPE is explicitly not the primary metric** because demand series can contain zero values (e.g. rare groups/components in small institutions), where MAPE is undefined or explosive. It may be shown only as a secondary, footnote-qualified figure when zeros are absent.

### 10.2 Minimum data requirements and insufficient-data state

- Minimum **104 weekly observations** (2 years) per aggregate series for seasonal models; **52 weeks** for the moving-average-only fallback.
- Minimum **4 rolling-origin folds** with ≥8 weeks train / ≥4 weeks test.
- Minimum completeness **85%** of expected weekly records and no unresolved duplicate/conflict in the evaluation window.

If any requirement fails, the API returns an explicit state — never a fabricated number:

```json
{ "status": "INSUFFICIENT_DATA", "reason": "only 61 weekly observations; need 104",
  "available": 61, "required": 104, "fallback": "SEASONAL_NAIVE_WITH_CAVEAT" }
```

UI renders: *"Insufficient data for a forecast — showing observed history only."* No score, band, or accuracy figure is emitted.

### 10.3 Data quality is not confidence [PROPOSED]

The Data Trust engine (`DATA_QUALITY_AND_INTEROPERABILITY.md`) produces freshness/completeness indicators. These describe **input quality**, not model confidence. The two are stored in separate fields, rendered with separate visual components, and never multiplied into a single "trust score". A stale inventory record does not change a backtest metric; a low backtest metric does not change a freshness badge.

### 10.4 Model versioning and reproducibility

- Every forecast snapshot records `model_version` (semantic), `training_window`, `seed`, `data_version`, `weights_version`, `code_commit`, `generated_at`.
- The synthetic generator and backtest job are seeded; `backtest_report.csv` must be reproducible byte-for-byte from the committed seed.
- Model promotion requires a recorded decision: challenger beats baseline on WAPE and MASE, has acceptable bias, and interval coverage within tolerance. Otherwise the baseline is retained and the decision is documented.

### 10.5 Drift monitoring

- Weekly monitoring of: input distribution shift (demand mean/variance by group), residual drift (MAE/WAPE rolling 8 weeks vs backtest), calibration of bands (observed shortage rate per band), and data-quality trends.
- Alert thresholds: WAPE degradation >25% vs backtest, band calibration inversion, or completeness <85%. Response: revert to baseline, flag "model degraded" in UI, and require revalidation — never silently continue using a degraded model.

### 10.6 Simulation validation

Simulations reuse the same forecast/score functions on cloned state. Validation asserts: identical inputs produce identical simulation outputs (determinism); simulation writes zero rows to production inventory tables; every result includes `assumptions`, `mode: SIMULATION`, and a timestamp.

---

## 11. Insufficient-data behaviour for every forecasting scenario [PROPOSED]

No scenario ever returns a fabricated point forecast, band, accuracy figure, or confidence value. Each returns a typed state with the reason and the safe fallback.

| Scenario / trigger | API state | UI behaviour | Fallback |
|---|---|---|---|
| Fewer than 104 weekly observations for seasonal model | `INSUFFICIENT_DATA` (`reason: HISTORY_SHORT`) | "Not enough history for a seasonal forecast" + observed history chart | 52-week moving average if ≥52 weeks; else none |
| Fewer than 52 weekly observations | `INSUFFICIENT_DATA` (`reason: HISTORY_CRITICAL`) | Observed history only, no forecast line | None; never extrapolate |
| Fewer than 4 rolling-origin folds available | `INSUFFICIENT_DATA` (`reason: FOLDS_SHORT`) | Backtest tab disabled with explanation | No model promotion decision |
| Completeness <85% | `DEGRADED` (`reason: MISSING_FIELDS`) | Score shown with amber "degraded inputs" flag and missing field list | Score computed but labelled; no interval |
| Verification `REJECTED` / unresolved conflict | `DATA_QUALITY_BLOCK` | No score; "Source blocked — review required" | Last good snapshot shown as `STALE` |
| Stale source beyond 2× threshold | `DATA_QUALITY_BLOCK` | No new score; freshness pill red | Last good snapshot with age banner |
| Zero-demand series (all zeros) | `NO_SIGNAL` | "No observed demand for this group/component" | No forecast; MAPE omitted |
| Intermittent demand with zeros | `LOW_VOLUME` | WAPE/MAE shown, MAPE explicitly omitted | Seasonal naive with caveat |
| No nearby verified surplus for scoring factor | `PARTIAL_FACTORS` | Factor shown as "network data unavailable" | `network_scarcity` factor omitted, weights renormalised and version recorded |
| Simulation with insufficient inputs | `SIMULATION_INPUT_ERROR` | Scenario not applied; assumptions list highlights missing inputs | No simulated result emitted |
| Model degraded by drift | `MODEL_DEGRADED` | "Model under review — showing baseline" | Seasonal naive until revalidation |
| Intelligence service unreachable | `SERVICE_UNAVAILABLE` | Last committed snapshot with `PRECOMPUTED — not live` label | Domain API serves cached snapshot; no new score |

**Universal rule:** every non-OK state includes `as_of`, `data_mode`, `reason`, and `available`/`required` counts where applicable. No state returns HTTP 200 with invented numbers.

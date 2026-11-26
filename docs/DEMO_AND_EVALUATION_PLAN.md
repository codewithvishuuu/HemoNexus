# DEMO_AND_EVALUATION_PLAN.md — HemoNexus

**Phase 0.1 document. No deployment or code changes. Access date: 2026-11-26.**
**All demo entities are [SIMULATED] with fictional names.** No real hospital, bank, donor or patient is represented.

---

## 1. Demo thesis

One continuous 8-minute story on a **clearly labelled synthetic regional network**: a seeded shortage is predicted, explained, located, matched to feasible surplus, rehearsed in simulation, approved by humans, and recorded in an audit trail. Every number shown comes from the seeded dataset or a deterministic computation — none from an LLM's imagination.

**Network fixture [SIMULATED]:** 3 regions, 10 fictional institutions (6 hospitals, 4 blood banks), 8 ABO/Rh groups, 3 components (RBC, Plasma, Platelets), 104 weekly observations per aggregate series, `seed = 42`, 4 known shortage events with onset dates.

---

## 2. The nine demo steps

| # | Step | Screen | Action shown | Evidence displayed | Acceptance criterion |
|---|---|---|---|---|---|
| 1 | Historical demand analysis | `/forecasts` | Show 2-year weekly consumption by group/component and the ABO/Rh distribution | Chart with labelled axes, data-mode badge, `as of` timestamp | All 24 aggregate series render; no empty/zero conflation |
| 2 | Shortage forecasting | `/forecasts` | Switch to "held-out weeks" view; show forecast + 80% interval vs actual | Backtest table with MAE, WAPE, MASE, bias, interval coverage; baseline comparison | Challenger promoted only if WAPE and MASE beat baselines; otherwise baseline shown with note |
| 3 | Explainable risk | `/institutions/[id]` | Open the seeded O− CRITICAL score | 5 factor bars (cover, demand, supply gap, expiry, network scarcity), weights version, hard-override note if any | ≥4 factors shown; band reproducible from stored inputs; no confidence % |
| 4 | Regional intelligence | `/map` | Filter group = O−, component = RBC; hotspot highlights | MapLibre points by band, nearby institutions, `SIMULATED DATA` badge | Clicking hotspot lists ≥2 nearby institutions with distance |
| 5 | Surplus discovery | `/map` side panel | Select a neighbouring blood bank | Verified units, expiry dates, quality badges, freshness pill | Ineligible units (unresolved excursion/quarantine) absent from available count |
| 6 | Transfer feasibility | `/approvals` or matching panel | Request feasibility check | Candidate ranked by transport time; chips for blockers; authorization state | Candidate with any blocker is non-actionable; no auto-approval |
| 7 | Emergency simulation | `/simulation` | Preset "O− demand +30% for 7 days" | Two-column compare: actual forecast vs simulated impact, assumptions list, watermark | Simulation writes zero rows to inventory; watermark visible; numbers differ as expected |
| 8 | Human approval | `/approvals` | Two institutional approvals + clinical sign-off with named reviewer | State transitions PENDING → APPROVED; reviewer identity and timestamp recorded | No transition without all three approvals; audit entry created |
| 9 | Audit history | `/reports` → audit viewer | Filter by transfer_request_id | Append-only log: inventory event, score computation, alert, simulation run, approvals | Every step 1–8 has a corresponding audited event |

---

## 3. Reproducible test scenario [SIMULATED]

```yaml
seed: 42
institutions: 10 (fictional names), 3 regions
groups: [A+, A-, B+, B-, AB+, AB-, O+, O-]
components: [RBC, Plasma, Platelets]
history_weeks: 104
held_out_weeks: 4
folds: 4 (rolling origin, 8+ weeks train each)
seeded_events:
  - id: E1, region: East, group: O-, component: RBC, onset: week 88, surge: +30%, duration: 7w
  - id: E2, region: North, group: AB-, component: Plasma, onset: week 96, surge: +45%, duration: 4w
quality_fixtures:
  - one unit with unresolved excursion
  - one quarantined unit
  - one stale institution source (>48h)
  - one incomplete source (completeness 80%)
  - one conflicting duplicate record
scenario: O- demand +30% for 7 days at institution H-03
```

**Expected headline result:** E1 produces a HIGH or CRITICAL band at least **5 days before** a naive stock-threshold rule, with ≥4 factor contributions; the simulation shows the projected shortage and a feasible surplus candidate in a neighbouring bank; all three approvals are required; audit contains all events.

If the seeded result does **not** meet the ≥5-day lead time, the demo must say so honestly and show the measured value — it must not substitute a fabricated number.

---

## 4. Measurable acceptance criteria

| Metric | Target | Source of truth |
|---|---|---|
| Demo completion | 9/9 steps without dead ends | Playwright E2E run |
| Data-mode labelling | 100% of screens and exports | Visual + DOM assertion |
| Explanation coverage | 100% of CRITICAL/HIGH scores show ≥4 factors | API payload check |
| Forecast lead time for E1 | ≥5 days (report actual if lower) | Backtest report |
| Ineligible-unit leakage | 0 units with unresolved quality/excursion shown as available | Test IDs U2/U3 |
| Double allocation | 0 | Concurrency test R1 |
| Simulation production writes | 0 rows | Test S3 |
| Approval integrity | 0 transfers without 2 institutional + 1 clinical approval | Test R5/R6 |
| Audit completeness | 1 event per demo step | Audit query |
| Assistant grounding | 0 fabricated numbers in 10 scripted questions | Numeric-token test |
| Visual review | 1366px and 390px, keyboard-only | Manual gate |

---

## 5. Evaluation mapping (internal planning weights)

| Demo step | Evaluation dimension supported |
|---|---|
| 1–2 | AI/ML implementation (20), problem understanding (10) |
| 3 | Explainability, innovation (15) |
| 4–6 | Technical architecture (15), functional completeness (15), real-world impact (10) |
| 7 | Innovation (15) — strongest differentiator |
| 8–9 | Security and reliability (5), safety, trust |
| Whole | UI/UX quality (10) |

See `HACKATHON_SCORECARD.md` for the honest current/target scores. Target after a clean run: **80/100**; stretch **88/100**.

---

## 6. Fallbacks and honesty rules

- If the Python service is unavailable, show the last committed backtest report and label it `PRECOMPUTED — not live`.
- If the map fails, use the accessible list view; do not fake map pins.
- If a forecast cannot be computed (insufficient data), show `INSUFFICIENT_DATA` and continue the story with observed history — never invent a forecast.
- Never name a real hospital, never show a real donor/patient record, never claim a clinical decision was made by the system.

---

## 7. Runbook (to be written at implementation time)

1. Clean clone → `npm install` in each app → `docker compose up -d` (Postgres+Redis) → `npm run seed`.
2. Start domain API, intelligence service, web app.
3. Open `/overview` with demo account `regional_coordinator@simulated.local`.
4. Execute steps 1–9 in order; capture screenshots and the audit export.
5. Run `npm run test:e2e` and `npm run test:backtest`; attach reports to the demo folder.

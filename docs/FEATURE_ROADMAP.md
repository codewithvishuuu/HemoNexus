# FEATURE_ROADMAP.md — HemoNexus

**Legend:** P0 = essential for a credible core product · P1 = high-value differentiators (the reason we win) · P2 = advanced enhancements (stretch).

Sequencing and dependencies are in `IMPLEMENTATION_PLAN.md`. Effort is relative (S/M/L), assuming 2–4 engineers.

---

## P0 — Essential (must ship)

| ID | Feature | Effort | Why essential | Acceptance criteria |
|---|---|---|---|---|
| P0-1 | Data model + synthetic data generator | L | Everything depends on it; no real data exists | PostgreSQL/PostGIS schema for `institution`, `blood_group`, `component`, `blood_unit`, `temperature_reading`, `excursion_event`, `component_rule`, `consumption_record`, `donation_event`, `data_trust_record`, `reservation`, `forecast_snapshot`, `risk_score`, `alert`, `transfer_request`, `simulation_run`, `audit_log`. Seeded generator produces ≥104 weeks of history for 8–12 fictional institutions. Every record has `is_simulated = true`. Generator is deterministic from checked-in `seed=42` with a pinned PRNG version and stable ordering (row hashes reproducible). |
| P0-2 | Auth + RBAC + institution scoping | M | Healthcare platform without isolation is not demoable | Six roles from `PRODUCT_VISION.md`. httpOnly JWT cookies. Every domain row has `institution_id`; non-admin queries are scoped server-side and by Postgres RLS. Unauthorized access returns 403 and writes an audit entry. |
| P0-3 | Inventory intake + current stock view | M | The system must know what it has | Authorized CSV/API intake validates group/component/quantity/expiry (Zod). UI shows stock by group/component with batch-level expiry. Invalid rows rejected with a reason; nothing silently dropped. |
| P0-4 | Deterministic forecasting pipeline | L | The "AI/ML" must be real math, not an LLM | Python service computes weekly demand forecasts per `(region, group, component)` with seasonal naive baseline + ETS/STL challenger. Rolling-origin backtest report with MAE, RMSE, WAPE and bias. Batch job runs on demand and nightly. |
| P0-5 | Blood Intelligence Score + factor decomposition | L | Turns forecasts into decisions | For each `(institution, group, component)` produce band (`CRITICAL/HIGH/MODERATE/STABLE`) from explicit thresholds on days-of-cover, forecast surplus/deficit, inbound supply, expiring units, and lead time. Response includes named factor contributions and a generated reason. Bands are reproducible from stored inputs. |
| P0-6 | Command-center dashboard | M | The product must be usable | Overview with network risk distribution, top at-risk groups, active alerts, and data-mode banner. Institution view with stock, risk, and factor breakdown. Responsive, keyboard accessible. |
| P0-7 | Alerts + notification centre | S | Coordinates action | Rule-based alerts on band transitions and expiry windows; deduplicated; read/acknowledge state; routed by institution and role. No external messaging in v1. |
| P0-8 | Audit log | S | Safety and security requirement | Append-only log of auth events, inventory mutations, score recomputations, alert acknowledgements, and transfer requests with actor, institution, timestamp, before/after summary. No patient data. |
| P0-9 | Safety & honesty guardrails | S | Non-negotiable | `SIMULATED DATA` label on all screens/exports; clinical-approval gate on transfer requests; no field accepts patient identifiers; LLM endpoints reject inventory mutation verbs. |

---

## P1 — High-value differentiators (build these; they are the moat)

| ID | Feature | Effort | Problem addressed | Acceptance criteria |
|---|---|---|---|---|
| P1-1 | Regional Intelligence Map | L | Institutions cannot see usable surplus nearby | MapLibre + PostGIS facility layers; hotspots by risk band; nearby institutions within configurable radius; clicking a hotspot lists candidate surplus with distance and transport-time estimate. All facilities fictional and labelled. |
| P1-2 | Smart matching UX (gating logic is **P0-14**) | M | Finding compatible stock is slow and error-prone | Presentation/ranking layer over the P0-14 feasibility engine: component filter, transport-time sorting, reasons/blockers display, authorization state. Output is a **suggestion list**, never an executed transfer. Clinical sign-off is a separate human step. Rules and gates live in P0-14; this item only renders them. |
| P1-3 | Emergency Simulation Engine | L | Teams cannot rehearse decisions | Scenario presets (demand +30%, O− surge, inventory loss, regional shortage, added donations) plus custom deltas. Runs the **same deterministic risk math** on a cloned state. Side-by-side "Forecast vs Simulation" with assumption list and `SIMULATION — NOT A FORECAST` watermark. Simulations never write to production inventory tables. |
| P1-4 | Expiry Intelligence | M | Wasted stock and unnoticed near-expiry risk | Batch-level expiry tracking; "expiring in 7/14/30 days" views; FEFO-prioritized suggestions; links into matching engine for authorized redistribution. |
| P1-5 | Explainable AI Assistant | L | Users need to understand *why*, in plain language | Read-only tool calls to platform APIs; answers composed from returned structured objects; every answer cites data timestamp and dataset mode; refuses questions about patient data or clinical suitability; scripted demo set of ≥10 questions with grounded answers. |
| P1-6 | Backtest & explainability report page | M | Judges need evidence, not assertions | Page showing rolling-origin backtest metrics vs baseline, seeded shortage event detection lead time, and factor contribution examples. Downloadable CSV of metrics. |

---

## P2 — Advanced enhancements (stretch, only after P0 + P1 are green)

| ID | Feature | Effort | Value | Acceptance criteria |
|---|---|---|---|---|
| P2-1 | Real-time inventory sync (Socket.IO) | M | Live network feel | Authorized inventory changes push events to connected clients; optimistic UI with server revalidation; reconnect handling. |
| P2-2 | Prediction intervals | M | Honest uncertainty | Quantile/interval output from residual bootstrap or quantile regression; displayed as ranges with empirical coverage from backtest. |
| P2-3 | ML challenger model + SHAP | L | Stronger AI/ML story | Gradient-boosted regressor with lag/calendar features evaluated against ETS; SHAP values shown for the same factor set; challenger promoted only if it beats baseline on backtest. |
| P2-4 | Multi-region hierarchy | M | Realistic networks | Regional aggregate forecasts reconciled with institution-level forecasts (top-down proportional allocation). |
| P2-5 | Institution onboarding wizard | L | Real-world path | Documented data dictionary, CSV template, provenance capture, verification workflow for a new institution. No real institution is onboarded during the hackathon. |
| P2-6 | Report exports & scheduled briefings | S | Usability | PDF/CSV exports with data-mode watermark; scheduled emaildigest to authorized roles (no patient data). |
| P2-7 | Dark/light theme + motion preferences | S | Polish/a11y | Theme respects `prefers-color-scheme`; animations respect `prefers-reduced-motion`. |

---

## Explicitly not on the roadmap

- Mobile native apps (the reference app's form factor is wrong for this product).
- LLM-generated numeric risk/confidence scores.
- Real patient data, donor PII, or real hospital identities in the demo.
- Automated blood transfer execution or clinical compatibility sign-off by software.
- Blockchain, microservices-for-show, or a new framework chosen for novelty.

---

## Definition of "done" for every item

1. Code merged with the smallest test or assert-based self-check for non-trivial logic.
2. API contract documented (route, role, input schema, output schema).
3. No secret or synthetic-as-real data leaks into the UI or logs.
4. Demo path works from a clean checkout with one documented command sequence.

---

## Phase 0.1 revision — added and reprioritized items

The tables above remain valid; the following items are **added** and, where they conflict, **supersede** the earlier priority. Full rationale is in `FINAL_REVIEW.md`.

### New P0 items (must ship — safety and trust are not optional)

| ID | Feature | Effort | Acceptance criteria |
|---|---|---|---|
| P0-10 | Unit-level inventory identity + quality state | L | Every blood unit has a unique ID, component type, collection/expiry dates, storage condition, quarantine flag, quality-verification flag, transport record, and distribution trace. Units with unresolved quality/temperature issues are excluded from all eligible-stock queries and from matching. |
| P0-11 | Configurable component shelf-life & storage rules | M | Rules sourced from applicable standards (`HEALTHCARE_STANDARDS_AND_COMPLIANCE.md`), versioned, and configurable per component; demo values are labelled and cite their source; software never declares clinical usability. |
| P0-12 | Data Trust engine + freshness indicator | M | Per-institution record of last update, source, verification status, missing/conflicting fields, stale threshold, completeness %. UI shows a transparent freshness indicator; the score is explicitly *not* forecast confidence. |
| P0-13 | Transactional reservation integrity | L | Reservation uses DB transaction + row lock or `SELECT … FOR UPDATE SKIP LOCKED`; idempotency keys; reservation expiry; duplicate detection; cancellation/rollback; immutable-style audit history. Concurrent test proves one unit cannot be reserved by two institutions. |
| P0-14 | Transfer feasibility engine | L | Evaluates component rules, institutional eligibility, verified inventory, expiry, transport time, cold-chain feasibility, reservation state, and authorization. Emits reasons/blockers; never approves clinical suitability. |
| P0-15 | DPDP-aligned data governance baseline | M | Data minimization (no donor/patient PII), purpose limitation, role-based access, retention/deletion policy, encryption at rest/in transit, incident-response runbook, auditability; phased commencement documented. |

### New P1 items

| ID | Feature | Effort | Acceptance criteria |
|---|---|---|---|
| P1-7 | Cold-chain intelligence | L | Temperature monitoring records and excursion events per unit/shipment; unresolved excursion blocks eligibility; configurable thresholds by component; demo generates simulated excursions. |
| P1-8 | Isolated simulation environment | M | Cloned snapshot, recorded inputs/results, side-by-side comparison, explicit `SIMULATION — NOT A FORECAST`, and an automated assertion that no simulation path writes to live inventory. |
| P1-9 | Advanced validation suite | M | MAE, WAPE, MASE, bias, interval coverage, event precision/recall, detection lead time, false-alarm rate, missed events; explicit insufficient-data state; no MAPE when zeros exist. |
| P1-10 | FHIR-ready interoperability layer | M | Domain→FHIR R5 `InventoryItem`/`InventoryReport` mapping documented and unit-tested for the subset used; no full FHIR server in v1. |

### Deferred / deprioritized

- P2-2 prediction intervals move to **P1** as part of P1-9 (honest uncertainty is core, not stretch).
- P2-3 ML challenger model stays **P2** and only after classical baselines are validated.
- P2-5 institution onboarding wizard stays **P2**; the interface is designed now, real onboarding is out of scope.
- Cosmetic theme work (P2-7) stays last.

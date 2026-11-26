# TESTING_AND_VALIDATION_STRATEGY.md — HemoNexus

**Phase 0.1 document. No code written or executed. Access date: 2026-11-26.**
**Evidence legend:** [PROPOSED] target test design · [SIMULATED] demo fixtures.

---

## 1. Testing principles

1. **Safety logic gets a test.** Any branch that can make a unit eligible/ineligible, reserve stock, approve a transfer, or emit a risk band has a deterministic test.
2. **No random assertions.** The synthetic generator is seeded; tests use fixed fixtures.
3. **Test the negative path.** For every "allowed" case, test the corresponding denial (stale data, unresolved excursion, cross-institution attempt, duplicate idempotency key).
4. **Reproducibility is a test.** Re-running the seed and backtest must produce identical artifacts.
5. **Simulated data only.** No test uses real institution or patient data.

---

## 2. Test pyramid [PROPOSED]

| Level | Tooling | Scope | Gate |
|---|---|---|---|
| Unit | Vitest (TS), pytest (Python) | Score factors, compatibility rules, validation schemas, DRY generator, FHIR mapping | Fast, runs on every change |
| Integration | Supertest + ephemeral Postgres with PostGIS + RLS | Auth, institution isolation, inventory events, reservations, transfer lifecycle, audit | Runs in CI |
| Forecast validation | pytest + committed fixture dataset | Backtest metrics, baselines, insufficient-data states, drift checks | Runs on data/model changes |
| Concurrency | k6 or custom script with parallel workers | Same unit reserved twice → exactly one winner | Runs in CI and before demo |
| Security | Automated role matrix + secret scan + dependency audit | RBAC/RLS, no PHI fields, no committed secrets | Runs in CI |
| Accessibility | axe-core + manual keyboard pass | Core screens, focus, contrast, reduced motion | Manual gate before demo |
| E2E demo | Playwright | The 9-step scripted demo in `DEMO_AND_EVALUATION_PLAN.md` | Release gate |

---

## 3. Domain-specific test cases

### 3.1 Unit eligibility and cold chain [PROPOSED]
| ID | Setup (SIMULATED) | Expected |
|---|---|---|
| U1 | Unit with `quality_verified = true`, no excursion, expiry +30d | In `eligible_for_matching` |
| U2 | Unresolved `excursion_event` | Excluded; UI shows `EXCURSION UNRESOLVED` |
| U3 | `quarantine_state = QUARANTINED` | Excluded; cannot be reserved |
| U4 | Expiry inside minimum remaining shelf life | Excluded from matching; appears in expiry watch |
| U5 | Missing storage condition | `missing_fields` populated; completeness recomputed; eligibility blocked |
| U6 | Conflicting duplicate natural key | `conflicts[]` recorded; trust gate blocks scoring |
| U7 | AI asked to mark a unit usable | Rejected — no write tool exists |

### 3.2 Data Trust engine [PROPOSED]
| ID | Setup | Expected |
|---|---|---|
| T1 | Stale source beyond 2× threshold | No new `risk_score`; UI `STALE`; API `DATA_QUALITY_BLOCK` |
| T2 | Completeness 80% | Score emitted with `DEGRADED` flag and reason |
| T3 | Verification REJECTED | Source excluded; alert to institution |
| T4 | Freshness band boundaries | Text matches timestamp exactly at 1h, 24h, 48h |
| T5 | Freshness vs confidence | Assert fields are separate in API and UI DOM |

### 3.3 Reservation and transfer integrity [PROPOSED]
| ID | Setup | Expected |
|---|---|---|
| R1 | Two concurrent reservations of same unit | Exactly one 201, one 409; DB has one active reservation |
| R2 | Duplicate idempotency key | Same `transfer_request_id` returned; no second row |
| R3 | Reservation expiry job runs | State `EXPIRED`; unit available again; audit entry |
| R4 | Cancel after approval started | Rollback; audit `CANCELLED`; no silent deletion |
| R5 | Transfer without both institutional approvals | 403; state unchanged |
| R6 | Transfer without clinical sign-off | 403; state `PENDING_CLINICAL` |
| R7 | Audit row update/delete attempt | No route exists; 404/405 |

### 3.4 Transfer feasibility [PROPOSED]
| ID | Setup | Expected |
|---|---|---|
| F1 | ABO/Rh compatible, verified, fresh, nearby | Candidate listed with reasons |
| F2 | Incompatible group | Blocked with `COMPATIBILITY_RULE` reason |
| F3 | Valid group but unresolved excursion | Blocked with `QUALITY` reason |
| F4 | Transport exceeds cold-chain window | Blocked with `COLD_CHAIN` reason |
| F5 | Unit already reserved | Blocked with `RESERVED` reason |
| F6 | Any candidate with blocker | Non-actionable in UI; no "approve" button |

**Note:** tests assert rule-based gating only. They never assert that a unit is clinically suitable — that decision is out of system.

### 3.5 Forecast validation [PROPOSED]
| ID | Check | Expected |
|---|---|---|
| V1 | Seasonal-naive and moving-average baselines computed | Present in report for every series |
| V2 | ETS challenger vs baseline | Promoted only if WAPE **and** MASE improve; else baseline retained with decision log |
| V3 | MAE / WAPE / MASE / bias / interval coverage / precision / recall / lead time / false alarms / missed events | All present in `backtest_report.csv` |
| V4 | Series with zeros | MAPE omitted; no divide-by-zero error |
| V5 | 61 weekly observations | `INSUFFICIENT_DATA` with counts; no forecast emitted |
| V6 | Determinism | Same seed → identical CSV bytes |
| V7 | Interval coverage | Within tolerance of nominal 80%; otherwise model flagged |
| V8 | Drift injection | WAPE degradation >25% triggers `MODEL_DEGRADED` state |
| V9 | Seeded shortage event | Detection lead time ≥5 days vs stock-threshold rule |
| V10 | Missed event | Counted and displayed, not hidden |

### 3.6 Simulation safety [PROPOSED]
| ID | Check | Expected |
|---|---|---|
| S1 | Simulation of O− surge | Projected stock differs from baseline; inputs recorded |
| S2 | Identical scenario run twice | Identical output (determinism) |
| S3 | Count rows in `inventory_batch` before/after | Zero change |
| S4 | Response metadata | `mode: SIMULATION`, `assumptions[]`, `generated_at` |
| S5 | UI watermark | Present on every simulation state, including results |
| S6 | "Escalate for real" | Requires separate confirmation + auth + audit entry |

### 3.7 Security and privacy [PROPOSED]
- Role × endpoint matrix test for all six roles; cross-institution reads return aggregated data only.
- RLS integration test with two institutions; admin bypass audited.
- Schema scan: no column named patient/donor/name/phone/Aadhaar; no PHI fields.
- Secret scan on repository; `.env.example` only; CI fails on high-severity dependency findings.
- Assistant tool allowlist: read-only; no inventory mutation tool registered.
- Numeric-token grounding: every number in a scripted answer appears in tool payload.

### 3.8 Accessibility [PROPOSED]
- axe-core zero critical violations on: overview, inventory, map (list alternative), simulation, approvals, assistant.
- Keyboard-only completion of the 9-step demo.
- Focus visible on all interactive elements; band labels textual; reduced-motion honored.

---

## 4. Acceptance criteria (release gate)

1. All test IDs above pass, or each failure has a documented waiver approved before demo.
2. Backtest report exists and is byte-reproducible from the committed seed.
3. Concurrency test proves no double allocation.
4. Simulation purity assertion passes.
5. No secrets, no real institution names, no patient data.
6. DPDP and standards items marked [PARTIALLY VERIFIED]/[UNVERIFIED] are not presented as verified claims in the UI.
7. E2E demo completes with no dead ends.

---

## 5. Data fixtures [SIMULATED]

- `seed=42`, 8–12 fictional institutions, 3 regions, 8 blood groups, 3 components, 24 months weekly history.
- Known seeded shortage events with onset dates for lead-time measurement.
- At least one unresolved excursion, one quarantined unit, one stale source, one conflicting record, one low-completeness source, and one concurrent-reservation pair.
- All fixture entities carry `is_simulated = true` and fictional names.

---

## 6. End-to-end acceptance test — complete emergency scenario [PROPOSED]

Playwright script mirrors `DEMO_AND_EVALUATION_PLAN.md` §2. Each step has an assertable outcome, so a failure is attributable.

| Step | E2E assertion |
|---|---|
| E0 Seed | `npm run seed` twice → identical row hashes; 10 institutions, 104 weeks, 4 events |
| E1 History | 24 aggregate series render; `SIMULATED DATA` badge and as-of timestamp present |
| E2 Forecast | Backtest table contains all 10 required metrics; baseline row present; no MAPE for zero-demand series |
| E3 Risk | O− CRITICAL score has ≥4 factor bars; recomputing from persisted inputs yields same band |
| E4 Map | Filter O−/RBC shows ≥2 nearby institutions with distance; list alternative reachable by keyboard |
| E5 Surplus | Available count excludes the excursion, quarantine, stale and conflicting fixtures |
| E6 Feasibility | Candidate list shows blockers; blocked candidate has no actionable approve button |
| E7 Simulation | Projected stock differs from baseline; `mode: SIMULATION` in payload; `inventory_batch` row count unchanged |
| E8 Approval | Transfer blocked at `PENDING_APPROVAL` after one approval; blocked at `PENDING_CLINICAL` after two; advances only after clinical sign-off with identity/timestamp |
| E9 Audit | Query by `transfer_request_id` returns events from E0–E8 in order; no update/delete route exists |

**Exit condition:** 10/10 steps pass with zero fabricated values. If E2 lead time <5 days, the test still passes but records the measured value and surfaces it in the report — it never substitutes a desired number.

---

## 7. Infrastructure and contract tests [PROPOSED]

| ID | Test | Expected |
|---|---|---|
| C1 | Next.js → Express contract fuzz (unknown/missing fields) | 422/400 with typed error, no 500 |
| C2 | Express → FastAPI contract schema test | DTO validated; no raw SQL/user text forwarded |
| C3 | FastAPI read-only assertion | Intelligence service has no DB write credentials |
| M1 | Apply all migrations to empty DB | Schema matches Prisma; seed succeeds |
| M2 | Pre-migration snapshot + destructive migration + rollback drill on preview | Row counts/hashes restored; audit intact |
| M3 | Migration checksum recorded | `migration_id`, `applied_at`, `applied_by`, checksum in audit |
| D1 | Simulate Postgres outage | `SERVICE_UNAVAILABLE`; cached snapshot labelled not-live; writes rejected |
| D2 | Simulate FastAPI outage | Last-good scores served with `PRECOMPUTED` label |
| D3 | Simulate Redis outage | DB unique constraints prevent duplicates; scheduled fallback runs |
| D4 | Restore drill into preview DB | Restore completes within RTO; smoke suite passes |
| B1 | Backup existence check | Daily snapshot + pre-migration snapshot present and encrypted |

These tests are added to the release gate: all must pass (or have documented waivers) before the demo.

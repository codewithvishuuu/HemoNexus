# IMPLEMENTATION_READINESS_GATE.md — HemoNexus Phase 0.2

**Status:** Final planning review. No implementation started. No application code, database, deployment configuration, or Git state modified.
**Review date:** 2026-11-26
**Documents reviewed:** all 15 planning documents in `C:\Users\VISHAL KUMAR\.opencode\plan\`.
**Evidence legend:** [VERIFIED] · [PARTIALLY VERIFIED] · [ASSUMPTION] · [PROPOSED] · [SIMULATED].

---

## 1. Workspace and repository confirmation

| Check | Result |
|---|---|
| Path `C:\Users\VISHAL KUMAR\Promptwars offline` | **Exists but is empty** — 0 entries (re-verified 2026-11-26) |
| `.git` in that path | **Absent** — not a repository |
| Planning documents | 15 `.md` files present in `C:\Users\VISHAL KUMAR\.opencode\plan\` |
| BloodGuard AI / blood-shortage codebase elsewhere in user folder | **None found** (Phase 0 audit) |
| Only blood-adjacent artifact | `Downloads\SIH2026.zip` → unrelated Expo emergency-response app, reference only |

**Conclusion:** the target application workspace contains no project and no repository. This is the single largest unresolved dependency. Creating or pointing to the real repository is a **pre-implementation action**, not a Phase 0.2 code change.

---

## 2. Coverage of the 10 Phase 0.2 requirements

| # | Requirement | Where addressed | Status |
|---|---|---|---|
| 1 | Compatibility + qualified human verification | `HEALTHCARE_STANDARDS_AND_COMPLIANCE.md` §8 (rule table, 5 human checkpoints, no AI clinical verdict); `PRODUCT_VISION.md` §5/§10; `SECURITY_AND_SAFETY.md` §7 | Closed in plan |
| 2 | Cold-chain quarantine and release workflow | `DATA_QUALITY_AND_INTEROPERABILITY.md` §7 (state diagram, human-only release, audit); `HEALTHCARE_STANDARDS_AND_COMPLIANCE.md` §5–6; tests Q1–Q4 | Closed in plan |
| 3 | Data Trust dimensions independently measurable | `DATA_QUALITY_AND_INTEROPERABILITY.md` §6 (per-dimension measure, unit, test, independence assertion); §2.3 gates; explicit separation from forecast confidence | Closed in plan |
| 4 | Insufficient-data behaviour for every forecasting scenario | `AI_ML_STRATEGY.md` §11 (12 typed states with UI/fallback); §10.2 minimum data; `SYSTEM_ARCHITECTURE.md` §11.1–11.2 error shapes | Closed in plan |
| 5 | Backup, restore, DR, service failure | `SYSTEM_ARCHITECTURE.md` §12 (snapshots, RPO/RTO, restore drill, four failure modes); `SECURITY_AND_SAFETY.md` §12; tests D1–D4, B1 | Closed in plan **[ASSUMPTION]** values need host confirmation |
| 6 | Reproducible synthetic generation | `FEATURE_ROADMAP.md` P0-1 (`seed=42`, pinned PRNG, stable ordering, row hashes); `DATA_STRATEGY.md` §3; `AI_ML_STRATEGY.md` §10.4; `TESTING_AND_VALIDATION_STRATEGY.md` E0/V6 | Closed in plan |
| 7 | API contracts Next.js ↔ Express ↔ FastAPI | `SYSTEM_ARCHITECTURE.md` §11 (routes, auth, request/response, failure states; service boundaries) | Closed in plan |
| 8 | Migration and rollback strategy | `SYSTEM_ARCHITECTURE.md` §13 (Prisma-only, pre-migration snapshot, forward compensating rollback, audit); tests M1–M3 | Closed in plan |
| 9 | E2E acceptance tests for complete emergency scenario | `TESTING_AND_VALIDATION_STRATEGY.md` §6 (E0–E9), §7 (infrastructure); `DEMO_AND_EVALUATION_PLAN.md` §2–4 | Closed in plan |
| 10 | Minimum security and deployment requirements | `SECURITY_AND_SAFETY.md` §12; `SYSTEM_ARCHITECTURE.md` §14 | Closed in plan |

All ten requirements are **documented**. None is **implemented** — this is a readiness gate, not a completion claim.

---

## 3. P0 feature coverage matrix

Every P0 item has scope, dependency, acceptance criterion, test strategy and a documented failure state.

| ID | Scope | Depends on | Acceptance | Tests | Failure state |
|---|---|---|---|---|---|
| P0-1 Data model + seeded generator | Schema incl. `blood_unit`, cold-chain, trust, reservation; 104 weeks, `seed=42` | none | Two runs → identical row hashes | E0, V6 | `SEED_MISMATCH` / `INSUFFICIENT_DATA` |
| P0-2 Auth + RBAC + RLS | Six roles, institution scope, httpOnly JWT | P0-1 | Cross-institution read → 403 + audit | Role matrix, RLS integration | `401` / `403 CROSS_INSTITUTION` |
| P0-3 Inventory intake | Validated CSV/form events, no silent drops | P0-1, P0-2 | Invalid rows rejected with reasons | C1, U1 | `422 VALIDATION` / `409 DUPLICATE_EVENT` |
| P0-4 Forecast pipeline | Baselines + ETS/STL, rolling backtest | P0-1, P0-3 | WAPE/MASE vs baseline; seeded lead time | V1–V10 | 12 typed states (`INSUFFICIENT_DATA` etc.) |
| P0-5 Risk score | Bands + factor decomposition + override | P0-4, P0-11, P0-12 | ≥4 factors; reproducible from inputs | Score unit tests, E3 | `DATA_QUALITY_BLOCK` / `PARTIAL_FACTORS` |
| P0-6 Command center | Overview + role views + data-mode banner | P0-2, P0-5 | Responsive, keyboard-accessible | axe, Playwright E1 | `SERVICE_UNAVAILABLE` cached snapshot |
| P0-7 Alerts | Band-transition alerts, dedupe, ack | P0-5 | One alert per transition | Alert tests, E9 | Stale-alert banner; no fabricated alerts |
| P0-8 Audit log | Append-only events | P0-2 | No update/delete path | R7, E9 | **Fail closed** — mutation blocked if audit write fails |
| P0-9 Safety/honesty guardrails | `SIMULATED` labels, no PHI, human gates | all | 100% labelled screens/exports | E1, E9, schema scan | Render blocked if label missing |
| P0-10 Unit identity + quality state | Unique unit ID, quarantine/quality, trace | P0-1, P0-11 | Ineligible units absent from available stock | U1–U7, Q1–Q4 | `QUARANTINED` / `EXCURSION UNRESOLVED` |
| P0-11 Component rules | Versioned, sourced shelf-life/storage | Research (partially verified) | Rules cite source + version | Rule tests | `UNVERIFIED_RULE` → no eligibility decision |
| P0-12 Data Trust engine | 8 independent dimensions + gates | P0-1, P0-3 | Independence assertion passes | T1–T5, independence test | `DATA_QUALITY_BLOCK` / `DEGRADED` |
| P0-13 Reservation integrity | Locks, idempotency, expiry, rollback | P0-2, P0-10, P0-8 | One unit → one active reservation | R1–R7, concurrency | `409 RESERVATION_CONFLICT` |
| P0-14 Transfer feasibility | Rules, verified stock, expiry, cold chain, auth | P0-10–P0-13 | Blockers emitted; no auto-approval | F1–F6, E6 | `NO_CANDIDATES` / `PARTIAL_FACTORS` |
| P0-15 DPDP governance | Minimization, retention, encryption, IR | P0-2, P0-8 | No PII fields; runbook reviewed | Schema scan, secret scan | `PII_FIELD_REJECTED` / `403` |

Cross-cutting contracts (§11), migration (§13), DR (§12) and deployment (§14) are specified but are **work items**, not separate P0 IDs.

---

## 4. Consistency check across the 15 documents

| Check | Result |
|---|---|
| Official name | **HemoNexus** in all documents; only two intentional historical references remain (`PROJECT_AUDIT.md` keyword-scan evidence, `FINAL_REVIEW.md` change log) |
| Original problem statement | Preserved; no rewrite performed |
| Architecture decisions | Consistent: Express TypeScript modular monolith, Python FastAPI, Postgres 16 + PostGIS + Prisma, SSE, Redis/BullMQ only where justified, no full FHIR server |
| Scores | Consistent: current **5**, target **80**, stretch **88** |
| Data minimum | **Fixed in this review**: `DATA_STRATEGY.md` 12 months → **104 weeks**, matching `AI_ML_STRATEGY.md` §10.2 |
| Schema list | **Fixed**: `FEATURE_ROADMAP.md` P0-1 now includes `blood_unit`, cold-chain, trust, reservation tables |
| Matching-engine overlap | **Fixed**: P1-2 is now presentation only; gating logic is P0-14 |
| Insufficient-data states | Consistent across `AI_ML_STRATEGY.md` §11, `SYSTEM_ARCHITECTURE.md` §11, `DEMO_AND_EVALUATION_PLAN.md` §6 |
| Safety boundary | Consistent: AI never declares clinical usability; release/approval is human-only |
| Evidence labels | Consistent [VERIFIED]/[PARTIALLY VERIFIED]/[ASSUMPTION]/[PROPOSED]/[SIMULATED] |
| No deleted documents | 10 originals retained; 5 added in Phase 0.1; 1 added here (16 total) |

**Result:** internally consistent after the three fixes above. No remaining contradiction found.

---

## 5. Unresolved decisions / dependencies

| ID | Item | Severity | Why it blocks |
|---|---|---|---|
| U1 | **Actual application workspace / repository path** — current path is empty and not a Git repo | **CRITICAL** | Nothing can be implemented or tested without a target |
| U2 | PostGIS support on the chosen managed Postgres host | **CRITICAL for map + feasibility** | `ST_Distance` and hotspot layers depend on it; verify at provisioning |
| U3 | Deployment hosts/accounts (Vercel, Render/Fly, managed Postgres, Redis) | High for deploy, low for local build | Env/CORS/RPO/RTO values remain **[ASSUMPTION]** |
| U4 | Primary standards clauses (National Standards PDF, Drugs & Cosmetics Rules) | High for non-demo rule claims; demo can proceed with **labelled provisional rules** | Do not cite clause numbers until read |
| U5 | Gazette primary text for DPDP commencement | Medium (documentation) | Secondary-source dates must be verified before any public compliance claim |
| U6 | Authorized e-RaktKosh integration | Out of scope for demo **[ASSUMPTION: unavailable]** | No open API verified; do not assume access |
| U7 | Named simulated clinical reviewer account for demo approval step | Medium | Needed for E8; can be a clearly labelled fake identity |
| U8 | RPO/RTO/retention values | Medium | Marked assumptions; must be confirmed by host before DR sign-off |
| U9 | Demo district set (real coordinates, fictional institutions) | Low | **[ASSUMPTION]**; confirm before map build |

All architecture *design* choices are closed. The items above are **environmental/authority** dependencies, not design debates.

---

## 6. GO / NO-GO recommendation

### Decision: **NO-GO for implementation at this moment.**

Rationale:
1. **U1 is unresolved and critical.** The designated workspace is empty and not a repository. Per the instruction *"Do not claim implementation readiness if any critical dependency remains unresolved"*, readiness cannot be claimed.
2. **U2 is unverified** and is required by P0 feasibility/map work.
3. **U4/U8** carry unverified regulatory/infrastructure values that must either be verified or explicitly carried as labelled assumptions before build.
4. Planning documents are complete and consistent, but **plan completeness is not implementation readiness**.

### Conditions to convert to GO (all must be met)
- [ ] User confirms the real repository path, or authorizes creating a new repo at a named path.
- [ ] User approves this plan and the Phase 0.2 gate.
- [ ] Agent is switched out of Plan mode / to an implementation agent.
- [ ] Managed Postgres with PostGIS is provisioned or its absence is accepted with a documented fallback (e.g. Haversine distance without PostGIS, requiring a scope change).
- [ ] Deployment host values (RPO/RTO/retention/CORS origins) are confirmed or explicitly accepted as demo assumptions.
- [ ] Standards clause verification is scheduled; demo uses only labelled provisional component rules until then.

Once these are satisfied, the recommendation becomes **CONDITIONAL GO** for Phase 1 (Foundation) only — not for full production deployment. Implementation should then follow `IMPLEMENTATION_PLAN.md` phases with the gates in `TESTING_AND_VALIDATION_STRATEGY.md` §4/§6/§7.

---

## 7. What this gate did and did not change

**Changed:** planning documents only — added API contracts, backup/DR, migration rollback, per-scenario insufficient-data states, independent Data Trust measures, cold-chain release workflow, human-verification checkpoints, E2E emergency acceptance tests, minimum security/deployment baseline; fixed three internal inconsistencies.

**Not changed:** application code, database schemas, deployment configuration, Git state, production systems. No backup/restore or migration was executed. No secret value was read or written.

**Remaining risk:** every score (5 / 80 / 88) is a planning estimate. The target score is earned only if a clean build passes E0–E9, the backtest, and the concurrency/simulation-purity tests. None of that has run.

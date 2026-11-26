# HemoNexus — safe remediation plan

Baseline evidence is in `FINAL_HACKATHON_AUDIT.md`. This plan was prepared **after** the baseline report was saved. No production deployment or database change is performed.

## Rule applied
Fix only defects that are small, locally verifiable and do not alter forecasting mathematics, database schema, brand, or infrastructure. Propose anything requiring a migration, dependency major upgrade, real data, or new infrastructure.

---

## A. Fixes applied (small, verified locally)

### A1 — F-01: Institutional approval RBAC bypass
- **Finding:** `src/app/api/v1/transfers/approve/route.ts:16` restricted only the clinical checkpoint; an `ANALYST` successfully signed `SENDING_INSTITUTION` in the baseline probe.
- **Change:** restrict institutional checkpoints to `PLATFORM_ADMIN`, `REGIONAL_COORDINATOR`, `HOSPITAL_MANAGER`, `BLOOD_BANK_MANAGER`; for manager/bank roles, require that the signer's `institutionId` equals the sending/receiving institution of the request. Clinical sign-off remains exclusive to `CLINICAL_REVIEWER`.
- **Verification:** before = analyst approval HTTP 200; after = analyst approval HTTP 403; coordinator and clinical reviewer flows still pass.

### A2 — F-02: Assistant institution isolation
- **Finding:** `src/app/api/v1/assistant/route.ts:23` queried all `riskScore` rows regardless of the caller's institution; a hospital manager received the network-wide top risk.
- **Change:** apply `scopedInstitutionFilter(user)` to the assistant's risk-score and unit queries, matching the `/scores` and `/inventory` endpoints. Network roles keep network-wide visibility.
- **Verification:** before = hospital manager saw “Valleyview Community Hospital … CRITICAL”; after = manager sees only scores/units from their own institution or a clear empty state.

### A3 — F-03: Hardcoded JWT fallback secret
- **Finding:** `src/lib/auth.ts:9` used `'hemonexus-dev-secret-change-me'` when `JWT_SECRET` was absent, allowing token forgery under misconfiguration.
- **Change:** fail closed — throw if `JWT_SECRET` is not configured. Production and local `.env` already define it.
- **Verification:** build and login still pass with the configured secret; startup without the variable now fails rather than silently using a public secret.

### A4 — F-04: Transfer group/component mismatch
- **Finding:** `src/app/api/v1/transfers/route.ts:38-45` accepted a request declaring `group: O-` while supplying an `A+` unit ID; baseline probe returned HTTP 201.
- **Change:** validate that the selected unit's `group` and `component` equal the request values, that `units === 1`, that `toId` exists and differs from `fromId`, before creating the reservation.
- **Verification:** before = HTTP 201 for mismatched group; after = HTTP 422 with `UNIT_REQUEST_MISMATCH`. Valid transfer flow still works.

### A5 — F-07: Simulation scenarios were not differentiated
- **Finding:** `domain.ts:130-147` applied the same `surgePct` calculation to every scenario, including `INVENTORY_LOSS`, `REGIONAL_SHORTAGE` and `ADDED_DONATIONS`.
- **Change:** map each supported scenario to an explicit, labelled delta while keeping the cloned-state isolation and deterministic output. Assumptions list the scenario-specific operation.
- **Verification:** run each scenario locally and confirm projected values and assumptions differ; eligible inventory count unchanged across all runs.

---

## B. Proposed, not applied (require approval / migration / real data)

| Item | Why not applied | Recommended action |
|---|---|---|
| F-05 unique active reservation per unit | Requires Prisma schema migration and database DDL | Add partial unique index on `(unitId)` where `state='ACTIVE'` in a reviewed migration; keep app-level check as defence in depth |
| F-06 reservation expiry releases stock | Requires a scheduled job or a change to eligibility semantics | Implement expiry worker (BullMQ already justified for this) or compute eligibility from active, unexpired reservations instead of the boolean |
| F-08 hardcoded event indices / tuned threshold | Requires labelled event data and evaluation redesign | Store seeded events as data with provenance; derive metrics from labels; report out-of-sample results separately |
| F-09 interval calibration | Numerical methodology change | Fit intervals on backtest residuals and verify empirical coverage before changing UI labels |
| F-10 N+1 queries | Performance refactor | Batch institution/unit lookups, add pagination, then load-test at 100 institutions |
| SEC-8 dependency advisories | All fixes are major-version upgrades (`next@16`, `zod@4`) | Schedule an upgrade branch with full regression; do not use `npm audit fix --force` |
| SEC-7 rate limiting / CSRF token | New infrastructure/middleware decision | Add rate limiting to auth/assistant endpoints and evaluate CSRF tokens if non-Lax cookie usage is introduced |
| Dead code / `strict:false` / lint disabled | Broad cleanup unrelated to demo correctness | Controlled debt-remediation branch with ESLint baseline and incremental strictness |

---

## C. Regression checklist after fixes
- `npm run build` must pass.
- `npm test` must remain 13/13 (or higher if new tests added).
- Local API probes: unauthorized 401, cross-institution 403, analyst approval 403, valid coordinator/clinical approval flow 200, transfer mismatch 422, valid transfer 201, simulation purity unchanged.
- Production must remain untouched; no deploy in this phase.

## D. Record of results

## D. Record of results (executed and verified)

All five fixes were applied locally and verified against an isolated SQLite database. **Production was not redeployed during this audit**, so the live URL still contains the baseline behaviour until these changes are approved and deployed.

| Fix | Before | After | Status |
|---|---|---|---|
| A1 institutional approval RBAC | `ANALYST` signed `SENDING_INSTITUTION` → HTTP 200 | `ANALYST` → HTTP 403 `INSTITUTIONAL_APPROVAL_DENIED`; coordinator and clinical flow still reaches `APPROVED` | **VERIFIED** |
| A2 assistant scoping | Hospital manager saw network-wide top risk (Valleyview CRITICAL) | Hospital manager now sees own institution Northbridge B+/RBC HIGH | **VERIFIED** |
| A3 JWT secret | Hardcoded fallback secret present | Throws `JWT_SECRET is not configured` if absent; configured env still logs in normally | **VERIFIED** (code + login) |
| A4 transfer mismatch | Mismatched group returned HTTP 201 | Mismatched group returns HTTP 422 `UNIT_REQUEST_MISMATCH`; valid transfer still 201 and approvals complete | **VERIFIED** |
| A5 simulation scenarios | All scenarios produced identical deltas | Four scenarios produced distinct projections (44 / 34 / 58 / 40) with explicit operation assumptions | **VERIFIED** |

### Final quality gate after remediation
- `npm run build`: **PASS**
- `npm test`: **13/13 PASS** (no regressions)
- TypeScript (via build): **PASS**
- ESLint: **not configured / disabled** — unchanged, not claimed
- `npm audit`: **3 advisories unchanged** (next/postcss/zod, all major-fix)
- API probes: unauthorized 401, cross-institution 403, analyst approval 403, mismatch 422, valid approval chain PASS, simulation purity unchanged
- Browser responsive QA: unchanged from baseline (50/50 route checks PASS on production, which still runs the pre-fix build)
- Production database: untouched; no deploy performed

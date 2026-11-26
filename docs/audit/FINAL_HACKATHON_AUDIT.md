# HemoNexus Final Hackathon Evaluation Report

**Audit type:** independent read-only baseline, followed by narrowly scoped safe remediation.
**Date:** 2026-11-26
**Repository:** https://github.com/codewithvishuuu/HemoNexus
**Production:** https://hemonexus-rho.vercel.app
**Branch / commit:** `main` @ `9420a22b09044bc5ad7bb2f17f82076f25101a4f`
**Working tree at start:** clean (0 changes). Production was not modified, deployed or reset during the audit.

Evidence legend: **VERIFIED** = executed/inspected in this audit · **PARTIALLY VERIFIED** = code evidence only, no live reproduction · **NOT VERIFIED** = not tested · **FAILED** = test reproduced a defect.

---

## 1. Executive verdict

HemoNexus is a credible, well-presented hackathon prototype with real numerical forecasting, deterministic risk scoring, unit-level inventory, transactional transfer requests, human approval steps, audit history and a coherent premium UI. It is **demo-ready with documented limitations**, but it is **not a clinically validated or production-ready healthcare system**, and the audit found several genuine correctness and authorization defects that must be disclosed or fixed before jury presentation.

- **Demo readiness:** READY — all 12 public/authenticated routes load, auth works, responsive QA passes at 5 widths.
- **Technical credibility:** MODERATE-HIGH for a hackathon; the forecasting is genuine statistics, not an LLM, but evaluation methodology has circular and uncalibrated elements.
- **Real-world feasibility:** LOW as presented; no real institution integration, no inventory-write workflow, no operational ownership model implemented.
- **Major concerns:** institutional approval RBAC bypass, assistant cross-institution data exposure, transfer group/component mismatch, hardcoded JWT fallback secret, inert reservation expiry.

---

## 2. Project verification

| Item | Result |
|---|---|
| Repository | `codewithvishuuu/HemoNexus`, origin verified |
| Branch | `main`, commit `9420a22…`, working tree clean at start |
| Production | `https://hemonexus-rho.vercel.app`, deployment `dpl_HZraXih7dJuZszSv3xnG5dFSa2NH` (historical; not re-deployed in audit) |
| Production DB | Neon PostgreSQL; `prisma migrate status` reported schema up to date in earlier verification; PostGIS 3.6 previously verified. Not re-run against production during this read-only audit to avoid any DB interaction. |
| Files inspected | all `src/**/*.ts(x)`, `prisma/schema.postgres.prisma`, `prisma/seed.ts`, `next.config.ts`, `package.json`, `tsconfig.json`, `services/intelligence/main.py`, `server/express.ts`, all API routes |
| Environment | variable **names only** inspected; no values printed or exposed |

---

## 3. Functional verification

Tests executed against the live production URL (read-only, browser automation) and against an isolated local SQLite copy for mutating workflow probes. No production data was mutated.

| Workflow | Expected | Actual | Status | Evidence |
|---|---|---|---|---|
| Landing page | 200, real logo, headline | 200, headline “Every Drop Matters. Every Second Counts.”, 0 broken images | PASS | Playwright production report |
| Login page | 200, accessible form | 200, “Welcome back to HemoNexus”, password toggle present | PASS | Playwright production report |
| Invalid credentials | rejected with error | 401, “Email or password is incorrect” | PASS | Production + local API |
| Valid login → dashboard | redirect to `/dashboard` | redirect observed | PASS | Playwright production report |
| Unauthenticated `/dashboard` | redirect to login | redirect to `/login` | PASS | Production Playwright |
| Logout | session cleared | redirect to `/login`, `/auth/me` null | PASS | Production Playwright |
| Protected APIs unauthenticated | 401 | 401 on institutions, inventory, scores, forecasts, transfers, audit, simulations | PASS | Local + production API |
| Institution isolation (scores endpoint) | manager cannot read foreign institution | manager scope = own id; foreign score → 403 | PASS | Local API |
| Institution isolation (assistant) | manager only sees own data | **assistant returned network-wide top risk to hospital manager** | **FAILED** | `assistant/route.ts:23`; local API probe |
| Inventory eligibility | quarantined/excursion excluded | 10 AB−/Platelets units blocked; quarantined and excursion states shown | PASS | Local + production UI |
| Forecast generation | state OK, 104 weeks | `state=OK`, 4 folds, lead 21d, coverage 0.50 | PASS | Production API |
| Insufficient data | typed state | unit tests cover `HISTORY_CRITICAL`, `HISTORY_SHORT`, `NO_SIGNAL`, `LOW_VOLUME` | PASS | `analytics.test.ts` |
| Risk scoring | bands + factors | 64 scores persisted; CRITICAL/HIGH/MODERATE/STABLE present with factors | PASS | Production API/UI |
| Matching | compatible, verified, in-date | 3 actionable candidates; blockers emitted | PASS | Local API |
| Transfer request | creates reservation + audit | 201, `PENDING_APPROVAL`, idempotent replay works | PASS | Local API |
| Transfer group/component mismatch | rejected | **request with group `O-` but `A+` unit ID returned 201** | **FAILED** | `transfers/route.ts:38-45`; local probe |
| Institutional approval RBAC | only institution officers | **ANALYST successfully signed `SENDING_INSTITUTION`** | **FAILED** | `approve/route.ts:16`; local probe |
| Clinical approval RBAC | only clinical reviewer | coordinator → 403, clinical reviewer → approved | PASS | Local + production |
| Concurrent reservation of same unit | one winner | 1×201, 1×409 observed on SQLite | PARTIALLY VERIFIED | local concurrent probe; no DB-level unique constraint |
| Reservation expiry | releases stock after 30 min | code never resets `reserved`; no expiry job | FAILED (code) | `schema:180-189`, no `reserved:false` in codebase |
| Simulation | isolated, deterministic | eligible count unchanged 470→470; output deterministic | PASS | Local + production probe |
| Simulation scenario differentiation | scenarios produce distinct deltas | `INVENTORY_LOSS`, `REGIONAL_SHORTAGE`, `ADDED_DONATIONS` all use the same surge calculation | FAILED (code) | `domain.ts:130-147` |
| Assistant grounding | answers from platform data, refuses clinical | rule-based templates from DB counts; sensitive/clinical regex refuses | PARTIALLY VERIFIED | `assistant/route.ts:14-48`; no LLM, no hallucination possible, but regex can be bypassed by rephrasing |
| Audit log | append-only, actor/timestamp | 4 events per transfer; no update/delete route | PASS | Local API |
| Responsive 1440/1280/1024/768/390 | no overflow, no broken assets | 50/50 route checks clean; 0 console errors except deliberate 401 | PASS | Playwright production report |

---

## 4. AI/ML evaluation

**Actual algorithms** (`src/lib/analytics.ts`):
- Seasonal naive baseline (`seasonalNaive`, line 16).
- Trailing 4-week moving average baseline (`movingAverage`, line 21).
- Hand-written additive Holt-Winters with level/trend/52-week seasonality (`holtWinters`, lines 27-47). This is statistical forecasting, **not machine learning**, and is correctly described as such.
- Rolling-origin backtest with 4 folds of 4 held-out weeks (lines 80-133), MAE, WAPE, MASE, bias and interval coverage. MAPE omitted because demand can be zero — correct.
- Risk score is a **transparent weighted heuristic** (lines 139-163), not a trained classifier. Weights are fixed constants; thresholds 0.30/0.50/0.70; hard override when days-of-cover < 1.

**Measured metrics (production, East/O−/RBC):** MAE 5.19, WAPE 0.25, MASE 0.83, bias 1.44, **coverage 0.50**, precision 0.89, recall 1.00, lead time 21 days, false alarms 1, missed events 0, 4 folds.

**Credibility concerns:**
1. **Circular event evaluation.** Seeded event indices are hardcoded in `domain.ts:89-93` (`index:88`, `index:96`) and the detection flag threshold `recent > trailing * 1.14` is hardcoded in `analytics.ts:116`. Precision/recall/lead-time are computed against known synthetic event windows, so they demonstrate pipeline behaviour, not genuine predictive skill on unseen data.
2. **Interval coverage 0.50 vs nominal 0.80.** Intervals use `1.28 × 1.4 × std(first differences)`, not calibrated backtest residuals (`analytics.ts:67,92,98`). The UI discloses 0.50 coverage — honest, but the interval is not statistically calibrated.
3. **No per-group or per-institution error breakdown** is stored or shown; only one aggregate series is backtested on demand.
4. **`network_scarcity` factor counts nearby institutions**, not actual surplus units (`domain.ts:73-76`), so the factor name overstates what it measures.
5. **Duplicate forecasting implementations** exist in `src/lib/analytics.ts` and `services/intelligence/main.py`; only the TypeScript one runs in production. Both could drift.
6. **Assistant is not an LLM.** It is a deterministic regex-to-template responder reading DB counts. This is safer than an LLM but does not deliver the "explainable AI assistant" capability as a language model; answers are correct but rigid.

**Conclusion:** the numerical core is genuine and reproducible, but accuracy claims are limited to synthetic data and partially circular evaluation. The project should not claim predictive accuracy beyond “the pipeline runs and beats a baseline on synthetic history”.

---

## 5. Code quality

- **TypeScript strictness:** `tsconfig.json` has `"strict": false` and `"skipLibCheck": true`; `any` is used extensively in domain logic and API routes.
- **Lint:** ESLint is disabled in `next.config.ts` (`eslint.ignoreDuringBuilds: true`) and no ESLint config/dependency exists. This is not a failure of the build, but lint debt is unmeasured.
- **Dead code:** `networkScores` (`domain.ts:44`), `freshness` (`domain.ts:16`), `isNetworkRole` (`guard.ts:19`), `hashPassword` (`auth.ts:11`) and the entire `src/components/ui.tsx` component kit are unused. Express (`server/express.ts`) and FastAPI (`services/intelligence/main.py`) services are implemented but not deployed.
- **N+1 queries:** `matchingCandidates` (`domain.ts:106-117`) performs per-institution unit and component-rule queries; `computeScore` performs multiple sequential queries per score. Acceptable at 10 institutions, risky at 100+.
- **Error handling:** most routes validate with Zod and return typed errors; `transfers/route.ts:70` rethrows unexpected errors, which can leak stack traces in some deployments.
- **No console debugging** remains in `src/`.
- **Tests:** 13 unit tests (`vitest`) covering forecast states, determinism, risk scoring and eligibility. No integration tests exist for API authorization, transfers, reservations or assistant; those were probed manually in this audit.

---

## 6. Security

**Verified controls:** httpOnly cookies; `Secure` in production; `SameSite=Lax`; bcrypt password hashing; JWT with 8h expiry; Zod validation; app-level institution scoping on most endpoints; security headers present in production (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS); no secrets in repository; no localStorage password storage; audit log append-only.

**Findings:**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| SEC-1 | P0 | Institutional approval checkpoints are not role- or institution-bound; any authenticated role can sign them | `approve/route.ts:16` restricts only `CLINICAL_REVIEWER`; probe signed `SENDING_INSTITUTION` as `ANALYST` |
| SEC-2 | P0 | Assistant bypasses institution scoping and returns network-wide risk to a hospital manager | `assistant/route.ts:23` uses unbounded `prisma.riskScore.findMany` |
| SEC-3 | P0 | Hardcoded JWT fallback secret makes token forgery possible if `JWT_SECRET` is missing | `auth.ts:9` fallback `'hemonexus-dev-secret-change-me'` |
| SEC-4 | P1 | Transfer request does not verify that the supplied unit matches requested group/component or that `units === 1` | `transfers/route.ts:9,38-45` |
| SEC-5 | P1 | No unique constraint prevents two active reservations for one unit; check-then-create race possible under Postgres | `schema.postgres.prisma:180-189`; `transfers/route.ts:49-59` |
| SEC-6 | P1 | Expired reservations are never released; `reserved` boolean is never reset | no code resets `reserved`; grep found no `reserved:false` |
| SEC-7 | P2 | No rate limiting; no explicit CSRF token; `SameSite=Lax` gives partial CSRF mitigation | code inspection |
| SEC-8 | P2 | Dependency advisories: `next@15.5.29` moderate (fix requires Next 16 major), `postcss@8.4.31` high via Next, `zod@3.25.76` high (fix requires Zod 4 major) | `npm audit --omit=dev` |
| SEC-9 | P2 | `strict:false`, lint disabled, `any` widely used | `tsconfig.json`, `next.config.ts` |

No destructive penetration testing was performed; no production data was changed.

---

## 7. Performance and scalability

- Measured production page loads: all routes 200; shared JS 103 kB; dashboard first-load 226 kB, forecasts 220 kB; no broken charts at 5 widths.
- API timing was not formally load-tested; no latency numbers are claimed.
- Likely bottlenecks: N+1 matching queries; full-table `findMany` for inventory (API caps at 500 rows); no pagination on transfers/audit; no caching; no background job for reservations.
- Scale scenarios: 10 institutions — demonstrated; 100 — plausible with query optimisation; 1,000/10,000 — **untested and unlikely without indexes, pagination, queueing and connection pooling**. Redis/queues are not currently justified for the demo.

---

## 8. Real-world feasibility

Target users are plausible (hospital blood-bank managers, blood-bank officers, regional coordinators), but operational gaps remain:
- No inventory-write UI or verified intake workflow exists; stock can only be seeded or created by seed script.
- No institution onboarding, identity verification, legal agreement or data-governance workflow is implemented.
- No physical transport coordination, receiver confirmation or rejection/cancellation path.
- No integration with e-RaktKosh or hospital systems exists; FHIR mapping is documentation only.
- Fallback JWT secret, missing rate limiting and advisories would need remediation before any real deployment.
- The platform is explicitly **decision support**, with human approval gates retained — appropriate, but final clinical responsibility stays with people.

**Conclusion:** suitable as a hackathon demonstration of an idea and engineering pipeline; **not ready for a real hospital pilot**.

---

## 9. Hackathon jury score

| Category | Score / max | Evidence | Gap |
|---|---:|---|---|
| Problem relevance and clarity | 9 / 10 | Well-defined problem, documented workflows | Impact not evidenced with real data |
| Solution effectiveness and completeness | 7 / 10 | Core loop works end to end | No rejection/cancel, no inventory-write UI, simulation scenarios undifferentiated |
| Innovation and differentiation | 7 / 10 | Explainable risk, simulation, matching with human gates | Incremental over dashboards; novel value not measured |
| Technical architecture and engineering | 10 / 15 | Next.js monolith, Prisma/Neon, typed APIs | Duplicate forecasting, N+1, dead code, strict false |
| Implementation and working functionality | 10 / 15 | 50 route checks, real auth/transfer/audit | Three reproduced functional/security defects |
| AI/ML credibility and accuracy | 5 / 10 | Real Holt-Winters, baselines, backtest | Circular event metrics, 0.50 coverage, no real data |
| UI/UX and accessibility | 8 / 10 | Premium, responsive, reduced motion | Screen-reader audit not performed |
| Feasibility and real-world adoption | 4 / 10 | Clear user roles documented | No integration, onboarding or operational ownership |
| Security, privacy and reliability | 2 / 5 | Headers, RBAC mostly enforced | P0 RBAC bypass, assistant leak, fallback secret, advisories |
| Documentation and demo readiness | 4 / 5 | Extensive docs, clear demo path | Some claims need caveats |
| **TOTAL** | **66 / 100** | | |
| **Conservative score** | **62 / 100** | If jury discounts synthetic-only evidence | |

- **Strongest category:** problem relevance (9), UI/UX (8).
- **Weakest category:** security (2), real-world feasibility (4), AI/ML credibility (5).
- **Three reasons a jury might reject:** (1) no real data or clinical validation; (2) security defects found by simple role/parameter manipulation; (3) AI evaluation partly circular and interval coverage uncalibrated.
- **Three strongest differentiators:** (1) explainable factor decomposition with reproducible inputs; (2) isolated scenario simulation with side-by-side comparison; (3) transfer feasibility with compatibility/cold-chain blockers and mandatory human approvals.
- **Demo-ready:** YES, with limitations disclosed.
- **Technically credible:** YES for a hackathon; NO for clinical use.
- **Ready for real-world pilot consideration:** NO.

---

## 10. Top 10 findings (prioritized)

| ID | Severity | Finding | Location | User impact | Fix |
|---|---|---|---|---|---|
| F-01 | P0 | Analyst can sign institutional approvals | `approve/route.ts:16` | Unauthorized coordination action | Enforce role + institution identity |
| F-02 | P0 | Assistant leaks network-wide risk to institution-scoped user | `assistant/route.ts:23` | Cross-institution data exposure | Apply scope filter |
| F-03 | P0 | Fallback JWT secret | `auth.ts:9` | Token forgery if env missing | Fail closed when secret absent |
| F-04 | P1 | Group/component mismatch accepted in transfer | `transfers/route.ts:38-45` | Wrong blood group requested | Validate unit against request |
| F-05 | P1 | No unique active reservation constraint | `schema:180-189` | Double allocation under Postgres | Migration + DB constraint |
| F-06 | P1 | Reservation expiry never releases stock | codebase-wide | Permanent stock lock | Expiry job or computed eligibility |
| F-07 | P1 | Simulation scenarios not differentiated | `domain.ts:130-147` | Misleading scenario output | Implement scenario-specific deltas |
| F-08 | P1 | Hardcoded event indices / tuned detection threshold | `domain.ts:89-93`, `analytics.ts:116` | Circular evaluation metrics | Derive events from labelled data |
| F-09 | P2 | Interval coverage 0.50, uncalibrated intervals | `analytics.ts:67,92,98` | Misleading uncertainty | Calibrate intervals on backtest residuals |
| F-10 | P2 | N+1 queries, dead code, strict false, lint disabled | multiple | Maintainability/scale risk | Controlled cleanup plan |

---

## 11. Remediation summary

Baseline was saved before changes. Five safe fixes (institutional approval RBAC, assistant institution scoping, fail-closed JWT secret, transfer unit/request validation, differentiated simulation scenarios) were applied locally and verified with before/after evidence in `REMEDIATION_PLAN.md`. **They were not deployed**, so the live production URL still exhibits the baseline defects until an approved deployment. Items requiring migrations, dependency majors, new infrastructure or real data are **proposed, not applied**.

---

## 12. Final quality gate

Baseline results: `npm run build` PASS; `npm test` 13/13 PASS; TypeScript check via build PASS; ESLint NOT CONFIGURED; `npm audit` 3 advisories (all major-fix); Playwright 50/50 route checks PASS; production API authorization PASS except the security defects reproduced above. After local remediation, build and 13/13 tests still pass and all five before/after probes are green (see `REMEDIATION_PLAN.md`); production was intentionally left unchanged.

---

## 13. Jury questions

See `JURY_QUESTIONS.md` (18 questions with evidence-based answers).

---

## 14. Final verdict

**READY WITH DOCUMENTED LIMITATIONS** for a hackathon demonstration **once the five local fixes are deployed**; the currently deployed production URL still contains the baseline P0 defects and must not be presented as if fixed. It is **NOT READY** for clinical use, real hospital pilot, or production healthcare deployment.

# FINAL_REVIEW.md — HemoNexus Phase 0.1

**Status:** Planning-only review. No application code, configuration, database, deployment or repository was modified.
**Access date:** 2026-11-26.
**Official name:** HemoNexus. The original problem statement is preserved; only planning documents were renamed/updated.
**Evidence legend:** [VERIFIED] primary source fetched · [PARTIALLY VERIFIED] provenance confirmed, content not retrievable · [ASSUMPTION] confirm before implementation · [PROPOSED] target design · [SIMULATED] synthetic demo data.

---

## 1. Final architectural decisions (all previously open items closed)

| # | Decision | Final choice | Trade-off |
|---|---|---|---|
| D1 | Web frontend | Next.js 15 App Router + TypeScript + Tailwind v4 | Familiar to team; server components for data-heavy views |
| D2 | Domain API | **TypeScript modular monolith (Express 4)**, not NestJS | Loses DI/guard conventions; gains one deployable and speed |
| D3 | Forecasting | Separate Python 3.11 + FastAPI + statsmodels/sklearn service | One extra deployment; real numerical stack isolated |
| D4 | Database | PostgreSQL 16 + PostGIS + Prisma | PostGIS needed for feasibility distances; verify host support |
| D5 | Real-time | **SSE**, not Socket.IO | One-way is sufficient; Socket.IO retained only as fallback |
| D6 | Queue/cache | Redis + BullMQ **only** for idempotency, reservation expiry, nightly jobs | Extra infra justified by concurrency safety |
| D7 | Simulation | Cloned snapshot in isolated tables; no production writes | Extra storage for a hard safety guarantee |
| D8 | Interoperability | FHIR R5 mapping subset, no FHIR server | Future integration cheap; full FHIR out of scope |
| D9 | Safety | Unit-level eligibility gates; human-only clinical sign-off | More data/model work; non-negotiable |
| D10 | Demo geography | Real district coordinates + **[ASSUMPTION]** fictional institutions | Credible map without real-facility claims |

Full rationale: `SYSTEM_ARCHITECTURE.md` §8–10.

---

## 2. Updated feature prioritization

### P0 — essential
1. Unit-level inventory identity, component type, collection/expiry, storage condition, quarantine/quality state, transport conditions, distribution trace.
2. Configurable, versioned, sourced component shelf-life/storage rules.
3. Data Trust engine + transparent freshness indicator (distinct from forecast confidence).
4. Transactional reservation integrity (locks, idempotency, expiry, rollback, append-only audit).
5. Transfer feasibility engine (rules, verified stock, expiry, transport, cold chain, authorization) — advisory only.
6. Auth + RBAC + institution scoping + RLS; DPDP-aligned minimization/retention/encryption/incident runbook.
7. Synthetic generator (seed 42) emitting all new fields with `SIMULATED` labels.
8. Deterministic forecasting baselines + ETS/STL, rolling-origin backtest, `INSUFFICIENT_DATA` state.
9. Explainable Blood Intelligence Score with factor decomposition and hard override.
10. Command center, inventory/quality views, alerts, approvals screen, audit viewer.

### P1 — differentiators
1. Regional Intelligence Map with nearby surplus and transfer opportunities.
2. Emergency Simulation Engine with isolated cloned state and side-by-side comparison.
3. Cold-chain intelligence with excursion records blocking eligibility.
4. Advanced validation suite (MAE, WAPE, MASE, bias, interval coverage, event precision/recall, lead time, false alarms, missed events).
5. Grounded AI assistant (read-only tools, citations, no fabricated facts).
6. FHIR R5 mapping subset with unit tests.

### P2 — stretch
1. ML challenger + SHAP (only after baselines validated).
2. Multi-region hierarchical reconciliation.
3. Institution onboarding wizard (design only; no real onboarding).
4. Report exports, dark/light theme, reduced motion.

**Explicitly excluded:** mobile native app, full FHIR server, LLM numeric risk/confidence, real patient/donor data, automated transfer execution.

See `FEATURE_ROADMAP.md` for acceptance criteria per item.

---

## 3. Research source register

| Ref | Source & URL | Date / section | Verification | Use in planning |
|---|---|---|---|---|
| S1 | e-RaktKosh portal — `https://eraktkosh.mohfw.gov.in/` | accessed 2026-11-26; title/meta/footer | [VERIFIED] fetched | Official identity: MoHFW + C-DAC |
| S2 | e-RaktKosh public page — `https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/transactions/bbpublicindex.html` | accessed 2026-11-26; "Looking for Blood", "Types of donation", "Compatible Blood Type Donors" | [VERIFIED] fetched | Capabilities + component storage/shelf-life figures |
| S3 | e-RaktKosh search description (official domain, indexed) | accessed 2026-11-26 | [PARTIALLY VERIFIED] snippet | Search dimensions: State/District/Group/Component/Location |
| S4 | PIB press release `https://www.pib.gov.in/PressReleasePage.aspx?PRID=1847438` | date not retrievable (403) | [PARTIALLY VERIFIED] snippet | e-RaktKosh as blood-bank data interface; verify before citing |
| S5 | UMANG e-RaktKosh listing `https://web.umang.gov.in/landing/department/e-raktkosh.html` | accessed via index | [PARTIALLY VERIFIED] snippet | Mobile access and purpose |
| S6 | C-DAC blog `https://cdac.in/index.aspx?id=blog_ni_e-RaktKosh` | accessed via index | [PARTIALLY VERIFIED] snippet | States directed to use e-RaktKosh as single point |
| S7 | WHO Blood safety and availability fact sheet — `https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability` | **12 June 2026**; §§Key facts, National blood policy, Blood processing, Clinical use, WHO response | [VERIFIED] fetched | Coordination, components, rational use, quality systems |
| S8 | WHO Blood cold chain — `https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/blood-and-products-of-human-origin/blood-cold-chain` | publications dated 2002, 2005, 2011 | [VERIFIED] fetched | Cold-chain definition, deviation risks, quality management |
| S9 | National Standards for Blood Centres (2nd ed.), MoHFW/NBTC — `https://www.clinicalestablishments.mohfw.gov.in/sites/default/files/2022-07/1491_0.pdf` | uploaded 2022-07; first standard 2007 | [PARTIALLY VERIFIED] PDF not parseable here | Source for configurable shelf-life rules; clause verification pending |
| S10 | DGHS Blood Transfusion Services — `https://www.dghs.mohfw.gov.in/bts.php` | accessed via index | [PARTIALLY VERIFIED] snippet | NBTC/SBTC policy hierarchy |
| S11 | Drugs and Cosmetics Rules 1945 / CDSCO Blood Centre — `https://www.cdsco.gov.in/opencms/opencms/en/BloodCentre/` | n/a | [UNVERIFIED] | Do not cite clause numbers; legal review required |
| S12 | HL7 FHIR R5 InventoryItem — `https://hl7.org/fhir/R5/inventoryitem.html` | **26 Mar 2023**, §§12.30.1–12.30.5, Maturity 0 Draft | [VERIFIED] fetched | Mapping of unit identity, lot, expiry, status, characteristics |
| S13 | HL7 FHIR R5 InventoryReport — `https://hl7.org/fhir/R5/inventoryreport.html` | **26 Mar 2023**, §§12.29.1–12.29.5, Maturity 0 Trial Use | [VERIFIED] fetched | Snapshot/difference inventory reporting; non-clinical boundary |
| S14 | DPDP Act 2023 (Act 22 of 2023), assent 11 Aug 2023; commencement G.S.R. 843(E) 13 Nov 2025 | phases 13 Nov 2025 / 13 Nov 2026 / 13 May 2027 | [PARTIALLY VERIFIED] via secondary source citing Gazette | Phased compliance; primary Gazette to be verified |
| S15 | DPDP Rules 2025, notified 14 Nov 2025 | indexed PIB/Economic Times/The Hindu references | [PARTIALLY VERIFIED] | Notice/consent, breach, cross-border, phased compliance |
| S16 | UCI Blood Transfusion Service Center dataset 176 — `https://archive.ics.uci.edu/dataset/176/blood+transfusion+service+center` | donated 10 Feb 2008, DOI 10.24432/C5GS39, CC BY 4.0 | [VERIFIED] fetched in Phase 0 | Donor-propensity reference only; not inventory forecasting |

**Not assumed:** no public e-RaktKosh API; no institutional coverage counts; no clinical validation; no real hospital participation.

---

## 4. Updated risk register

| Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| Empty workspace / wrong repo | High | High | Pre-flight path confirmation | Already occurred; unresolved until user confirms |
| No real data → credibility gap | Certain | Medium-High | Synthetic labelling + backtest + e-RaktKosh complementarity | Mitigated in plan |
| Forecast fails to beat baseline | Medium | High | Ship baseline; report WAPE/MASE honestly; lead-time headline | Open |
| LLM fabricated numbers | Medium | High | Grounding validation; no write tools | Open |
| Unit double-allocation | Medium | High | Row locks + idempotency + expiry + concurrency test | Open |
| Unresolved excursion shown as available | Medium | High | Eligibility materialized view + negative tests | Open |
| Cross-institution data leak | Medium | High | RLS + role matrix + audit | Open |
| Simulation mutates live stock | Low-Medium | High | Isolated tables + purity assertion | Open |
| DPDP dates misstated | Medium | Medium | Cite phases; flag unverified primary sources | Mitigated in plan |
| Standards clause misquoted | Medium | Medium | Mark [PARTIALLY VERIFIED]; no clause numbers in demo | Mitigated in plan |
| Scope creep / time pressure | Medium | High | Simulation before assistant; defer P2 | Open |

Full register with owners: `IMPLEMENTATION_PLAN.md` §7.

---

## 5. Final implementation readiness checklist

- [x] Official name HemoNexus applied across all planning documents
- [x] Original problem statement preserved
- [x] No application code/config/database/deployment modified
- [x] All 10 original documents retained and updated
- [x] 5 new documents created (11–15)
- [x] Research source register with URLs, dates, sections, verification status
- [x] Verified vs assumed vs simulated explicitly distinguished
- [x] e-RaktKosh capabilities researched; no public API assumed; complementarity documented
- [x] Cold-chain, unit identity, quarantine/quality, transport trace in data model
- [x] Data Trust engine and freshness indicator separated from forecast confidence
- [x] Transfer feasibility and transactional integrity designed
- [x] Advanced validation metrics, insufficient-data state, versioning, drift designed
- [x] Simulation isolation designed
- [x] FHIR R5 subset mapped; full FHIR excluded
- [x] DPDP phased commencement documented; unverified primary sources flagged
- [x] Architecture decisions closed; no open decision points
- [x] Demo and testing plans with measurable criteria
- [ ] **User reviews and approves this plan**
- [ ] **Agent switched out of plan mode before implementation begins**
- [ ] Workspace/repository path confirmed

---

## 6. Change summary — exactly what changed and why

| Document | Change | Why |
|---|---|---|
| All 10 original docs | `BloodGuard AI` → `HemoNexus` | Official project name |
| `PROJECT_AUDIT.md` | Added evidence legend, Phase 0.1 research addendum (§8) | Preserve audit honesty while recording new verified facts |
| `PRODUCT_VISION.md` | Added e-RaktKosh complementarity (§1) and six Phase 0.1 principles (§10) | Position against existing national infrastructure; encode safety/trust boundaries |
| `FEATURE_ROADMAP.md` | Added 5 new P0 and 4 new P1 items; moved prediction intervals to P1 | Safety, trust, integrity and validation are core, not optional |
| `AI_ML_STRATEGY.md` | Added §10: full metric set, MASE, bias, coverage, event metrics, lead time, false alarms, missed events, no MAPE-on-zeros, minimum data, insufficient-data state, quality≠confidence, versioning, drift, simulation validation | Meet advanced validation requirement without inventing accuracy |
| `SYSTEM_ARCHITECTURE.md` | Closed all decisions (Express monolith, Python service, SSE, Redis/BullMQ, PostGIS); added blood_unit/temperature/reservation/trust tables; §8–10 diagrams | Resolve architecture decisions and add transactional/cold-chain structure |
| `UI_UX_STRATEGY.md` | Added §9: freshness/quality badges, unit/cold-chain views, feasibility chips, simulation watermark, human approval screen | Make new safety concepts visible and distinguishable |
| `DATA_STRATEGY.md` | Added §7 e-RaktKosh research/complementarity and §8 unit-level fields | Ground data strategy in verified national system; expand data model |
| `SECURITY_AND_SAFETY.md` | Added §11 DPDP Act/Rules with phased commencement and control mapping | Meet India privacy requirement without assuming uniform effective dates |
| `HACKATHON_SCORECARD.md` | Target scores 77/85 → 80/88; current unchanged at 5 | Credit added rigor only as *potential* if built; no inflation of current state |
| `IMPLEMENTATION_PLAN.md` | Added §6 revised sequencing, §7 updated risk register, §8 readiness checklist | Turn new requirements into ordered work and gates |
| **New** `HEALTHCARE_STANDARDS_AND_COMPLIANCE.md` | e-RaktKosh capabilities; WHO guidance; Indian standards; expanded data model; safety invariants | Requirement 2 + 9 research foundation |
| **New** `DATA_QUALITY_AND_INTEROPERABILITY.md` | Data Trust engine; freshness indicator; FHIR R5 InventoryItem/InventoryReport mapping subset | Requirements 3 + 8 |
| **New** `TESTING_AND_VALIDATION_STRATEGY.md` | Test pyramid, 40+ named test cases, release gate | Requirement on measurable validation |
| **New** `DEMO_AND_EVALUATION_PLAN.md` | One 9-step synthetic-network demo, reproducible scenario, acceptance criteria | Requirement 11 |
| **New** `FINAL_REVIEW.md` | This document | Requirement 13 final review deliverables |

**What did NOT change:** no application files, no schemas, no environment variables, no deployments, no git operations, no existing planning document deleted.

---

## 7. Recommendation

Proceed to implementation **only after** (a) the workspace/repository path is confirmed, (b) the user approves this plan, and (c) the agent is switched out of plan mode. Preserve the synthetic-data honesty and human-authorization boundaries — they are the project's credibility, not decoration.

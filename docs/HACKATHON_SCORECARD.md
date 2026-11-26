# HACKATHON_SCORECARD.md — HemoNexus

**Internal planning weights, not an official rubric.** Scores are deliberately conservative: no credit for features that were not inspected, and no credit for plans that have not been built.

Three columns:
- **Current (target)** — the actual workspace state: empty.
- **Reference app** — the SIH2026 emergency app found in `Downloads`, scored against *this* brief as if submitted unchanged.
- **Target after roadmap** — realistic outcome of completing P0 + P1 with the P2 items noted separately.

---

## 1. Weighted scorecard

| Dimension | Weight | Current (target) | Reference app as-is | Target after P0+P1 | Stretch with P2 |
|---|---:|---:|---:|---:|---:|
| Problem understanding | 10 | 4 | 5 | 9 | 9 |
| Innovation & differentiation | 15 | 1 | 3 | 13 | 14 |
| AI/ML implementation | 20 | 0 | 3 | 15 | 18 |
| Technical architecture | 15 | 0 | 4 | 12 | 13 |
| Functional completeness | 15 | 0 | 3 | 12 | 13 |
| UI/UX quality | 10 | 0 | 3 | 8 | 9 |
| Real-world impact | 10 | 0 | 2 | 6 | 7 |
| Security & reliability | 5 | 0 | 1 | 5 | 5 |
| **Total** | **100** | **5** | **24** | **80** | **88** |

**Phase 0.1 adjustment:** target scores moved from 77/85 to **80/88** because the plan now includes unit-level safety, data trust, transactional integrity, advanced validation, and interoperability readiness — all of which are scoreable *if built*. The current score is unchanged at **5/100**: research improves the plan, not the product.

**Honest read:** 100/100 is not realistically achievable for a greenfield hackathon build with no real hospital data and no clinical validation. 80–88 with a clean demo and honest framing is a strong, defensible outcome. Anything higher would require evidence we do not have.

---

## 2. Dimension-by-dimension assessment

### Problem understanding — 4 / 10 now → 9 target
- **Evidence now:** the brief is unusually precise, but no implementation embodies it. The reference app solves emergency dispatch, not shortage prediction.
- **Weakness:** no artifact demonstrates that the team has translated the problem into a model.
- **Improvement:** show the DGP, the forecasting unit `(region, group, component)`, the risk-factor decomposition, and the clinical authorization boundary in working code and docs.
- **Demonstration:** walk the judge through one seeded shortage from cause → score → alert → suggested transfer.

### Innovation & differentiation — 1 / 10 now → 12 target
- **Evidence now:** none in target; reference has an empty `SimulationScreen.js`.
- **Weakness:** most blood-bank systems are inventory CRUD; adding a chat box would not differentiate us.
- **Improvement:** four genuine differentiators — predictive lead time, factor-explained scores, side-by-side simulation, expiry/compatibility-aware matching.
- **Demonstration:** live scenario injection showing the score move and the alternative transfer appear.

### AI/ML implementation — 0 / 20 now → 14 target (17 stretch)
- **Evidence now:** no models, no data. Reference uses Gemini to invent `riskPercentage` and `confidence` from hardcoded inputs — an anti-pattern.
- **Weakness:** judges will probe whether "AI" is just an LLM call. It must not be.
- **Improvement:** real time-series baselines + ETS, rolling-origin backtest, WAPE vs baseline, known-event detection lead time, empirical intervals; LLM confined to phrasing grounded explanations.
- **Demonstration:** `/forecasts` page with held-out backtest metrics and a seeded event detected 5+ days earlier than a stock-threshold rule.

### Technical architecture — 0 / 15 now → 12 target
- **Evidence now:** none. Reference has Express/Mongoose layering and Socket.IO but no isolation, no tests, hardcoded endpoints.
- **Weakness:** a single Next.js app with everything in route handlers would look thin; over-splitting into many microservices would look like theatre.
- **Improvement:** the three-layer design in `SYSTEM_ARCHITECTURE.md` (web + domain API + Python intelligence) with Postgres/PostGIS, RLS, and audited state machines.
- **Demonstration:** architecture diagram in docs matching the actual deployed repo; show the nightly job producing snapshots.

### Functional completeness — 0 / 15 now → 12 target
- **Evidence now:** nothing in target. Reference blood screen is hardcoded local state.
- **Weakness:** incomplete flows (empty screens, duplicated files) signal a prototype, not a product.
- **Improvement:** complete the full loop A→D in `PRODUCT_VISION.md`, including transfer request state machine and audit trail.
- **Demonstration:** end-to-end scripted run with no broken buttons or dead endpoints.

### UI/UX quality — 0 / 10 now → 8 target
- **Evidence now:** none in target; reference is a mobile UI unsuited to a command center.
- **Weakness:** generic admin dashboards are the default failure mode.
- **Improvement:** the design system in `UI_UX_STRATEGY.md` — dense clinical command center, tabular numerals, honest data badges, accessible band labels.
- **Demonstration:** screenshot walkthrough at 1366px and 390px plus a keyboard-only pass.

### Real-world impact — 0 / 10 now → 6 target
- **Evidence now:** no real institutions, no real data.
- **Weakness:** claiming real-world impact on synthetic data would be dishonest and is likely to be penalized.
- **Improvement:** quantify *demonstrated* impact — detection lead time on seeded events, percentage of high-risk scores with full factor explanations, number of simulated transfer opportunities surfaced.
- **Demonstration:** a one-page "Evidence, not claims" summary with the onboarding path clearly marked as future work.

### Security & reliability — 0 / 5 now → 4 target
- **Evidence now:** none. Reference has a committed `config.env` with secret-bearing keys and no role/institution fields.
- **Weakness:** cross-institution leakage is the obvious failure a healthcare judge will test.
- **Improvement:** RBAC + RLS + audit log + validation + simulation isolation + no PHI.
- **Demonstration:** attempt an unauthorized cross-institution request on stage and show the 403 and audit entry.

---

## 3. What would move the score upward

1. **Real backtest evidence** (biggest lever on AI/ML, +3–4 points achievable).
2. **A polished, fully working simulation** (biggest lever on innovation, +2–3).
3. **Clean end-to-end demo with no dead ends** (+2–3 across completeness and UI).
4. **Visible safety posture** — roles, audit, simulation watermark (+1–2).

## 4. What would move it downward / risks

- Presenting simulated data as real → credibility collapse across impact and safety.
- Any LLM-invented number anywhere → direct hit on AI/ML and trust.
- Incomplete Transfer flow or broken map → functional completeness drops.
- Copying the reference app's hardcoded values → obvious on inspection.

---

## 5. Scoring rule for the final demo

Score only what can be **shown running** or **verified in the repository**. If a feature exists only in a planning document, it scores zero. This document is intentionally written so the team cannot mistake plans for points.

# PRODUCT_VISION.md — HemoNexus

**Status:** Greenfield product definition. Grounded in `PROJECT_AUDIT.md` (no existing implementation).

---

## 1. One-sentence vision

HemoNexus is a **predictive coordination network** that tells participating hospitals and blood banks *which blood group will run short, where, and why — days before it becomes an emergency* — and shows what authorized institutions could do about it.

It is **not** a blood bank CRUD app with an AI badge, and **not** an autonomous clinical decision system.

**Positioning against existing Indian infrastructure [VERIFIED]:** e-RaktKosh (MoHFW/C-DAC) is the national *system of record* for blood-bank stock availability and directory search. HemoNexus does **not** replace it and does **not** re-implement ordinary blood bank management. HemoNexus is a *decision-intelligence and coordination layer* that consumes verified inventory signals (eventually from systems like e-RaktKosh, subject to authorization) and adds prediction, explainability, expiry/cold-chain intelligence, transfer feasibility, simulation, and audit. Where such integration is not available, the demo uses clearly labelled **[SIMULATED]** institutions.

---

## 2. The problem worth solving

Blood shortages are rarely sudden; they are usually the end of a visible chain:

> steady demand + seasonal spike + low donations + stock nearing expiry + no view of stock next door → emergency scramble.

Most existing systems record what happened. They do not combine **demand forecasting**, **expiry-aware supply**, and **cross-institution visibility** into one decision loop. The gap is time: by the time a shortage is obvious, options are expensive.

**Who is hurt:** hospital blood bank managers, transfusion service coordinators, regional health administrators, and ultimately patients whose care is delayed.

**What we can honestly claim:** a decision-support and coordination platform working on **simulated** data for the demo, with a credible path to verified institutional data. We cannot claim clinical validation or real hospital participation at hackathon stage.

---

## 3. Target users and jobs to be done

| User | Role in platform | Job to be done | What they must never be allowed to do |
|---|---|---|---|
| **Regional coordinator** (public health / blood authority) | `REGIONAL_COORDINATOR` | See which groups and districts are at risk this week; find transferable stock across institutions | Order a transfer without both institutions' authorization |
| **Hospital blood bank manager** | `HOSPITAL_MANAGER` | Monitor own stock by group/component; understand why risk is rising; request units | See another institution's patient-level or identifiable data |
| **Blood bank inventory officer** | `BLOOD_BANK_MANAGER` | Record donations, batches, expiry dates; see surplus and near-expiry stock | Override compatibility rules or mark stock verified without checks |
| **Analyst / planner** | `ANALYST` | Backtest forecasts, inspect factor contributions, export reports | Change inventory records |
| **Platform administrator** | `PLATFORM_ADMIN` | Manage institutions, users, roles, data-source configuration | View or export secrets; impersonate a clinician |
| **Clinical reviewer (human)** | Out-of-system, named approver | Make the final compatibility/transfusion decision | Be replaced by the system |

**Explicit non-users:** patients (no patient-facing portal, no PHI in this build), unauthenticated public users (landing page only).

---

## 4. Core value proposition

1. **Lead time** — forecast shortage risk on a 7–28 day horizon instead of reacting the day stock hits zero.
2. **Explanations, not vibes** — every risk band is decomposed into measurable factors (cover days, expected demand, inbound supply, expiring stock, lead time).
3. **Network effect** — an institution's shortage can be matched against another institution's verified surplus, with transport time and authorization gates.
4. **Safe rehearsal** — a simulation engine lets coordinators test "what if O− demand jumps 30%?" without touching real stock, clearly labelled as hypothetical.
5. **Grounded assistant** — an AI that answers only from platform APIs and cites the numbers it used; it refuses to invent inventory or medical facts.

---

## 5. Primary workflows (end to end)

### Workflow A — Weekly shortage watch (the core loop)
1. Inventory updates arrive (batch CSV or authorized form) → stock by `(institution, group, component, expiry, batch)` is persisted.
2. Nightly pipeline computes expected demand per `(region, group, component)` from historical consumption + seasonality + known events.
3. For every institution/group/component, the risk engine computes **days of cover**, compares with forecast demand and inbound donations, and assigns a band: **Critical / High / Moderate / Stable**.
4. Every score carries a factor breakdown and human-readable reason.
5. Alerts are routed to the owning institution and the regional coordinator.
6. Coordinator opens the map, sees the hotspot and nearby verified surplus, and issues a **transfer request** (not a transfer).
7. Both institutions' authorized officers review; a clinical reviewer confirms compatibility; only then is any movement recorded.

### Workflow B — Emergency demand spike
1. Authorized coordinator opens **Simulation**, selects scenario "O− demand +30% for 7 days".
2. Engine clones the current state, applies the delta, re-runs the deterministic risk math, and shows **actual forecast vs simulated impact** side by side.
3. Output is watermarked `SIMULATION — NOT A FORECAST`, with the assumptions listed.
4. If real, the coordinator may convert the scenario into a real escalation request — a separate, audited action.

### Workflow C — Expiry-aware redistribution
1. System flags batches expiring in ≤ N days at institution A.
2. Matching engine finds institutions with verified need for the same group/component, filtered by compatibility rules, distance/transport time, and authorization status.
3. Suggestion is presented with reasons and constraints; no automated movement.

### Workflow D — Grounded explanation
1. User asks the assistant: "Why did O− go critical in the East district?"
2. Assistant calls read-only `/api/intelligence/explain?institution=…&group=O-`, receives a structured factor object with data provenance and timestamps.
3. Assistant renders the explanation from those fields and **must** cite "data as of <timestamp>, source: <dataset/simulation>". If data is missing it says so.

---

## 6. Product principles

- **Simulated means simulated.** Every screen and export states the data mode. Synthetic institutions use fictional names and cannot be mistaken for real hospitals.
- **Numbers come from math, words come from the model.** Forecasts, risk bands, and scores are deterministic Python computations. LLMs only phrase explanations from structured inputs.
- **Recommendation ≠ authorization.** The platform suggests; licensed humans decide.
- **Explainability is a feature, not a footnote.** A score without factors is not shown.
- **No fabricated certainty.** No invented accuracy, confidence percentages, or "AI confidence" badges. Uncertainty is expressed as prediction intervals and backtest metrics.
- **Institution isolation is structural.** Data is scoped by `institution_id` in the schema and enforced in the API and database.

---

## 7. Scope boundaries

**In scope for this build:** simulated multi-institution network, forecasting/risk engine, explanation layer, map with transfer opportunities, expiry intelligence, simulation engine, grounded assistant, RBAC, audit log, premium web UI, backtest report.

**Out of scope:** patient records, donor PII in the demo, automated orders, clinical compatibility sign-off by software, real payment/logistics integrations, mobile native apps, SMS to patients, production onboarding of real hospitals (documented as a future path only).

---

## 8. Success criteria (demo-level, measurable)

| Criterion | Target |
|---|---|
| Institutions in demo network | 8–12 fictional facilities across ≥3 regions |
| Time series generated | ≥24 months weekly consumption per region/group/component |
| Forecast baseline | Beats seasonal-naive baseline on rolling-origin backtest (WAPE) |
| Risk scores explained | 100% of Critical/High scores show ≥4 factor contributions |
| Simulation vs forecast | Same scenario shown side by side, clearly distinguished |
| Assistant grounding | 0 fabricated inventory facts in a scripted 10-question demo |
| Data honesty | 100% of screens/exports labelled `SIMULATED DATA` |
| Auth | Every API read/write authorized by role + institution scope |
| Accessibility | Keyboard navigable; WCAG 2.2 AA contrast on core screens |

---

## 9. What "impact" means here

Real-world value is demonstrated, not claimed: a backtest showing the risk engine would have flagged a seeded historical shortage **N days earlier** than a stock-threshold rule, and a simulation showing which transfer would have covered the gap. That is the demo the judges should see — not a claim that a real hospital was helped.

---

## 10. Phase 0.1 additions to product principles

1. **Unit-level truth [PROPOSED].** Inventory is tracked per blood unit with component, expiry, storage conditions, quarantine/quality state, and distribution history — not as an anonymous aggregate count. A unit with an unresolved temperature or quality issue is **not eligible inventory** and cannot be shown as available.
2. **Trust is displayed, not assumed [PROPOSED].** Every stock figure carries source, last update, verification state, completeness, and stale/conflict flags via the Data Trust module (`DATA_QUALITY_AND_INTEROPERABILITY.md`). A data-quality indicator is never presented as forecast confidence.
3. **Feasibility before suggestion [PROPOSED].** The matching engine checks component-specific rules, verified availability, reservation state, expiry, cold-chain feasibility, transport time, and authorization before listing a transfer candidate. Clinical usability is always confirmed by a qualified human.
4. **Safe rehearsal [PROPOSED].** Simulation runs on a cloned snapshot; no simulated result can modify live inventory.
5. **Interoperability-ready, not FHIR-complete [PROPOSED].** Domain objects are shaped to map to FHIR R5 `InventoryItem`/`InventoryReport` concepts so future integration is cheap; the full FHIR specification is deliberately not implemented.
6. **Privacy by design [VERIFIED basis].** Data minimization, purpose limitation, phased DPDP compliance, and institutional isolation are design constraints, not afterthoughts (`SECURITY_AND_SAFETY.md`).

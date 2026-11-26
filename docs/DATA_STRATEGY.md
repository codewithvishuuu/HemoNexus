# DATA_STRATEGY.md — HemoNexus

**Status:** Target data plan. No real hospital or donor data exists in the workspace (see `PROJECT_AUDIT.md`).
**Verification note:** items marked ✅ were fetched during this phase; items marked **VERIFY** are known references whose exact terms/API must be re-checked before use.

---

## 1. The honest starting position

There is **no usable real inventory or consumption dataset** for this project. Public blood datasets mostly cover *donor behaviour*, not *inventory over time*. Therefore:

- The demo runs entirely on **explicitly simulated data**.
- No screen, chart, export, or assistant answer may present simulated entities as real institutions.
- The platform ships with a documented path to onboard verified institutions later.

---

## 2. Candidate public data sources

| Source | URL | Fields | Licensing / restrictions | Reliability & coverage | Supports forecasting? | Status |
|---|---|---|---|---|---|---|
| **UCI Blood Transfusion Service Center** | https://archive.ics.uci.edu/dataset/176/blood+transfusion+service+center | Recency (months), Frequency (donations), Monetary (c.c.), Time (months since first), binary donation in Mar 2007. 748 rows, 4 features, no missing values. | **CC BY 4.0** — reuse allowed with attribution. | High (curated academic dataset), Taiwan, single centre, 2007. | **No** for inventory forecasting; useful as a donor-propensity / inbound-supply modelling reference. | ✅ fetched & verified |
| **WHO Blood safety / Global Status Report on Blood Safety and Availability** | https://www.who.int/health-topics/blood-safety | Aggregated national collection/transfusion figures, policy indicators. | WHO terms of use; citation required; aggregates only. | High-level but coarse; country-level, periodic. | **No** — no weekly series; use only to justify policy parameters. | ✅ page reachable; specific report URL **VERIFY** |
| **e-RaktKosh (MoHFW, India)** | https://eraktkosh.mohfw.gov.in/ | Blood bank registry, stock availability by group/component, district coverage. | Government portal; terms and any API access **VERIFY** — do not scrape. | Authoritative reference model for Indian blood-bank inventory; real-time-ish availability. | **Potentially** if an authorized data-sharing route exists; not assumed available. | ✅ portal reachable; API availability **VERIFY** |
| **OpenStreetMap / Overpass API** | https://www.openstreetmap.org/copyright · https://overpass-api.de/ | Hospital and blood-bank points, admin boundaries, coordinates. | **ODbL** — attribution required; share-alike on derived database. | Community-maintained; variable completeness; good for geography only. | Indirect — provides locations, not demand. | Well-known license — **VERIFY** exact attribution text |
| **Open-Meteo** | https://open-meteo.com/ | Daily weather/temperature/precipitation. | **CC BY 4.0** (free tier), attribution required. | Reliable modelled/forecast weather; global coverage. | Indirect — weather as a seasonality covariate. | **VERIFY** current terms |
| **Kaggle blood donation / inventory datasets** | https://www.kaggle.com/datasets | Varies (often donor-level RFM or synthetic). | Per-dataset license varies widely — must read each. | Mixed; many are teaching datasets. | Usually no; inspect before use. | **VERIFY** per dataset |

**Conclusion from the survey:** no freely available dataset provides the weekly, multi-institution, group-by-component inventory histories the brief requires. A synthetic strategy is not a shortcut — it is the only honest option at this stage.

---

## 3. Synthetic data policy (mandatory)

### 3.1 Generation
- A **checked-in, seeded generator** (Python, fixed seed) deterministically produces:
  - 8–12 fictional institutions across 3 regions, with real coordinates but invented names (e.g. "Northbridge District Hospital — SIMULATED").
  - ≥24 months of weekly consumption per `(region, group, component)`.
  - Batch-level stock with collection and expiry dates; FEFO-consistent.
  - Weekly donation arrivals with availability lag.
  - Calendar effects: weekly seasonality, festival/monsoon/exam bumps.
  - **Known seeded shortage events** with onset dates, used to measure detection lead time.
- The data-generating process (DGP) is documented in code and in `backtest_report.csv`, so results are reproducible.

### 3.2 Labeling rules
- DB rows carry `is_simulated = true` and `source = 'synthetic-v1'`.
- UI shows a persistent `SIMULATED DATA` badge; exports include it in filename and header.
- Institution names are unmistakably fictional; no real hospital names, logos, or addresses.
- Assistant prompt context states the data mode; answers must repeat it when asked.
- Simulation results carry `SIMULATION — NOT A FORECAST` separately from the general simulated badge.

### 3.3 Prohibitions
- No real donor or patient data — no names, phone numbers, IDs, diagnoses.
- No claim of real-world deployment, real hospital partnership, or clinical validation.
- No "accuracy" claim derived only from synthetic data without saying it is synthetic.

---

## 4. How real onboarding would eventually work (design only, not executed)

1. **Agreement & governance** — MOU with institution; define data sharing, retention, purpose limitation, and who can view what.
2. **Verification** — platform admin verifies institution identity and the authorized officer's role; `verified = true` only after checks.
3. **Data dictionary & template** — publish required fields (group, component, units, collected/expiry dates, event timestamps); supply CSV template and API spec.
4. **Ingestion with provenance** — every imported row records `source`, `imported_at`, `imported_by`, and validation result; no silent drops.
5. **Backfill & baseline** — require **≥104 weekly observations (2 years)** before enabling seasonal forecasts, with a ≥52-week fallback and an explicit `INSUFFICIENT_DATA` state otherwise; otherwise show "insufficient history" (see `AI_ML_STRATEGY.md` §10.2 and §11).
6. **Isolation** — institution-scoped roles and RLS from day one; cross-institution visibility limited to the matching endpoints' aggregated suggestions.
7. **Clinical governance** — compatibility and transfusion decisions remain with qualified professionals; the platform only suggests and records approvals.
8. **Audit & consent** — append-only audit log; donor consent status tracked if donor-level data is ever introduced (not in this build).

**No real institution is onboarded during the hackathon.** This section demonstrates architectural readiness, not a claim of partnerships.

---

## 5. Data quality rules applied at ingestion

- Blood group ∈ the 8 ABO/Rh values; component ∈ allowed set; quantity > 0.
- Expiry date > collection date; batch cannot be verified without an authorized verifier.
- Timestamps stored UTC; all displays show timezone.
- Duplicate events detected by natural key `(institution, group, component, event_time, source)`.
- Rejected rows are surfaced with reasons in the UI; never silently ignored.

---

## 6. Evidence to show in the demo

- A "Data provenance" panel showing: generator seed, DGP summary, number of synthetic institutions, date range, and the fact that all values are simulated.
- A backtest report generated from the seed, proving the pipeline works end to end.
- A clear statement: "This pipeline is ready for verified institutional data; none was available at hackathon time."

---

## 7. Phase 0.1 — e-RaktKosh research and complementarity

### 7.1 [VERIFIED] What is publicly observable

| Item | Evidence |
|---|---|
| Official ownership | Footer of the public portal: "Ministry of Health and Family Welfare", "Designed and Developed by Centre for Development of Advanced Computing" |
| Purpose | Portal title/description: "e-Raktkosh: Centralized Blood Center Management System"; initiative to connect/digitize blood banks |
| Public capabilities (from navigation) | Blood Availability Search, Blood Bank Directory, Thalassemia Request, Blood Donation Camps, Donor Login, Register VBD Camp, Voluntary Donor Group, Blood Bank Login, Add Your Blood Bank |
| Search dimensions (search-result snippet from official portal) | State, District, Blood Group, Component, Location → real-time availability across registered centres |
| Published component guidance on the public page | Red cells: 42 days at 2–6 °C; plasma: frozen below −30 °C up to 1 year; platelets: 5 days at 20–24 °C |
| Mobile access | Listed on UMANG (official government app aggregator) as "find blood banks, check blood availability, volunteer for camps" |

Sources and access date: `eraktkosh.mohfw.gov.in/` and `eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/transactions/bbpublicindex.html` (fetched 2026-11-26); UMANG department listing and C-DAC/PIB references identified via search but pages not directly retrievable here — see `FINAL_REVIEW.md` source register.

### 7.2 What is NOT verified — do not assume

- **No public open API documentation was found.** Any integration must be treated as **[ASSUMPTION]** until an authorized data-sharing mechanism is confirmed with MoHFW/C-DAC/the_state blood transfusion council.
- Institutional coverage counts (number of registered blood banks) are **[UNVERIFIED]** here; third-party claims of "3,500+" were seen in search snippets but are not from a primary source and must not be quoted in the demo.
- No scraping is proposed. Any future integration is a formal, authorized feed with provenance and governance.

### 7.3 Complementarity (why HemoNexus is not a duplicate)

| e-RaktKosh (system of record) | HemoNexus (proposed intelligence layer) |
|---|---|
| Current stock availability search | Forecast future shortage risk with lead time |
| Blood bank directory and camps | Cross-institution transfer feasibility and coordination |
| Donor registration / collection drives | Demand/supply imbalance explanations, expiry intelligence, simulation |
| Operational blood-bank records | Read-only consumption of verified signals; no replacement of bank workflow |

HemoNexus would **consume**, not replace, verified inventory data. Until authorized access exists, all demo institutions and stock are **[SIMULATED]**.

---

## 8. Unit-level data fields added in Phase 0.1 [PROPOSED]

The synthetic generator must now emit, per unit: `unit_id`, `institution_id`, `blood_group`, `component`, `collected_at`, `expires_at`, `storage_condition`, `temperature_readings[]`, `excursion_events[]`, `quarantine_state`, `quality_verification`, `transport_conditions`, `distribution_trace`, `reservation_state`. Component-specific shelf-life rules are configurable and sourced (`HEALTHCARE_STANDARDS_AND_COMPLIANCE.md`); unresolved quality/temperature issues force `eligible_for_matching = false`. No unit record contains donor or patient identity.

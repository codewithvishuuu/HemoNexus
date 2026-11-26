# HEALTHCARE_STANDARDS_AND_COMPLIANCE.md — HemoNexus

**Phase 0.1 research document. No application code changed.**
**Access date for all sources:** 2026-11-26.

**Evidence legend:** [VERIFIED] fetched from primary source · [PARTIALLY VERIFIED] existence/provenance confirmed, content not retrievable · [ASSUMPTION] must be confirmed · [PROPOSED] target design · [SIMULATED] demo data.

---

## 1. Purpose and scope

This document grounds HemoNexus's healthcare data model and safety rules in official Indian and WHO guidance, and states clearly what could and could not be verified in this environment. It does **not** make clinical claims. The platform remains decision support; all transfusion and compatibility decisions stay with qualified humans.

---

## 2. e-RaktKosh — Government of India centralised blood bank system

### 2.1 [VERIFIED] Identity and ownership
- **Source:** official portal `https://eraktkosh.mohfw.gov.in/` — page title: *"e-Raktkosh: Centralized Blood Center Management System"*; meta description confirms it is the official website; footer states *"by Ministry of Health and Family Welfare"* and *"Designed and Developed by Centre for Development of Advanced Computing"*.
- Public portal page: `https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/transactions/bbpublicindex.html` (fetched successfully).

### 2.2 [VERIFIED] Observable capabilities
From the public portal navigation and content:

| Capability | Evidence (section of page) |
|---|---|
| Blood Availability Search | "Looking for Blood → Blood Availability"; homepage quick link "Blood Availability Search" |
| Blood Bank Directory | "Looking for Blood → Blood Bank Directory" |
| Thalassemia Request | "Looking for Blood → Thalassemia Request" |
| Blood Donation Camps / camp registration | "Want to Donate Blood → Blood Donation Camps / Register VBD Camp" |
| Donor login and voluntary donor group | "Want to Donate Blood → Donor Login / Voluntary Donor Group" |
| Blood-bank onboarding and login | "Blood Bank Login → eRaktkosh Login / Add Your Bloodbank" |
| Compatibility education table | "Compatible Blood Type Donors" table (ABO/Rh) |
| Component guidance | "Types of donation" section — Packed Red Blood Cells, Plasma, Platelet |
| Mobile access | UMANG department listing (identified in search; page not directly fetched) |

### 2.3 [VERIFIED] Component storage/shelf-life published on the public page
| Component | Published guidance |
|---|---|
| Red cells | "can be stored for 42 days at 2-6 degree celsius" |
| Plasma | "after separation if frozen below -30 degrees can be stored up to one year" |
| Platelets | "can be stored for 5 days at 20-24 degree celsius" |

These are **published public guidance figures**, used in HemoNexus only as the initial **configurable, versioned rule set** for the demo. They must be confirmed against the applicable National Standards clause before any non-demo use.

### 2.4 [VERIFIED via search snippet / PARTIALLY VERIFIED] Search dimensions
The official portal's search description states that Blood Availability Search lets users check real-time availability by **State, District, Blood Group, Component and Location** across registered blood centres. The snippet came from an indexed result of the official domain; the exact text could not be re-fetched from the SPA bundle. Treat the dimensions as **[PARTIALLY VERIFIED]**.

### 2.5 [PARTIALLY VERIFIED] Government statements on integration
- PIB press release `https://www.pib.gov.in/PressReleasePage.aspx?PRID=1847438` (page returned 403 in this environment) — indexed snippet: *"the e-RaktKosh web portal of Government of India, provides the interface for Blood Banks data management and integration. For this, all blood banks have been advised to register on e-RaktKosh web-portal."* Publication date not retrievable — **verify**.
- C-DAC blog `https://cdac.in/index.aspx?id=blog_ni_e-RaktKosh` — indexed snippet states states were directed to use e-RaktKosh as a single point for donor records and real-time stock status — **verify**.
- UMANG listing `https://web.umang.gov.in/landing/department/e-raktkosh.html` — indexed snippet describes connecting/digitising blood banks and checking availability — **verify**.

### 2.6 Integration mechanisms — what we do NOT assume
- **No public Open API specification was found or verified.** Any claim of open API access is **[ASSUMPTION]** and forbidden in the demo.
- Institutional coverage numbers (e.g. third-party "3,500+ blood banks" claims) are **[UNVERIFIED]** and must not be quoted.
- HemoNexus proposes a **future, authorized, governed feed** only: formal data-sharing agreement → verified credentials → documented data dictionary → provenance records → rate limits → audit. Until then, all HemoNexus institutions are **[SIMULATED]** and are never presented as e-RaktKosh participants.

### 2.7 Complementarity — HemoNexus does not duplicate e-RaktKosh
| e-RaktKosh [VERIFIED capabilities] | HemoNexus [PROPOSED addition] |
|---|---|
| Current availability lookup and bank directory | Predictive shortage risk with 7–28 day lead time |
| Blood bank workflow records | Cross-institution feasibility, expiry/cold-chain intelligence, simulation |
| Donor/camp registration | Explainable factor decomposition and grounded assistant |
| System of record | Decision-intelligence layer that reads verified signals |

**Rule:** HemoNexus never becomes a second system of record for routine blood bank management.

---

## 3. WHO guidance

### 3.1 [VERIFIED] Blood safety and availability fact sheet
- **Source:** `https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability`, **published 12 June 2026**, sections: *Key facts*, *National blood policy and organization*, *Blood supply*, *Blood donors*, *Blood screening*, *Blood processing*, *Clinical use of blood*, *WHO response*.
- Relevant verified statements:
  - WHO recommends all collection, testing, processing, storage and distribution activities be coordinated nationally through integrated blood supply networks (*National blood policy and organization*).
  - Blood can be separated into components (red cell concentrates, platelets, plasma, cryoprecipitate) to serve more than one patient (*Blood processing*).
  - Unnecessary transfusions expose patients to risk and reduce availability; WHO recommends hospital transfusion committees and haemovigilance (*Clinical use of blood*).
  - Data source note: WHO Global Database on Blood Safety, 153 countries for 2023.

### 3.2 [VERIFIED] Blood cold chain
- **Source:** `https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/blood-and-products-of-human-origin/blood-cold-chain`.
- Verified statements: the cold chain is *"a system for storing and transporting blood and blood products, within the correct temperature range and conditions, from the point of collection ... to the point of transfusion"*; deviations "can seriously affect viability", increase bacterial proliferation risk, and may cause life-threatening reactions; a break leads to wastage/discard; **quality management should apply to all aspects** in blood centres, hospital blood banks, and all handling institutions.
- Listed WHO publications with dates: *Aide-mémoire for National Blood Programmes: the blood cold chain* (1 Jan 2011); *Safe blood and blood products: Manual on the management, maintenance and use of blood cold chain equipment* (17 May 2005); *The blood cold chain: guide to selection and procurement of equipment* (1 Jan 2002).

### 3.3 Application to HemoNexus [PROPOSED]
Cold-chain is modelled as first-class data (temperature readings, excursion events, transport conditions), and an unresolved excursion makes a unit ineligible. WHO guidance supports the *structure* of this model; it does not supply HemoNexus-specific clinical thresholds.

---

## 4. Indian National Standards and Drugs and Cosmetics Rules

### 4.1 [PARTIALLY VERIFIED] National Standards for Blood Centres
- **Document:** *National Standards for Blood Centres* (second edition/revision), MoHFW / National Blood Transfusion Council (NBTC) / Directorate General of Health Services (DGHS).
- **Host:** `https://www.clinicalestablishments.mohfw.gov.in/sites/default/files/2022-07/1491_0.pdf` (uploaded 2022-07), with a mirror at `https://cerrs-dev.inroad.in/sites/default/files/2023-03/1491.pdf`.
- Indexed provenance text: *"Standards for Blood Centres and BTS in India were first published in 2007 ... NBTC entrusted the responsibility to a committee to 'review and revise' the Standards."*
- **Limitation:** the PDF content type could not be parsed by the fetch tool in this environment. **Clause numbers and exact temperature/shelf-life tables are NOT verified here** and must be read from the official PDF before implementation. The public e-RaktKosh figures (§2.3) are used as provisional demo values only.

### 4.2 [PARTIALLY VERIFIED] NBTC / DGHS roles
- **Source:** DGHS Blood Transfusion Services page `https://www.dghs.mohfw.gov.in/bts.php` (identified via search; not directly fetched). Indexed text: *"NBTC is the policy-formulating apex body for all matters about Blood Transfusion Services for the country. Similarly, State Blood Transfusion Councils are set up at the State level to adopt/adapt and implement the policy directives of NBTC"*, with roles including policy/strategy/standards, monitoring provisioning, and coordination.
- Implication [PROPOSED]: future institutional onboarding must respect the NBTC/SBTC policy hierarchy; HemoNexus does not set blood policy.

### 4.3 [UNVERIFIED] Drugs and Cosmetics Rules 1945
Blood-centre licensing and operational requirements under the Drugs and Cosmetics Rules 1945 (and related CDSCO guidance at `https://www.cdsco.gov.in/opencms/opencms/en/BloodCentre/`) are relevant but **specific rule numbers, schedules and amendments were not verified in this phase**. Do not cite clause numbers in the demo. Action: legal/regulatory review before any real deployment.

---

## 5. Expanded HemoNexus data model [PROPOSED]

Derived from §2–§4, every blood unit carries:

| Field group | Fields |
|---|---|
| Identity | `unit_id` (unique), `institution_id`, `donation_ref` (non-identifying) |
| Classification | `blood_group`, `component`, `base_unit`, `net_content` |
| Dates | `collected_at`, `processed_at`, `expires_at`, `component_shelf_life_rule_version` |
| Storage | `storage_condition` (code), `temperature_readings[]`, `storage_location` |
| Cold chain | `transport_conditions[]`, `excursion_events[]`, `excursion_resolved_by/at` |
| Quality/legal | `quarantine_state`, `quality_verification`, `verified_by`, `verification_time`, `regulatory_status` (if applicable) |
| Movement | `distribution_trace[]`, `reservation_state`, `current_holder` |
| Provenance | `is_simulated`, `source`, `imported_at` |

**Eligibility rule [PROPOSED]:** a unit is `eligible_for_matching` only if all of the following hold — verified quality state, no unresolved temperature excursion, not quarantined, expiry beyond minimum remaining shelf life, known storage condition, and no conflicting records. AI never sets this flag automatically from medical judgement; it is derived from recorded, human-verified facts.

**Component rules [PROPOSED]:** a versioned `component_rule` table holds storage range, shelf life, transport range, and source citation per component. Demo seed values come from §2.3; each row records `source`, `source_date`, and `verification_status`.

---

## 6. Safety invariants (non-negotiable)

1. A unit with unresolved quality or temperature issue is **never** presented as eligible inventory.
2. Compatibility matching uses rule tables and gates; clinical usability is confirmed by a qualified human.
3. The platform does not approve transfusions, issue medical instructions, or replace institutional protocols.
4. No donor or patient identifiers are stored in this build.
5. All simulated units are labelled **[SIMULATED]**; no real institution names are used.
6. Unverified standards content is marked as such; no invented clause citations.

---

## 7. Outstanding verification tasks before implementation

- [ ] Read the official National Standards PDF and record exact clause numbers for storage, shelf life, quarantine, and transport.
- [ ] Verify Drugs and Cosmetics Rules 1945 clauses relevant to blood centres with a regulatory reviewer.
- [ ] Confirm whether any authorized e-RaktKosh integration mechanism exists; do not assume.
- [ ] Verify PIB/UMANG/C-DAC publication dates and statements if they will be cited publicly.
- [ ] Obtain legal review of DPDP applicability if real data is ever onboarded.

---

## 8. Component compatibility and qualified-human verification [PROPOSED]

### 8.1 Rule-based compatibility (decision support only)
The public e-RaktKosh ABO/Rh table [VERIFIED §2.2] is encoded as a **versioned rule table** used only as a *filter* in candidate discovery:

| Recipient group | Red-cell compatible donor groups (from public table) |
|---|---|
| O− | O− |
| A− | A−, O− |
| B− | B−, O− |
| AB− | AB−, A−, B−, O− |
| O+ | O+, O− |
| A+ | A+, A−, O+, O− |
| B+ | B+, B−, O+, O− |
| AB+ | Everyone |

Oops — this table is a **simplified educational matrix** from a public portal, not a clinical protocol. It must be replaced by the institution's approved compatibility protocol before any real use. Demo values are labelled **[SIMULATED / PUBLIC GUIDANCE]** and carry `rule_version` and `source`.

Rules:
- Component type must match the requested component; different components have different handling and shelf-life rules.
- Only units that are verified, non-quarantined, excursion-free, unexpired, and unreserved enter the candidate set.
- The engine emits **reasons and blockers**, never a "clinically suitable" verdict.

### 8.2 Qualified human verification (non-negotiable)
| Checkpoint | Who | Evidence recorded |
|---|---|---|
| Unit quality verification | Authorized quality officer | identity, timestamp, method, result |
| Excursion investigation / release | Authorized quality officer | reason, duration, decision, audit entry (`DATA_QUALITY_AND_INTEROPERABILITY.md` §7) |
| Institutional approval A | Sending institution officer | identity, timestamp, acceptance |
| Institutional approval B | Receiving institution officer | identity, timestamp, acceptance |
| Clinical confirmation | Named qualified clinical reviewer | identity, timestamp, protocol reference, explicit confirmation |

The system **cannot** advance a transfer beyond `PENDING_CLINICAL` without the fifth checkpoint. There is no API, UI action, or AI tool that performs it. Tests R5/R6 and F6 enforce this.

### 8.3 Explicit boundary statement
HemoNexus provides decision support and coordination only. It does not determine clinical compatibility, issue transfusion instructions, or authorize a transfusion. Any claim to the contrary in UI, docs, or assistant output is a defect.

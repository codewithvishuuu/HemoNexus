# SECURITY_AND_SAFETY.md — HemoNexus

**Status:** Target security and healthcare-safety design. No production system exists to audit (see `PROJECT_AUDIT.md`).

---

## 1. Classification and threat model

- **Domain:** healthcare coordination decision support.
- **Data sensitivity in this build:** synthetic operational data only. No PHI, no donor PII, no patient identifiers.
- **Future sensitivity:** if real institutions onboard, inventory and staffing data become sensitive operational information; donor/patient data is out of scope and must never enter this system.
- **Primary threats:** cross-institution data leakage, privilege escalation, tampering with inventory records, fabricated AI output presented as fact, accidental execution of an unauthorized transfer, secret leakage from committed env files.

---

## 2. Role-based access control (RBAC)

| Role | Read own institution | Read other institutions (aggregated only) | Write inventory | Acknowledge alerts | Create transfer request | Approve transfer | Administer users/institutions |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `PLATFORM_ADMIN` | ✓ (audited) | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `REGIONAL_COORDINATOR` | ✓ | ✓ (via map/matching only) | ✗ | ✓ | ✓ | ✗ | ✗ |
| `HOSPITAL_MANAGER` | ✓ | aggregated only | ✓ (own) | ✓ (own) | ✓ | ✗ | ✗ |
| `BLOOD_BANK_MANAGER` | ✓ | aggregated only | ✓ (own) | ✓ (own) | ✓ | ✗ | ✗ |
| `ANALYST` | ✓ | ✓ (read-only) | ✗ | ✗ | ✗ | ✗ | ✗ |
| `CLINICAL_REVIEWER` | ✓ (own) | ✗ | ✗ | ✗ | ✗ | ✓ (final sign-off) | ✗ |

**Enforcement points:**
1. API guard checks role on every route.
2. Institution scope injected from the authenticated session, never from a client parameter.
3. Postgres RLS policies filter `institution_id` for non-admin roles.
4. UI hides actions the role cannot perform — a convenience, not the security boundary.

---

## 3. Authentication

- Passwords hashed with **argon2id** (or bcrypt with cost ≥12 if argon2 unavailable).
- JWT in **httpOnly, Secure, SameSite=Lax** cookies; short-lived access token + rotating refresh token.
- No tokens in localStorage; no secrets in frontend bundles.
- Failed-login rate limiting; lockout after repeated failures.
- Demo accounts are clearly labelled and seeded; production accounts require admin creation.
- Reference-app lesson: it had bcrypt + JWT middleware but **no role and no institution** — do not repeat.

---

## 4. Institutional isolation

- `institution_id` NOT NULL on every domain table; composite indexes for scoped queries.
- RLS session variable set per request from the verified token; never trust a body/query parameter for institution.
- Cross-institution reads are limited to:
  - map hotspots (band + coarse location only),
  - matching suggestions (group, component, verified units, distance, expiry — no patient data),
  - regional aggregates.
- Any cross-institution write requires the two-phase transfer state machine with approvals from both sides.
- Admin bypass is a distinct DB role and every query it runs is audited.

---

## 5. Data validation and API safety

- Zod schemas at every HTTP boundary; Pydantic in the Python service; unknown fields rejected.
- Enums for blood group, component, role, band, alert state, transfer state — no free text where an enum belongs.
- Numeric bounds on quantity, expiry horizon, scenario deltas, and radius.
- Consistent error shape `{ error: { code, message, trace_id } }`; no stack traces or DB errors returned to clients.
- CORS allowlist configured by environment; **no hardcoded LAN IPs** (reference app defect).
- CSP, `X-Content-Type-Options`, `Referrer-Policy`; HTTPS everywhere in deployment.
- Rate limits on auth, assistant, and simulation endpoints.
- File upload (CSV) is size-limited, type-checked, and parsed in a sandboxed path — no raw file execution.

---

## 6. Audit logging

Append-only `audit_log` with: actor id, role, institution id, action, entity/entity id, before/after summary, timestamp, request trace id, outcome.

Logged events:
- login / logout / failed login
- inventory batch create/update/verify/delete
- donation import and CSV import results
- forecast + score recomputation (with model/weights version)
- alert creation, acknowledgement, resolution
- transfer request creation, approvals, rejection, completion
- simulation runs (scenario and actor)
- admin user/institution changes
- assistant queries (question and cited sources, no patient data)

No update or delete API for audit rows. Retention and access policy documented; admin-only viewer in UI.

---

## 7. Healthcare safety boundaries

1. **Decision support only.** The platform never autonomously orders, reserves, or moves blood.
2. **Clinical decisions stay human.** Compatibility/transfusion appropriateness is confirmed by a qualified clinical reviewer; the system records that approval, it does not replace it.
3. **Matching is advisory.** The engine applies ABO/Rh rules as *filters* and shows blockers; it does not declare a unit clinically suitable.
4. **No patient data.** No patient identifiers, diagnoses, or transfusion records enter the platform.
5. **No fabricated certainty.** No invented accuracy/confidence percentages; uncertainty appears as empirical intervals and backtest metrics.
6. **No fabricated facts by the assistant.** Grounded tool calls only; if data is missing, the assistant says so.
7. **Simulation isolation.** Simulated scenarios never write to live inventory and are always labelled.
8. **Stale data visibility.** Every score/forecast shows `as_of`; stale snapshots show a warning banner rather than silently looking current.

---

## 8. Secrets and configuration

- Secrets only in platform env stores / `.env` files that are gitignored.
- **Never commit a `config.env`** — the reference archive contained one with `MONGO_URI`, `JWT_SECRET`, `GOOGLE_GEMINI_KEY` keys. Values were not read; if that artifact was ever committed, credentials must be rotated.
- Provide `.env.example` with key names and no values.
- CI secret scanning; dependency vulnerability check before final demo.
- Separate dev/preview/prod credentials; preview uses synthetic data only.

---

## 9. Privacy and governance readiness

- Purpose limitation: data used only for shortage prediction and coordination.
- Data minimization: store only group/component/quantity/expiry/time — no donor identity in this build.
- Access reviews: quarterly for real deployments (documented, not performed now).
- If donor-level data is ever added: consent capture, retention limits, and a lawful basis must be designed first — explicitly deferred.
- No third-party analytics that exfiltrate operational data; no external AI provider receives patient or identifiable data.

---

## 10. Pre-demo security checklist

- [ ] All roles tested against a cross-institution access attempt (expect 403 + audit entry).
- [ ] RLS verified with two simulated institutions.
- [ ] No secrets in repository; `.env.example` only.
- [ ] Assistant has no write tools and refuses clinical questions.
- [ ] Simulation cannot write to `inventory_batch`.
- [ ] Every screen and export shows `SIMULATED DATA`.
- [ ] Transfer request requires both institutional approvals + clinical sign-off before state change.
- [ ] Audit viewer accessible to admins only.
- [ ] Hardcoded endpoints/CORS replaced with env config.

---

## 11. Phase 0.1 — India DPDP Act 2023 and DPDP Rules 2025

### 11.1 [VERIFIED via secondary source] Applicable commencement — not uniform

| Instrument | Date | Detail |
|---|---|---|
| DPDP Act 2023 (Act No. 22 of 2023) | Assent **11 Aug 2023** | Framework Act; long title covers lawful processing of digital personal data |
| Commencement notification **G.S.R. 843(E)** | **13 Nov 2025** | Brought into force s.1(2), s.2, ss.18–26, s.35, ss.38–43, and s.44(1) & (3) — includes the Data Protection Board provisions |
| Further commencement | **13 Nov 2026** | s.6(9) and s.27(1)(d) |
| Remaining provisions | **13 May 2027** | Everything else |
| DPDP Rules 2025 | Notified **14 Nov 2025** | Operational detail: notice/consent, breach reporting, cross-border conditions, Board procedure, phased compliance |

**Important:** do not assume every obligation has the same effective date. Primary Gazette texts (G.S.R. 843(E), 13 Nov 2025; Rules notification, 14 Nov 2025) were not directly retrievable in this environment — **[PARTIALLY VERIFIED]**, re-check before any compliance claim. Sources: DPDP Act/Rules summaries and cited Gazette references in `FINAL_REVIEW.md` §4.

### 11.2 Design mapping (proposed controls)

| DPDP principle | HemoNexus design response |
|---|---|
| Data minimization | Store only group, component, quantity, timestamps, storage/quality state. **No donor or patient identity in this build.** No PHI fields exist in the schema. |
| Purpose limitation | Data used only for shortage prediction, expiry intelligence, and coordination suggestions; purpose stated in notices and enforced by role scoping. |
| Consent / lawful processing | Not applicable to the synthetic demo (no personal data). If real institutional feeds are added, institutional authorization + lawful basis must be established before any donor-level field is introduced. |
| Access control | Six roles, institution scoping, Postgres RLS, audited admin bypass (`§2–4`). |
| Retention / deletion | Append-only event history with documented retention; deletion request workflow designed for future real data; audit log retained for safety. **[PROPOSED]** |
| Encryption | TLS in transit; encryption at rest for DB and backups; secrets in platform stores only. |
| Auditability | Append-only `audit_log` covering all mutations, approvals, simulations, and assistant queries (`§6`). |
| Institutional isolation | RLS + API scope + UI context; cross-institution visibility limited to aggregated map/matching views. |
| Security incident response | Runbook: detect → contain → assess affected data → notify Data Protection Board and affected principals where applicable within prescribed timelines → remediate → post-incident review. Timeline values must be verified against the Rules before adoption. |

### 11.3 Healthcare-safety interaction

DPDP compliance does **not** imply clinical safety. Separate controls remain: unresolved temperature/quality issues block eligibility; clinical usability is confirmed only by a qualified human; simulations never alter live stock. See `HEALTHCARE_STANDARDS_AND_COMPLIANCE.md`.

---

## 12. Minimum security and deployment baseline [PROPOSED]

See `SYSTEM_ARCHITECTURE.md` §14 for the deployment half. Minimum security gate before any demo or deployment:

1. **Identity:** named accounts, MFA for admins, no shared credentials, demo accounts clearly labelled and non-production.
2. **Transport:** HTTPS/TLS 1.2+ everywhere, HSTS, secure cookies (`HttpOnly`, `Secure`, `SameSite`), no token in localStorage.
3. **Data:** encryption at rest for DB/backups; field-level minimisation (no donor/patient PII); retention/deletion policy documented.
4. **Access:** RBAC + RLS + institution scope on every route; admin bypass audited; deny-by-default.
5. **Supply chain:** dependency and secret scanning in CI; no high-severity findings; lockfiles committed.
6. **Observability:** structured logs with `trace_id`, audit log append-only, health/readiness probes on all services.
7. **Incident response:** runbook with detection → containment → assessment → DPDP notification where applicable → recovery → post-incident review; contact list and escalation path recorded (values are **[ASSUMPTION]** until hosts are provisioned).
8. **Backup/DR:** pre-migration snapshots, restore drill, RPO/RTO targets per `SYSTEM_ARCHITECTURE.md` §12.
9. **No planning-phase action:** no deploy, no push, no production config change, no secret value read or written.

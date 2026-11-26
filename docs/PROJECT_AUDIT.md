# PROJECT_AUDIT.md — HemoNexus, Phase 0 + Phase 0.1 research addendum

**Status:** Read-only audit. No application files, configurations, databases, or deployments were modified.
**Date:** 2026-11-26 (Phase 0.1 research addendum same date)
**Auditor:** Principal AI Architect / Full-Stack / Healthcare Product review
**Official project name:** HemoNexus. The original problem statement (Predictive Emergency Blood Shortage Network) is preserved verbatim in scope; only planning artefacts are renamed.
**Evidence standard:** Nothing below is claimed as working unless it was inspected directly. Claims that could not be verified are marked **UNVERIFIED**.

**Evidence legend used across all HemoNexus planning documents:**
- **[VERIFIED]** — fetched/read from a primary source during Phase 0.1.
- **[PARTIALLY VERIFIED]** — existence/provenance confirmed, specific content not retrievable here.
- **[PROPOSED]** — target design, not yet built.
- **[ASSUMPTION]** — planning input that must be confirmed before implementation.
- **[SIMULATED]** — synthetic data or hypothetical scenario, never a real institution or clinical fact.

---

## 0. Headline finding (read this first)

The brief states: *"This is an existing project. We are NOT building it from scratch."*

**The designated workspace is empty.** `C:\Users\VISHAL KUMAR\Promptwars offline` contains **zero entries** (verified twice with `Get-ChildItem -Force`; no hidden files, no `.git`, no manifests). There is no HemoNexus codebase at the path the session was opened in.

A broader filesystem search found **no project matching the blood-shortage problem statement**:

| Location checked | Result |
|---|---|
| `C:\Users\VISHAL KUMAR\Promptwars offline` | **Empty** (0 items) |
| All sibling project folders (README/title scan) | AirAware AI, Jharkhand Societal Innovation Platform, VELOUR, OppSync AI, Sentria, Minecraft site — none blood-related |
| Keyword scan for `BloodGuard`, `blood shortage`, `transfusion`, `blood group`, `blood inventory` across `C:\Users\VISHAL KUMAR` | Only `node_modules` library noise |
| Git remotes under `C:\Users\VISHAL KUMAR` (depth 4) | Only `github.com/codewithvishuuu/velour-modern-fashion.git` (unrelated) |
| `Downloads\SIH2026.zip` and extracted `Downloads\SIH2026\SIH2026` | **One blood-adjacent codebase found** (see §2) — but it is a different product |

**Consequence:** A truthful "current implementation audit" of the target project is impossible because no target implementation exists. Per the agreed hybrid scope, this document (a) records that fact, (b) audits the only blood-adjacent artifact found as a **reusable reference, not as HemoNexus**, and (c) establishes the baseline for the greenfield blueprint in the other nine documents.

---

## 1. Scope and method

- **In scope:** workspace contents, local project inventory, the extracted SIH2026 archive, public data-source reachability.
- **Out of scope / not possible:** live Vercel dashboard, production logs, private GitHub repositories, registered-hospital data, clinical validation.
- **Methods used:** directory enumeration, file reads, keyword search, manifest inspection, targeted HTTP fetches for data sources.
- **Destructive commands:** none. No installs, no builds, no schema changes, no env edits, no deploys, no commits.

---

## 2. Reference artifact audit — `Downloads\SIH2026\SIH2026` (NOT HemoNexus)

This is an **Expo / React Native mobile app** for emergency response, found inside a downloaded SIH 2026 archive. It is included because it is the only local codebase with blood-related UI and a simulation concept. It solves a **different problem** (accident response, ambulance dispatch, hospital beds) and must not be represented as an implementation of the predictive blood-shortage brief.

### 2.1 Structure and stack

| Layer | Finding | Evidence |
|---|---|---|
| Frontend | Expo ~54.0.6, React 19.1.0, React Native 0.81.5, React Navigation 7, TanStack Query 5, react-native-maps 1.20.1, Socket.IO client 4.8.3 | `App/package.json` |
| On-device ML | `@tensorflow/tfjs` 4.22 + `@tensorflow-models/blazeface`, `expo-face-detector`, `expo-camera`, `expo-sensors` | `App/package.json` |
| Backend | Express 4.22 + Mongoose 8.1 + Socket.IO 4.8 + JWT + bcryptjs + Gemini SDK + Cloudinary | `Backend/package.json` |
| Database | MongoDB (connection via `src/database/db.Connection.js`); models: `User`, `Emergency`, `Corridor`, `Shipment` | `Backend/src/models/*` |
| Scripts | Frontend: `expo start` variants only. Backend: `start`, `dev`. **No test, lint, typecheck, or build scripts.** | both manifests |
| Naming hygiene | Frontend package is `"name": "rizzledating"`, backend `"mlm-backend"` — copied template names | manifests |

### 2.2 Feature classification (reference app against *this* brief)

| Feature | Classification | Evidence / reasoning |
|---|---|---|
| Blood stock screen | **Partially working (UI only)** | `App/src/app/BloodScreen.jsx` uses a hardcoded `initialData` array of 8 groups with fixed units; "Request Blood" only flips local `booked` state. No API call, no inventory model, no expiry, no compatibility, no authorization. |
| Blood shortage prediction | **Missing** | No forecasting code, no historical consumption store, no model artifacts anywhere in `Backend/src` or `App/src`. |
| Risk score / explainability | **Missing** | No scoring module. The only "risk" output is an LLM-generated route-safety percentage (§2.4). |
| Emergency simulation | **Missing** | `App/src/app/SimulationScreen.js` is **0 bytes**. |
| Dashboard | **Missing** | `App/src/app/Dashboard.jsx` is **0 bytes**. |
| Regional intelligence map | **Needs improvement (different purpose)** | `MapScreen.js` / `MapScreen.jsx` are byte-identical 108,971-byte duplicates showing emergency incidents/ambulances, not blood availability or transfer opportunities. |
| AI assistant | **Partially working, unsafe for this brief** | `AIChatScreen.jsx` POSTs raw user text to `http://192.168.29.218:5000/api/ai/generate` — a hardcoded LAN IP, no auth, no data grounding, no clinical guardrails. |
| Real-time updates | **Working (in reference only)** | Socket.IO client + `Backend/src/websocket/socket.js` exist and are wired for emergency events. Reusable pattern. |
| Authentication | **Partially working** | `User` model hashes passwords with bcryptjs; `authMiddleware.js` exists. But `User` has **only email/password — no role and no institution**, so RBAC and institutional isolation are absent. |
| Inventory / expiry management | **Missing** | No inventory or expiry schema in `Backend/src/models`. |
| Audit logging / data governance | **Missing** | No audit model or middleware. |
| Tests / CI / lint | **Missing** | No scripts, no test files, no CI config. |

### 2.3 Concrete defects found in the reference app

1. **Environment key mismatch (broken):** `Backend/config.env` defines `GOOGLE_GEMINI_KEY`, but `Backend/src/controllers/aiService.js` reads `process.env.GEMINI_API_KEY`. The AI feature cannot authenticate unless an undeclared variable is supplied. (`aiRouteService.js` is a byte-identical duplicate of `aiService.js`.)
2. **Fabricated numbers:** `aiService.js` instructs Gemini to "Calculate risk from 0 to 100" and "Calculate AI confidence from 0 to 100" from **hardcoded** weather/traffic/road values in `aiRouteController.js` ("Temporary data"). `fallbackRecommendation()` returns made-up `riskPercentage: 18`, `confidence: 85` with `success: true`. This is exactly the anti-pattern the brief forbids ("Do not invent confidence percentages or prediction accuracy", "must never fabricate ... facts").
3. **Secrets handling risk:** a `config.env` file with keys `PORT`, `MONGO_URI`, `JWT_SECRET`, `GOOGLE_GEMINI_KEY` sits inside the distributable archive. Values were **not** read or reproduced. Any repo that commits this file is leaking credentials; it must be gitignored and rotated before reuse.
4. **Hardcoded network endpoints:** `App/src/url/url.jsx` uses `http://localhost:5000/api/auth`; chat uses a hardcoded private IP. Not deployable without rewrite.
5. **Duplicated/dead files:** `MapScreen.js` == `MapScreen.jsx`; `aiService.js` == `aiRouteService.js`; two empty screens. Signs of unfinished work, not a system to preserve as-is.
6. **CORS allowlist** in `app.js` is pinned to `localhost:5173` and `192.168.1.6:5000` — another deployment blocker.

### 2.4 What is genuinely reusable from the reference app

Only **patterns and lessons**, not code to copy verbatim:

- Socket.IO event pattern for pushing live updates to many clients (validated in this codebase).
- Express + Mongoose module layout (routers → controllers → services → models) as a structural reference.
- bcrypt password hashing and a JWT middleware skeleton (must be extended with roles/institution).
- The explicit lesson that **LLM-generated numeric risk/confidence is unacceptable** — the reference demonstrates the failure mode we must avoid.

---

## 3. GitHub / Vercel / deployment status

| Item | Finding |
|---|---|
| Git repository in workspace | **None** — workspace is empty and not a git repo (confirmed by environment metadata). |
| Git history / branch / working tree | **Not available** for the target project. No commits exist to inspect. |
| TODOs / incomplete features | For the reference app: empty `SimulationScreen.js` and `Dashboard.jsx`, duplicated files, "Temporary data" comments. For the target: nothing exists. |
| Secrets exposure | Unverifiable for target. Reference archive contains `config.env` with secret-bearing keys (§2.3). |
| Vercel configuration | **No `vercel.json`, no `.vercel` directory, no deployment record** found for the target or the reference app. |
| Production / preview status | **UNKNOWN / no evidence.** No production config was accessed or changed. |
| Build errors | Not measurable — there is no build script or deployment for the target. |

---

## 4. Functional audit summary (target project)

Every major feature from the brief, assessed against the **actual workspace state**:

| Capability | Status | Basis |
|---|---|---|
| Historical consumption analysis | **Missing** | No data, no code |
| Current inventory monitoring | **Missing** | No data model |
| Blood group availability | **Missing** | Only hardcoded values in reference UI |
| Seasonal / emergency demand patterns | **Missing** | No time series |
| Multi-institution network | **Missing** | No institution entity anywhere |
| Shortage alerts | **Missing** | No alert pipeline |
| Resource allocation coordination | **Missing** | No workflow |
| Predictive analytics | **Missing** | No model |
| Geographical visualization | **Missing** | Reference map is for incidents, not blood |
| Expiry-aware inventory | **Missing** | No expiry field |
| Intelligent recommendations | **Missing** | Only generic LLM chat in reference |
| Simulation engine | **Missing** | Empty file in reference |
| AI assistant grounded in platform data | **Missing** | Reference chat is ungrounded |
| Auth / RBAC / tenant isolation | **Missing** | Reference has auth without roles or institutions |
| Tests / observability | **Missing** | No scripts, no logs strategy |

**Working features in the target project: none, because the target project does not yet exist.**

---

## 5. What to preserve / what to discard

**Preserve (as decisions, not as files):**
- The problem statement itself — it is unusually well-specified and already names the right safety constraints.
- Team familiarity evident in sibling projects: Next.js 15 + Tailwind v4 (AirAware), NestJS/Prisma/PostgreSQL + shared RBAC constants (SIH-Project), Socket.IO (reference app). These reduce delivery risk.
- The reference app's Socket.IO push pattern and module layering as *ideas*.

**Discard / do not carry forward:**
- Hardcoded inventory arrays presented as real stock.
- LLM-generated risk percentages and confidence scores.
- Hardcoded LAN IPs and pinned CORS origins.
- `config.env` inside a distributable archive; template package names; duplicate and empty files.
- The mobile-first, single-user emergency-response framing. This platform is a **web command center for institutions**.

---

## 6. Audit verdict

- **Baseline score for the target project:** effectively **0 implemented points** (see `HACKATHON_SCORECARD.md` for the weighted assessment). The idea is strong; the implementation is absent.
- **Biggest risk is not technical complexity — it is starting from an empty directory while believing code exists.** This phase resolves that.
- **Recommendation:** proceed on a greenfield basis, reusing the team's demonstrated stack strengths, with the reference app treated strictly as a cautionary example and pattern library. Do **not** spend implementation time trying to retrofit the Expo app; its domain, data model, and safety posture are wrong for this brief.

---

## 7. Limitations of this audit

- No live system was exercised; nothing was running.
- GitHub/Vercel state could not be inspected (no repo, no deployment config, no credentials used).
- Data-source licensing was spot-checked only for sources listed in `DATA_STRATEGY.md`; each must be re-verified at implementation time.
- Secret *values* were deliberately not read. Only key names are reported.

---

## 8. Phase 0.1 research addendum — what changed in the audit picture

- **[VERIFIED] e-RaktKosh exists and is an official MoHFW system.** Its public portal (`eraktkosh.mohfw.gov.in`) exposes Blood Availability Search, Blood Bank Directory, Thalassemia Request, donation-camp and donor services, and blood-bank login; it is designed/developed by C-DAC. Specific component storage/shelf-life figures are published on that public page (RBC 42 days at 2–6 °C; plasma frozen below −30 °C up to 1 year; platelets 5 days at 20–24 °C). No open public API was found or assumed — see `HEALTHCARE_STANDARDS_AND_COMPLIANCE.md`.
- **[VERIFIED] The gap HemoNexus fills is prediction and coordination, not stock listing.** e-RaktKosh answers "where is blood now?"; HemoNexus is proposed to answer "what will run short, why, and what can be done about it". This is complementarity, not duplication.
- **[VERIFIED] WHO guidance** requires coordinated national blood systems, quality systems across the cold chain, and rational clinical use; deviations from temperature ranges can render units unsuitable (`HEALTHCARE_STANDARDS_AND_COMPLIANCE.md` §3).
- **[PARTIALLY VERIFIED] Indian National Standards for Blood Centres** (second edition, MoHFW/NBTC, hosted 2022-07) exist; clause-level details could not be retrieved here and must be checked before implementation.
- **[VERIFIED via secondary source] DPDP commencement is phased**, not uniform (13 Nov 2025, 13 Nov 2026, 13 May 2027); primary gazette verification is required. See `SECURITY_AND_SAFETY.md`.
- **Audit verdict unchanged:** the target workspace is still empty. Phase 0.1 improves the *quality of the plan*, not the implementation baseline.

# HemoNexus

**Predictive Emergency Blood Shortage Network** — a decision-support and coordination platform that forecasts shortage risk, explains it, and finds feasible verified surplus across a participating network.

> **Safety notice:** HemoNexus is decision support, not a clinical device. All institutions, units and events in this build are **[SIMULATED]**. No real hospital, donor or patient data is used. Compatibility, cold-chain release and transfer approval always require qualified humans.

## Quick start

```bash
npm install
npm run db:dev          # generates Prisma client, creates local SQLite DB, seeds deterministic data
npm run dev             # http://localhost:3000
```

Demo sign-in: `coordinator@simulated.local` / `HemoNexus!2026` (other demo roles are listed on the sign-in page).

Optional services:

```bash
npm run api                                   # Express domain API on :4000
cd services/intelligence && pip install -r requirements.txt && uvicorn main:app --port 8000
```

The Next.js route handlers provide the same domain API locally and in production, so the platform works without the optional services. The Python service is the authoritative numerical forecasting implementation; the TypeScript fallback uses identical deterministic algorithms.

## What is implemented

- Next.js 15 / React 19 / TypeScript command center with navy #101B35 + crimson #C62845 design tokens.
- Express TypeScript modular-monolith domain API (local) and equivalent typed Next.js route handlers (production).
- PostgreSQL 16 + PostGIS schema (Prisma) with a SQLite dev schema for environments without a database provider. Distance queries use the documented Haversine fallback where PostGIS is unavailable.
- Python FastAPI intelligence service with statsmodels Holt-Winters, typed insufficient-data states.
- Deterministic synthetic generator: seed 42, pinned PRNG, 10 fictional institutions, 104 weeks, 4 planted shortage events.
- Baselines (seasonal naive, moving average), ETS, rolling-origin backtest, MAE/WAPE/MASE/bias/coverage/event metrics.
- Explainable 5-factor Blood Intelligence Score with explicit bands and hard override.
- Unit-level inventory, cold-chain quarantine and human-only release, expiry controls.
- Transactional reservations with idempotency, conflict detection and expiry; three human approval checkpoints.
- Data Trust engine, freshness indicator, alerts, append-only audit history, grounded assistant, simulation isolation.
- RBAC, institution scoping, secure httpOnly cookies, input validation, safe error states.

## Architecture

```
Next.js UI ──> /api/v1/* route handlers ──> domain layer (src/lib)
                                               ├── Prisma ──> PostgreSQL/SQLite
                                               ├── analytics.ts / FastAPI ──> forecasts + scores
                                               └── matching / reservation / simulation
Express (:4000) ──> same domain layer (local development)
FastAPI (:8000) ──> numerical forecasting (optional standalone service)
```

Full architecture and evidence: `docs/` (16 planning documents).

## Testing

```bash
npm test          # unit tests: forecast states, determinism, risk scoring, eligibility
npm run build     # production build and type check
```

API smoke sequence (E0–E9) is described in `docs/DEMO_AND_EVALUATION_PLAN.md`.

## Production

Set `DATABASE_URL` to a PostgreSQL connection string, `JWT_SECRET` to a random value, and run `npm run db:prod` before deploying. The Vercel build command generates the PostgreSQL Prisma client automatically.

## Known limitations

- All data is simulated; no clinical validation or real institution is connected.
- Production uses Neon Postgres with **PostGIS 3.6 verified** (`SELECT postgis_version()`). The application currently computes distances with the portable Haversine fallback; PostGIS is provisioned and ready for a geospatial query layer.
- Express and FastAPI are implemented and run locally; the deployed production API is served by equivalent Next.js route handlers calling the same domain layer. The standalone Python service is not separately deployed.
- Database backups/recovery are provider-managed by Neon; the documented RPO/RTO values are planning assumptions.
- No LLM is used for numeric scoring. The assistant only phrases answers from read-only platform data.

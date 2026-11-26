# UI_UX_STRATEGY.md — HemoNexus

**Status:** Design direction and screen-by-screen plan. **Nothing has been redesigned or implemented** (audit-first rule).

---

## 1. Design thesis

> A calm, dense, clinical command center — like a hospital operations floor, not a startup admin template.

The interface's job is to make **risk and time** legible at a glance, then let a user drill into the factors behind a number. Beauty comes from hierarchy, spacing, typography, and honest data — not decoration.

**Reference mental models:** enterprise operations consoles (linear, precise, high information density), clinical dashboards (clear status, no ambiguity), financial terminals (tabular numerals, compact charts). **Not** a generic purple-gradient AI dashboard.

---

## 2. Design system

### 2.1 Color (restrained, accessible)

| Token | Value (indicative) | Use |
|---|---|---|
| `bg-canvas` | `#0B1220` deep navy | App shell background |
| `bg-surface` | `#121C2E` | Card / panel surfaces |
| `bg-raised` | `#1A2740` | Hover, selected |
| `text-primary` | `#F2F5FA` | Body text |
| `text-muted` | `#94A3B8` | Labels, metadata |
| `border-subtle` | `#25334A` | Dividers |
| `accent` | `#3B82F6` blue | Primary action, links |
| `stable` | `#2DD4A7` teal | STABLE band |
| `moderate` | `#F5C451` amber | MODERATE band |
| `high` | `#F08A4B` orange | HIGH band |
| `critical` | `#EF5B5B` red | CRITICAL band |
| `simulation` | `#A78BFA` violet | Simulation-only accents |

Rules:
- Band colors are **never the only signal** — every band also has a text label and icon shape.
- Simulation violet may not appear on real-forecast surfaces.
- No gradients on large surfaces. Gradients are not used as status signals.
- All text/background pairs target WCAG 2.2 AA (≥4.5:1 normal text).

### 2.2 Typography

- **UI:** Inter or IBM Plex Sans — clear at small sizes, neutral.
- **Numerals/data:** IBM Plex Mono with `font-variant-numeric: tabular-nums` — numbers must align in tables and KPIs.
- **Scale:** 12 / 13 / 14 / 16 / 20 / 28 / 40 px. Tight, deliberate.
- **Hierarchy:** one primary headline per screen; labels are small-caps, uppercase, letter-spaced.

### 2.3 Layout and spacing

- 8px spacing grid; card padding 16/24px.
- 12-column desktop grid; sidebar 240px; content max-width 1440px.
- Dense tables with sticky headers, zebra on hover only, and inline factor bars.
- Responsive: sidebar collapses to icon rail at 1024px, to bottom nav at 768px; maps get a full-screen mode on mobile.

### 2.4 Components (built locally, Radix primitives underneath)

`StatusBand`, `FactorBar`, `KpiTile`, `StockTable`, `TrendChart`, `MapPanel`, `AlertRow`, `ScenarioCard`, `TransferRequestCard`, `DataModeBanner`, `Timestamp`, `EmptyState`, `ConfirmDialog`, `RoleBadge`.

### 2.5 Motion

- 120–200ms, ease-out; used for state changes only (band change, alert arrival, scenario apply).
- Respect `prefers-reduced-motion` — no decorative animation, no loading shimmer loops.
- No confetti, no pulsing fake "live" indicators that do not reflect real events.

---

## 3. Global data-honesty elements

Every screen includes, in a consistent top-right position:

1. **Data mode badge** — `SIMULATED DATA` (always in this build).
2. **As-of timestamp** — `Scores as of 2026-11-26 02:00 UTC`.
3. **Model/data version** — `v0.3 · seed 42`.

These are not decorative. They are the product's promise.

---

## 4. Screen-by-screen plan

### 4.1 Landing page `/`
- **Purpose:** Explain the problem in one screen; show a live (simulated) network snapshot — not marketing fluff.
- **Layout:** full-bleed dark hero with a real map panel showing fictional institutions and band-colored hotspots; headline "Know the shortage before the emergency"; three proof strips (forecast lead time, factor transparency, matching constraints).
- **CTA:** "Enter command center" (demo auth) and "View methodology".
- **No fake statistics.** Every number shown comes from the demo dataset and is labelled simulated.

### 4.2 Command center `/overview` (default after login)
- **Purpose:** Answer "what needs attention right now?" in 5 seconds.
- **Above the fold:** 4 KPI tiles (Critical sites, At-risk groups, Alerts open, Stock expiring in 14d) + network risk distribution strip + top 5 hotspots table.
- **Left rail:** region selector, group filter, component filter.
- **Right rail:** alert feed with band-transition reasons.
- **Interaction:** clicking a hotspot opens the institution drawer; clicking a group filters everything.

### 4.3 Institution dashboard `/institutions/[id]`
- **Purpose:** A manager's operational view of their own stock and risk.
- **Layout:** header with institution name + verification state; matrix of 8 blood groups × 3 components as colored cells with days-of-cover; clicking a cell opens the factor panel.
- **Factor panel:** horizontal bars for `cover_risk`, `demand_pressure`, `supply_gap`, `expiry_pressure`, `network_scarcity`, each with the raw value and plain-language note.
- **Tables:** batches with expiry dates, sorted FEFO; inbound donations; 12-week consumption sparkline.

### 4.4 Hospital dashboard `/hospital`
- Role-filtered variant of 4.3: emphasizes own demand forecast, incoming transfer requests, and the clinical-approval queue. No cross-institution stock editing.

### 4.5 Blood bank dashboard `/blood-bank`
- Role-filtered variant: emphasizes batch intake, expiry calendar, verified stock, and surplus available for matching suggestions. Inbound donation entry is the primary action.

### 4.6 Regional intelligence map `/map`
- **Purpose:** Turn risk into geography and show who can help whom.
- **Base:** MapLibre with district boundaries (fictional institutions on real coordinates).
- **Layers:** institution points sized by stock, colored by highest band; heat halo for hotspots; dashed arcs from surplus to shortage candidate.
- **Side panel:** selected hotspot → nearby institutions with distance, transport-time estimate, verified stock, and a "Suggest transfer" action that creates a **request**, not an order.
- **Controls:** group/component filter, radius slider, layer toggles, legend, keyboard-accessible list alternative to the map.

### 4.7 Predictive analytics `/forecasts`
- **Purpose:** Show that the math is real.
- **Content:** forecast chart with point line + 80% interval band, baseline comparison, backtest metrics table (MAE/RMSE/WAPE/bias), per-group breakdown, and the seeded shortage-event detection timeline showing lead time.
- **Trust cues:** model version, training window, "evaluated on held-out weeks" label.

### 4.8 Inventory management `/inventory`
- **Purpose:** Authorized intake and expiry intelligence (P1-4).
- **Content:** batch table with FEFO sort, expiry countdown chips (7/14/30 days), intake form with inline validation, import CSV with row-level errors, and "expiring surplus" panel linking to matching suggestions.

### 4.9 Emergency simulation `/simulation`
- **Purpose:** The differentiator — rehearsal without risk.
- **Layout:** left scenario builder (preset cards + custom delta sliders); right two-column comparison `Actual forecast` vs `Simulated impact`.
- **Persistent watermark** on the whole page: `SIMULATION — NOT A FORECAST`.
- **Assumptions panel** listing every delta and the clone timestamp.
- **Action boundary:** "Escalate for real" is a separate, confirmation-gated action that writes to a real request table and is audited.

### 4.10 AI assistant `/assistant`
- **Purpose:** Explain, never invent.
- **Layout:** chat with a persistent context rail showing the data sources currently in scope (region, institution, as-of).
- **Answer format:** short explanation + cited factor list + `Source: <endpoint>, as of <time>` footer.
- **Refusal states:** patient data, clinical suitability, real-hospital claims, and requests to change inventory are politely refused with the reason.
- **Suggested questions** are the scripted grounding demo set.

### 4.11 Alerts `/alerts`
- Table of alerts with band transition, reason, actor, acknowledge/resolve actions, filters by institution/group/severity. Bulk acknowledge requires confirmation.

### 4.12 Reports `/reports`
- Backtest report, score history, transfer-request history, audit-log viewer (admin only). All exports carry the `SIMULATED DATA` watermark and as-of timestamp.

---

## 5. Visualization rules

- One clear chart per question. No decorative charts.
- Always label axes with units ("units/week", "days of cover").
- Risk bands use shape + text + color; never color alone.
- Interval bands are shown with a legend; point forecasts alone are never presented as certain.
- Tables beat charts for exact values; charts beat tables for trends.
- Empty states say what data is missing and why — never render `0` to mean "no data".

---

## 6. Accessibility checklist (non-negotiable)

- [ ] All interactive elements reachable by keyboard with visible focus.
- [ ] Map has an equivalent list view; arcs are described in text for selected items.
- [ ] Color contrast ≥4.5:1 for text, ≥3:1 for UI components.
- [ ] Band labels present as text, not only color.
- [ ] Forms have associated labels and inline error messages tied to inputs.
- [ ] `aria-live` on alert feed and simulation results.
- [ ] `prefers-reduced-motion` honored.
- [ ] Screen-reader pass on the command center and simulation pages.

---

## 7. Anti-patterns to forbid in review

- Purple/pink gradient hero with floating 3D blobs.
- Glassmorphism cards over a photo of a hospital.
- Fake "live" counters, fake uptime, fake partner logos.
- "AI Confidence: 94%" badges (fabricated certainty).
- Charts with no axis labels or with rounded values that don't match the data.
- Real-sounding hospital names or logos.
- Animations that fire on every render or on scroll without purpose.

---

## 8. Definition of visual done

A reviewer can, in under 30 seconds, identify: the data mode, the as-of time, the top risk, why it is risky, and what action is available — on a 1366px laptop and a 390px phone, with keyboard only.

---

## 9. Phase 0.1 additions

### 9.1 Data Trust indicators (distinct from forecast confidence)
- `FreshnessPill` — green/amber/red by age of last inventory update, with exact timestamp on hover/focus and text label (`Updated 12 min ago`, `Stale — 3 days`).
- `QualityBadge` — `VERIFIED`, `UNVERIFIED`, `QUARANTINED`, `EXCURSION UNRESOLVED`. Text + icon + color; never color alone.
- `CompletenessMeter` — percentage of expected fields present for an institution, with a "missing: expiry date, storage condition" detail line.
- **Rule:** these components must never be rendered inside, or adjacent to, a forecast-confidence/interval component with a shared visual language. They describe *input quality*, not model certainty.

### 9.2 Unit-level and cold-chain views
- Inventory tables show unit ID, component, expiry countdown, storage condition, and quality state. Ineligible units are visibly struck through or filtered out with a reason — never silently counted as stock.
- Temperature excursion rows show timestamp, duration, threshold, resolution state, and the fact that a human must resolve it. No automatic "cleared" state by AI.
- Shelf-life rules are shown with the source citation and version (e.g. "RBC 42 days, 2–6 °C — e-RaktKosh public guidance, verified 2026-11-26").

### 9.3 Transfer feasibility presentation
- Candidate list shows each blocker/reason as a small labelled chip (`expiry < 7d`, `no verified unit`, `cold-chain gap`, `awaiting authorization`). A candidate with any unresolved blocker is visually non-actionable.
- Confirmation dialog states explicitly: "Request only — no transfer occurs until both institutions and a qualified clinical reviewer approve."

### 9.4 Simulation isolation visual
- Entire simulation page carries a diagonal-watermark-style header band `SIMULATION — NOT A FORECAST` (not a subtle badge).
- The compare view uses two differently styled columns: solid border = actual forecast; dashed border + violet accent = simulated impact.
- Assumption list is always visible, never collapsed by default.

### 9.5 Human approval screen
- New `/approvals` view for authorized reviewers: queue of pending transfer requests, unit-level detail, clinical sign-off checkbox with reviewer identity and timestamp, and a mandatory note field for rejection.
- Audit history is viewable from the same screen (admin/clinical roles only).

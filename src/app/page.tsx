import Link from 'next/link';
import {
  Activity, ShieldCheck, Network, ThermometerSnowflake, GitBranch, ClipboardCheck,
  LockKeyhole, ArrowUpRight, FileClock, FlaskConical, ArrowRight, Database,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const REGION_COORDS: Record<string, { x: number; y: number }> = {
  North: { x: 300, y: 110 }, East: { x: 430, y: 270 }, South: { x: 250, y: 390 },
};

export default async function Landing() {
  const [institutions, scores, events] = await Promise.all([
    prisma.institution.findMany({ select: { region: true, name: true, lat: true, lng: true } }),
    prisma.riskScore.findMany({ orderBy: { raw: 'desc' }, take: 1, include: { institution: true } }),
    prisma.auditLog.count().catch(() => 0),
  ]);
  // eligibility is computed in the API layer; derive here from recorded facts
  const allUnits = await prisma.bloodUnit.findMany({ select: { qualityVerified: true, quarantineState: true, excursionOpen: true, reserved: true, expiresAt: true } });
  const eligible = allUnits.filter((u) => u.qualityVerified && u.quarantineState === 'IN_STOCK' && !u.excursionOpen && !u.reserved && u.expiresAt > new Date()).length;
  const blocked = allUnits.length - eligible;
  const regions = [...new Set(institutions.map((i) => i.region))];
  const top = scores[0];
  const factors = top ? Object.entries(JSON.parse(top.factors || '{}')).slice(0, 4) : [];

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" aria-label="HemoNexus home"><Logo variant="light-bg" height={34} className="brand-wordmark" /></Link>
        <nav className="nav-links">
          <a href="#platform">Platform</a><a href="#prediction">Prediction</a><a href="#network">Network</a><a href="#safety">Safety</a>
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge sim">SIMULATED DATA</span>
          <Link className="btn secondary" href="/login">Sign in</Link>
          <Link className="btn" href="/dashboard">Open console <ArrowUpRight size={14} /></Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Predictive emergency blood shortage network</div>
          <h1>Every shortage has a warning sign.</h1>
          <p className="lede">HemoNexus reads demand history, verified stock and cold-chain signals across a participating network — then tells coordinators which blood group is at risk, why, and where a feasible match exists, before the emergency arrives.</p>
          <div className="hero-actions">
            <Link className="btn" href="/dashboard">Explore the command center <ArrowRight size={15} /></Link>
            <a className="btn secondary" href="#prediction">See how prediction works</a>
          </div>
          <div className="chart-legend" style={{ marginTop: 26 }}>
            <span><i style={{ background: 'var(--critical)' }} />Critical</span>
            <span><i style={{ background: 'var(--stable)' }} />Verified supply</span>
            <span>{institutions.length} simulated facilities · {regions.length} regions</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-frame">
            <div className="hero-frame-top"><span>Network overview · simulated</span><span className="mono">seed 42</span></div>
            <div className="hero-frame-body">
              <svg className="hero-net" viewBox="0 0 560 470" role="img" aria-label="Illustration of a simulated regional blood network">
                <defs>
                  <linearGradient id="netline" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#C62845" stopOpacity=".7" /><stop offset="1" stopColor="#4C6EA8" stopOpacity=".35" /></linearGradient>
                </defs>
                {regions.map((r, i) => {
                  const p = REGION_COORDS[r] ?? { x: 180 + i * 120, y: 200 };
                  return regions.slice(i + 1).map((r2, j) => {
                    const q = REGION_COORDS[r2] ?? { x: 180 + (i + j + 1) * 120, y: 260 };
                    const key = `${r}-${r2}`;
                    return <line key={key} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="url(#netline)" strokeWidth="1.5" strokeDasharray="6 5" />;
                  });
                })}
                {regions.map((r, i) => {
                  const p = REGION_COORDS[r] ?? { x: 180 + i * 120, y: 200 };
                  const band = i === 1 ? 'var(--critical)' : i === 0 ? 'var(--amber)' : 'var(--stable)';
                  return (
                    <g key={r}>
                      <circle cx={p.x} cy={p.y} r="30" fill={band} opacity=".1" />
                      <circle cx={p.x} cy={p.y} r="13" fill="#101B35" stroke={band} strokeWidth="2.5" />
                      <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="10" fill="#fff" fontFamily="monospace">{r.slice(0, 2).toUpperCase()}</text>
                      <text x={r === 'South' ? p.x - 34 : p.x + 36} y={p.y + 4} textAnchor={r === 'South' ? 'end' : 'start'} fontSize="12" fill="#C6D1E2">{r} region</text>
                    </g>
                  );
                })}
                <g transform="translate(320,320)">
                  <rect width="210" height="120" rx="10" fill="#131F3A" stroke="#2A3A5C" />
                  <text x="16" y="26" fontSize="10" fill="#8FA0BC" fontFamily="monospace">RISK WATCH</text>
                  <text x="16" y="58" fontSize="22" fill="#F3F5F9" fontFamily="monospace">O− / RBC</text>
                  <rect x="16" y="74" width="178" height="8" rx="4" fill="#22304E" />
                  <rect x="16" y="74" width="142" height="8" rx="4" fill="#C62845" />
                  <text x="16" y="106" fontSize="10" fill="#8FA0BC" fontFamily="monospace">{top ? `${top.band} · 5 contributing factors` : 'awaiting first score computation'}</text>
                </g>
              </svg>
              <div className="hero-caption">Native interface preview built from the synthetic network — not a screenshot of a real institution.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="section-head">
          <div className="eyebrow">The platform</div>
          <h2>Coordination, not another registry.</h2>
          <p>Existing systems record stock. HemoNexus adds the time dimension: what will run short, what is actually usable, and what a participating institution could do about it.</p>
        </div>
        <div className="feature-grid">
          <div className="feature"><div className="ico"><Activity size={19} /></div><h3>Predict before the crisis</h3><p>Seasonal baselines and Holt-Winters forecasts with rolling-origin backtesting, reported with honest error metrics and explicit insufficient-data states.</p></div>
          <div className="feature"><div className="ico"><GitBranch size={19} /></div><h3>Explain every risk band</h3><p>Five measurable factors — cover, demand pressure, inbound supply, expiry and nearby scarcity — make each CRITICAL or HIGH band reproducible and reviewable.</p></div>
          <div className="feature"><div className="ico"><Network size={19} /></div><h3>Find feasible surplus</h3><p>Rule-based compatibility, verified inventory, transport time and cold-chain windows produce suggestions with reasons and blockers, never automatic transfers.</p></div>
        </div>
      </section>

      <section className="section tint" id="prediction">
        <div className="story-grid">
          <div>
            <div className="eyebrow">Explainable prediction</div>
            <h2 style={{ marginTop: 10, fontSize: 32 }}>A score is only useful if you can question it.</h2>
            <p className="sub" style={{ marginTop: 14, maxWidth: 560 }}>Every stored risk score keeps its inputs, factor contributions, weights version and calculation time. Coordinators see the reasoning beside the number — not a confidence claim invented by a language model.</p>
            <div className="story-steps" style={{ marginTop: 26 }}>
              <div className="step"><div className="n">1</div><div><h4>Aggregate verified history</h4><p>Weekly consumption by region, blood group and component from participating institutions.</p></div></div>
              <div className="step"><div className="n">2</div><div><h4>Forecast demand</h4><p>Deterministic models produce a point forecast with an interval and a named model version.</p></div></div>
              <div className="step"><div className="n">3</div><div><h4>Decompose the risk</h4><p>Factors are computed from stock, demand, supply, expiry and network availability, then banded by policy thresholds.</p></div></div>
            </div>
          </div>
          <div className="mini-panel">
            <div className="panel-head" style={{ borderBottom: '1px solid var(--line)', padding: '0 0 12px' }}><div><h3>Current top simulated risk</h3><div className="hint">{top ? `${top.institution?.name} · ${top.group} / ${top.component}` : 'No score computed yet'}</div></div>{top && <span className={`badge ${top.band}`}>{top.band}</span>}</div>
            {factors.length ? factors.map(([key, value]) => (
              <div key={key} className="factor-row" style={{ marginTop: 14 }}>
                <div className="factor-top"><span>{key.replace(/_/g, ' ')}</span><span className="num">{Math.round(Number(value) * 100)}%</span></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(Number(value) * 100)}%` }} /></div>
              </div>
            )) : <div className="empty">Run the scoring pipeline from the command center to populate this preview.</div>}
            <div className="chart-note">Weights version: {top?.weightsVersion ?? '—'} · values are simulated · no confidence percentage shown.</div>
          </div>
        </div>
      </section>

      <section className="section" id="network">
        <div className="section-head"><div className="eyebrow">Inventory &amp; cold chain</div><h2>Usable stock is not the same as recorded stock.</h2><p>A unit with an unresolved temperature excursion, quarantine flag or failed quality verification is excluded from eligible inventory and from every matching suggestion.</p></div>
        <div className="grid g3">
          <div className="feature"><div className="ico"><ShieldCheck size={19} /></div><h3>{eligible.toLocaleString()} eligible units</h3><p>Recorded, verified and within storage requirements across the simulated network.</p></div>
          <div className="feature"><div className="ico"><ThermometerSnowflake size={19} /></div><h3>{blocked.toLocaleString()} restricted units</h3><p>Quarantined, excursion-affected, expired or reserved — never presented as available.</p></div>
          <div className="feature"><div className="ico"><FileClock size={19} /></div><h3>Append-only trace</h3><p>Every verification, release decision and transfer request is recorded with an actor and timestamp.</p></div>
        </div>
      </section>

      <section className="section tint">
        <div className="story-grid">
          <div className="mini-panel">
            <div className="eyebrow">Transfer workflow</div>
            <h3 style={{ marginTop: 8 }}>Suggestion → authorisation → record</h3>
            {[
              ['Discover', 'Find compatible, verified surplus within transport range.'],
              ['Feasibility', 'Check component rules, expiry, cold-chain window and reservation state.'],
              ['Approve', 'Two institutions and a qualified clinical reviewer sign off.'],
              ['Record', 'The full decision trail is written to the immutable audit history.'],
            ].map(([t, d], i) => <div className="mini-row" key={t}><div className="left"><span className="num muted">0{i + 1}</span><strong>{t}</strong></div><span className="small muted">{d}</span></div>)}
          </div>
          <div>
            <div className="eyebrow">Human authority</div>
            <h2 style={{ fontSize: 32, marginTop: 10 }}>Software recommends. People decide.</h2>
            <p className="sub" style={{ marginTop: 14 }}>HemoNexus never approves a transfusion, releases a quarantined unit, or executes a transfer. Clinical suitability follows approved institutional protocols and is confirmed by a named qualified reviewer.</p>
            <div className="notice" style={{ marginTop: 22 }}><LockKeyhole size={15} style={{ verticalAlign: -3, marginRight: 6 }} />No LLM determines clinical usability or generates numerical risk scores.</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div className="eyebrow">How it fits together</div><h2>Built as a decision layer over operational systems.</h2><p>The domain API, forecasting service and data trust engine share one data model. FHIR R5 inventory concepts are mapped at the adapter boundary; the platform does not replace a blood bank system of record.</p></div>
        <div className="feature-grid">
          <div className="feature"><div className="ico"><Database size={19} /></div><h3>Verified inputs</h3><p>Inventory events with provenance, completeness and freshness tracked independently of forecast accuracy.</p></div>
          <div className="feature"><div className="ico"><FlaskConical size={19} /></div><h3>Isolated simulation</h3><p>What-if scenarios run on a cloned snapshot and can never modify live inventory.</p></div>
          <div className="feature"><div className="ico"><ClipboardCheck size={19} /></div><h3>{events.toLocaleString()} audited events</h3><p>Identity, inventory, scoring, approval and simulation events are written to an append-only history.</p></div>
        </div>
      </section>

      <section className="section tint">
        <div className="disclosure">
          <div className="eyebrow" style={{ color: '#F3A9B6' }}>Data honesty</div>
          <h3>Everything you see here is simulated.</h3>
          <p>Institutions are fictional, inventory is generated from a deterministic seed (42), and no real hospital, donor or patient record is present. Forecast metrics are measured on synthetic history and prove the pipeline works — not that it is clinically validated. HemoNexus is decision support, not a medical device.</p>
        </div>
      </section>

      <section className="cta-band">
        <div className="eyebrow">Ready to explore?</div>
        <h2>See the warning before the emergency.</h2>
        <p>Step into the command center and follow a synthetic shortage from forecast to human-approved transfer.</p>
        <Link className="btn" href="/dashboard">Open command center <ArrowUpRight size={15} /></Link>
      </section>

      <footer className="footer">
        <div><Logo variant="dark-bg" height={28} className="brand-wordmark" /><p style={{ marginTop: 12 }}>Predictive blood shortage intelligence and coordination.</p></div>
        <div><strong>Product</strong><br /><a href="#platform">Platform</a> · <a href="#prediction">Prediction</a> · <a href="#network">Network</a></div>
        <div><strong>Governance</strong><br /><span>Decision support only · No clinical validation · Synthetic demonstration data</span></div>
      </footer>
    </div>
  );
}

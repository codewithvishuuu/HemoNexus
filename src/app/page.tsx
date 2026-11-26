import Link from 'next/link';
import {
  Activity, ArrowUpRight, ArrowRight, ShieldCheck, Network as NetworkIcon,
  ThermometerSnowflake, GitBranch, ClipboardCheck, FlaskConical, Database,
  PackageSearch, TriangleAlert, Radio, LockKeyhole, FileClock,
} from 'lucide-react';
import LandingNav from '@/components/LandingNav';
import Logo from '@/components/Logo';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const REGION_POS: Record<string, { x: number; y: number }> = {
  North: { x: 235, y: 120 },
  East: { x: 445, y: 232 },
  South: { x: 300, y: 370 },
};

export default async function Landing() {
  const [institutions, scores, criticalCount, unitRows, auditCount] = await Promise.all([
    prisma.institution.findMany({ select: { region: true, name: true } }),
    prisma.riskScore.findMany({ orderBy: { raw: 'desc' }, take: 1, include: { institution: true } }),
    prisma.riskScore.count({ where: { band: 'CRITICAL' } }),
    prisma.bloodUnit.findMany({ select: { qualityVerified: true, quarantineState: true, excursionOpen: true, reserved: true, expiresAt: true } }),
    prisma.auditLog.count(),
  ]);
  const eligible = unitRows.filter((u) => u.qualityVerified && u.quarantineState === 'IN_STOCK' && !u.excursionOpen && !u.reserved && u.expiresAt > new Date()).length;
  const regions = [...new Set(institutions.map((i) => i.region))];
  const regionData = regions.map((r, i) => ({
    name: r,
    ...(REGION_POS[r] ?? { x: 200 + i * 130, y: 220 }),
    facilities: institutions.filter((x) => x.region === r).length,
  }));
  const top = scores[0];

  return (
    <div className="lp-page">
      <LandingNav />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <div className="lp-kicker"><span className="lp-kicker-line" /> Predictive emergency blood shortage network</div>
            <h1 className="lp-title"><span>Every Drop Matters.</span><span>Every Second Counts.</span></h1>
            <p className="lp-lede">Connecting blood banks, hospitals and emergency networks through intelligent shortage prediction and coordinated response.</p>
            <div className="lp-cta-row">
              <Link className="btn" href="#network">Explore the Network <ArrowRight size={15} /></Link>
              <Link className="btn secondary" href="/dashboard">Access Dashboard <ArrowUpRight size={14} /></Link>
            </div>
            <div className="lp-hero-facts">
              <span><i className="lp-dot stable" /> {eligible.toLocaleString()} eligible units</span>
              <span><i className="lp-dot critical" /> {criticalCount} critical signals</span>
              <span>{institutions.length} simulated facilities</span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-board">
              <div className="lp-board-head">
                <div className="lp-board-title">Network overview <span className="lp-board-sub">· simulated</span></div>
                <div className="lp-board-tabs"><span className="active">Overview</span><span>Inventory</span><span>Alerts</span></div>
              </div>
              <div className="lp-board-body">
                <svg className="lp-net" viewBox="0 0 640 460" role="img" aria-label="Simulated network of regional facilities">
                  <defs>
                    <linearGradient id="lpLine" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#C62845" stopOpacity=".55" /><stop offset="1" stopColor="#101B35" stopOpacity=".22" />
                    </linearGradient>
                  </defs>
                  {regionData.slice(1).map((r, i) => {
                    const a = regionData[0];
                    return <line key={`l${i}`} className="lp-link" x1={a.x} y1={a.y} x2={r.x} y2={r.y} stroke="url(#lpLine)" strokeWidth="2" strokeDasharray="7 6" />;
                  })}
                  {regionData.slice(1).map((r, i) => {
                    const a = regionData[1];
                    return <line key={`l2${i}`} className="lp-link lp-link-slow" x1={a.x} y1={a.y} x2={r.x} y2={r.y} stroke="url(#lpLine)" strokeWidth="1.5" strokeDasharray="5 7" />;
                  })}
                  {regionData.map((r, i) => {
                    const tone = i === 1 ? '#C62845' : i === 0 ? '#B85C1E' : '#147D64';
                    return (
                      <g key={r.name} className="lp-node" style={{ animationDelay: `${i * .7}s` }}>
                        <circle cx={r.x} cy={r.y} r="34" fill={tone} opacity=".08" />
                        <circle cx={r.x} cy={r.y} r="19" fill="#fff" stroke={tone} strokeWidth="2.5" />
                        <circle cx={r.x} cy={r.y} r="7" fill={tone} />
                        <text x={r.x} y={r.y + 40} textAnchor="middle" fontSize="13" fill="#101B35" fontFamily="var(--sans)">{r.name}</text>
                        <text x={r.x} y={r.y + 57} textAnchor="middle" fontSize="11" fill="#7A8699" fontFamily="monospace">{r.facilities} facilities</text>
                      </g>
                    );
                  })}
                </svg>
                <div className="lp-float lp-float-a">
                  <div className="lp-float-label">Top risk signal</div>
                  <div className="lp-float-value">{top ? `${top.group} / ${top.component}` : 'Awaiting scores'}</div>
                  <div className="lp-float-foot">{top ? <span className={`badge ${top.band}`}>{top.band}</span> : <span className="badge neutral">No data</span>} <span className="lp-float-muted">explainable</span></div>
                </div>
                <div className="lp-float lp-float-b">
                  <div className="lp-float-label">Verified stock</div>
                  <div className="lp-float-value num">{eligible.toLocaleString()} <small>units</small></div>
                  <div className="lp-float-foot"><span className="badge STABLE">Eligible</span><span className="lp-float-muted">cold-chain checked</span></div>
                </div>
              </div>
              <div className="lp-board-foot"><span className="live-dot" /> Synthetic demonstration network · seed 42 · no real institutions</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="lp-section" id="product">
        <div className="lp-section-head">
          <div className="eyebrow">The problem</div>
          <h2>A shortage rarely begins as an emergency.</h2>
          <p>It begins as a gap nobody can see: stock recorded in one place, demand rising in another, and expiry quietly reducing what is actually usable.</p>
        </div>
        <div className="lp-problem-grid">
          <div className="lp-story-card lp-story-lg">
            <div className="lp-quote">“By the time a shortage is obvious, the options are already expensive.”</div>
            <p>Hospitals and blood banks need a shared view of demand, verified inventory and feasible transfer paths — not another isolated register.</p>
          </div>
          <div className="lp-story-card">
            <div className="lp-icon"><PackageSearch size={20} /></div><h3>Fragmented inventory</h3><p>Stock is recorded locally. Nearby surplus stays invisible until someone makes a phone call.</p>
          </div>
          <div className="lp-story-card">
            <div className="lp-icon"><TriangleAlert size={20} /></div><h3>Late signals</h3><p>Seasonal demand and emergency spikes are noticed after stock is already critical.</p>
          </div>
          <div className="lp-story-card">
            <div className="lp-icon"><ThermometerSnowflake size={20} /></div><h3>Hidden constraints</h3><p>Expiry, quarantine and cold-chain excursions change what can safely be used.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-section-tint" id="how">
        <div className="lp-section-head">
          <div className="eyebrow">How it works</div>
          <h2>From signal to coordinated response.</h2>
          <p>Four connected steps, each with a visible reason and a human decision point.</p>
        </div>
        <div className="lp-steps">
          {[
            [Activity, 'Monitor inventory', 'Unit-level stock, component, expiry and cold-chain state are recorded with provenance.'],
            [GitBranch, 'Predict shortage risk', 'Deterministic forecasts and five measurable factors produce an explainable risk band.'],
            [NetworkIcon, 'Find compatible supply', 'Verified surplus is filtered by compatibility, transport time and cold-chain feasibility.'],
            [ClipboardCheck, 'Coordinate approval', 'Two institutions and a qualified clinical reviewer sign off before any movement.'],
          ].map(([Icon, title, text], i) => {
            const I = Icon as any;
            return <div className="lp-step" key={String(title)}>
              <div className="lp-step-n">0{i + 1}</div>
              <div className="lp-step-icon"><I size={19} /></div>
              <h3>{String(title)}</h3>
              <p>{String(text)}</p>
            </div>;
          })}
        </div>
      </section>

      {/* NETWORK / CAPABILITIES */}
      <section className="lp-section" id="network">
        <div className="lp-section-head">
          <div className="eyebrow">Platform capabilities</div>
          <h2>One network view. Six practical capabilities.</h2>
          <p>Designed for hospital administrators, blood-bank coordinators and regional operations teams.</p>
        </div>
        <div className="lp-cap-grid">
          {[
            [Database, 'Inventory intelligence', 'Batch and unit records with FEFO-aware expiry views and verified stock state.'],
            [GitBranch, 'Shortage forecasting', 'Seasonal baselines and Holt-Winters models with rolling-origin backtesting.'],
            [NetworkIcon, 'Regional visibility', 'Facility hotspots, nearby partners and transport-time estimates on one map.'],
            [PackageSearch, 'Institution matching', 'Compatibility rules, verified availability and cold-chain windows as filters.'],
            [ClipboardCheck, 'Human-approved transfers', 'Structured approvals with an immutable audit trail. No automated movement.'],
            [FlaskConical, 'Simulation & planning', 'What-if scenarios on cloned state, clearly separated from actual forecasts.'],
          ].map(([Icon, title, text]) => {
            const I = Icon as any;
            return <div className="lp-cap" key={String(title)}><div className="lp-icon"><I size={19} /></div><h3>{String(title)}</h3><p>{String(text)}</p></div>;
          })}
        </div>
      </section>

      {/* TRUST */}
      <section className="lp-section" id="about">
        <div className="lp-disclosure">
          <div className="lp-disclosure-left">
            <div className="lp-kicker light"><span className="lp-kicker-line" /> Trust & transparency</div>
            <h2>Explainable by design. Honest by default.</h2>
            <p>Every risk band carries the factors behind it, its weights version and the data it used. Forecast uncertainty is reported from backtests — never invented as a confidence percentage.</p>
            <div className="lp-disclosure-points">
              <span><ShieldCheck size={16} /> No LLM-generated clinical decisions</span>
              <span><FileClock size={16} /> {auditCount.toLocaleString()} append-only audit events</span>
              <span><LockKeyhole size={16} /> Institution-level isolation</span>
            </div>
          </div>
          <div className="lp-disclosure-card">
            <div className="lp-disclosure-card-title">Demonstration data</div>
            <p>All institutions, units and activity shown here are synthetic, generated from a fixed seed. HemoNexus is not connected to real hospitals and is not a clinically validated system. It provides decision support only.</p>
            <span className="badge sim">SIMULATED DATA</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <div className="lp-final-inner">
          <div className="eyebrow">Ready when you are</div>
          <h2>Prepare before the pressure arrives.</h2>
          <p>Step into the command center and follow a synthetic shortage from forecast to human-approved transfer.</p>
          <div className="lp-cta-row centered">
            <Link className="btn" href="/dashboard">Access Dashboard <ArrowUpRight size={15} /></Link>
            <Link className="btn secondary" href="/login">Sign in to the network</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div><Logo variant="dark-bg" height={28} className="lp-logo" /><p>Predictive blood shortage intelligence and coordination.</p></div>
          <div><strong>Product</strong><a href="#product">Product</a><a href="#how">How it works</a><a href="#network">Network</a></div>
          <div><strong>Company</strong><a href="#about">About</a><Link href="/login">Sign in</Link><Link href="/dashboard">Dashboard</Link></div>
        </div>
        <div className="lp-footer-bottom">Decision support only · No clinical validation · Synthetic demonstration data · Not connected to real institutions</div>
      </footer>
    </div>
  );
}

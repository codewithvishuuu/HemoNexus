import Link from 'next/link';

export default function Landing() {
  return (
    <div className="landing">
      <header className="topbar" style={{ position: 'static' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="shield">H</div>
          <div><div className="brand-name">HemoNexus</div><div className="brand-sub">Temporary text branding — approved logo kit unavailable in this build</div></div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge sim">SIMULATED DATA</span>
          <Link className="btn ghost" href="/login">Sign in</Link>
          <Link className="btn" href="/dashboard">Enter command center</Link>
        </div>
      </header>
      <section className="hero">
        <div>
          <span className="badge sim">Predictive Emergency Blood Shortage Network</span>
          <h1>Know the shortage<br />before the emergency.</h1>
          <p>HemoNexus turns inventory records into lead time. It forecasts demand by blood group and region, explains why risk is rising, and finds feasible, verified surplus across a participating network — while leaving every clinical decision with qualified humans.</p>
          <div className="actions">
            <Link className="btn" href="/dashboard">Open command center</Link>
            <Link className="btn ghost" href="/forecasts">View methodology &amp; backtest</Link>
          </div>
        </div>
        <div className="card" style={{ borderColor: 'rgba(198,40,69,.4)' }}>
          <h3>Live network snapshot — simulated</h3>
          <div className="grid g2" style={{ marginTop: 14 }}>
            <div><div className="muted" style={{ fontSize: 12 }}>Participating facilities</div><div className="kpi">10</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Recorded units</div><div className="kpi">1,320</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Weeks of history</div><div className="kpi">104</div></div>
            <div><div className="muted" style={{ fontSize: 12 }}>Seeded events</div><div className="kpi">4</div></div>
          </div>
          <div className="warn" style={{ marginTop: 16 }}>All facilities, units and events on this page are synthetic. No real hospital or patient data is represented.</div>
        </div>
      </section>
      <div className="feature-strip">
        <div><h3>Forecast, don't react</h3><p className="sub">Seasonal-naive, moving average and Holt-Winters models with rolling-origin backtesting and honest failure states.</p></div>
        <div><h3>Explain every band</h3><p className="sub">Five measurable factors behind CRITICAL, HIGH, MODERATE and STABLE — no invented confidence percentages.</p></div>
        <div><h3>Human authority</h3><p className="sub">Compatibility, cold-chain release and transfer approval remain with qualified people. Software only suggests.</p></div>
      </div>
      <footer style={{ padding: '26px 8vw', color: 'var(--muted)', fontSize: 12 }}>HemoNexus · Decision support only · Not a clinical device · Synthetic demonstration network</footer>
    </div>
  );
}

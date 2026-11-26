'use client';
import { useState } from 'react';

export default function Simulation() {
  const [scenario, setScenario] = useState('O_NEGATIVE_EMERGENCY');
  const [surge, setSurge] = useState(30);
  const [days, setDays] = useState(7);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  async function run() {
    setError('');
    const res = await fetch('/api/v1/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, surgePct: surge, days, group: 'O-', component: 'RBC' }) });
    const d = await res.json();
    if (!res.ok) { setError(d.error?.message ?? 'Simulation failed'); setResult(null); return; }
    setResult(d);
  }
  return (
    <>
      <div className="warn" style={{ marginBottom: 16, fontSize: 13 }}>SIMULATION — NOT A FORECAST. Results are hypothetical and are stored separately from live inventory.</div>
      <div className="page-head"><div><h1>Emergency simulation</h1><p className="sub">Apply hypothetical demand or supply changes to a cloned snapshot and compare the projected impact.</p></div></div>
      <div className="grid g2">
        <div className="card">
          <h3>Scenario builder</h3>
          <div className="field"><label>Scenario</label><select value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="DEMAND_SURGE">Demand increase</option><option value="O_NEGATIVE_EMERGENCY">O-negative emergency</option>
            <option value="INVENTORY_LOSS">Inventory loss</option><option value="REGIONAL_SHORTAGE">Regional shortage</option><option value="ADDED_DONATIONS">Added donations</option>
          </select></div>
          <div className="field"><label>Demand change: {surge}%</label><input type="range" min="-90" max="200" value={surge} onChange={(e) => setSurge(Number(e.target.value))} /></div>
          <div className="field"><label>Horizon (days): {days}</label><input type="range" min="1" max="28" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
          <button className="btn" onClick={run}>Run simulation</button>
          {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
          <div className="muted" style={{ fontSize: 11, marginTop: 16 }}>Simulations never write to inventory tables. A separate, audited action is required to escalate a real request.</div>
        </div>
        <div className="card">
          <h3>Projected impact</h3>
          {result ? <>
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14 }}>
              <div className="muted" style={{ fontSize: 11 }}>ACTUAL FORECAST</div>
              <div className="kpi">{result.result.baselineAvailable}<small>eligible units</small></div>
              <div className="muted mono" style={{ fontSize: 11 }}>baseline demand {result.result.baselineDemand?.toFixed?.(1)} / week</div>
            </div>
            <div style={{ border: '1px dashed var(--sim)', borderRadius: 8, padding: 14, marginTop: 12 }}>
              <div style={{ color: 'var(--sim)', fontSize: 11 }}>SIMULATED IMPACT</div>
              <div className="kpi" style={{ color: 'var(--sim)' }}>{result.result.projectedAvailable}<small>projected units</small></div>
              <div className="muted mono" style={{ fontSize: 11 }}>delta {result.result.deltaUnits} units · simulated demand {result.result.simulatedDemand?.toFixed?.(1)}</div>
            </div>
            <div style={{ marginTop: 14 }}><div className="muted" style={{ fontSize: 11 }}>ASSUMPTIONS</div>{result.assumptions.map((a: string) => <div key={a} className="mono" style={{ fontSize: 11, marginTop: 4 }}>· {a}</div>)}</div>
          </> : <div className="empty">Choose a scenario and run the simulation.</div>}
        </div>
      </div>
    </>
  );
}

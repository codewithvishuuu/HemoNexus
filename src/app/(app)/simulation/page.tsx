'use client';
import { useState } from 'react';
import { FlaskConical, ShieldAlert } from 'lucide-react';
import { PageHead, Panel, EmptyBlock, InfoNote } from '@/components/console';

export default function Simulation() {
  const [scenario, setScenario] = useState('O_NEGATIVE_EMERGENCY');
  const [surge, setSurge] = useState(30), [days, setDays] = useState(7);
  const [result, setResult] = useState<any>(null), [error, setError] = useState('');
  async function run() {
    setError('');
    const res = await fetch('/api/v1/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, surgePct: surge, days, group: 'O-', component: 'RBC' }) });
    const d = await res.json();
    if (!res.ok) { setError(d.error?.message ?? 'Simulation failed'); setResult(null); return; }
    setResult(d);
  }
  return (
    <>
      <PageHead section="Intelligence · rehearsal" title="Simulation" description="Apply hypothetical demand or supply changes to a cloned snapshot and compare projected impact against the actual forecast."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-note critical" style={{ marginBottom: 16 }}><ShieldAlert size={15} style={{ verticalAlign: -3, marginRight: 6 }} /><strong>SIMULATION — NOT A FORECAST.</strong> Results are hypothetical, stored separately, and can never modify production inventory.</div>
      <div className="ax-grid-main">
        <Panel title="Scenario builder" subtitle="Inputs are recorded with every run" icon={FlaskConical}>
          <div className="field"><label>Scenario</label><select value={scenario} onChange={(e) => setScenario(e.target.value)}><option value="DEMAND_SURGE">Demand increase</option><option value="O_NEGATIVE_EMERGENCY">O-negative emergency</option><option value="INVENTORY_LOSS">Inventory loss</option><option value="REGIONAL_SHORTAGE">Regional shortage</option><option value="ADDED_DONATIONS">Added donations</option></select></div>
          <div className="field"><label>Demand change — {surge}%</label><input type="range" min="-90" max="200" value={surge} onChange={(e) => setSurge(Number(e.target.value))} /></div>
          <div className="field"><label>Horizon — {days} days</label><input type="range" min="1" max="28" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
          <button className="btn" onClick={run}><FlaskConical size={15} /> Run simulation</button>
          {error && <div className="error-state" style={{ marginTop: 12 }}>{error}</div>}
          <div style={{ marginTop: 16 }}><InfoNote>Escalating a real request is a separate, audited action requiring authorisation.</InfoNote></div>
        </Panel>
        <Panel title="Projected impact" subtitle="Actual forecast vs simulated state" icon={FlaskConical}>
          {result ? <>
            <div className="ax-metric" style={{ boxShadow: 'none' }}><div className="ax-metric-top"><span>ACTUAL FORECAST</span></div><div className="ax-metric-value">{result.result.baselineAvailable}<small>eligible units</small></div><div className="ax-metric-note">Baseline demand {Number(result.result.baselineDemand).toFixed(1)} units / week</div></div>
            <div className="ax-metric" style={{ boxShadow: 'none', marginTop: 12, borderColor: '#A78BFA' }}><div className="ax-metric-top"><span style={{ color: '#6E56B5' }}>SIMULATED IMPACT</span></div><div className="ax-metric-value" style={{ color: '#6E56B5' }}>{result.result.projectedAvailable}<small>projected units</small></div><div className="ax-metric-note">Δ {result.result.deltaUnits} units · demand {Number(result.result.simulatedDemand).toFixed(1)}</div></div>
            <div style={{ marginTop: 16 }}><div className="eyebrow">Assumptions</div>{result.assumptions.map((a: string) => <div key={a} className="mono small muted" style={{ marginTop: 4 }}>· {a}</div>)}</div>
            <div className="chart-note">Run {result.runId} · mode {result.mode}</div>
          </> : <EmptyBlock title="No simulation run" message="Configure a scenario and run it to compare projected impact." />}
        </Panel>
      </div>
    </>
  );
}

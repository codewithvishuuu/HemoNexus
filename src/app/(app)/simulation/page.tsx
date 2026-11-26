'use client';
import { useState } from 'react';
import { FlaskConical, ArrowRight, ShieldAlert } from 'lucide-react';
import { PageHeader, Panel, EmptyState } from '@/components/ui';

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
      <PageHeader eyebrow="Rehearsal" title="Emergency simulation" description="Apply hypothetical demand or supply changes to a cloned snapshot and compare the projected impact against the actual forecast." />
      <div className="notice" style={{ marginBottom: 18 }}><ShieldAlert size={15} style={{ verticalAlign: -3, marginRight: 6 }} /><strong>SIMULATION — NOT A FORECAST.</strong> Results are hypothetical, stored separately, and can never modify production inventory.</div>
      <div className="grid g2">
        <Panel title="Scenario builder" hint="Inputs are recorded with every run">
          <div className="field"><label>Scenario</label><select value={scenario} onChange={(e) => setScenario(e.target.value)}>
            <option value="DEMAND_SURGE">Demand increase</option><option value="O_NEGATIVE_EMERGENCY">O-negative emergency</option>
            <option value="INVENTORY_LOSS">Inventory loss</option><option value="REGIONAL_SHORTAGE">Regional shortage</option><option value="ADDED_DONATIONS">Added donations</option>
          </select></div>
          <div className="field"><label>Demand change — {surge}%</label><input type="range" min="-90" max="200" value={surge} onChange={(e) => setSurge(Number(e.target.value))} /></div>
          <div className="field"><label>Horizon — {days} days</label><input type="range" min="1" max="28" value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
          <button className="btn" onClick={run}><FlaskConical size={15} /> Run simulation</button>
          {error && <div className="error-state" style={{ marginTop: 12 }}>{error}</div>}
          <div className="chart-note" style={{ marginTop: 14 }}>Escalating a real request is a separate, audited action that requires authorisation.</div>
        </Panel>
        <Panel title="Projected impact" hint="Actual forecast vs simulated state">
          {result ? <>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
              <div className="eyebrow">Actual forecast</div>
              <div className="kpi-value" style={{ fontSize: 28, marginTop: 8 }}>{result.result.baselineAvailable}<small>eligible units</small></div>
              <div className="small muted">Baseline demand {Number(result.result.baselineDemand).toFixed(1)} units / week</div>
            </div>
            <div style={{ border: '1px dashed #A78BFA', background: '#F8F6FE', borderRadius: 10, padding: 16, marginTop: 12 }}>
              <div className="eyebrow" style={{ color: '#6E56B5' }}>Simulated impact</div>
              <div className="kpi-value" style={{ fontSize: 28, color: '#6E56B5', marginTop: 8 }}>{result.result.projectedAvailable}<small>projected units</small></div>
              <div className="small muted">Δ {result.result.deltaUnits} units · simulated demand {Number(result.result.simulatedDemand).toFixed(1)}</div>
            </div>
            <div style={{ marginTop: 16 }}><div className="eyebrow" style={{ color: 'var(--muted)' }}>Assumptions</div>{result.assumptions.map((a: string) => <div key={a} className="mono small" style={{ marginTop: 4 }}>· {a}</div>)}</div>
            <div className="chart-note" style={{ marginTop: 12 }}>Run ID {result.runId} · mode {result.mode}</div>
          </> : <EmptyState title="No simulation run" message="Configure a scenario and run it to compare projected impact." />}
        </Panel>
      </div>
    </>
  );
}

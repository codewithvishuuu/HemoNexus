'use client';
import { useState } from 'react';
import { useApi } from '@/lib/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Forecasts() {
  const [region, setRegion] = useState('East'), [group, setGroup] = useState('O-'), [component, setComponent] = useState('RBC');
  const q = `?region=${region}&group=${encodeURIComponent(group)}&component=${component}`;
  const { data, loading, error } = useApi<any>(`/api/v1/forecasts${q}`);
  if (loading) return <div className="card">Loading forecast…</div>;
  if (error) return <div className="err">{error}</div>;
  const series = data?.series ?? [];
  const chartData = series.slice(-52).map((v: number, i: number) => ({ w: i, actual: v }));
  const m = data?.backtest?.metrics ?? {};
  const b = data?.backtest?.baseline ?? {};
  return (
    <>
      <div className="page-head"><div><h1>Predictive analytics</h1><p className="sub">Deterministic Holt-Winters forecast with rolling-origin backtest. No LLM produces these numbers.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={region} onChange={(e) => setRegion(e.target.value)}><option>East</option><option>North</option><option>South</option></select>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>{['O-','A+','B+','AB-'].map((g) => <option key={g}>{g}</option>)}</select>
          <select value={component} onChange={(e) => setComponent(e.target.value)}>{['RBC','Plasma','Platelets'].map((c) => <option key={c}>{c}</option>)}</select>
        </div>
      </div>
      {data?.forecast?.state !== 'OK' && data?.forecast?.state !== 'LOW_VOLUME' && <div className="warn" style={{ marginBottom: 14 }}>Forecast state: {data?.forecast?.state} — showing observed history only. No accuracy figure is emitted.</div>}
      <div className="card">
        <h3>Observed weekly demand — last 52 weeks</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#273653" strokeDasharray="3 3" /><XAxis dataKey="w" stroke="#94a3bb" tick={{ fontSize: 11 }} /><YAxis stroke="#94a3bb" tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: '#0c1428', border: '1px solid #273653' }} /><Line type="monotone" dataKey="actual" stroke="#C62845" dot={false} /><ReferenceLine y={Math.max(1, m.mae || 0)} stroke="#f5c451" strokeDasharray="4 4" /></LineChart></ResponsiveContainer>
        </div>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Backtest metrics ({data?.backtest?.folds ?? 0} folds)</h3>
          <table><thead><tr><th>Metric</th><th className="mono">Model</th><th className="mono">Baseline</th></tr></thead><tbody>
            {[['MAE', m.mae, b.mae], ['WAPE', m.wape, b.wape], ['MASE', m.mase, b.mase], ['Bias', m.bias, b.bias], ['Interval coverage', m.coverage, b.coverage], ['Precision', m.precision, b.precision], ['Recall', m.recall, b.recall], ['Lead time (days)', m.leadTimeDays, b.leadTimeDays], ['False alarms', m.falseAlarms, b.falseAlarms], ['Missed events', m.missedEvents, b.missedEvents]].map(([label, mv, bv]: any) => <tr key={label}><td>{label}</td><td className="mono">{Number(mv ?? 0).toFixed(2)}</td><td className="mono">{Number(bv ?? 0).toFixed(2)}</td></tr>)}
          </tbody></table>
          <p className="sub" style={{ marginTop: 12 }}>MAPE is deliberately omitted: this series can contain zero-demand weeks.</p>
        </div>
        <div className="card">
          <h3>How to read this</h3>
          <p className="sub">MASE below 1 means the model beats the seasonal-naive baseline. WAPE compares error across blood groups with different volumes. Interval coverage should be near the nominal 80%. Lead time is measured from seeded shortage events with known onset dates.</p>
          <div className="ok" style={{ marginTop: 14 }}>Model version: {data?.forecast?.modelVersion ?? '—'} · series length: {data?.series?.length ?? 0} weeks · state: {data?.forecast?.state ?? '—'}</div>
        </div>
      </div>
    </>
  );
}

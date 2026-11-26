'use client';
import { useState } from 'react';
import { LineChart as LineIcon, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApi } from '@/lib/useApi';
import { PageHead, Panel, EmptyBlock, SkeletonRows, InfoNote, FilterRow } from '@/components/console';

export default function Forecasts() {
  const [region, setRegion] = useState('East'), [group, setGroup] = useState('O-'), [component, setComponent] = useState('RBC');
  const q = `?region=${region}&group=${encodeURIComponent(group)}&component=${component}`;
  const { data, loading, error } = useApi<any>(`/api/v1/forecasts${q}`);
  const series = data?.series ?? [];
  const observed = series.slice(-40).map((v: number, i: number) => ({ i, actual: v }));
  const points = data?.forecast?.point ?? [];
  const forecastRows = points.map((v: number, i: number) => ({ i: observed.length + i, forecast: v, low: data.forecast.low[i], high: data.forecast.high[i] }));
  const chartData = [...observed, ...forecastRows];
  const m = data?.backtest?.metrics ?? {}, b = data?.backtest?.baseline ?? {};
  const metrics: [string, any, any][] = [['MAE (units/week)', m.mae, b.mae], ['WAPE', m.wape, b.wape], ['MASE', m.mase, b.mase], ['Bias', m.bias, b.bias], ['Interval coverage', m.coverage, b.coverage], ['Event precision', m.precision, b.precision], ['Event recall', m.recall, b.recall], ['Lead time (days)', m.leadTimeDays, b.leadTimeDays], ['False alarms', m.falseAlarms, b.falseAlarms], ['Missed events', m.missedEvents, b.missedEvents]];
  return (
    <>
      <PageHead section="Intelligence" title="Forecasts" description="Deterministic demand forecasts with rolling-origin backtesting. No language model generates these numbers."
        meta={<span className="badge sim">SIMULATED DATA</span>}
        actions={<FilterRow><SlidersHorizontal size={15} /><select value={region} onChange={(e) => setRegion(e.target.value)}><option>East</option><option>North</option><option>South</option></select><select value={group} onChange={(e) => setGroup(e.target.value)}>{['O-','A+','B+','AB-'].map((g) => <option key={g}>{g}</option>)}</select><select value={component} onChange={(e) => setComponent(e.target.value)}>{['RBC','Plasma','Platelets'].map((c) => <option key={c}>{c}</option>)}</select></FilterRow>} />
      {error && <div className="error-state">{error}</div>}
      {data?.forecast?.state !== 'OK' && data?.forecast?.state !== 'LOW_VOLUME' && <div className="ax-note critical" style={{ marginBottom: 14 }}>Forecast state: <strong>{data?.forecast?.state ?? '—'}</strong> — observed history only; no accuracy figure is emitted.</div>}
      <div className="ax-grid-main">
        <Panel title="Observed and forecast demand" subtitle={`${series.length} weeks · units per week`} icon={LineIcon}>
          {loading ? <SkeletonRows rows={4} /> : series.length ? <div className="chart-shell">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 10, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="#E3E7ED" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" tick={{ fontSize: 10 }} label={{ value: 'Week', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#7A8699' }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Units / week', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#7A8699' }} />
                <Tooltip contentStyle={{ border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 }} />
                <Area dataKey="high" stroke="none" fill="#C62845" fillOpacity={.09} isAnimationActive={false} />
                <Area dataKey="low" stroke="none" fill="#fff" fillOpacity={1} isAnimationActive={false} />
                <Line dataKey="actual" stroke="#101B35" strokeWidth={2} dot={false} name="Observed" isAnimationActive={false} />
                <Line dataKey="forecast" stroke="#C62845" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Forecast" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="chart-legend"><span><i style={{ background: '#101B35' }} />Observed</span><span><i style={{ background: '#C62845' }} />Forecast</span><span><i style={{ background: '#F3CDD4' }} />80% interval</span></div>
            <div className="chart-note">Coverage {Number(m.coverage ?? 0).toFixed(2)} vs nominal 0.80 — disclosed limitation, not certainty.</div>
          </div> : <EmptyBlock title="No series available" />}
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel title="Backtest metrics" subtitle={`${data?.backtest?.folds ?? 0} rolling-origin folds`} icon={ShieldCheck}>
            <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Metric</th><th className="num">Model</th><th className="num">Baseline</th></tr></thead><tbody>
              {metrics.map(([label, mv, bv]) => <tr key={label}><td>{label}</td><td className="num">{Number(mv ?? 0).toFixed(2)}</td><td className="num">{Number(bv ?? 0).toFixed(2)}</td></tr>)}
            </tbody></table></div>
            <div className="chart-note">MAPE omitted: demand can contain zero-value weeks.</div>
          </Panel>
          <Panel title="Model provenance" icon={ShieldCheck}>
            <div className="small muted">Selected: <strong>{data?.backtest?.selectedModel ?? '—'}</strong></div>
            <div className="small muted" style={{ marginTop: 6 }}>Version: <span className="mono">{data?.forecast?.modelVersion ?? '—'}</span></div>
            <div className="small muted" style={{ marginTop: 6 }}>State: <span className="mono">{data?.forecast?.state ?? '—'}</span></div>
            <div style={{ marginTop: 12 }}><InfoNote tone="ok">MASE below 1.00 means the challenger beat the seasonal-naive baseline.</InfoNote></div>
          </Panel>
        </div>
      </div>
    </>
  );
}

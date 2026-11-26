'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity, ArrowRight, RefreshCw, Package, ShieldAlert, Building2, ClipboardCheck,
  LineChart as LineIcon, ThermometerSnowflake, Clock3, GitBranch,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Line, Area,
} from 'recharts';
import { useApi } from '@/lib/useApi';
import { PageHead, Metric, Panel, RiskPill, EmptyBlock, SkeletonRows, InfoNote, ActivityRow } from '@/components/console';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Dashboard() {
  const { data: scores, loading: loadingScores } = useApi<any>('/api/v1/scores');
  const { data: insts } = useApi<any>('/api/v1/institutions');
  const { data: transfers } = useApi<any>('/api/v1/transfers');
  const { data: audit } = useApi<any>('/api/v1/audit');
  const { data: forecasts } = useApi<any>('/api/v1/forecasts?region=East&group=O-&component=RBC');
  const { data: me } = useApi<any>('/api/v1/auth/me');
  const [groupUnits, setGroupUnits] = useState<any[]>([]);

  useEffect(() => {
    Promise.all(GROUPS.map((g) => fetch(`/api/v1/inventory/units?group=${encodeURIComponent(g)}`).then((r) => r.json()).catch(() => ({ units: [] }))))
      .then((parts) => setGroupUnits(parts.flatMap((p) => p.units ?? [])))
      .catch(() => setGroupUnits([]));
  }, []);

  const rows = scores?.scores ?? [];
  const critical = rows.filter((r: any) => r.band === 'CRITICAL');
  const high = rows.filter((r: any) => r.band === 'HIGH');
  const available = groupUnits.filter((u: any) => u.eligible).length;
  const quarantined = groupUnits.filter((u: any) => u.quarantineState === 'QUARANTINED' || u.excursionOpen).length;
  const pending = (transfers?.requests ?? []).filter((r: any) => r.state !== 'APPROVED');
  const nearExpiry = groupUnits.filter((u: any) => {
    if (!u.eligible || !u.expiresAt) return false;
    return (new Date(u.expiresAt).getTime() - Date.now()) / 86400000 <= 14;
  }).length;

  const distribution = GROUPS.map((g) => {
    const all = groupUnits.filter((u: any) => u.group === g);
    return {
      group: g,
      available: all.filter((u: any) => u.eligible).length,
      restricted: all.filter((u: any) => !u.eligible).length,
    };
  });
  const riskBands = ['CRITICAL', 'HIGH', 'MODERATE', 'STABLE'].map((band) => ({ band, count: rows.filter((r: any) => r.band === band).length }));
  const observed = (forecasts?.series ?? []).slice(-32).map((v: number, i: number) => ({ i, actual: v }));
  const forecastPoints = (forecasts?.forecast?.point ?? []).map((v: number, i: number) => ({ i: observed.length + i, forecast: v, low: forecasts.forecast.low[i], high: forecasts.forecast.high[i] }));
  const chartData = [...observed, ...forecastPoints];
  const regions = (insts?.institutions ?? []).reduce((acc: Record<string, number>, i: any) => { acc[i.region] = (acc[i.region] ?? 0) + 1; return acc; }, {});
  const regionRisk = Object.keys(regions).map((r) => ({
    region: r, facilities: regions[r],
    critical: rows.filter((x: any) => x.band === 'CRITICAL' && x.institution?.region === r).length,
  }));
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <PageHead
        section="Overview · command center"
        title={`${greeting}, ${(me?.user?.name ?? 'Coordinator').split(' ').slice(-1)[0]}`}
        description="A working view of shortage risk, verified supply and coordination activity across the synthetic network."
        meta={<><span className="badge neutral">{dateLabel}</span><span className="badge crimson">Network context · all regions</span><span className="badge sim">SIMULATED DATA</span></>}
        actions={<div className="ax-quick-actions">
          <button className="btn secondary" onClick={() => fetch('/api/v1/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() => location.reload())}><RefreshCw size={14} /> Recompute scores</button>
          <Link className="btn" href="/approvals">Review approvals <ArrowRight size={14} /></Link>
        </div>}
      />

      <div className="ax-metric-grid">
        <Metric label="Available units" value={available || '—'} note="verified, unexpired, unrestricted" icon={Package} tone="stable" />
        <Metric label="Critical / high risk" value={critical.length + high.length} unit={`/ ${rows.length}`} note="stored explainable scores" icon={ShieldAlert} tone="critical" />
        <Metric label="Active institutions" value={insts?.institutions?.length ?? '—'} note="simulated participants" icon={Building2} />
        <Metric label="Pending approvals" value={pending.length} note="human action required" icon={ClipboardCheck} tone="amber" />
        <Metric label="Forecast signals" value={critical.length} note="critical bands this week" icon={LineIcon} tone="crimson" />
      </div>

      <div className="ax-grid-main">
        <Panel title="Blood inventory distribution" subtitle="Available units by ABO/Rh group" icon={Package} action={<Link className="btn ghost" href="/inventory">Open inventory <ArrowRight size={14} /></Link>}>
          {groupUnits.length ? <>
            <div className="ax-group-bars">
              {distribution.map((d) => <div className="ax-group-bar" key={d.group}>
                <span className="mono">{d.group}</span>
                <div className="track"><div className="fill" style={{ width: `${Math.min(100, d.available * 5)}%` }} /></div>
                <span className="num">{d.available}</span>
              </div>)}
            </div>
            <div className="ax-group-bars" style={{ marginTop: 16 }}>
              <div className="ax-group-bar"><span className="mono">Q</span><div className="track"><div className="fill neg" style={{ width: `${Math.min(100, quarantined * 3)}%` }} /></div><span className="num">{quarantined}</span></div>
            </div>
            <div className="ax-inline-legend"><span><i style={{ background: 'var(--crimson)' }} /> Available</span><span><i style={{ background: 'var(--navy)' }} /> Quarantined / excursion — excluded from availability</span></div>
          </> : <SkeletonRows rows={4} />}
        </Panel>

        <Panel title="Demand forecast" subtitle="East region · O− RBC · units per week" icon={LineIcon} action={<Link className="btn ghost" href="/forecasts">Validation <ArrowRight size={14} /></Link>}>
          {chartData.length > 1 ? <div className="chart-shell">
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#E3E7ED" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }} />
                <Area dataKey="high" stroke="none" fill="#C62845" fillOpacity={.08} isAnimationActive={false} />
                <Area dataKey="low" stroke="none" fill="#fff" fillOpacity={1} isAnimationActive={false} />
                <Line dataKey="actual" stroke="#101B35" strokeWidth={2} dot={false} name="Observed" isAnimationActive={false} />
                <Line dataKey="forecast" stroke="#C62845" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Forecast" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="chart-legend"><span><i style={{ background: '#101B35' }} />Observed</span><span><i style={{ background: '#C62845' }} />Forecast</span><span><i style={{ background: '#F3CDD4' }} />80% interval</span></div>
            <div className="chart-note">Model coverage {Number(forecasts?.backtest?.metrics?.coverage ?? 0).toFixed(2)} vs nominal 0.80 — disclosed limitation.</div>
          </div> : <SkeletonRows rows={3} />}
        </Panel>

        <Panel title="Regional network" subtitle="Facility count and critical signals by region" icon={Building2} action={<Link className="btn ghost" href="/map">Open map <ArrowRight size={14} /></Link>}>
          {regionRisk.length ? <div className="table-wrap"><table className="ax-table"><thead><tr><th>Region</th><th className="num">Facilities</th><th className="num">Critical</th></tr></thead><tbody>
            {regionRisk.map((r) => <tr key={r.region}><td>{r.region}</td><td className="num">{r.facilities}</td><td className="num">{r.critical > 0 ? <span className="badge CRITICAL">{r.critical}</span> : '—'}</td></tr>)}
          </tbody></table></div> : <EmptyBlock title="No regions loaded" />}
        </Panel>

        <Panel title="Risk overview" subtitle={`${rows.length} scored group / component pairs`} icon={ShieldAlert}>
          {loadingScores ? <SkeletonRows rows={3} /> : rows.length ? <>
            <div className="ax-group-bars">
              {riskBands.map((b) => <div className="ax-group-bar" key={b.band}>
                <span style={{ width: 74, fontSize: 11 }}>{b.band}</span>
                <div className="track"><div className={`fill ${b.band === 'CRITICAL' ? '' : b.band === 'HIGH' ? 'neg' : ''}`} style={{ width: `${Math.min(100, b.count * 8)}%` }} /></div>
                <span className="num">{b.count}</span>
              </div>)}
            </div>
            {critical[0] && <div style={{ marginTop: 16 }}><div className="small muted" style={{ marginBottom: 8 }}>Top explainable signal · {critical[0].group} / {critical[0].component}</div>
              {Object.entries(JSON.parse(critical[0].factors || '{}')).slice(0, 3).map(([k, v]) => <div key={k} className="ax-group-bar"><span style={{ width: 110, fontSize: 11 }}>{k.replace(/_/g, ' ')}</span><div className="track"><div className="fill" style={{ width: `${Math.round(Number(v) * 100)}%` }} /></div><span className="num">{Math.round(Number(v) * 100)}%</span></div>)}
            </div>}
          </> : <EmptyBlock title="No scores yet" message="Recompute scores to populate the risk overview." />}
        </Panel>
      </div>

      <div className="ax-grid-bottom">
        <Panel title="Critical shortage alerts" subtitle="Highest stored risk bands" icon={ShieldAlert} action={<Link className="btn ghost" href="/forecasts">Evidence <ArrowRight size={14} /></Link>}>
          {critical.length ? critical.slice(0, 5).map((r: any) => <div className="ax-activity-row" key={r.id}><span className="ax-activity-dot critical" /><div><strong>{r.institution?.name?.replace(' (SIMULATED)', '')}</strong><span>{r.group} / {r.component} · {Object.keys(JSON.parse(r.factors || '{}')).length} explainable factors</span></div><RiskPill band={r.band} /></div>) : <EmptyBlock title="No critical alerts" message="All scored groups are currently below the critical threshold." />}
        </Panel>
        <Panel title="Transfer approvals" subtitle="Requests awaiting human action" icon={ClipboardCheck} action={<Link className="btn ghost" href="/approvals">Open <ArrowRight size={14} /></Link>}>
          {pending.length ? pending.slice(0, 5).map((r: any) => <ActivityRow key={r.id} title={`${r.group} / ${r.component}`} detail={`Request ${r.id.slice(-8)} · ${r.units} unit(s)`} meta={r.state.replace(/_/g, ' ')} tone="amber" />) : <EmptyBlock title="No pending approvals" message="Transfer requests will appear here." />}
        </Panel>
        <Panel title="Recent activity" subtitle="Append-only audit trail" icon={Activity} action={<Link className="btn ghost" href="/audit">Full history <ArrowRight size={14} /></Link>}>
          {(audit?.events ?? []).length ? audit.events.slice(0, 5).map((e: any) => <ActivityRow key={e.id} title={e.action.replace(/_/g, ' ')} detail={`${e.actor} · ${String(e.entity).slice(-8)}`} meta={String(e.at).slice(11, 19)} />) : <EmptyBlock title="No audited events" />}
        </Panel>
        <Panel title="Inventory exceptions" subtitle="Cold-chain and expiry watch" icon={ThermometerSnowflake} action={<Link className="btn ghost" href="/inventory">Review <ArrowRight size={14} /></Link>}>
          <InfoNote tone="notice"><Clock3 size={14} /> {nearExpiry} eligible units expire within 14 days; {quarantined} units are quarantined or excursion-affected and excluded from matching.</InfoNote>
          <div className="small muted" style={{ marginTop: 10 }}><GitBranch size={13} /> Exceptions are recorded from verified facts. Human review is required before any release.</div>
        </Panel>
      </div>
    </>
  );
}

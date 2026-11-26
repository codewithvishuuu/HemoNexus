'use client';
import Link from 'next/link';
import { Activity, PackageCheck, Building2, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApi } from '@/lib/useApi';
import { PageHeader, Panel, Kpi, StatusBadge, EmptyState, LoadingRows, FactorBar } from '@/components/ui';

export default function Dashboard() {
  const { data: units, loading: lu } = useApi<any>('/api/v1/inventory/units?eligibleOnly=true');
  const { data: scores, loading: ls } = useApi<any>('/api/v1/scores');
  const { data: insts } = useApi<any>('/api/v1/institutions');
  const { data: transfers } = useApi<any>('/api/v1/transfers');
  const rows = scores?.scores ?? [];
  const critical = rows.filter((r: any) => r.band === 'CRITICAL').length;
  const distribution = ['CRITICAL', 'HIGH', 'MODERATE', 'STABLE'].map((b) => ({ band: b, count: rows.filter((r: any) => r.band === b).length }));
  const top = rows[0];

  return (
    <>
      <PageHeader
        eyebrow="Network overview"
        title="Command center"
        description="A live view of shortage risk, verified supply and coordination activity across the synthetic network."
        actions={<button className="btn secondary" onClick={() => fetch('/api/v1/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() => location.reload())}><RefreshCw size={14} /> Recompute scores</button>}
      />

      <div className="kpi-grid">
        <Kpi label="Critical scores" value={critical} unit={`/ ${rows.length}`} foot="groups requiring escalation" tone="critical" />
        <Kpi label="Eligible units" value={units?.total ?? '—'} foot="verified and in date" tone="stable" />
        <Kpi label="Facilities" value={insts?.institutions?.length ?? '—'} foot="simulated participants" tone="crimson" />
        <Kpi label="Open transfers" value={(transfers?.requests ?? []).filter((r: any) => r.state !== 'APPROVED').length} foot="awaiting human action" />
      </div>

      <div className="grid g-2-1" style={{ marginTop: 18 }}>
        <Panel title="Shortage risk register" hint="Ranked by composite risk score" action={<Link className="btn ghost" href="/forecasts">Backtest evidence <ArrowRight size={14} /></Link>}>
          {ls ? <LoadingRows rows={3} /> : rows.length ? (
            <div className="table-wrap"><table><thead><tr><th>Institution</th><th>Group / component</th><th>Band</th><th className="num">Score</th></tr></thead><tbody>
              {rows.slice(0, 9).map((r: any) => <tr key={r.id}><td>{r.institution?.name?.replace(' (SIMULATED)', '')}</td><td className="mono">{r.group} · {r.component}</td><td><StatusBadge band={r.band} /></td><td className="num">{Number(r.raw).toFixed(2)}</td></tr>)}
            </tbody></table></div>
          ) : <EmptyState title="No scores computed" message="Run the scoring pipeline to populate the risk register." />}
        </Panel>
        <div className="stack">
          <Panel title="Risk distribution" hint="Current synthetic network">
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#E3E7ED" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="band" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ border: '1px solid #E3E7ED', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#C62845" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="chart-note">Counts are derived from stored scores; no estimated values.</div>
            </div>
          </Panel>
          <Panel title="Top factor signal" hint={top ? `${top.group} / ${top.component}` : '—'}>
            {top ? Object.entries(JSON.parse(top.factors || '{}')).slice(0, 3).map(([k, v]) => <FactorBar key={k} label={k} value={Number(v)} />) : <div className="small muted">No factors available.</div>}
          </Panel>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <Panel title="Recent transfer activity" hint="Requests and approval state">
          {(transfers?.requests ?? []).length ? <div className="table-wrap"><table><thead><tr><th>Request</th><th>Blood group</th><th>State</th></tr></thead><tbody>
            {transfers.requests.slice(0, 5).map((r: any) => <tr key={r.id}><td className="mono">{r.id.slice(-8)}</td><td className="mono">{r.group} · {r.component}</td><td><span className="badge neutral">{r.state.replace(/_/g, ' ')}</span></td></tr>)}
          </tbody></table></div> : <EmptyState title="No transfer requests" message="Create one from a matching suggestion." />}
        </Panel>
        <Panel title="Operational boundaries">
          <div className="stack" style={{ gap: 10 }}>
            <div className="notice"><ShieldAlert size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Quarantined or temperature-excursion units never appear as eligible stock.</div>
            <div className="notice"><Activity size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Two institutional approvals and one clinical sign-off are required for every transfer.</div>
            <div className="notice"><PackageCheck size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Simulations run on cloned state and cannot change live inventory.</div>
          </div>
        </Panel>
      </div>
    </>
  );
}

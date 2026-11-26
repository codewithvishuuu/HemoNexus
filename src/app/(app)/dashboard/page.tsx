'use client';
import Link from 'next/link';
import { useApi } from '@/lib/useApi';

export default function Dashboard() {
  const { data: units } = useApi<any>('/api/v1/inventory/units?eligibleOnly=true');
  const { data: scores } = useApi<any>('/api/v1/scores');
  const { data: insts } = useApi<any>('/api/v1/institutions');
  const { data: health } = useApi<any>('/api/v1/health');
  const rows = scores?.scores ?? [];
  const critical = rows.filter((r: any) => r.band === 'CRITICAL').length;
  const eligible = units?.total ?? 0;

  return (
    <>
      <div className="page-head">
        <div><h1>Command center</h1><p className="sub">Network-wide shortage risk, verified supply and active alerts. Data as of {health?.time?.slice(0, 16) ?? '—'} UTC.</p></div>
        <button className="btn" onClick={() => fetch('/api/v1/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(() => location.reload())}>Recompute scores</button>
      </div>
      <div className="grid g4">
        <div className="card"><h3>Critical scores</h3><div className="kpi" style={{ color: 'var(--critical)' }}>{critical}<small>of {rows.length}</small></div></div>
        <div className="card"><h3>Eligible units</h3><div className="kpi">{eligible}<small>verified</small></div></div>
        <div className="card"><h3>Facilities</h3><div className="kpi">{insts?.institutions?.length ?? '—'}<small>simulated</small></div></div>
        <div className="card"><h3>Forecast engine</h3><div className="kpi" style={{ fontSize: 18 }}>HW + baselines</div><div className="muted" style={{ fontSize: 11, marginTop: 8 }}>seed 42 · deterministic</div></div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Top shortage risk</h3>
          {rows.length ? <table><thead><tr><th>Institution</th><th>Group / component</th><th>Band</th><th className="mono">Raw</th></tr></thead><tbody>
            {rows.slice(0, 10).map((r: any) => <tr key={r.id}><td>{r.institution?.name?.replace(' (SIMULATED)', '')}</td><td className="mono">{r.group} · {r.component}</td><td><span className={`band ${r.band}`}>{r.band}</span></td><td className="mono">{r.raw?.toFixed?.(2)}</td></tr>)}
          </tbody></table> : <div className="empty">No scores yet. Click “Recompute scores” to run the deterministic pipeline.</div>}
          {!!rows.length && <Link className="btn ghost" style={{ marginTop: 14 }} href="/forecasts">View backtest evidence →</Link>}
        </div>
        <div className="card">
          <h3>Recent audit activity</h3>
          <AuditPreview />
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Operational boundaries</h3>
        <div className="grid g3">
          <div className="warn">Quarantined or temperature-excursion units never appear as eligible stock.</div>
          <div className="warn">No transfer is executed by software. Two institutional approvals and one clinical sign-off are required.</div>
          <div className="warn">Simulation runs on a cloned snapshot and cannot modify live inventory.</div>
        </div>
      </div>
    </>
  );
}

function AuditPreview() {
  const { data } = useApi<any>('/api/v1/audit');
  const events = data?.events?.slice(0, 8) ?? [];
  if (!events.length) return <div className="empty">No audited events yet.</div>;
  return <table><thead><tr><th>Action</th><th>Actor</th><th>Time</th></tr></thead><tbody>{events.map((e: any) => <tr key={e.id}><td className="mono">{e.action}</td><td>{e.actor}</td><td className="mono">{e.at?.slice(0, 16)}</td></tr>)}</tbody></table>;
}

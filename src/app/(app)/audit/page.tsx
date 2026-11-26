'use client';
import { useApi } from '@/lib/useApi';
export default function Audit() {
  const { data } = useApi<any>('/api/v1/audit');
  const events = data?.events ?? [];
  return (
    <>
      <div className="page-head"><div><h1>Audit history</h1><p className="sub">Append-only record of identity, inventory, scoring, approval and simulation events. No delete path exists.</p></div></div>
      <div className="card">
        {events.length ? <table><thead><tr><th className="mono">ID</th><th>Action</th><th>Actor</th><th>Entity</th><th>Summary</th><th className="mono">At</th></tr></thead><tbody>
          {events.map((e: any) => <tr key={e.id}><td className="mono">{e.id.slice(-8)}</td><td className="mono">{e.action}</td><td>{e.actor}</td><td className="mono">{e.entity?.slice?.(-8) ?? e.entity}</td><td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.summary}</td><td className="mono">{e.at?.slice(0, 19)}</td></tr>)}
        </tbody></table> : <div className="empty">No audit events recorded yet.</div>}
      </div>
    </>
  );
}

'use client';
import { useApi } from '@/lib/useApi';
import { useState } from 'react';

const checkpoints = ['SENDING_INSTITUTION', 'RECEIVING_INSTITUTION', 'CLINICAL_REVIEWER'];

export default function Approvals() {
  const { data } = useApi<any>('/api/v1/transfers', 8000);
  const [msg, setMsg] = useState('');
  async function approve(requestId: string, checkpoint: string) {
    setMsg('');
    const res = await fetch('/api/v1/transfers/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, checkpoint, note: 'Human verification recorded in demo' }) });
    const d = await res.json();
    setMsg(res.ok ? `Advanced to ${d.state}` : (d.error?.message ?? 'Approval denied'));
  }
  const requests = data?.requests ?? [];
  return (
    <>
      <div className="page-head"><div><h1>Transfer approvals</h1><p className="sub">Three human checkpoints are required. Software never approves a transfusion or declares clinical suitability.</p></div>
        <button className="btn" onClick={async () => {
          const insts = (await (await fetch('/api/v1/institutions')).json()).institutions;
          const units = (await (await fetch('/api/v1/inventory/units?eligibleOnly=true')).json()).units;
          const unit = units[0];
          const to = insts.find((i: any) => i.id !== unit?.institutionId);
          if (!unit || !to) { setMsg('No eligible unit available'); return; }
          const res = await fetch('/api/v1/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `demo-${unit.id}-${Date.now()}` }, body: JSON.stringify({ fromId: unit.institutionId, toId: to.id, group: unit.group, component: unit.component, units: 1, unitId: unit.id }) });
          const d = await res.json();
          setMsg(res.ok ? 'Transfer request created — awaiting human approvals' : (d.error?.message ?? 'Request failed'));
          location.reload();
        }}>Create demo request</button>
      </div>
      {msg && <div className="ok" style={{ marginBottom: 14 }}>{msg}</div>}
      <div className="card">
        {requests.length ? <table><thead><tr><th>Request</th><th>Group / component</th><th>Units</th><th>State</th><th>Approvals</th><th>Action</th></tr></thead><tbody>
          {requests.map((r: any) => {
            const done = (r.approvals ?? []).map((a: any) => a.checkpoint);
            const next = checkpoints.find((c) => !done.includes(c));
            return <tr key={r.id}>
              <td className="mono">{r.id.slice(-8)}</td><td className="mono">{r.group} · {r.component}</td><td className="mono">{r.units}</td>
              <td><span className="band MODERATE">{r.state}</span></td><td className="mono">{done.join(', ') || 'none'}</td>
              <td>{next ? <button className="btn ghost" onClick={() => approve(r.id, next)}>Sign {next.replace('_', ' ').toLowerCase()}</button> : <span className="band STABLE">COMPLETE</span>}</td>
            </tr>;
          })}
        </tbody></table> : <div className="empty">No transfer requests yet. Create one from a matching suggestion on the map page.</div>}
      </div>
    </>
  );
}

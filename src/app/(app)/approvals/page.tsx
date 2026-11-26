'use client';
import { useState } from 'react';
import { ClipboardCheck, Plus, ShieldAlert } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHead, Metric, Panel, EmptyBlock, SkeletonRows, InfoNote } from '@/components/console';

const checkpoints = ['SENDING_INSTITUTION', 'RECEIVING_INSTITUTION', 'CLINICAL_REVIEWER'];
export default function Approvals() {
  const { data, loading } = useApi<any>('/api/v1/transfers', 8000);
  const [msg, setMsg] = useState('');
  async function approve(requestId: string, checkpoint: string) {
    setMsg('');
    const res = await fetch('/api/v1/transfers/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, checkpoint, note: 'Human verification recorded in demo' }) });
    const d = await res.json();
    setMsg(res.ok ? `Advanced to ${d.state}` : (d.error?.message ?? 'Approval denied'));
    if (res.ok) location.reload();
  }
  const requests = data?.requests ?? [];
  const pending = requests.filter((r: any) => r.state !== 'APPROVED');
  return (
    <>
      <PageHead section="Operations" title="Approvals" description="Three distinct human checkpoints. Software never approves a transfusion or declares clinical suitability."
        meta={<span className="badge sim">SIMULATED DATA</span>}
        actions={<button className="btn" onClick={async () => {
          const insts = (await (await fetch('/api/v1/institutions')).json()).institutions;
          const units = (await (await fetch('/api/v1/inventory/units?eligibleOnly=true')).json()).units;
          const unit = units[0], to = insts.find((i: any) => i.id !== unit?.institutionId);
          if (!unit || !to) { setMsg('No eligible unit available'); return; }
          const res = await fetch('/api/v1/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `demo-${unit.id}-${Date.now()}` }, body: JSON.stringify({ fromId: unit.institutionId, toId: to.id, group: unit.group, component: unit.component, units: 1, unitId: unit.id }) });
          const d = await res.json(); setMsg(res.ok ? 'Request created — awaiting human approvals' : (d.error?.message ?? 'Request failed')); location.reload();
        }}><Plus size={15} /> Create demo request</button>} />
      <div className="ax-metric-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <Metric label="Pending requests" value={pending.length} note="awaiting human action" icon={ClipboardCheck} tone="amber" />
        <Metric label="Approved" value={requests.filter((r: any) => r.state === 'APPROVED').length} note="fully signed off" icon={ClipboardCheck} tone="stable" />
        <Metric label="Checkpoints" value="3" note="institutional + clinical" icon={ShieldAlert} />
      </div>
      {msg && <div className="ax-note ok" style={{ marginBottom: 14 }}>{msg}</div>}
      <Panel title="Transfer requests" subtitle={`${requests.length} in scope`} icon={ClipboardCheck}>
        {loading ? <SkeletonRows rows={3} /> : requests.length ? <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Request</th><th>Blood group</th><th className="num">Units</th><th>State</th><th>Signed checkpoints</th><th>Action</th></tr></thead><tbody>
          {requests.map((r: any) => {
            const done = (r.approvals ?? []).map((a: any) => a.checkpoint);
            const next = checkpoints.find((c) => !done.includes(c));
            return <tr key={r.id}><td className="mono">{r.id.slice(-8)}</td><td className="mono">{r.group} · {r.component}</td><td className="num">{r.units}</td><td><span className="badge neutral">{r.state.replace(/_/g, ' ')}</span></td><td className="small">{done.length ? done.map((d: string) => d.replace('_', ' ')).join(', ') : 'none'}</td><td>{next ? <button className="btn secondary" onClick={() => approve(r.id, next)}>Sign {next.replace(/_/g, ' ').toLowerCase()}</button> : <span className="badge STABLE">Complete</span>}</td></tr>;
          })}
        </tbody></table></div> : <EmptyBlock title="No transfer requests" message="Create a demo request to walk through the approval workflow." />}
        <div style={{ marginTop: 14 }}><InfoNote tone="critical">Every transfer requires two institutional approvals and one qualified clinical sign-off.</InfoNote></div>
      </Panel>
    </>
  );
}

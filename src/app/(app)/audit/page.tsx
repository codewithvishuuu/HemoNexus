'use client';
import { FileClock } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHeader, Panel, EmptyState, LoadingRows } from '@/components/ui';

export default function Audit() {
  const { data, loading } = useApi<any>('/api/v1/audit');
  const events = data?.events ?? [];
  return (
    <>
      <PageHeader eyebrow="Governance" title="Audit history" description="Append-only record of identity, inventory, scoring, approval and simulation events. There is no update or delete path." />
      <Panel title="Event log" hint={`${events.length} most recent`} action={<span className="badge neutral"><FileClock size={13} /> Immutable</span>}>
        {loading ? <LoadingRows rows={4} /> : events.length ? <div className="table-wrap"><table><thead><tr><th>Event</th><th>Actor</th><th>Entity</th><th>Summary</th><th className="num">Timestamp</th></tr></thead><tbody>
          {events.map((e: any) => <tr key={e.id}><td><span className="badge crimson">{e.action.replace(/_/g, ' ')}</span></td><td>{e.actor}</td><td className="mono">{String(e.entity ?? '').slice(-8)}</td><td className="small muted" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.summary}</td><td className="num">{String(e.at).slice(0, 19).replace('T', ' ')}</td></tr>)}
        </tbody></table></div> : <EmptyState title="No audit events" message="Actions performed in the console will appear here." />}
      </Panel>
    </>
  );
}

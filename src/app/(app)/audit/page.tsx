'use client';
import { FileClock } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHead, Metric, Panel, EmptyBlock, SkeletonRows } from '@/components/console';

export default function Audit() {
  const { data, loading } = useApi<any>('/api/v1/audit');
  const events = data?.events ?? [];
  const today = events.filter((e: any) => String(e.at).slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  return (
    <>
      <PageHead section="Operations · governance" title="Audit" description="Append-only record of identity, inventory, scoring, approval and simulation events. There is no update or delete path."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-metric-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <Metric label="Events in view" value={events.length} note="most recent" icon={FileClock} />
        <Metric label="Today" value={today} note="current date" icon={FileClock} tone="crimson" />
        <Metric label="Storage" value="Append only" note="no update or delete route" icon={FileClock} tone="stable" />
      </div>
      <Panel title="Event log" subtitle={`${events.length} most recent`} icon={FileClock}>
        {loading ? <SkeletonRows rows={4} /> : events.length ? <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Event</th><th>Actor</th><th>Entity</th><th>Summary</th><th className="num">Timestamp</th></tr></thead><tbody>
          {events.map((e: any) => <tr key={e.id}><td><span className="badge crimson">{e.action.replace(/_/g, ' ')}</span></td><td>{e.actor}</td><td className="mono">{String(e.entity ?? '').slice(-8)}</td><td className="small muted" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.summary}</td><td className="num">{String(e.at).slice(0, 19).replace('T', ' ')}</td></tr>)}
        </tbody></table></div> : <EmptyBlock title="No audit events" message="Actions performed in the console will appear here." />}
      </Panel>
    </>
  );
}

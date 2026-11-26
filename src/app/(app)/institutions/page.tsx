'use client';
import { useState } from 'react';
import { Building2, MapPin, ShieldCheck } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHeader, Panel, Kpi, EmptyState, LoadingRows } from '@/components/ui';

export default function Institutions() {
  const { data, loading } = useApi<any>('/api/v1/institutions');
  const [selected, setSelected] = useState<string>('');
  const list = data?.institutions ?? [];
  const inst = list.find((i: any) => i.id === selected) ?? list[0];
  return (
    <>
      <PageHeader eyebrow="Network" title="Institutions" description="Fictional participating facilities. Every record is labelled simulated and is not a real hospital or blood bank." />
      <div className="grid g-2-1">
        <Panel title="Participating facilities" hint={`${list.length} in scope`}>
          {loading ? <LoadingRows rows={5} /> : list.length ? <div className="table-wrap"><table><thead><tr><th>Facility</th><th>Type</th><th>Region</th><th className="num">Units</th><th>Status</th></tr></thead><tbody>
            {list.map((i: any) => <tr key={i.id} onClick={() => setSelected(i.id)} style={{ cursor: 'pointer', background: inst?.id === i.id ? '#FBEBEE' : undefined }}><td>{i.name}</td><td>{i.type.replace('_', ' ')}</td><td>{i.region}</td><td className="num">{i._count?.units}</td><td><span className="badge neutral">{i.verified ? 'Verified' : 'Pending'}</span></td></tr>)}
          </tbody></table></div> : <EmptyState title="No institutions in scope" />}
        </Panel>
        <Panel title="Facility detail" hint={inst?.name ?? '—'}>
          {inst ? <>
            <div className="eyebrow">{inst.type.replace('_', ' ')}</div>
            <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', margin: '14px 0' }}>
              <Kpi label="Units" value={inst._count?.units ?? 0} />
              <Kpi label="Scores" value={inst._count?.scores ?? 0} />
            </div>
            <div className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin size={14} /> {inst.lat.toFixed(3)}, {inst.lng.toFixed(3)} · {inst.region} region</div>
            <div className="notice" style={{ marginTop: 16 }}><ShieldCheck size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Synthetic institution — not a real healthcare facility.</div>
          </> : <EmptyState title="Select a facility" />}
        </Panel>
      </div>
    </>
  );
}

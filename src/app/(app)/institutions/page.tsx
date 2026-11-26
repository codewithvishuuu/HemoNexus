'use client';
import { useState } from 'react';
import { Building2, MapPin, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHead, Metric, Panel, EmptyBlock, SkeletonRows, InfoNote, FilterRow } from '@/components/console';

export default function Institutions() {
  const { data, loading } = useApi<any>('/api/v1/institutions');
  const [region, setRegion] = useState('All');
  const [selected, setSelected] = useState<string>('');
  const list = data?.institutions ?? [];
  const filtered = region === 'All' ? list : list.filter((i: any) => i.region === region);
  const inst = filtered.find((i: any) => i.id === selected) ?? filtered[0];
  return (
    <>
      <PageHead section="Network" title="Institutions" description="Fictional participating facilities. Every record is labelled simulated and is not a real hospital or blood bank."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-metric-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <Metric label="Facilities in scope" value={list.length} note="network participants" icon={Building2} />
        <Metric label="Regions" value={new Set(list.map((i: any) => i.region)).size} note="geographic coverage" icon={MapPin} />
        <Metric label="Verified records" value={list.filter((i: any) => i.verified).length} note="verification state" icon={ShieldCheck} tone="stable" />
      </div>
      <div className="ax-grid-main" style={{ marginTop: 14 }}>
        <Panel title="Participating facilities" subtitle={`${filtered.length} shown`} icon={Building2} action={<FilterRow><SlidersHorizontal size={15} /><select value={region} onChange={(e) => setRegion(e.target.value)}><option>All</option><option>North</option><option>East</option><option>South</option></select></FilterRow>}>
          {loading ? <SkeletonRows rows={5} /> : filtered.length ? <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Facility</th><th>Type</th><th>Region</th><th className="num">Units</th><th>Status</th></tr></thead><tbody>
            {filtered.map((i: any) => <tr key={i.id} onClick={() => setSelected(i.id)} style={{ cursor: 'pointer', background: inst?.id === i.id ? 'var(--crimson-soft)' : undefined }}><td>{i.name}</td><td>{i.type.replace('_', ' ')}</td><td>{i.region}</td><td className="num">{i._count?.units}</td><td><span className="badge neutral">{i.verified ? 'Verified' : 'Pending'}</span></td></tr>)}
          </tbody></table></div> : <EmptyBlock title="No institutions" message="Adjust the region filter." />}
        </Panel>
        <Panel title="Facility detail" subtitle={inst?.name ?? '—'} icon={MapPin}>
          {inst ? <>
            <div className="eyebrow">{inst.type.replace('_', ' ')}</div>
            <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}><span className="badge neutral">{inst.region} region</span><span className="badge sim">Synthetic</span></div>
            <div className="small muted" style={{ display: 'flex', gap: 7 }}><MapPin size={14} /> {inst.lat.toFixed(3)}, {inst.lng.toFixed(3)}</div>
            <div style={{ marginTop: 18 }}><InfoNote tone="notice">This is a synthetic institution. It is not a real hospital or blood bank.</InfoNote></div>
          </> : <EmptyBlock title="Select a facility" />}
        </Panel>
      </div>
    </>
  );
}

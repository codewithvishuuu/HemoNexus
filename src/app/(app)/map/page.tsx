'use client';
import { useState } from 'react';
import { MapPin, Route, Building2, ShieldAlert } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { haversine } from '@/lib/geo';
import { PageHead, Metric, Panel, EmptyBlock, SkeletonRows, InfoNote, FilterRow } from '@/components/console';

const COLORS: Record<string, string> = { CRITICAL: '#B4233B', HIGH: '#B85C1E', MODERATE: '#9A6707', STABLE: '#147D64' };

export default function MapPage() {
  const { data: insts, loading } = useApi<any>('/api/v1/institutions');
  const { data: scores } = useApi<any>('/api/v1/scores');
  const [region, setRegion] = useState('All');
  const all = insts?.institutions ?? [];
  const list = region === 'All' ? all : all.filter((i: any) => i.region === region);
  const bandMap: Record<string, string> = {};
  (scores?.scores ?? []).forEach((s: any) => { if (!bandMap[s.institutionId] || s.band === 'CRITICAL') bandMap[s.institutionId] = s.band; });
  const first = list[0];
  const neighbours = first ? list.filter((i: any) => i.id !== first.id).map((i: any) => ({ ...i, km: haversine(first, i) })).sort((a: any, b: any) => a.km - b.km).slice(0, 5) : [];
  const xy = (i: any) => ({ x: ((i.lng - 68) / 18) * 100, y: 100 - ((i.lat - 16) / 18) * 100 });
  return (
    <>
      <PageHead section="Network" title="Regional Map" description="Fictional facilities on real coordinates. Distance uses the documented Haversine fallback; transport times are estimates for prioritisation only."
        meta={<span className="badge sim">SIMULATED DATA</span>}
        actions={<FilterRow><select value={region} onChange={(e) => setRegion(e.target.value)}><option>All</option><option>North</option><option>East</option><option>South</option></select></FilterRow>} />
      <div className="ax-metric-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
        <Metric label="Facilities shown" value={list.length} note="current filter" icon={MapPin} />
        <Metric label="Critical sites" value={list.filter((i: any) => bandMap[i.id] === 'CRITICAL').length} note="highest stored band" icon={ShieldAlert} tone="critical" />
        <Metric label="Nearest partner" value={neighbours[0] ? neighbours[0].km.toFixed(0) : '—'} unit="km" note="from first facility" icon={Route} />
      </div>
      <div className="ax-grid-main">
        <Panel title="Regional network" subtitle="Point colour = highest current risk band" icon={Building2}>
          {loading ? <SkeletonRows rows={3} /> : list.length ? <div className="chart-shell">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 460, background: '#F8FAFC', border: '1px solid var(--line)', borderRadius: 10 }}>
              {list.slice(1).map((i: any) => { const a = xy(first), b = xy(i); return <line key={`l${i.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#D2D9E3" strokeWidth=".25" strokeDasharray="2 1.5" />; })}
              {list.map((i: any) => { const p = xy(i); return <g key={i.id}><circle cx={p.x} cy={p.y} r="3.6" fill={COLORS[bandMap[i.id]] ?? '#7A8699'} opacity=".16" /><circle cx={p.x} cy={p.y} r="1.8" fill={COLORS[bandMap[i.id]] ?? '#334566'} stroke="#fff" strokeWidth=".4" /><text x={p.x + 2.4} y={p.y + .8} fontSize="2" fill="#334566">{i.name.replace(' (SIMULATED)', '').slice(0, 15)}</text></g>; })}
            </svg>
            <div className="chart-legend">{Object.entries(COLORS).map(([b, c]) => <span key={b}><i style={{ background: c }} />{b}</span>)}</div>
          </div> : <EmptyBlock title="No facilities in this region" />}
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel title="Nearby facilities" subtitle={first?.name?.replace(' (SIMULATED)', '') ?? '—'} icon={Route}>
            {neighbours.length ? <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Facility</th><th className="num">km</th><th className="num">hrs</th></tr></thead><tbody>{neighbours.map((n: any) => <tr key={n.id}><td>{n.name}</td><td className="num">{n.km.toFixed(1)}</td><td className="num">{(n.km / 45).toFixed(1)}</td></tr>)}</tbody></table></div> : <EmptyBlock title="Select a region" />}
          </Panel>
          <Panel title="Reading this map" icon={ShieldAlert}>
            <InfoNote tone="notice">Points are simulated facilities; lines show proximity, not confirmed logistics routes. Cold-chain verification and human authorisation are required before any movement.</InfoNote>
          </Panel>
        </div>
      </div>
    </>
  );
}

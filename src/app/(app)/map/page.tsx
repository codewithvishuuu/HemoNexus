'use client';
import { useApi } from '@/lib/useApi';
import { useState } from 'react';
import { haversine } from '@/lib/geo';

export default function MapPage() {
  const { data: insts } = useApi<any>('/api/v1/institutions');
  const { data: scores } = useApi<any>('/api/v1/scores');
  const { data: candidates } = useApi<any>('/api/v1/matching?fromId=sim&group=O-&component=RBC&radiusKm=150');
  const [region, setRegion] = useState('All');
  const all = insts?.institutions ?? [];
  const list = region === 'All' ? all : all.filter((i: any) => i.region === region);
  const scoreMap: Record<string, string> = {};
  (scores?.scores ?? []).forEach((s: any) => { if (!scoreMap[s.institutionId] || s.band === 'CRITICAL') scoreMap[s.institutionId] = s.band; });
  const color: Record<string, string> = { CRITICAL: '#ef5b5b', HIGH: '#f08a4b', MODERATE: '#f5c451', STABLE: '#2dd4a7' };
  const first = list[0];
  const neighbours = first ? list.filter((i: any) => i.id !== first.id).map((i: any) => ({ ...i, km: haversine(first, i) })).sort((a: any, b: any) => a.km - b.km).slice(0, 4) : [];

  return (
    <>
      <div className="page-head"><div><h1>Regional intelligence</h1><p className="sub">Fictional facilities plotted on real coordinates. Distances use a documented Haversine fallback — PostGIS is not available in this environment.</p></div>
        <select value={region} onChange={(e) => setRegion(e.target.value)}><option>All</option><option>North</option><option>East</option><option>South</option></select>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Network view</h3>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 360, background: '#0c1428', border: '1px solid var(--line)', borderRadius: 8 }}>
            {list.map((i: any, idx: number) => {
              const x = ((i.lng - 70) / 15) * 100, y = 100 - ((i.lat - 18) / 14) * 100;
              return <g key={i.id} onClick={() => setRegion(i.region)} style={{ cursor: 'pointer' }}>
                {idx > 0 && <line x1={x} y1={y} x2={((list[0].lng - 70) / 15) * 100} y2={100 - ((list[0].lat - 18) / 14) * 100} stroke="#273653" strokeWidth="0.25" />}
                <circle cx={x} cy={y} r="2.2" fill={color[scoreMap[i.id]] ?? '#64748b'} stroke="#fff" strokeWidth="0.3" />
                <text x={x + 2.5} y={y + 1} fill="#94a3bb" fontSize="2.2">{i.name.replace(' (SIMULATED)', '').slice(0, 14)}</text>
              </g>;
            })}
          </svg>
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Point color = highest current risk band. Lines are network proximity, not confirmed transport routes.</div>
        </div>
        <div className="card">
          <h3>Nearby facilities {first ? `— ${first.name.replace(' (SIMULATED)', '')}` : ''}</h3>
          {neighbours.length ? <table><thead><tr><th>Facility</th><th className="mono">km</th><th className="mono">Hours</th></tr></thead><tbody>
            {neighbours.map((n: any) => <tr key={n.id}><td>{n.name}</td><td className="mono">{n.km.toFixed(1)}</td><td className="mono">{(n.km / 45).toFixed(1)}</td></tr>)}
          </tbody></table> : <div className="empty">Select a region.</div>}
          <div className="warn" style={{ marginTop: 14 }}>Transport-time figures are estimates for prioritisation only. Cold-chain verification and human authorisation are required before any movement.</div>
        </div>
      </div>
    </>
  );
}

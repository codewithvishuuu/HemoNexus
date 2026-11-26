'use client';
import { useApi } from '@/lib/useApi';
import { useState } from 'react';

export default function Institutions() {
  const { data } = useApi<any>('/api/v1/institutions');
  const [selected, setSelected] = useState<string>('');
  const list = data?.institutions ?? [];
  const inst = list.find((i: any) => i.id === selected) ?? list[0];
  return (
    <>
      <div className="page-head"><div><h1>Institutions</h1><p className="sub">Every facility in this network is fictional and explicitly labelled simulated.</p></div></div>
      <div className="grid g2">
        <div className="card">
          <h3>Participating facilities</h3>
          <table><thead><tr><th>Name</th><th>Type</th><th>Region</th><th>Units</th><th>Verified</th></tr></thead><tbody>
            {list.map((i: any) => <tr key={i.id} onClick={() => setSelected(i.id)} style={{ cursor: 'pointer' }}><td>{i.name}</td><td>{i.type}</td><td>{i.region}</td><td className="mono">{i._count?.units}</td><td>{i.verified ? 'Yes' : 'No'}</td></tr>)}
          </tbody></table>
        </div>
        <div className="card">
          <h3>{inst?.name ?? 'Select an institution'}</h3>
          {inst ? <>
            <p className="sub">{inst.type} · {inst.region} · {inst.lat.toFixed(3)}, {inst.lng.toFixed(3)}</p>
            <div className="grid g2" style={{ marginTop: 16 }}>
              <div><div className="muted" style={{ fontSize: 12 }}>Recorded units</div><div className="kpi">{inst._count?.units}</div></div>
              <div><div className="muted" style={{ fontSize: 12 }}>Risk scores</div><div className="kpi">{inst._count?.scores}</div></div>
            </div>
            <div className="warn" style={{ marginTop: 16 }}>This is a synthetic institution. It is not a real hospital or blood bank and must not be represented as one.</div>
          </> : <div className="empty">No institutions found.</div>}
        </div>
      </div>
    </>
  );
}

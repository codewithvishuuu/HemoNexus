'use client';
import { useApi } from '@/lib/useApi';
import { useState } from 'react';

export default function Inventory() {
  const { data } = useApi<any>('/api/v1/inventory/units');
  const [group, setGroup] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(false);
  let units = data?.units ?? [];
  if (group !== 'All') units = units.filter((u: any) => u.group === group);
  if (onlyEligible) units = units.filter((u: any) => u.eligible);
  return (
    <>
      <div className="page-head"><div><h1>Inventory &amp; cold chain</h1><p className="sub">Unit-level traceability, quality state and expiry. Ineligible units are never counted as available stock.</p></div></div>
      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <select value={group} onChange={(e) => setGroup(e.target.value)}><option>All</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select>
          <label className="muted" style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} /> Eligible only</label>
          <span className="muted mono" style={{ fontSize: 12, marginLeft: 'auto' }}>{units.length} shown</span>
        </div>
        <table><thead><tr><th>Unit ID</th><th>Group</th><th>Component</th><th>Institution</th><th className="mono">Expires</th><th className="mono">°C</th><th>State</th><th>Eligible</th></tr></thead><tbody>
          {units.slice(0, 120).map((u: any) => <tr key={u.id}>
            <td className="mono">{u.id.slice(-8)}</td><td className="mono">{u.group}</td><td>{u.component}</td><td>{u.institution?.replace(' (SIMULATED)', '')}</td>
            <td className="mono">{u.expiresAt?.slice(0, 10)}</td><td className="mono">{u.temperatureC}</td>
            <td>{u.excursionOpen ? 'EXCURSION UNRESOLVED' : u.quarantineState}</td>
            <td>{u.eligible ? <span className="band STABLE">YES</span> : <span className="band HIGH">NO</span>}</td>
          </tr>)}
        </tbody></table>
        {!units.length && <div className="empty">No units match the current filters.</div>}
      </div>
    </>
  );
}

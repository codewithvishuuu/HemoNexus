'use client';
import { useState } from 'react';
import { Package, ShieldAlert, Thermometer } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHeader, Panel, Kpi, EmptyState, LoadingRows } from '@/components/ui';

export default function Inventory() {
  const { data, loading } = useApi<any>('/api/v1/inventory/units');
  const [group, setGroup] = useState('All');
  const [onlyEligible, setOnlyEligible] = useState(false);
  let units = data?.units ?? [];
  if (group !== 'All') units = units.filter((u: any) => u.group === group);
  if (onlyEligible) units = units.filter((u: any) => u.eligible);
  const all = data?.units ?? [];
  const eligibleCount = all.filter((u: any) => u.eligible).length;
  const restricted = all.length - eligibleCount;
  const excursions = all.filter((u: any) => u.excursionOpen).length;

  return (
    <>
      <PageHeader eyebrow="Operations" title="Inventory & cold chain" description="Unit-level traceability with quality, temperature and expiry state. Ineligible units are excluded from availability and matching." />
      <div className="kpi-grid">
        <Kpi label="Recorded units" value={all.length} foot="in current scope" tone="crimson" />
        <Kpi label="Eligible" value={eligibleCount} foot="verified and in date" tone="stable" />
        <Kpi label="Restricted" value={restricted} foot="quarantine, quality or expiry" />
        <Kpi label="Open excursions" value={excursions} foot="awaiting human resolution" tone="critical" />
      </div>
      <Panel title="Blood units" hint={`${units.length} shown`} action={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={group} onChange={(e) => setGroup(e.target.value)}><option>All</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select>
          <label className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={onlyEligible} onChange={(e) => setOnlyEligible(e.target.checked)} /> Eligible only</label>
        </div>
      }>
        {loading ? <LoadingRows rows={4} /> : units.length ? <div className="table-wrap"><table><thead><tr><th>Unit</th><th>Group</th><th>Component</th><th>Facility</th><th>Expires</th><th className="num">°C</th><th>State</th><th>Eligibility</th></tr></thead><tbody>
          {units.slice(0, 120).map((u: any) => <tr key={u.id}>
            <td className="mono">{u.id.slice(-8)}</td><td className="mono">{u.group}</td><td>{u.component}</td><td>{u.institution?.replace(' (SIMULATED)', '')}</td>
            <td className="mono">{u.expiresAt?.slice(0, 10)}</td><td className="num">{u.temperatureC}</td>
            <td>{u.excursionOpen ? <span className="badge HIGH">EXCURSION</span> : u.quarantineState === 'QUARANTINED' ? <span className="badge CRITICAL">QUARANTINED</span> : <span className="badge neutral">In stock</span>}</td>
            <td>{u.eligible ? <span className="badge STABLE">Eligible</span> : <span className="badge HIGH">Blocked</span>}</td>
          </tr>)}
        </tbody></table></div> : <EmptyState title="No units match" message="Adjust the filters to see more inventory." />}
        <div className="notice" style={{ marginTop: 14 }}><Thermometer size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Storage ranges and shelf-life rules are versioned and sourced; release of a quarantined unit requires an authorised human.</div>
      </Panel>
    </>
  );
}

'use client';
import { useState } from 'react';
import { Package, ShieldAlert, Thermometer, SlidersHorizontal } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHead, Metric, Panel, EmptyBlock, SkeletonRows, InfoNote, FilterRow } from '@/components/console';

export default function Inventory() {
  const { data, loading } = useApi<any>('/api/v1/inventory/units');
  const [group, setGroup] = useState('All'), [component, setComponent] = useState('All'), [eligibleOnly, setEligibleOnly] = useState(false);
  const all = data?.units ?? [];
  let units = all;
  if (group !== 'All') units = units.filter((u: any) => u.group === group);
  if (component !== 'All') units = units.filter((u: any) => u.component === component);
  if (eligibleOnly) units = units.filter((u: any) => u.eligible);
  const eligibleCount = all.filter((u: any) => u.eligible).length;
  const excursions = all.filter((u: any) => u.excursionOpen).length;
  const expiring = all.filter((u: any) => u.eligible && (new Date(u.expiresAt).getTime() - Date.now()) / 86400000 <= 14).length;
  return (
    <>
      <PageHead section="Network · operations" title="Inventory" description="Unit-level traceability with quality, temperature and expiry state. Ineligible units are excluded from availability and matching."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-metric-grid">
        <Metric label="Recorded units" value={all.length || '—'} note="in current scope" icon={Package} />
        <Metric label="Eligible" value={eligibleCount} note="verified and in date" icon={Package} tone="stable" />
        <Metric label="Excursions" value={excursions} note="awaiting human resolution" icon={Thermometer} tone="critical" />
        <Metric label="Expiring ≤14d" value={expiring} note="eligible stock" icon={ShieldAlert} tone="amber" />
        <Metric label="Restricted" value={all.length - eligibleCount} note="quarantine, quality or expiry" icon={ShieldAlert} />
      </div>
      <Panel title="Blood units" subtitle={`${units.length} shown`} icon={Package} action={<FilterRow><SlidersHorizontal size={15} /><select value={group} onChange={(e) => setGroup(e.target.value)}><option>All</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g) => <option key={g}>{g}</option>)}</select><select value={component} onChange={(e) => setComponent(e.target.value)}><option>All</option><option>RBC</option><option>Plasma</option><option>Platelets</option></select><label className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} /> Eligible only</label></FilterRow>}>
        {loading ? <SkeletonRows rows={4} /> : units.length ? <div className="ax-table-wrap"><table className="ax-table"><thead><tr><th>Unit</th><th>Group</th><th>Component</th><th>Facility</th><th>Expires</th><th className="num">°C</th><th>State</th><th>Eligibility</th></tr></thead><tbody>
          {units.slice(0, 120).map((u: any) => <tr key={u.id}><td className="mono">{u.id.slice(-8)}</td><td className="mono">{u.group}</td><td>{u.component}</td><td>{u.institution?.replace(' (SIMULATED)', '')}</td><td className="mono">{u.expiresAt?.slice(0, 10)}</td><td className="num">{u.temperatureC}</td><td>{u.excursionOpen ? <span className="badge HIGH">EXCURSION</span> : u.quarantineState === 'QUARANTINED' ? <span className="badge CRITICAL">QUARANTINED</span> : <span className="badge neutral">In stock</span>}</td><td>{u.eligible ? <span className="badge STABLE">Eligible</span> : <span className="badge HIGH">Blocked</span>}</td></tr>)}
        </tbody></table></div> : <EmptyBlock title="No units match" message="Adjust the filters to see more inventory." />}
        <div style={{ marginTop: 14 }}><InfoNote tone="notice">Storage ranges and shelf-life rules are versioned and sourced; release of a quarantined unit requires an authorised human.</InfoNote></div>
      </Panel>
    </>
  );
}

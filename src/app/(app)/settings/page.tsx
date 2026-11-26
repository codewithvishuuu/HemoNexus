'use client';
import { useApi } from '@/lib/useApi';
export default function Settings() {
  const { data } = useApi<any>('/api/v1/health');
  return (
    <>
      <div className="page-head"><div><h1>Settings &amp; platform state</h1><p className="sub">Environment and governance information for this simulated deployment.</p></div></div>
      <div className="grid g2">
        <div className="card"><h3>Runtime</h3><table><tbody>
          <tr><td>Service</td><td className="mono">{data?.service ?? '—'}</td></tr>
          <tr><td>Data mode</td><td className="mono">{data?.dataMode ?? '—'}</td></tr>
          <tr><td>Deterministic seed</td><td className="mono">{data?.seed ?? '—'}</td></tr>
          <tr><td>Institutions</td><td className="mono">{data?.institutions ?? '—'}</td></tr>
          <tr><td>Status</td><td className="mono">{data?.status ?? '—'}</td></tr>
        </tbody></table></div>
        <div className="card"><h3>Governance</h3>
          <div className="warn">Synthetic data only. No donor or patient identifiers are stored.</div>
          <div className="warn" style={{ marginTop: 8 }}>DPDP-aligned minimisation, purpose limitation and role-based access are enforced. Phased commencement is documented in the planning set.</div>
          <div className="warn" style={{ marginTop: 8 }}>Clinical decisions remain with qualified humans; this platform is decision support only.</div>
        </div>
      </div>
    </>
  );
}

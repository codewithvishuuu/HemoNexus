'use client';
import { Database, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHead, Panel, InfoNote } from '@/components/console';

export default function Settings() {
  const { data } = useApi<any>('/api/v1/health');
  const rows: [string, string][] = [['Service', data?.service ?? '—'], ['Data mode', data?.dataMode ?? '—'], ['Deterministic seed', String(data?.seed ?? '—')], ['Institutions', String(data?.institutions ?? '—')], ['Status', data?.status ?? '—']];
  return (
    <>
      <PageHead section="System" title="Settings" description="Runtime and governance information for this simulated deployment."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-grid-main">
        <Panel title="Runtime" subtitle="Public health endpoint" icon={Database}>
          <div className="ax-table-wrap"><table className="ax-table"><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className="num">{v}</td></tr>)}</tbody></table></div>
        </Panel>
        <Panel title="Governance" icon={ShieldCheck}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoNote><LockKeyhole size={14} /> Synthetic data only. No donor or patient identifiers are stored.</InfoNote>
            <InfoNote><Database size={14} /> Role-based access, purpose limitation and append-only auditing are enforced.</InfoNote>
            <InfoNote tone="ok"><ShieldCheck size={14} /> Clinical decisions remain with qualified humans. This platform is decision support only.</InfoNote>
          </div>
        </Panel>
      </div>
    </>
  );
}

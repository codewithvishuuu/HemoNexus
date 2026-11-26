'use client';
import { Database, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { PageHeader, Panel } from '@/components/ui';

export default function Settings() {
  const { data } = useApi<any>('/api/v1/health');
  const rows: [string, string][] = [
    ['Service', data?.service ?? '—'], ['Data mode', data?.dataMode ?? '—'],
    ['Deterministic seed', String(data?.seed ?? '—')], ['Institutions', String(data?.institutions ?? '—')],
    ['Status', data?.status ?? '—'],
  ];
  return (
    <>
      <PageHeader eyebrow="Administration" title="Settings & platform state" description="Runtime and governance information for this simulated deployment." />
      <div className="grid g2">
        <Panel title="Runtime" hint="Public health endpoint">
          <div className="table-wrap"><table><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className="num">{v}</td></tr>)}</tbody></table></div>
        </Panel>
        <Panel title="Governance">
          <div className="stack" style={{ gap: 10 }}>
            <div className="notice"><LockKeyhole size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Synthetic data only. No donor or patient identifiers are stored.</div>
            <div className="notice"><Database size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Role-based access, purpose limitation and append-only auditing are enforced.</div>
            <div className="ok-note"><ShieldCheck size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Clinical decisions remain with qualified humans. This platform is decision support only.</div>
          </div>
        </Panel>
      </div>
    </>
  );
}

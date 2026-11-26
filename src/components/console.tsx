'use client';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function PageHead({ section, title, description, actions, meta }: {
  section?: string; title: string; description?: string; actions?: React.ReactNode; meta?: React.ReactNode;
}) {
  return (
    <div className="ax-page-head">
      <div className="ax-page-head-main">
        {section && <div className="eyebrow">{section}</div>}
        <h1>{title}</h1>
        {description && <p className="sub">{description}</p>}
        {meta && <div className="ax-page-meta">{meta}</div>}
      </div>
      {actions && <div className="ax-page-actions">{actions}</div>}
    </div>
  );
}

export function Metric({ label, value, unit, note, icon: Icon, tone = '' }: {
  label: string; value: React.ReactNode; unit?: string; note?: string; icon?: LucideIcon; tone?: string;
}) {
  return (
    <div className={`ax-metric ${tone}`}>
      <div className="ax-metric-top"><span>{label}</span>{Icon && <Icon size={16} strokeWidth={1.8} />}</div>
      <div className="ax-metric-value">{value}{unit && <small>{unit}</small>}</div>
      {note && <div className="ax-metric-note">{note}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, icon: Icon, action, children, className = '', flush = false }: {
  title?: string; subtitle?: string; icon?: LucideIcon; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean;
}) {
  return (
    <section className={`ax-panel ${className}`}>
      {title && <div className="ax-panel-head">
        <div className="ax-panel-heading">{Icon && <span className="ax-panel-icon"><Icon size={16} /></span>}<div><h3>{title}</h3>{subtitle && <span>{subtitle}</span>}</div></div>
        {action}
      </div>}
      <div className={flush ? 'ax-panel-flush' : 'ax-panel-body'}>{children}</div>
    </section>
  );
}

export function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="ax-filter-row">{children}</div>;
}

export function RiskPill({ band }: { band: string }) {
  return <span className={`badge ${band}`}>{band.replace(/_/g, ' ')}</span>;
}

export function EmptyBlock({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return <div className="ax-empty"><strong>{title}</strong>{message && <p>{message}</p>}{action}</div>;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return <div className="ax-skeleton-stack">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height: 42 }} />)}</div>;
}

export function InfoNote({ tone = 'notice', children }: { tone?: 'notice' | 'critical' | 'ok'; children: React.ReactNode }) {
  return <div className={`ax-note ${tone}`}>{children}</div>;
}

export function ActivityRow({ title, detail, meta, tone = 'neutral' }: { title: string; detail?: string; meta: string; tone?: string }) {
  return <div className="ax-activity-row"><span className={`ax-activity-dot ${tone}`} /><div><strong>{title}</strong>{detail && <span>{detail}</span>}</div><time className="mono">{meta}</time></div>;
}

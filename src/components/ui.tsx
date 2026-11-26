import React from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 style={{ marginTop: eyebrow ? 6 : 0 }}>{title}</h1>
        {description && <p className="sub">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Panel({ title, hint, action, children, bodyClass = '' }: { title?: string; hint?: string; action?: React.ReactNode; children: React.ReactNode; bodyClass?: string }) {
  return (
    <section className="panel">
      {title && <div className="panel-head"><div><h3>{title}</h3>{hint && <div className="hint">{hint}</div>}</div>{action}</div>}
      <div className={`panel-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, unit, foot, tone = '' }: { label: string; value: React.ReactNode; unit?: string; foot?: string; tone?: string }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}{unit && <small>{unit}</small>}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  );
}

export function StatusBadge({ band }: { band: string }) {
  const label = band.replace(/_/g, ' ');
  return <span className={`badge ${band}`}>{label}</span>;
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return <div className="empty"><strong>{title}</strong>{message && <span>{message}</span>}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="error-state">{message}</div>;
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return <div className="stack">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton skeleton-block" />)}</div>;
}

export function FactorBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const tone = pct >= 60 ? '' : pct >= 30 ? 'mid' : 'low';
  return (
    <div className="factor-row">
      <div className="factor-top"><span>{label.replace(/_/g, ' ')}</span><span className="num">{pct}%</span></div>
      <div className="bar-track"><div className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function BandLegend() {
  return (
    <div className="chart-legend">
      {['CRITICAL', 'HIGH', 'MODERATE', 'STABLE'].map((b) => <span key={b}><i style={{ background: `var(--${b.toLowerCase()})` }} />{b}</span>)}
    </div>
  );
}

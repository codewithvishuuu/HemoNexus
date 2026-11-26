'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  ['/dashboard', 'Command center'], ['/institutions', 'Institutions'], ['/map', 'Regional map'],
  ['/inventory', 'Inventory'], ['/forecasts', 'Forecasting'], ['/simulation', 'Simulation'],
  ['/approvals', 'Approvals'], ['/audit', 'Audit history'], ['/assistant', 'AI assistant'], ['/settings', 'Settings'],
];

export function DataModeBanner() {
  return <span className="badge sim" title="All institutions and stock in this build are synthetic">SIMULATED DATA</span>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me').then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => {});
  }, []);
  async function logout() {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <div className="shield">H</div>
          <div><div className="brand-name">HemoNexus</div><div className="brand-sub">Blood intelligence</div></div>
        </Link>
        <div className="nav-label">Workspace</div>
        <nav className="nav">
          {links.map(([href, label]) => (
            <Link key={href} href={href} style={pathname === href ? { background: 'var(--navy-3)', color: '#fff' } : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="nav-label">Account</div>
        <div style={{ padding: '0 10px', fontSize: 12, color: 'var(--muted)' }}>
          {user ? <>{user.name}<br /><span className="mono">{user.role}</span></> : 'Not signed in'}
        </div>
        {user && <button className="btn ghost" style={{ margin: '12px 10px', width: 'calc(100% - 20px)' }} onClick={logout}>Sign out</button>}
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Predictive Emergency Blood Shortage Network</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><DataModeBanner /><span className="mono muted" style={{ fontSize: 11 }}>seed 42 · v1.0</span></div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

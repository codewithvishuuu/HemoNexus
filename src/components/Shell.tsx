'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import {
  LayoutDashboard, Building2, Map as MapIcon, Package, LineChart, FlaskConical,
  ClipboardCheck, ScrollText, MessageSquareText, Settings, LogOut, ChevronRight,
} from 'lucide-react';
import Logo from './Logo';

const groups = [
  { label: 'Overview', items: [
    ['/dashboard', 'Command center', LayoutDashboard],
    ['/institutions', 'Institutions', Building2],
    ['/map', 'Regional map', MapIcon],
  ] },
  { label: 'Operations', items: [
    ['/inventory', 'Inventory', Package],
    ['/forecasts', 'Forecasting', LineChart],
    ['/simulation', 'Simulation', FlaskConical],
    ['/approvals', 'Approvals', ClipboardCheck],
  ] },
  { label: 'Intelligence', items: [
    ['/assistant', 'AI assistant', MessageSquareText],
    ['/audit', 'Audit history', ScrollText],
    ['/settings', 'Settings', Settings],
  ] },
] as Array<{ label: string; items: Array<[string, string, ComponentType<{ size?: number; strokeWidth?: number }>]> }>;

export function DataModeBadge({ compact = false }: { compact?: boolean }) {
  return <span className="badge sim" title="All institutions, units and events are synthetic">{compact ? 'SIMULATED' : 'SIMULATED DATA'}</span>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => { fetch('/api/v1/auth/me').then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => {}); }, []);
  async function logout() { await fetch('/api/v1/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }
  const current = groups.flatMap((g) => g.items).find(([href]) => href === pathname)?.[1] ?? 'HemoNexus';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><Logo variant="dark-bg" height={30} className="brand-wordmark" /></Link>
        {groups.map((group) => (
          <div key={group.label}>
            <div className="nav-caption">{group.label}</div>
            <nav className="nav-list">
              {group.items.map(([href, label, Icon]) => (
                <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
                  <Icon strokeWidth={1.8} /><span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <div className="sidebar-foot">
          <div className="who">{user?.name ?? 'Not signed in'}</div>
          <div className="role">{user?.role ?? '—'}</div>
          {user && <button className="btn ghost" style={{ marginTop: 10, width: '100%', justifyContent: 'flex-start' }} onClick={logout}><LogOut size={15} /> Sign out</button>}
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="crumb"><span>HemoNexus</span><ChevronRight size={13} /><strong>{current}</strong></div>
          <div className="topbar-right">
            <DataModeBadge />
            <span className="mono small muted">seed 42 · v1.0</span>
            <div className="avatar" title={user?.name ?? ''}>{(user?.name ?? 'HN').slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}

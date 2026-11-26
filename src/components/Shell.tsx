'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  LayoutDashboard, Building2, Map as MapIcon, Package, LineChart, FlaskConical,
  ClipboardCheck, ScrollText, MessageSquareText, Settings, LogOut, ChevronRight,
  Bell, Search, Menu, X, ShieldAlert, ArrowRight, ChevronDown,
} from 'lucide-react';
import Logo from './Logo';
import { useApi } from '@/lib/useApi';

const groups: Array<{ label: string; items: Array<[string, string, ComponentType<{ size?: number; strokeWidth?: number }>]> }> = [
  { label: 'Overview', items: [['/dashboard', 'Dashboard', LayoutDashboard]] },
  { label: 'Network', items: [['/institutions', 'Institutions', Building2], ['/map', 'Regional Map', MapIcon], ['/inventory', 'Inventory', Package]] },
  { label: 'Intelligence', items: [['/forecasts', 'Forecasts', LineChart], ['/simulation', 'Simulation', FlaskConical], ['/assistant', 'Assistant', MessageSquareText]] },
  { label: 'Operations', items: [['/approvals', 'Approvals', ClipboardCheck], ['/audit', 'Audit', ScrollText]] },
  { label: 'System', items: [['/settings', 'Settings', Settings]] },
];

export function DataModeBadge({ compact = false }: { compact?: boolean }) {
  return <span className="badge sim" title="All institutions, units and events are synthetic">{compact ? 'SIMULATED' : 'SIMULATED DATA'}</span>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: scores } = useApi<any>('/api/v1/scores');
  const { data: transfers } = useApi<any>('/api/v1/transfers');

  useEffect(() => { fetch('/api/v1/auth/me').then((r) => r.json()).then((d) => setUser(d.user ?? null)).catch(() => {}); }, []);
  async function logout() { await fetch('/api/v1/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); }

  const allLinks = useMemo(() => groups.flatMap((g) => g.items), []);
  const matches = query.trim() ? allLinks.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase())) : [];
  const current = allLinks.find(([href]) => href === pathname)?.[1] ?? 'HemoNexus';
  const critical = (scores?.scores ?? []).filter((s: any) => s.band === 'CRITICAL').length;
  const pending = (transfers?.requests ?? []).filter((r: any) => r.state !== 'APPROVED').length;

  return (
    <div className="ax-shell">
      <aside className={`ax-sidebar ${mobileOpen ? 'open' : ''}`}>
        <Link href="/dashboard" className="ax-brand" onClick={() => setMobileOpen(false)}><Logo variant="dark-bg" height={30} className="ax-logo" /></Link>
        <div className="ax-sidebar-scroll">
          {groups.map((group) => (
            <div key={group.label} className="ax-nav-group">
              <div className="ax-nav-caption">{group.label}</div>
              {group.items.map(([href, label, Icon]) => (
                <Link key={href} href={href} className={`ax-nav-item ${pathname === href ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{pathname === href && <span className="ax-nav-mark" />}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="ax-sidebar-foot">
          <div className="ax-safety"><ShieldAlert size={14} /> Decision support · human approvals</div>
          <button className="ax-signout" onClick={logout}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      {mobileOpen && <button className="ax-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <div className="ax-main">
        <header className="ax-topbar">
          <button className="ax-mobile-toggle" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
          <div className="ax-crumb"><span>Workspace</span><ChevronRight size={13} /><strong>{current}</strong></div>
          <div className="ax-search">
            <Search size={15} />
            <input aria-label="Search pages" placeholder="Search pages…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { router.push(matches[0][0]); setQuery(''); } }} />
            {query && <div className="ax-search-results">{matches.length ? matches.map(([href, label]) => <Link key={href} href={href} onClick={() => setQuery('')}>{label}<ArrowRight size={13} /></Link>) : <span className="muted">No matching page</span>}</div>}
          </div>
          <div className="ax-top-actions">
            <DataModeBadge compact />
            <span className="ax-seed mono">seed 42</span>
            <div className="ax-menu-wrap">
              <button className="ax-icon-btn" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}>
                <Bell size={17} />{(critical + pending) > 0 && <span className="ax-count">{critical + pending}</span>}
              </button>
              {notificationsOpen && <div className="ax-popover ax-notifications">
                <div className="ax-popover-head">Notifications</div>
                <Link href="/dashboard" onClick={() => setNotificationsOpen(false)}><span className="ax-notif-dot critical" /><div><strong>{critical} critical shortage signals</strong><small>Review explainable risk factors</small></div></Link>
                <Link href="/approvals" onClick={() => setNotificationsOpen(false)}><span className="ax-notif-dot amber" /><div><strong>{pending} pending transfer approvals</strong><small>Human verification required</small></div></Link>
              </div>}
            </div>
            <div className="ax-menu-wrap">
              <button className="ax-profile" aria-label="Account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}>
                <span className="ax-avatar">{(user?.name ?? 'HN').slice(0, 2).toUpperCase()}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="ax-popover ax-profile-menu">
                <div className="ax-popover-head"><strong>{user?.name ?? 'Not signed in'}</strong><small className="mono">{user?.role ?? '—'}</small></div>
                <Link href="/settings" onClick={() => setProfileOpen(false)}><Settings size={14} /> Settings</Link>
                <button onClick={logout}><LogOut size={14} /> Sign out</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="ax-content">{children}</main>
      </div>
    </div>
  );
}

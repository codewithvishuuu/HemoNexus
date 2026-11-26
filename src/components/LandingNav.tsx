'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import Logo from './Logo';

const links = [
  ['#product', 'Product'],
  ['#how', 'How it works'],
  ['#network', 'Network'],
  ['#about', 'About'],
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <Link href="/" className="lp-brand" aria-label="HemoNexus home"><Logo variant="light-bg" height={32} className="lp-logo" /></Link>
        <nav className="lp-nav-links" aria-label="Main navigation">
          {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="lp-nav-actions">
          <span className="badge sim">SIMULATED DATA</span>
          <Link className="btn secondary" href="/login">Sign in</Link>
          <Link className="btn" href="/dashboard">Dashboard <ArrowUpRight size={14} /></Link>
        </div>
        <button className="lp-menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && <nav className="lp-mobile-menu" aria-label="Mobile navigation">
        {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
        <Link href="/dashboard" onClick={() => setOpen(false)}>Access dashboard</Link>
      </nav>}
    </header>
  );
}

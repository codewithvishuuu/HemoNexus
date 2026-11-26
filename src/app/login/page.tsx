'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import Logo from '@/components/Logo';

const accounts = [
  ['coordinator@simulated.local', 'Regional Coordinator'],
  ['hospital@simulated.local', 'Hospital Manager'],
  ['bank@simulated.local', 'Blood Bank Manager'],
  ['clinical@simulated.local', 'Clinical Reviewer'],
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(accounts[0][0]);
  const [password, setPassword] = useState('HemoNexus!2026');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const res = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setError(data.error?.message ?? 'Sign in failed'); return; }
    router.push('/dashboard'); router.refresh();
  }
  return (
    <div className="login-split">
      <div style={{ background: 'var(--navy)', padding: '48px clamp(28px,5vw,80px)', color: '#CFD8E7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Logo variant="dark-bg" height={38} className="brand-wordmark" />
        <div style={{ maxWidth: 560 }}>
          <div className="eyebrow" style={{ color: '#F0A3B1' }}>Blood intelligence network</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(34px,3.4vw,52px)', lineHeight: 1.12, marginTop: 14 }}>The warning comes before the emergency.</h1>
          <p style={{ marginTop: 20, color: '#AEBBD0', fontSize: 15, lineHeight: 1.75 }}>Sign in to review shortage risk, verified inventory and coordinated transfer requests across the simulated network.</p>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: '#93A2BA' }}>
          <span>Decision support only</span><span>·</span><span>Synthetic demonstration data</span><span>·</span><span>Human approvals required</span>
        </div>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="eyebrow">Institutional access</div>
          <h2 style={{ fontSize: 28, marginTop: 8 }}>Sign in</h2>
          <p className="sub" style={{ marginTop: 6 }}>Demo identities are clearly labelled simulated.</p>
          <form onSubmit={submit} style={{ marginTop: 26 }}>
            <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
            <div className="field"><label>Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
            {error && <div className="error-state" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn" style={{ width: '100%' }} disabled={busy}><LockKeyhole size={15} /> {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={15} /></button>
          </form>
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <div className="eyebrow" style={{ color: 'var(--muted)' }}>Quick demo accounts</div>
            {accounts.map(([a, label]) => <button key={a} className="btn secondary" style={{ width: '100%', marginTop: 8, justifyContent: 'space-between' }} onClick={() => { setEmail(a); setPassword('HemoNexus!2026'); }}><span>{label}</span><span className="mono small muted">{a.split('@')[0]}</span></button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

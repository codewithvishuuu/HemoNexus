'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const accounts = [
  ['coordinator@simulated.local', 'HemoNexus!2026', 'Regional Coordinator'],
  ['hospital@simulated.local', 'HemoNexus!2026', 'Hospital Manager'],
  ['bank@simulated.local', 'HemoNexus!2026', 'Blood Bank Manager'],
  ['clinical@simulated.local', 'HemoNexus!2026', 'Clinical Reviewer'],
];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(accounts[0][0]);
  const [password, setPassword] = useState(accounts[0][1]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const res = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error?.message ?? 'Sign in failed'); return; }
    router.push('/dashboard'); router.refresh();
  }
  return (
    <div style={{ minHeight: '100vh', paddingTop: 40 }}>
      <div className="auth-box">
        <div className="brand" style={{ paddingBottom: 24 }}><div className="shield">H</div><div><div className="brand-name">HemoNexus</div><div className="brand-sub">Institutional sign in</div></div></div>
        <div className="card">
          <h2>Sign in to the network</h2>
          <p className="sub" style={{ marginBottom: 18 }}>Demo identities are clearly labelled simulated. No real institutional credentials are used.</p>
          <form onSubmit={submit}>
            <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
            <div className="field"><label>Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
            {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 8 }}>QUICK DEMO ACCOUNTS</div>
            {accounts.map(([a, , label]) => <button key={a} className="btn ghost" style={{ width: '100%', marginBottom: 6, textAlign: 'left' }} onClick={() => { setEmail(a); setPassword('HemoNexus!2026'); }}>{label} — {a}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

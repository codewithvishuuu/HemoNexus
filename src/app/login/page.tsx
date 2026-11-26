'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Activity, GitBranch } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'Sign in failed'); return; }
      router.push('/dashboard'); router.refresh();
    } catch {
      setError('Unable to reach the sign-in service. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="ax-login">
      <div className="ax-login-brand">
        <div className="ax-login-net" aria-hidden="true">
          <svg viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice">
            <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#C62845" stopOpacity=".55" /><stop offset="1" stopColor="#C62845" stopOpacity=".06" /></linearGradient></defs>
            <g stroke="url(#lg)" strokeWidth="1.4" fill="none">
              <path d="M90 120 L250 210 L410 130 L520 300 L360 400 L210 500 L90 380 Z" />
              <path d="M250 210 L360 400 L520 300 M90 120 L210 500 M410 130 L360 400" strokeDasharray="6 8" />
            </g>
            {[[90,120],[250,210],[410,130],[520,300],[360,400],[210,500],[90,380]].map(([x,y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 7 : 4} fill={i === 4 ? '#C62845' : '#4B5E80'} />)}
          </svg>
        </div>
        <div className="ax-login-brand-inner">
          <Logo variant="dark-bg" height={38} className="ax-login-logo" />
          <div className="ax-login-message">
            <div className="eyebrow" style={{ color: '#F0A3B1' }}>Predictive blood shortage network</div>
            <h1>Welcome back<br />to HemoNexus.</h1>
            <p>Access your network, monitor blood availability and coordinate smarter emergency responses.</p>
            <div className="ax-login-points">
              <span><ShieldCheck size={15} /> Explainable risk signals</span>
              <span><Activity size={15} /> Verified inventory visibility</span>
              <span><GitBranch size={15} /> Human-approved coordination</span>
            </div>
          </div>
          <div className="ax-login-foot">Decision support only · Synthetic demonstration data · No clinical validation</div>
        </div>
      </div>

      <div className="ax-login-form-side">
        <div className="ax-login-card">
          <div className="eyebrow">Institutional access</div>
          <h2>Welcome back to HemoNexus</h2>
          <p className="sub">Sign in to continue to the network command center.</p>
          <form onSubmit={submit} className="ax-login-form" noValidate>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required aria-describedby={error ? 'login-error' : undefined} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="ax-password">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            {error && <div id="login-error" className="error-state" role="alert">{error}</div>}
            <button className="btn ax-login-submit" type="submit" disabled={busy}>
              {busy ? <><span className="ax-spinner" /> Signing in…</> : <><LockKeyhole size={15} /> Sign in <ArrowRight size={15} /></>}
            </button>
          </form>
          <div className="ax-demo-accounts">
            <div className="eyebrow" style={{ color: 'var(--muted)' }}>Demo identities</div>
            {accounts.map(([a, label]) => <button key={a} className="ax-demo-account" onClick={() => { setEmail(a); setPassword('HemoNexus!2026'); setError(''); }}><span>{label}</span><span className="mono small muted">{a.split('@')[0]}</span></button>)}
            <p className="small muted" style={{ marginTop: 10 }}>These are simulated accounts for the hackathon demonstration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

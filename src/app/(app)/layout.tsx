'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ready'>('checking');

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.replace('/login'); return; }
        setState('ready');
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (state === 'checking') {
    return <div className="ax-guard"><div className="skeleton" style={{ width: 220, height: 18 }} /><div className="skeleton" style={{ width: '70%', height: 90, marginTop: 18 }} /><div className="skeleton" style={{ width: '100%', height: 180, marginTop: 14 }} /></div>;
  }
  return <Shell>{children}</Shell>;
}

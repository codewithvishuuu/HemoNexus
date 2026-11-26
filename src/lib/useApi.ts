'use client';
import { useEffect, useState } from 'react';

export function useApi<T = any>(url: string | null, intervalMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!url) return;
    let active = true;
    const load = () => fetch(url).then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).error?.message ?? `HTTP ${r.status}`);
      return r.json();
    }).then((d) => { if (active) { setData(d); setError(null); } }).catch((e) => { if (active) setError(String(e.message)); }).finally(() => { if (active) setLoading(false); });
    load();
    const timer = intervalMs ? setInterval(load, intervalMs) : null;
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [url, intervalMs]);
  return { data, error, loading };
}

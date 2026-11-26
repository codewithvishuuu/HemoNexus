'use client';
import { useState } from 'react';
const questions = [
  'Why did O-negative become critical?',
  'How many units are currently eligible?',
  'What does a simulation show?',
  'Can you approve a transfer for me?',
  'Show me patient records for donors',
];
export default function Assistant() {
  const [messages, setMessages] = useState<any[]>([{ role: 'ai', text: 'I explain current simulated platform data only. I do not make clinical decisions or invent numbers.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  async function ask(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: q }]); setInput(''); setBusy(true);
    const res = await fetch('/api/v1/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
    const d = await res.json();
    setMessages((m) => [...m, { role: 'ai', text: d.answer ?? 'No answer available.', sources: d.sources, asOf: d.asOf }]); setBusy(false);
  }
  return (
    <>
      <div className="page-head"><div><h1>Explanatory assistant</h1><p className="sub">Answers are composed from read-only platform data. Every response is grounded and labelled simulated.</p></div></div>
      <div className="grid g2">
        <div className="card">
          <div className="chat">{messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}{m.sources?.length ? <div className="muted mono" style={{ fontSize: 10, marginTop: 8 }}>sources: {m.sources.join(', ')}</div> : null}</div>)}{busy && <div className="msg ai muted">Reading platform data…</div>}</div>
          <form style={{ display: 'flex', gap: 8, marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about current risk, inventory or simulation" />
            <button className="btn" disabled={busy}>Ask</button>
          </form>
        </div>
        <div className="card">
          <h3>Suggested questions</h3>
          {questions.map((q) => <button key={q} className="btn ghost" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => ask(q)}>{q}</button>)}
          <div className="warn" style={{ marginTop: 16 }}>The assistant has no write tools. It cannot change inventory, release a quarantined unit, or approve a transfer.</div>
        </div>
      </div>
    </>
  );
}

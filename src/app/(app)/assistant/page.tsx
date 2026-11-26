'use client';
import { useState } from 'react';
import { MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { PageHead, Panel, InfoNote } from '@/components/console';

const questions = ['Why did O-negative become critical?', 'How many units are currently eligible?', 'What does a simulation show?', 'Can you approve a transfer for me?', 'Show me patient records'];
export default function Assistant() {
  const [messages, setMessages] = useState<any[]>([{ role: 'ai', text: 'I explain current platform data only. I do not make clinical decisions, change inventory, or invent numbers.', sources: [] }]);
  const [input, setInput] = useState(''), [busy, setBusy] = useState(false);
  async function ask(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: q }]); setInput(''); setBusy(true);
    const res = await fetch('/api/v1/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) });
    const d = await res.json();
    setMessages((m) => [...m, { role: 'ai', text: d.answer ?? 'No answer available.', sources: d.sources ?? [] }]); setBusy(false);
  }
  return (
    <>
      <PageHead section="Intelligence" title="Assistant" description="Answers are composed from read-only platform data with cited sources. Every response reflects the simulated data mode."
        meta={<span className="badge sim">SIMULATED DATA</span>} />
      <div className="ax-grid-main">
        <Panel title="Conversation" subtitle="Grounded in platform APIs" icon={MessageSquareText}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
            {messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%', background: m.role === 'user' ? 'var(--navy)' : 'var(--surface-alt)', color: m.role === 'user' ? '#fff' : 'var(--body)', border: m.role === 'user' ? 'none' : '1px solid var(--line)', borderRadius: 10, padding: '11px 14px', fontSize: 13, whiteSpace: 'pre-wrap' }}>
              {m.text}{m.sources?.length ? <div className="mono small muted" style={{ marginTop: 8 }}>sources: {m.sources.join(', ')}</div> : null}
            </div>)}
            {busy && <div className="skeleton" style={{ width: 180 }} />}
          </div>
          <form style={{ display: 'flex', gap: 8, marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); ask(input); }}><input style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about risk, inventory or simulation" /><button className="btn" disabled={busy}><Send size={14} /> Ask</button></form>
        </Panel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Panel title="Suggested questions" icon={MessageSquareText}>
            {questions.map((q) => <button key={q} className="btn secondary" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => ask(q)}>{q}</button>)}
          </Panel>
          <Panel title="Safety boundary" icon={ShieldCheck}><InfoNote tone="notice">The assistant has no write tools. It cannot release inventory, approve transfers, or provide clinical advice.</InfoNote></Panel>
        </div>
      </div>
    </>
  );
}

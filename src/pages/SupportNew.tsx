import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AttachPhotos from '../components/AttachPhotos';
import { CATEGORIES } from '../support';
import { uploadSupportPhoto } from '../upload';
import { TicketCategory } from '../types';

export default function SupportNew() {
  const nav = useNavigate();
  const [category, setCategory] = useState<TicketCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ok = !!category && subject.trim().length >= 5 && message.trim().length >= 10;
  const hint = CATEGORIES.find((c) => c.key === category)?.hint;

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!ok) return;
    setBusy(true); setError('');
    try {
      const t = await api.createTicket({ category: category as TicketCategory, subject: subject.trim(), message: message.trim(), priority: urgent ? 'HIGH' : 'NORMAL', orderRef: orderRef.trim() || undefined, attachments: photos });
      nav(`/dashboard/support/tickets/${t.id}`, { replace: true });
    } catch (ex) { setError((ex as Error).message); setBusy(false); }
  }

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Tell us what happened. The more detail you give, the faster we can help. You can reply and add more on the ticket afterwards.</p></div>
      <form className="card form-narrow" onSubmit={submit}>
        <label className="field"><span>What is this about?</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} required>
            <option value="">Choose a topic…</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {hint && <small className="muted">{hint}</small>}
        </label>
        <label className="field"><span>Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="A short summary, e.g. “Withdrawal pending for 3 days”" required /></label>
        {(category === 'ORDER' || category === 'PAYMENT') && <label className="field"><span>Order number (optional)</span><input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} maxLength={30} placeholder="e.g. #8F0D12" /></label>}
        <label className="field"><span>Describe the problem</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={6} placeholder="What happened, when, and what you expected. Include amounts, dates or reference numbers." required /><small className="muted">{message.length}/4000</small></label>
        <div className="field"><span>Photos (optional)</span><AttachPhotos value={photos} onChange={setPhotos} upload={uploadSupportPhoto} disabled={busy} /><small className="muted">A screenshot or a photo of the product or receipt helps us solve it faster.</small></div>
        <label className="check"><input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> This is urgent (money is stuck or I cannot use my account)</label>
        {error && <div className="alert">{error}</div>}
        <div className="actions end">
          <Link className="btn ghost btn-cancel" to="/dashboard/support/tickets">Cancel</Link>
          <button className="btn" disabled={!ok || busy}>{busy ? 'Sending…' : 'Send'}</button>
        </div>
      </form>
    </div>
  );
}

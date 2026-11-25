import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import AttachPhotos from '../components/AttachPhotos';
import Thread from '../components/Thread';
import { date } from '../format';
import { categoryLabel, STATUS_BADGE, STATUS_LABEL } from '../support';
import { Ticket } from '../types';
import { uploadSupportPhoto } from '../upload';

export default function SupportTicket() {
  const { id = '' } = useParams();
  const [t, setT] = useState<Ticket | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => { api.ticket(id).then(setT).catch((e: Error) => setError(e.message)); }, [id]);
  // New replies from the support team appear without a refresh.
  useEffect(() => { const i = setInterval(() => api.ticket(id).then(setT).catch(() => {}), 20_000); return () => clearInterval(i); }, [id]);

  const act = async (fn: () => Promise<Ticket>) => { setBusy(true); setError(''); try { setT(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const send = (e: FormEvent) => { e.preventDefault(); if (!text.trim() && !photos.length) return; void act(async () => { const r = await api.replyTicket(id, text.trim(), photos); setText(''); setPhotos([]); return r; }); };

  if (error && !t) return <div className="content"><div className="alert">{error}</div><Link to="/dashboard/support/tickets">Back to my tickets</Link></div>;
  if (!t) return <div className="content"><p className="muted">Loading…</p></div>;
  const closed = t.status === 'CLOSED';
  const solved = t.status === 'RESOLVED';

  return (
    <div className="content">
      <Link className="back-link" to="/dashboard/support/tickets">← My tickets</Link>
      <section className="card ticket-head">
        <div className="ticket-top"><h2>{t.subject}</h2><span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span></div>
        <small className="muted">{t.number} · {categoryLabel(t.category)}{t.orderRef ? ` · Order ${t.orderRef}` : ''} · opened {date(t.createdAt)}{t.assignedName ? ` · handled by ${t.assignedName}` : ''}</small>
        {t.needsYourReply && <div className="notice warn">The support team is waiting for your reply.</div>}
        {solved && <div className="notice ok">Marked as solved. If it is not, just reply below and we will pick it up again.</div>}
      </section>

      <section className="card">
        <Thread messages={t.messages} you="USER" />
        {!closed ? (
          <form className="composer" onSubmit={send}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} placeholder={solved ? 'Not solved? Tell us what is still wrong…' : 'Write a reply…'} aria-label="Your reply" />
            <AttachPhotos value={photos} onChange={setPhotos} upload={uploadSupportPhoto} disabled={busy} />
            <div className="actions end">
              {!solved && <button type="button" className="btn ghost" disabled={busy} onClick={() => void act(() => api.closeTicket(id))}>Close ticket</button>}
              <button className="btn" disabled={busy || (!text.trim() && !photos.length)}>{busy ? 'Sending…' : 'Send reply'}</button>
            </div>
          </form>
        ) : (
          <div className="closed-bar"><span className="muted">This ticket is closed.</span>{t.canReopen && <button className="btn ghost small" disabled={busy} onClick={() => void act(() => api.reopenTicket(id))}>Reopen</button>}</div>
        )}
        {error && <div className="alert">{error}</div>}
      </section>

      {(solved || closed) && t.canRate && (
        <section className="card rate">
          <h3>How was the help?</h3>
          <div className="stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>)}
          </div>
          <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder="Anything to add? (optional)" aria-label="Comment" />
          <button className="btn small" disabled={!stars || busy} onClick={() => void act(() => api.rateTicket(id, stars, comment.trim() || undefined))}>Send feedback</button>
        </section>
      )}
      {t.rating && <p className="muted">You rated this {'★'.repeat(t.rating.stars)}{'☆'.repeat(5 - t.rating.stars)}. Thank you!</p>}
    </div>
  );
}

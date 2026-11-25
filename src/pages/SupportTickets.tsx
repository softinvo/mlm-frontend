import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { date } from '../format';
import { categoryLabel, STATUS_BADGE, STATUS_LABEL } from '../support';
import { TicketPage } from '../types';

const VIEWS = [{ key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'closed', label: 'Solved' }] as const;
const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : date(iso); };

export default function SupportTickets() {
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.find((v) => v.key === params.get('view'))?.key ?? 'all') as 'all' | 'open' | 'closed';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [data, setData] = useState<TicketPage | null>(null);
  const [error, setError] = useState('');
  const set = (patch: Record<string, string | undefined>) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k)); if (!('page' in patch)) n.delete('page'); return n; }, { replace: true });

  useEffect(() => {
    let stale = false; setError('');
    api.tickets(view, page).then((d) => { if (!stale) setData(d); }).catch((e: Error) => { if (!stale) setError(e.message); });
    return () => { stale = true; };
  }, [view, page]);

  return (
    <div className="content">
      <div className="page-head row-between">
        <p className="muted">Ask the support team about an order, a payment, a withdrawal or anything else. We reply here, and you can follow the whole conversation.</p>
        <Link className="btn add-btn" to="/dashboard/support/new">+ New ticket</Link>
      </div>

      {data && data.needsReply > 0 && <div className="notice warn">The support team is waiting for your reply on {data.needsReply} ticket{data.needsReply > 1 ? 's' : ''}.</div>}

      <div className="tabs" role="tablist">
        {VIEWS.map((v) => <button key={v.key} role="tab" aria-selected={view === v.key} className={view === v.key ? 'on' : ''} onClick={() => set({ view: v.key === 'all' ? undefined : v.key })}>{v.label}</button>)}
      </div>

      {error ? <div className="alert">{error}</div> : !data ? <p className="muted">Loading…</p> : data.items.length === 0 ? (
        <div className="card empty">
          <strong>{view === 'all' ? 'No tickets yet' : `No ${view === 'open' ? 'open' : 'solved'} tickets`}</strong>
          <p className="muted">{view === 'all' ? 'Need help? Open a ticket and the support team will get back to you.' : 'Nothing here.'}</p>
          {view === 'all' && <Link className="btn small" to="/dashboard/support/new">Open a ticket</Link>}
        </div>
      ) : (
        <ul className="ticket-list">
          {data.items.map((t) => (
            <li key={t.id}>
              <Link to={`/dashboard/support/tickets/${t.id}`} className={`card ticket-row ${t.needsYourReply ? 'hot' : ''}`}>
                <div className="ticket-top">
                  <strong>{t.subject}</strong>
                  <span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </div>
                {t.last && <p className="ticket-preview muted">{t.last.from === 'ADMIN' ? 'Support: ' : 'You: '}{t.last.text}</p>}
                <small className="muted">{t.number} · {categoryLabel(t.category)} · updated {ago(t.updatedAt)}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.total > 0 && (
        <div className="pager nobox">
          <span className="muted">Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}</span>
          <div>
            <button className="btn ghost small" disabled={page <= 1} onClick={() => set({ page: page - 1 === 1 ? undefined : String(page - 1) })}>Previous</button>
            <span className="muted pg">{data.page} / {data.pages}</span>
            <button className="btn ghost small" disabled={page >= data.pages} onClick={() => set({ page: String(page + 1) })}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

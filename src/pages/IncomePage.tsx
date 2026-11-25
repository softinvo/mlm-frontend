import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { date, inr } from '../format';
import { CommissionStatus, IncomePage as Data } from '../types';

const LIMIT = 10;
const STATUS_LABEL: Record<CommissionStatus, string> = { PENDING: 'Pending', APPROVED: 'Paid to wallet', REVERSED: 'Reversed' };
const BADGE: Record<CommissionStatus, string> = { PENDING: 'pending', APPROVED: 'approved', REVERSED: 'reversed' };

const COPY = {
  direct: { subtitle: 'Commission on orders placed by members you sponsored directly (level 1).', empty: 'Your direct members have no delivered orders yet.' },
  level: { subtitle: 'Commission on orders placed by members deeper in your team (level 2 and below).', empty: 'Members below your directs have no delivered orders yet.' },
  repurchase: { subtitle: 'Royalty on product purchases your team makes after joining, across up to 10 levels. No minimum purchase is needed to receive it.', empty: 'Your team has no delivered product orders yet.' },
};

export default function IncomePage({ kind }: { kind: 'direct' | 'level' | 'repurchase' }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sp = params.get('status');
  const status: CommissionStatus | undefined = sp === 'PENDING' || sp === 'APPROVED' || sp === 'REVERSED' ? sp : undefined;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const update = (patch: Record<string, string | undefined>) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
      if (!('page' in patch)) n.delete('page');
      return n;
    }, { replace: true });

  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    api.commissions({ type: kind, status, page, limit: LIMIT })
      .then((d) => { if (!stale) setData(d); })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [kind, page, status]);

  const s = data?.summary;
  return (
    <div className="content">
      <div className="page-head"><p className="muted">{COPY[kind].subtitle}</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Paid to wallet</span><strong>{s ? inr(s.approvedPaise) : '—'}</strong><small className="muted">Released after the cooling-off period</small></div>
        <div className="card stat"><span className="muted">Pending release</span><strong>{s ? inr(s.pendingPaise) : '—'}</strong><small className="muted">Held while orders are in cooling-off</small></div>
        <div className="card stat"><span className="muted">Reversed (refunds)</span><strong>{s ? inr(s.reversedPaise) : '—'}</strong><small className="muted">Taken back when orders are returned</small></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <select className="sort" aria-label="Filter by status" value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined })}>
            <option value="">All status</option>
            {(Object.keys(STATUS_LABEL) as CommissionStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
          {status && <button className="link-btn" onClick={() => update({ status: undefined })}>Clear filter</button>}
        </div>

        {error ? <div className="alert">{error}</div> : !data ? <p className="muted pad">Loading…</p> : data.items.length === 0 ? (
          <div className="empty">
            <strong>{status ? 'No matching entries' : 'No income yet'}</strong>
            <p className="muted">{status ? 'Try a different status.' : COPY[kind].empty}</p>
          </div>
        ) : (
          <div className={`table-wrap ${loading ? 'busy' : ''}`}>
            <table className="team">
              <thead>
                <tr><th>Date</th><th>Order</th><th>From</th>{kind !== 'direct' && <th>Level</th>}<th className="num">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{date(r.createdAt)}</td>
                    <td data-label="Order" className="mono">{r.orderNo}</td>
                    <td data-label="From"><div><strong className="sp">{r.fromName ?? '—'}</strong><small className="muted block">{r.fromCode}</small></div></td>
                    {kind !== 'direct' && <td data-label="Level">Level {r.level}</td>}
                    <td data-label="Amount" className="num">
                      <strong>{inr(r.amountPaise)}</strong>
                      {r.reversedPaise > 0 && <small className="muted block"><s>{inr(r.originalPaise)}</s> refund −{inr(r.reversedPaise)}</small>}
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      {r.releaseAt && <small className="muted block">Releases {date(r.releaseAt)}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="pager">
            <span className="muted">Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}</span>
            <div>
              <button className="btn ghost small" disabled={page <= 1 || loading} onClick={() => update({ page: page - 1 === 1 ? undefined : String(page - 1) })}>Previous</button>
              <span className="muted pg">{data.page} / {data.pages}</span>
              <button className="btn ghost small" disabled={page >= data.pages || loading} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </div>
          </div>
        )}
      </div>

      <p className="disclaimer muted">Commission is earned only on delivered retail orders, held through a cooling-off period, and reduced if an order is refunded. Earnings are not guaranteed.</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';
import { date, inr } from '../format';
import { useUrlFilters } from '../hooks';
import { FundPage, FundStatus } from '../types';
import { MODE_LABEL } from './FundRequestPage';

const LIMIT = 10;
const LABEL: Record<FundStatus, string> = { PENDING: 'Pending review', APPROVED: 'Credited', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };
const BADGE: Record<FundStatus, string> = { PENDING: 'pending', APPROVED: 'delivered', REJECTED: 'reversed', CANCELLED: 'inactive' };

export default function FundHistory() {
  const { params, update, page, setPage } = useUrlFilters();
  const sp = params.get('status') as FundStatus | null;
  const status = sp && sp in LABEL ? sp : undefined;
  const [data, setData] = useState<FundPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    api.funds({ status, page, limit: LIMIT })
      .then((d) => { if (!stale) setData(d); })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [status, page]);

  const s = data?.summary;
  return (
    <div className="content">
      <div className="page-head"><p className="muted">Every top-up you’ve requested and what happened to it.</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Total added</span><strong>{s ? inr(s.creditedPaise) : '—'}</strong><small className="muted">Credited to your shopping wallet</small></div>
        <div className="card stat"><span className="muted">Waiting for confirmation</span><strong>{s ? inr(s.pendingPaise) : '—'}</strong><small className="muted">{s ? `${s.pendingCount} request${s.pendingCount === 1 ? '' : 's'}` : ' '}</small></div>
        <div className="card stat"><span className="muted">All requests</span><strong>{data ? data.total : '—'}</strong><small className="muted">{status ? `Filtered: ${LABEL[status]}` : 'Every status'}</small></div>
      </div>

      <div className="card">
        <div className="toolbar">
          <select className="sort" aria-label="Filter by status" value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined })}>
            <option value="">All status</option>
            {(Object.keys(LABEL) as FundStatus[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
          </select>
          {status && <button className="link-btn" onClick={() => update({ status: undefined })}>Clear filter</button>}
        </div>

        {error ? <div className="alert">{error}</div> : !data ? <p className="muted pad">Loading…</p> : data.items.length === 0 ? (
          <div className="empty"><strong>{status ? 'No matching requests' : 'No top-ups yet'}</strong><p className="muted">{status ? 'Try a different status.' : 'Your top-up requests will appear here.'}</p></div>
        ) : (
          <div className={`table-wrap ${loading ? 'busy' : ''}`}>
            <table className="team">
              <thead><tr><th>Submitted</th><th className="num">Amount</th><th>Mode</th><th>Reference</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Submitted"><div>{date(r.createdAt)}<small className="muted block">Paid {date(r.paidOn)}</small></div></td>
                    <td data-label="Amount" className="num">
                      <strong>{inr(r.status === 'APPROVED' && r.approvedPaise ? r.approvedPaise : r.amountPaise)}</strong>
                      {r.status === 'APPROVED' && r.approvedPaise !== null && r.approvedPaise < r.amountPaise && <small className="muted block">of {inr(r.amountPaise)} requested</small>}
                    </td>
                    <td data-label="Mode">{MODE_LABEL[r.mode]}</td>
                    <td data-label="Reference" className="mono">{r.reference}</td>
                    <td data-label="Status"><span className={`badge ${BADGE[r.status]}`}>{LABEL[r.status]}</span>{r.reviewNote && <small className="muted block">{r.reviewNote}</small>}</td>
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
              <button className="btn ghost small" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="muted pg">{data.page} / {data.pages}</span>
              <button className="btn ghost small" disabled={page >= data.pages || loading} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

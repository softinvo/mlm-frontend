import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import { date, inr } from '../format';
import { useUrlFilters } from '../hooks';
import { WithdrawalPage, WithdrawalRow, WithdrawalStatus } from '../types';

const LIMIT = 10;
const LABEL: Record<WithdrawalStatus, string> = { REQUESTED: 'Pending review', APPROVED: 'Approved', PAID: 'Paid', REJECTED: 'Rejected', CANCELLED: 'Cancelled' };
const BADGE: Record<WithdrawalStatus, string> = { REQUESTED: 'pending', APPROVED: '', PAID: 'delivered', REJECTED: 'reversed', CANCELLED: 'inactive' };

export default function WithdrawalHistory() {
  const { params, update, page, setPage } = useUrlFilters();
  const sp = params.get('status') as WithdrawalStatus | null;
  const status = sp && sp in LABEL ? sp : undefined;
  const [data, setData] = useState<WithdrawalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<WithdrawalRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    api.withdrawals({ status, page, limit: LIMIT })
      .then((d) => { if (!stale) setData(d); })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [status, page, tick]);

  async function cancel() {
    if (!cancelling) return;
    setBusy(true); setError('');
    try { await api.cancelWithdrawal(cancelling.id); setCancelling(null); setTick(tick + 1); }
    catch (e) { setError((e as Error).message); setCancelling(null); } finally { setBusy(false); }
  }

  return (
    <div className="content">
      <div className="page-head row-between">
        <p className="muted">Every withdrawal you’ve requested and where it stands.</p>
        <select className="sort" aria-label="Filter by status" value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined })}>
          <option value="">All status</option>
          {(Object.keys(LABEL) as WithdrawalStatus[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
        </select>
      </div>

      <div className="card">
        {error && <div className="alert">{error}</div>}
        {!data ? (!error && <p className="muted pad">Loading…</p>) : data.items.length === 0 ? (
          <div className="empty"><strong>{status ? 'No matching withdrawals' : 'No withdrawals yet'}</strong><p className="muted">{status ? 'Try a different status.' : 'Your withdrawal requests will appear here.'}</p></div>
        ) : (
          <div className={`table-wrap ${loading ? 'busy' : ''}`}>
            <table className="team">
              <thead><tr><th>Requested</th><th className="num">Amount</th><th className="num">Deductions</th><th className="num">You receive</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.items.map((w) => (
                  <tr key={w.id}>
                    <td data-label="Requested"><div>{date(w.requestedAt)}<small className="muted block">{w.account}</small></div></td>
                    <td data-label="Amount" className="num">{inr(w.amountPaise)}</td>
                    <td data-label="Deductions" className="num">{w.feePaise + w.tdsPaise > 0 ? `−${inr(w.feePaise + w.tdsPaise)}` : '—'}</td>
                    <td data-label="You receive" className="num"><strong>{inr(w.netPaise)}</strong></td>
                    <td data-label="Status">
                      <span className={`badge ${BADGE[w.status]}`}>{LABEL[w.status]}</span>
                      {w.payoutRef && <small className="muted block">Ref {w.payoutRef}</small>}
                      {w.rejectReason && <small className="muted block">{w.rejectReason}</small>}
                    </td>
                    <td data-label="" className="act">{w.status === 'REQUESTED' && <button className="link-btn danger-link" onClick={() => setCancelling(w)}>Cancel</button>}</td>
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

      {cancelling && (
        <Modal title="Cancel this withdrawal?" onClose={() => setCancelling(null)}>
          <p>{inr(cancelling.amountPaise)} will go back to your income wallet straight away.</p>
          <div className="actions end">
            <button className="btn ghost" onClick={() => setCancelling(null)} disabled={busy}>Keep it</button>
            <button className="btn danger" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel withdrawal'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

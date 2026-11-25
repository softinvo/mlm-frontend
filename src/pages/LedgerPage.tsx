import { useEffect, useState } from 'react';
import { api } from '../api';
import { date, inr } from '../format';
import { useUrlFilters } from '../hooks';
import { EntriesPage, EntryType, WalletSummary } from '../types';

const LIMIT = 10;
export const ENTRY_LABEL: Record<EntryType, string> = {
  COMMISSION_CREDIT: 'Commission', COMMISSION_REVERSAL: 'Commission reversed', FRANCHISE_CREDIT: 'Franchise share', CASHBACK_CREDIT: 'Cashback', CASHBACK_REVERSAL: 'Cashback reversed',
  WITHDRAWAL_DEBIT: 'Withdrawal request', WITHDRAWAL_REFUND: 'Withdrawal returned', ADJUSTMENT: 'Adjustment',
  TRANSFER_OUT: 'Moved to shopping wallet', TRANSFER_IN: 'Added from income wallet', SHOPPING_SPEND: 'Purchase', SHOPPING_REFUND: 'Purchase refund', P2P_OUT: 'Sent to member', P2P_IN: 'Received from member', DEPOSIT: 'Top-up',
};
const TYPES: Record<'income' | 'shopping', EntryType[]> = {
  income: ['COMMISSION_CREDIT', 'COMMISSION_REVERSAL', 'FRANCHISE_CREDIT', 'CASHBACK_CREDIT', 'CASHBACK_REVERSAL', 'WITHDRAWAL_DEBIT', 'WITHDRAWAL_REFUND', 'TRANSFER_OUT', 'ADJUSTMENT'],
  shopping: ['DEPOSIT', 'TRANSFER_IN', 'P2P_IN', 'P2P_OUT', 'SHOPPING_SPEND', 'SHOPPING_REFUND'],
};
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** Passbook (income wallet) and Shopping Wallet History share this ledger view. */
export default function LedgerPage({ wallet }: { wallet: 'income' | 'shopping' }) {
  const { params, update, page, setPage } = useUrlFilters();
  const tp = params.get('type') as EntryType | null;
  const type = tp && TYPES[wallet].includes(tp) ? tp : undefined;
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [data, setData] = useState<EntriesPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.wallet().then(setSummary).catch(() => {}); }, [wallet]);
  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    api.walletEntries({ wallet, type, page, limit: LIMIT })
      .then((d) => { if (!stale) setData(d); })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [wallet, type, page]);

  const income = wallet === 'income';
  return (
    <div className="content">
      <div className="page-head">
        <p className="muted">{income ? 'Every credit and debit on your income wallet, with the balance after each one.' : 'Money you moved into your shopping wallet and what you spent it on.'}</p>
      </div>

      <div className="grid stats three">
        {income ? (
          <>
            <div className="card stat"><span className="muted">Available balance</span><strong>{summary ? inr(summary.incomeBalancePaise) : '—'}</strong><small className="muted">Withdrawable</small></div>
            <div className="card stat"><span className="muted">In process</span><strong>{summary ? inr(summary.inProcessPaise) : '—'}</strong><small className="muted">Withdrawal requests being reviewed</small></div>
            <div className="card stat"><span className="muted">Total withdrawn</span><strong>{summary ? inr(summary.withdrawnPaise) : '—'}</strong><small className="muted">Paid to your bank</small></div>
          </>
        ) : (
          <>
            <div className="card stat"><span className="muted">Shopping balance</span><strong>{summary ? inr(summary.shoppingBalancePaise) : '—'}</strong><small className="muted">Spend on products only</small></div>
            <div className="card stat span-2-col"><span className="muted">How it works</span><small>Move earnings here from the Wallet Transfer page, then pay for products with it at checkout. Shopping balance can’t be withdrawn or moved back.</small></div>
          </>
        )}
      </div>

      <div className="card">
        <div className="toolbar">
          <select className="sort" aria-label="Filter by type" value={type ?? ''} onChange={(e) => update({ type: e.target.value || undefined })}>
            <option value="">All transactions</option>
            {TYPES[wallet].map((t) => <option key={t} value={t}>{ENTRY_LABEL[t]}</option>)}
          </select>
          {type && <button className="link-btn" onClick={() => update({ type: undefined })}>Clear filter</button>}
        </div>

        {error ? <div className="alert">{error}</div> : !data ? <p className="muted pad">Loading…</p> : data.items.length === 0 ? (
          <div className="empty"><strong>{type ? 'No matching transactions' : 'No transactions yet'}</strong><p className="muted">{type ? 'Try a different type.' : 'Entries appear here as money moves in or out.'}</p></div>
        ) : (
          <div className={`table-wrap ${loading ? 'busy' : ''}`}>
            <table className="team">
              <thead><tr><th>Date</th><th>Description</th><th className="num">Credit</th><th className="num">Debit</th><th className="num">Balance</th></tr></thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Date"><div>{date(e.createdAt)}<small className="muted block">{time(e.createdAt)}</small></div></td>
                    <td data-label="Description"><div className="desc"><strong>{ENTRY_LABEL[e.type]}</strong>{e.note && e.note !== ENTRY_LABEL[e.type] && e.note !== "Withdrawal request" && <small className="muted block">{e.note}</small>}</div></td>
                    <td data-label="Credit" className="num pos">{e.amountPaise > 0 ? `+${inr(e.amountPaise)}` : '—'}</td>
                    <td data-label="Debit" className="num neg">{e.amountPaise < 0 ? `−${inr(-e.amountPaise)}` : '—'}</td>
                    <td data-label="Balance" className="num">{e.balanceAfterPaise === null ? '—' : inr(e.balanceAfterPaise)}</td>
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

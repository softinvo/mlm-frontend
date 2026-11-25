import { useEffect, useState } from 'react';
import { api } from '../api';
import CashbackSummary from '../components/CashbackSummary';
import { date, inr } from '../format';
import { CashbackData, CashbackItem } from '../types';
import IncomeNotActive from './IncomeNotActive';

const LABEL: Record<CashbackItem['status'], string> = { ACTIVE: 'Paying daily', COMPLETED: 'Completed', CANCELLED: 'Cancelled (refund)' };
const BADGE: Record<CashbackItem['status'], string> = { ACTIVE: 'pending', COMPLETED: 'approved', CANCELLED: 'reversed' };
type Tab = 'ALL' | CashbackItem['status'];
const TABS: { key: Tab; label: string }[] = [{ key: 'ALL', label: 'All' }, { key: 'ACTIVE', label: 'Paying now' }, { key: 'COMPLETED', label: 'Completed' }, { key: 'CANCELLED', label: 'Cancelled' }];

/** Cashback on the member's own delivered purchases: a small amount each day for a limited number of days. */
export default function CashbackPage() {
  const [data, setData] = useState<CashbackData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('ALL');
  useEffect(() => { let stale = false; api.cashback().then((d) => { if (!stale) setData(d); }).catch((e: Error) => { if (!stale) setError(e.message); }); return () => { stale = true; }; }, []);

  if (error) return <div className="content"><div className="alert">{error}</div></div>;
  if (!data) return <div className="content"><p className="muted">Loading…</p></div>;
  if (!data.config.enabled && data.items.length === 0) return <IncomeNotActive kind="cashback" />;

  const { config: c } = data;
  const count = (k: Tab) => (k === 'ALL' ? data.items.length : data.items.filter((i) => i.status === k).length);
  const rows = tab === 'ALL' ? data.items : data.items.filter((i) => i.status === tab);
  const example = (c.percentPerDay * 1000) / 100;

  return (
    <div className="content">
      <CashbackSummary data={data} />

      <section className="cb-steps" aria-label="How cashback works">
        <div><span className="cb-step-n">1</span><strong>Your order is delivered</strong><small className="muted">Product orders qualify{c.includePackages ? '' : '; joining kits and packages do not'}.</small></div>
        <div><span className="cb-step-n">2</span><strong>Credited every day</strong><small className="muted">{c.percentPerDay}% of the product value, starting the day after delivery.</small></div>
        <div><span className="cb-step-n">3</span><strong>Up to {c.days} days</strong><small className="muted">At most {c.maxTotalPercent}% back. ₹1,000 of products pays ₹{Math.round(example * 100) / 100} a day.</small></div>
      </section>

      <div className="card">
        <div className="cb-list-head">
          <h3>Your purchases</h3>
          <div className="tabs-pills" role="tablist" aria-label="Filter purchases">
            {TABS.filter((t) => t.key === 'ALL' || count(t.key) > 0).map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>{t.label} <small>{count(t.key)}</small></button>
            ))}
          </div>
        </div>
        {data.items.length === 0 ? (
          <div className="empty"><strong>No cashback yet</strong><p className="muted">Cashback starts the day after an eligible product order is delivered{c.includePackages ? '' : ' (joining kits and packages are not included)'}.</p></div>
        ) : rows.length === 0 ? (
          <p className="muted pad">Nothing here.</p>
        ) : (
          <ul className="cb-items">
            {rows.map((i) => (
              <li key={i.id} className={`cb-item ${i.status.toLowerCase()}`}>
                <div className="cb-item-main">
                  <strong>Order #{i.orderId.slice(-6).toUpperCase()}</strong>
                  <small className="muted">Delivered {date(i.startedAt)}</small>
                </div>
                <div className="cb-item-fig"><span className="muted">Eligible value</span><strong>{inr(i.baseVolumePaise)}</strong></div>
                <div className="cb-item-fig"><span className="muted">Per day</span><strong>{inr(i.dailyPaise)}</strong></div>
                <div className="cb-item-progress">
                  <div className="cb-bar" role="progressbar" aria-valuemin={0} aria-valuemax={i.daysTotal} aria-valuenow={i.daysPaid}><span style={{ width: `${(i.daysPaid / i.daysTotal) * 100}%` }} /></div>
                  <small className="muted">Day {i.daysPaid} of {i.daysTotal}{i.nextCreditAt ? ` · next credit ${date(i.nextCreditAt)}` : ''}</small>
                </div>
                <div className="cb-item-fig end"><span className="muted">Earned</span><strong className="cb-earned">{inr(i.paidPaise)}</strong></div>
                <div className="cb-item-status"><span className={`badge ${BADGE[i.status]}`}>{LABEL[i.status]}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="disclaimer muted">Cashback is paid only on delivered product orders, for a limited time, and is taken back in proportion if an order is refunded. It goes to your income wallet, so the normal withdrawal rules apply. You do not need to buy again to keep cashback you have already earned.</p>
    </div>
  );
}

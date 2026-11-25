import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import DeliveryTracking, { DELIVERY_BADGE, DELIVERY_LABEL } from '../components/DeliveryTracking';
import { ItemList } from '../components/Thumb';
import { date, inr } from '../format';
import { Purchase, PurchaseFilter, PurchasePage, PurchaseType } from '../types';

const LIMIT = 6;
const TABS: { key: PurchaseFilter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'shipping', label: 'On the way' }, { key: 'delivered', label: 'Delivered' }, { key: 'awaiting', label: 'Awaiting payment' }, { key: 'refunded', label: 'Refunded' }, { key: 'cancelled', label: 'Cancelled' },
];
const TYPES: { key: PurchaseType; label: string }[] = [{ key: 'all', label: 'All items' }, { key: 'joining', label: 'Joining kits' }, { key: 'repurchase', label: 'Repurchase products' }];
const STATUS: Record<Purchase['status'], [string, string]> = {
  PLACED: ['Awaiting payment', 'pending'], PAID: ['Paid', 'approved'], DELIVERED: ['Delivered', 'delivered'], CANCELLED: ['Cancelled', 'cancelled'], REFUNDED: ['Refunded', 'refunded'], PARTIALLY_REFUNDED: ['Part refunded', 'refunded'],
};

function PurchaseCard({ p }: { p: Purchase }) {
  // One badge: the money state when something is wrong or unpaid, otherwise where the delivery is.
  const money = ['PLACED', 'CANCELLED', 'REFUNDED'].includes(p.status);
  const [label, badge] = money ? STATUS[p.status] : [DELIVERY_LABEL[p.shipment.status], DELIVERY_BADGE[p.shipment.status]];
  const kinds = new Set(p.items.map((i) => i.kind));
  return (
    <article className="card purchase">
      <header>
        <div><strong>Order {p.orderNo}</strong><small className="muted block">{date(p.placedAt)}{p.shop ? ` · ${p.shop.name}` : ''}</small></div>
        <div className="purchase-badges"><span className={`badge ${badge}`}>{label}</span>{p.status === 'PARTIALLY_REFUNDED' && <span className="badge refunded">Part refunded</span>}</div>
      </header>
      <ul className="purchase-lines">
        {p.items.map((i, n) => (
          <li key={n}>
            <ItemList items={[i]} size={52} />
            <div className="purchase-price"><strong>{inr(i.linePaise)}</strong>{i.quantity > 1 && <small className="muted">{i.quantity} × {inr(i.unitPricePaise)}</small>}</div>
          </li>
        ))}
      </ul>
      {p.status === 'PLACED' ? <div className="notice warn">Reserved. The shop ships it once payment is confirmed.</div> : p.status === 'CANCELLED' || p.status === 'REFUNDED' ? null : <DeliveryTracking d={p.shipment} />}
      <footer>
        <div className="purchase-meta">
          <span className="chip">{kinds.size > 1 ? 'Joining kit + products' : kinds.has('JOINING') ? 'Joining kit' : 'Repurchase'}</span>
          {p.paymentMethod && <small className="muted">Paid with {p.paymentMethod}</small>}
          {p.status === 'PLACED' && <small className="muted">Ask the shop to collect payment.</small>}
          {p.shipment.address && p.status !== 'CANCELLED' && <small className="muted">Deliver to {p.shipment.address.fullName}, {p.shipment.address.city} – {p.shipment.address.pincode}</small>}
        </div>
        <div className="purchase-total">
          {p.refundedPaise > 0 && <small className="muted">Refunded {inr(p.refundedPaise)}</small>}
          <small className="muted">Total</small><strong>{inr(p.totalPaise)}</strong>
        </div>
      </footer>
    </article>
  );
}

export default function PurchaseHistory() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = (TABS.find((t) => t.key === params.get('status'))?.key ?? 'all') as PurchaseFilter;
  const type = (TYPES.find((t) => t.key === params.get('type'))?.key ?? 'all') as PurchaseType;
  const [data, setData] = useState<PurchasePage | null>(null);
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
    api.purchases({ page, limit: LIMIT, status, type })
      .then((d) => { if (!stale) setData(d); })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [page, status, type]);

  const s = data?.summary;
  return (
    <div className="content">
      <div className="page-head row-between">
        <p className="muted">Everything you have bought: the products, what you paid, where, how, and where the delivery is.</p>
      </div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Total spent</span><strong>{s ? inr(s.spentPaise) : '…'}</strong><small className="muted">{s && s.refundedPaise > 0 ? `After ${inr(s.refundedPaise)} refunded` : 'On paid orders'}</small></div>
        <div className="card stat"><span className="muted">Orders</span><strong>{s ? s.orders : '…'}</strong><small className="muted">{s?.lastPurchaseAt ? `Last on ${date(s.lastPurchaseAt)}` : 'Paid orders'}</small></div>
        <div className="card stat"><span className="muted">Items bought</span><strong>{s ? s.units : '…'}</strong><small className="muted">Units across all orders</small></div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => <button key={t.key} role="tab" aria-selected={status === t.key} className={status === t.key ? 'on' : ''} onClick={() => update({ status: t.key === 'all' ? undefined : t.key })}>{t.label}</button>)}
        <select className="sort" aria-label="Filter by item type" value={type} onChange={(e) => update({ type: e.target.value === 'all' ? undefined : e.target.value })}>
          {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {error ? <div className="alert">{error}</div> : !data ? <p className="muted">Loading purchases…</p> : data.items.length === 0 ? (
        <div className="card empty">
          <strong>{status !== 'all' || type !== 'all' ? 'No matching purchases' : 'No purchases yet'}</strong>
          <p className="muted">{status !== 'all' || type !== 'all' ? 'Try a different filter.' : 'What you buy from a franchise will show up here.'}</p>
          {(status !== 'all' || type !== 'all') && <button className="btn ghost small" onClick={() => update({ status: undefined, type: undefined })}>Show all</button>}
        </div>
      ) : (
        <div className={`ship-list ${loading ? 'busy' : ''}`}>{data.items.map((p) => <PurchaseCard key={p.id} p={p} />)}</div>
      )}

      {data && data.total > 0 && (
        <div className="pager nobox">
          <span className="muted">Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}</span>
          <div>
            <button className="btn ghost small" disabled={page <= 1 || loading} onClick={() => update({ page: page - 1 === 1 ? undefined : String(page - 1) })}>Previous</button>
            <span className="muted pg">{data.page} / {data.pages}</span>
            <button className="btn ghost small" disabled={page >= data.pages || loading} onClick={() => update({ page: String(page + 1) })}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

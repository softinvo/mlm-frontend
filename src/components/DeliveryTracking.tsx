import { useState } from 'react';
import { date } from '../format';
import { ShipmentStatus } from '../types';

export const DELIVERY_LABEL: Record<ShipmentStatus, string> = {
  PENDING: 'Processing', PACKED: 'Packed', SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', RETURNED: 'Returned',
};
export const DELIVERY_BADGE: Record<ShipmentStatus, string> = { PENDING: 'pending', PACKED: 'pending', SHIPPED: '', OUT_FOR_DELIVERY: '', DELIVERED: 'delivered', CANCELLED: 'cancelled', RETURNED: 'refunded' };
const STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: 'PENDING', label: 'Placed' }, { status: 'PACKED', label: 'Packed' }, { status: 'SHIPPED', label: 'Shipped' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' }, { status: 'DELIVERED', label: 'Delivered' },
];
const dateTime = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export interface Delivery {
  status: ShipmentStatus; courier: string | null; trackingId: string | null; expectedDelivery: string | null;
  events: { status: ShipmentStatus; at: string; note: string | null }[];
  address: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string } | null;
}

export function Stepper({ status }: { status: ShipmentStatus }) {
  if (status === 'CANCELLED' || status === 'RETURNED') return <div className="alert slim">This order was {status === 'CANCELLED' ? 'cancelled' : 'returned'}.</div>;
  const at = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="stepper" aria-label={`Delivery progress: ${DELIVERY_LABEL[status]}`}>
      {STEPS.map((s, i) => (
        <li key={s.status} className={i < at ? 'done' : i === at ? 'now' : ''} aria-current={i === at ? 'step' : undefined}>
          <i aria-hidden="true">{i <= at ? '✓' : ''}</i><span>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Where the delivery is: progress, courier, expected date, and a full tracking log with the delivery address. */
export default function DeliveryTracking({ d }: { d: Delivery }) {
  const [open, setOpen] = useState(false);
  const a = d.address;
  const delivered = d.events.find((e) => e.status === 'DELIVERED');
  return (
    <div className="delivery">
      <Stepper status={d.status} />
      <p className="muted delivery-line">
        {d.courier ? <>{d.courier} · <span className="mono">{d.trackingId}</span></> : d.status === 'DELIVERED' ? '' : 'Courier not assigned yet'}
        {d.status === 'DELIVERED' && delivered && <span className="ok-text"> Delivered on {date(delivered.at)}</span>}
        {d.expectedDelivery && d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && <> · Expected by <strong>{date(d.expectedDelivery)}</strong></>}
      </p>
      <button type="button" className="link-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide tracking details' : 'View tracking details'}</button>
      {open && (
        <div className="track">
          <ul className="timeline">
            {[...d.events].reverse().map((e, i) => (
              <li key={i} className={i === 0 ? 'latest' : ''}><strong>{DELIVERY_LABEL[e.status]}</strong><span className="muted">{e.note ? `${e.note} · ` : ''}{dateTime(e.at)}</span></li>
            ))}
          </ul>
          {a && (
            <div className="deliver-to">
              <small className="muted">Delivery address</small>
              <p>{a.fullName} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} – {a.pincode}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

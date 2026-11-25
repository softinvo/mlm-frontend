import { useState } from 'react';

/** A product picture, or its initials when there is none (or it fails to load). */
export default function Thumb({ url, name, size = 44 }: { url?: string; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const style = { width: size, height: size, fontSize: Math.max(11, size / 3) };
  return url && !broken
    ? <img className="thumb" src={url} alt={name} loading="lazy" style={style} onError={() => setBroken(true)} />
    : <span className="thumb thumb-empty" aria-hidden="true" style={style}>{initials}</span>;
}

/** The items of an order as small pictures with names, e.g. on a payment request or a shipment. */
export function ItemList({ items, size = 40 }: { items: { name: string; quantity: number; imageUrl?: string }[]; size?: number }) {
  return (
    <ul className="item-list">
      {items.map((i, n) => <li key={n}><Thumb url={i.imageUrl} name={i.name} size={size} /><span>{i.name}</span><strong>× {i.quantity}</strong></li>)}
    </ul>
  );
}

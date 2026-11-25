import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../api';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { INDIAN_STATES } from '../data';
import { AddressLabel, ShippingAddress as Address, ShippingAddressInput } from '../types';

const LABELS: Record<AddressLabel, string> = { HOME: 'Home', OFFICE: 'Office', OTHER: 'Other' };
const blank = (name = '', phone = ''): ShippingAddressInput => ({
  label: 'HOME', fullName: name, phone, line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false,
});

function AddressForm({ initial, isFirst, onSaved, onCancel, editing }: {
  initial: ShippingAddressInput; isFirst: boolean; editing?: Address; onSaved: (a: Address) => void; onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ShippingAddressInput>(k: K, v: ShippingAddressInput[K]) => setF({ ...f, [k]: v });
  const err = (k: string) => errors[k]?.[0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    try {
      onSaved(editing ? await api.updateAddress(editing.id, f) : await api.createAddress(f));
    } catch (ex) {
      if (ex instanceof ApiError && ex.details) setErrors(ex.details);
      setError((ex as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field">
          <span>Address type</span>
          <select value={f.label} onChange={(e) => set('label', e.target.value as AddressLabel)}>
            {Object.entries(LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <Field label="Recipient name" value={f.fullName} onChange={(e) => set('fullName', e.target.value)} error={err('fullName')} autoComplete="name" required />
        <Field label="Mobile number" inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} error={err('phone')} autoComplete="tel-national" required />
        <Field label="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} error={err('pincode')} autoComplete="postal-code" required />
        <div className="span-2"><Field label="House no., building, street" value={f.line1} onChange={(e) => set('line1', e.target.value)} error={err('line1')} autoComplete="address-line1" required /></div>
        <div className="span-2"><Field label="Area, landmark (optional)" value={f.line2} onChange={(e) => set('line2', e.target.value)} error={err('line2')} autoComplete="address-line2" /></div>
        <Field label="City" value={f.city} onChange={(e) => set('city', e.target.value)} error={err('city')} autoComplete="address-level2" required />
        <label className="field">
          <span>State</span>
          <select value={f.state} onChange={(e) => set('state', e.target.value)} aria-invalid={!!err('state')} autoComplete="address-level1">
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {err('state') && <small className="error">{err('state')}</small>}
        </label>
      </div>
      {!isFirst && !editing?.isDefault && (
        <label className="check"><input type="checkbox" checked={!!f.isDefault} onChange={(e) => set('isDefault', e.target.checked)} /> Make this my default address</label>
      )}
      {error && Object.keys(errors).length === 0 && <div className="alert">{error}</div>}
      <div className="actions end">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save address'}</button>
      </div>
    </form>
  );
}

export default function ShippingAddress() {
  const [items, setItems] = useState<Address[] | null>(null);
  const [max, setMax] = useState(10);
  const [error, setError] = useState('');
  const [form, setForm] = useState<null | 'new' | Address>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState('');
  const [me, setMe] = useState({ name: '', phone: '' });
  const [toast, setToast] = useState('');

  const load = () => api.addresses().then((d) => { setItems(d.items); setMax(d.max); }).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
    api.profile().then((p) => setMe({ name: p.name, phone: p.phone })).catch(() => {});
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); }, [toast]);

  async function act(id: string, fn: () => Promise<unknown>, done: string) {
    setBusyId(id); setError('');
    try { await fn(); await load(); setToast(done); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); }
  }

  const full = (items?.length ?? 0) >= max;

  return (
    <div className="content">
      <div className="page-head row-between">
        <p className="muted">Where your orders are delivered. Past orders keep the address they were shipped to.</p>
        <button className="btn add-btn" disabled={!items || full} onClick={() => setForm('new')} title={full ? `Limit of ${max} addresses reached` : undefined}>+ Add new address</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {toast && <div className="notice" role="status">✓ {toast}</div>}

      {!items ? (
        !error && <p className="muted">Loading addresses…</p>
      ) : items.length === 0 ? (
        <div className="card empty">
          <strong>No saved addresses</strong>
          <p className="muted">Add a delivery address to speed up checkout.</p>
          <button className="btn small add-btn" onClick={() => setForm('new')}>+ Add address</button>
        </div>
      ) : (
        <div className="addr-grid">
          {items.map((a) => (
            <article key={a.id} className={`card addr ${a.isDefault ? 'is-default' : ''}`}>
              <header>
                <span className="chip">{LABELS[a.label]}</span>
                {a.isDefault && <span className="badge delivered">Default</span>}
              </header>
              <strong className="addr-name">{a.fullName}</strong>
              <address>
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                {a.city}, {a.state} – {a.pincode}
              </address>
              <p className="muted">📞 {a.phone}</p>
              <footer>
                <button className="link-btn" onClick={() => setForm(a)} disabled={busyId === a.id}>Edit</button>
                <button className="link-btn danger-link" onClick={() => setDeleting(a)} disabled={busyId === a.id}>Delete</button>
                {!a.isDefault && (
                  <button className="link-btn push" disabled={busyId === a.id} onClick={() => act(a.id, () => api.setDefaultAddress(a.id), 'Default address updated')}>
                    {busyId === a.id ? 'Updating…' : 'Set as default'}
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
      {items && items.length > 0 && <p className="muted small-note">{items.length} of {max} addresses saved</p>}

      {form && (
        <Modal title={form === 'new' ? 'Add new address' : 'Edit address'} onClose={() => setForm(null)}>
          <AddressForm
            key={form === 'new' ? 'new' : form.id}
            editing={form === 'new' ? undefined : form}
            isFirst={(items?.length ?? 0) === 0}
            initial={form === 'new' ? blank(me.name, me.phone) : { ...form }}
            onCancel={() => setForm(null)}
            onSaved={async () => { const wasNew = form === 'new'; setForm(null); await load(); setToast(wasNew ? 'Address added' : 'Address updated'); }}
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete this address?" onClose={() => setDeleting(null)}>
          <p>{deleting.fullName}, {deleting.line1}, {deleting.city} – {deleting.pincode}</p>
          <p className="muted">Orders already placed will still show the address they were shipped to.</p>
          <div className="actions end">
            <button className="btn ghost" onClick={() => setDeleting(null)}>Keep it</button>
            <button className="btn danger" onClick={() => { const a = deleting; setDeleting(null); act(a.id, () => api.deleteAddress(a.id), 'Address deleted'); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

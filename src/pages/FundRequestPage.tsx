import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import AmountInput from '../components/AmountInput';
import Field from '../components/Field';
import { date, inr, toPaise } from '../format';
import { FundInfo, FundPage, PaymentMode } from '../types';

export const MODE_LABEL: Record<PaymentMode, string> = { UPI: 'UPI', IMPS: 'IMPS', NEFT: 'NEFT', RTGS: 'RTGS', CASH_DEPOSIT: 'Cash deposit at bank' };
const iso = (d: Date) => d.toISOString().slice(0, 10);

function CopyRow({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="copy-row">
      <div><small className="muted block">{label}</small><strong className="mono">{value}</strong></div>
      <button type="button" className="link-btn" onClick={() => navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); })}>{ok ? 'Copied ✓' : 'Copy'}</button>
    </div>
  );
}

export default function FundRequestPage() {
  const [params] = useSearchParams();
  const [info, setInfo] = useState<FundInfo | null>(null);
  const [open, setOpen] = useState<FundPage | null>(null);
  const [amount, setAmount] = useState(params.get('amount') ?? '');
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(iso(new Date()));
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => { api.fundInfo().then(setInfo).catch((e: Error) => setError(e.message)); }, []);
  useEffect(() => { api.funds({ status: 'PENDING', page: 1, limit: 10 }).then(setOpen).catch(() => {}); }, [tick]);

  if (!info) return <div className="content">{error ? <div className="alert">{error}</div> : <p className="muted">Loading…</p>}</div>;

  const { instructions: pay, limits } = info;
  const paise = toPaise(amount);
  const err = (k: string) => errors[k]?.[0];
  const minDate = iso(new Date(Date.now() - limits.maxAgeDays * 86_400_000));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({}); setDone('');
    try {
      await api.submitFund({ amountPaise: paise ?? 0, mode, reference: reference.trim(), paidOn, note: note.trim() || undefined });
      setDone('Request submitted. We’ll credit your shopping wallet once we confirm the payment.');
      setReference(''); setNote(''); setAmount(''); setTick((t) => t + 1);
    } catch (ex) {
      if (ex instanceof ApiError && ex.details) setErrors(ex.details);
      setError((ex as Error).message);
    } finally { setBusy(false); }
  }

  async function cancel(id: string) {
    setError('');
    try { await api.cancelFund(id); setTick((t) => t + 1); } catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Paid us by bank transfer or UPI? Tell us the payment details and we’ll add the money to your shopping wallet.</p></div>

      <div className="two-col">
        <section className="card">
          <h3>1. Pay to this account</h3>
          {!pay ? (
            <div className="notice warn">Payment details aren’t set up yet. Please contact support before sending any money.</div>
          ) : (
            <div className="copy-list">
              {pay.accountName && <CopyRow label="Account name" value={pay.accountName} />}
              {pay.accountNumber && <CopyRow label="Account number" value={pay.accountNumber} />}
              {pay.ifsc && <CopyRow label="IFSC" value={pay.ifsc} />}
              {pay.bank && <div className="copy-row"><div><small className="muted block">Bank</small><strong>{pay.bank}</strong></div></div>}
              {pay.upiId && <CopyRow label="UPI ID" value={pay.upiId} />}
            </div>
          )}
          <p className="muted small-note">Pay only to the account shown here, and keep your bank’s reference number (UTR) — you’ll need it in the next step. We never ask for payments to personal accounts.</p>
        </section>

        <section className="card">
          <h3>2. Tell us what you paid</h3>
          <form onSubmit={submit} noValidate>
            <AmountInput label="Amount paid" value={amount} onChange={setAmount} error={err('amountPaise')} hint={`Between ${inr(limits.minPaise)} and ${inr(limits.maxPaise)}`} />
            <label className="field">
              <span>Payment mode</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
                {info.modes.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
              </select>
            </label>
            <Field label="Bank reference / UTR number" value={reference} onChange={(e) => setReference(e.target.value.replace(/[^A-Za-z0-9\-/]/g, ''))} error={err('reference')} maxLength={30} autoComplete="off" />
            <Field label="Payment date" type="date" value={paidOn} min={minDate} max={iso(new Date())} onChange={(e) => setPaidOn(e.target.value)} error={err('paidOn')} />
            <Field label="Note (optional)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            {error && Object.keys(errors).length === 0 && <div className="alert">{error}</div>}
            {done && <div className="notice" role="status">✓ {done} <Link to="/dashboard/deposit/fund-history">View history</Link></div>}
            <button className="btn" disabled={busy || !paise || !reference || !pay}>{busy ? 'Submitting…' : 'Submit request'}</button>
          </form>
        </section>
      </div>

      <section className="card">
        <h3>Waiting for confirmation</h3>
        {!open ? <p className="muted">Loading…</p> : open.items.length === 0 ? <p className="muted">No requests waiting.</p> : (
          <ul className="list">
            {open.items.map((r) => (
              <li key={r.id}>
                <div><strong>{inr(r.amountPaise)}</strong> <span className="chip rank">{MODE_LABEL[r.mode]}</span><small className="muted block">Ref {r.reference} · paid {date(r.paidOn)}</small></div>
                <button className="link-btn danger-link" onClick={() => cancel(r.id)}>Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

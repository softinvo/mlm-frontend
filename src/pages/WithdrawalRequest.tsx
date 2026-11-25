import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import AmountInput from '../components/AmountInput';
import Field from '../components/Field';
import Modal from '../components/Modal';
import { inr, toPaise } from '../format';
import OtpBox from '../components/OtpBox';
import { WalletSummary } from '../types';

const blank = { accountHolder: '', accountNumber: '', confirmNumber: '', ifsc: '', pan: '' };

function PayoutForm({ onSaved, onCancel, rejectedNote }: { onSaved: (s: WalletSummary) => void; onCancel?: () => void; rejectedNote?: string | null }) {
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank, v: string) => setF({ ...f, [k]: v });
  const mismatch = f.confirmNumber !== '' && f.confirmNumber !== f.accountNumber;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.accountNumber !== f.confirmNumber) return;
    setBusy(true); setError(''); setErrors({});
    try {
      onSaved(await api.savePayoutAccount({ accountHolder: f.accountHolder, accountNumber: f.accountNumber, ifsc: f.ifsc, pan: f.pan }));
    } catch (ex) {
      if (ex instanceof ApiError && ex.details) setErrors(ex.details);
      setError((ex as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} noValidate>
      {rejectedNote && <div className="alert">Your last details were rejected: {rejectedNote}</div>}
      <div className="form-grid">
        <div className="span-2"><Field label="Name on bank account" value={f.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} error={errors.accountHolder?.[0]} autoComplete="off" /></div>
        <Field label="Account number" inputMode="numeric" value={f.accountNumber} onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, ''))} error={errors.accountNumber?.[0]} autoComplete="off" />
        <Field label="Confirm account number" inputMode="numeric" value={f.confirmNumber} onChange={(e) => set('confirmNumber', e.target.value.replace(/\D/g, ''))} error={mismatch ? 'Account numbers do not match' : undefined} autoComplete="off" />
        <Field label="IFSC code" value={f.ifsc} maxLength={11} onChange={(e) => set('ifsc', e.target.value.toUpperCase())} error={errors.ifsc?.[0]} autoComplete="off" />
        <Field label="PAN" value={f.pan} maxLength={10} onChange={(e) => set('pan', e.target.value.toUpperCase())} error={errors.pan?.[0]} autoComplete="off" />
      </div>
      {error && Object.keys(errors).length === 0 && <div className="alert">{error}</div>}
      <p className="muted small-note">Your account number is stored encrypted and only shown to the payments team when sending your payout.</p>
      <div className="actions">
        <button className="btn" disabled={busy || mismatch}>{busy ? 'Saving…' : 'Submit for verification'}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default function WithdrawalRequest() {
  const [s, setS] = useState<WalletSummary | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [code, setCode] = useState('');

  const load = () => api.wallet().then(setS).catch((e: Error) => setError(e.message));
  useEffect(() => { load(); }, []);

  if (!s) return <div className="content">{error ? <div className="alert">{error}</div> : <p className="muted">Loading…</p>}</div>;

  const { config, kyc } = s;
  const paise = toPaise(amount);
  const fee = paise ? Math.round((paise * config.feePercent) / 100) : 0;
  const tds = paise ? Math.round((paise * config.tdsPercent) / 100) : 0;
  const net = paise ? paise - fee - tds : 0;
  const verified = kyc.status === 'VERIFIED';
  let amountError = '';
  if (amount && !paise) amountError = 'Enter a valid amount';
  else if (paise && paise < config.minPaise) amountError = `Minimum withdrawal is ${inr(config.minPaise)}`;
  else if (paise && paise > s.incomeBalancePaise) amountError = 'More than your available balance';
  const canSubmit = verified && !!paise && !amountError;

  async function submit() {
    setBusy(true); setError(''); setDone('');
    try {
      await api.requestWithdrawal(paise!, code);
      setDone(`Withdrawal of ${inr(paise!)} requested. You’ll receive ${inr(net)} once it’s processed.`);
      setAmount(''); setCode(''); setConfirm(false); await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const showForm = kyc.status === 'NOT_SUBMITTED' || kyc.status === 'REJECTED' || editing;
  return (
    <div className="content">
      <div className="page-head"><p className="muted">Send your earnings to your bank account. Requests are reviewed by the payments team.</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Available to withdraw</span><strong>{inr(s.incomeBalancePaise)}</strong><small className="muted">Income wallet</small></div>
        <div className="card stat"><span className="muted">In process</span><strong>{inr(s.inProcessPaise)}</strong><small className="muted">Waiting for payout</small></div>
        <div className="card stat"><span className="muted">Total withdrawn</span><strong>{inr(s.withdrawnPaise)}</strong><small className="muted">Paid to your bank</small></div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="row-between"><h3>Payout account</h3>{kyc.status !== 'NOT_SUBMITTED' && <span className={`badge ${verified ? 'delivered' : kyc.status === 'PENDING' ? 'pending' : 'reversed'}`}>{verified ? 'Verified' : kyc.status === 'PENDING' ? 'Under review' : 'Rejected'}</span>}</div>
          {showForm ? (
            <PayoutForm rejectedNote={kyc.status === 'REJECTED' ? kyc.note ?? 'Please re-check and resubmit.' : null} onCancel={editing ? () => setEditing(false) : undefined} onSaved={(n) => { setS(n); setEditing(false); }} />
          ) : (
            <>
              <dl className="facts one">
                <div><dt>Account holder</dt><dd>{kyc.accountHolder}</dd></div>
                <div><dt>Account number</dt><dd className="mono">•••• •••• {kyc.accountLast4}</dd></div>
                <div><dt>IFSC</dt><dd className="mono">{kyc.ifsc}</dd></div>
                <div><dt>PAN</dt><dd className="mono">{kyc.panMasked}</dd></div>
              </dl>
              {kyc.status === 'PENDING' && <p className="muted small-note">We’re verifying these details. You can withdraw as soon as they’re approved.</p>}
              <button className="link-btn" onClick={() => setEditing(true)}>Change details</button>
              {verified && <p className="muted small-note">Changing details means they must be verified again before your next withdrawal.</p>}
            </>
          )}
        </section>

        <section className={`card ${verified ? '' : 'locked'}`}>
          <h3>Withdraw funds</h3>
          {!verified && <div className="notice warn">Verify your payout account to unlock withdrawals.</div>}
          <fieldset disabled={!verified} className="plain">
            <AmountInput label="Amount to withdraw" value={amount} onChange={(v) => { setAmount(v); setDone(''); }} error={amountError} max={s.incomeBalancePaise} hint={`Minimum ${inr(config.minPaise)}`} />
            <dl className="breakdown">
              <div><dt>Withdrawal amount</dt><dd>{paise ? inr(paise) : '—'}</dd></div>
              {config.feePercent > 0 && <div><dt>Processing fee ({config.feePercent}%)</dt><dd>−{inr(fee)}</dd></div>}
              {config.tdsPercent > 0 && <div><dt>TDS ({config.tdsPercent}%)</dt><dd>−{inr(tds)}</dd></div>}
              <div className="total"><dt>You receive</dt><dd>{paise ? inr(net) : '—'}</dd></div>
            </dl>
            {error && <div className="alert">{error}</div>}
            {done && <div className="notice" role="status">✓ {done} <Link to="/dashboard/wallet/withdrawal-history">View history</Link></div>}
            <button className="btn" disabled={!canSubmit} onClick={() => setConfirm(true)}>Request withdrawal</button>
          </fieldset>
        </section>
      </div>

      {confirm && paise && (
        <Modal title="Confirm withdrawal" onClose={() => setConfirm(false)}>
          <dl className="breakdown">
            <div><dt>Withdraw</dt><dd>{inr(paise)}</dd></div>
            {fee > 0 && <div><dt>Fee</dt><dd>−{inr(fee)}</dd></div>}
            {tds > 0 && <div><dt>TDS</dt><dd>−{inr(tds)}</dd></div>}
            <div className="total"><dt>You receive</dt><dd>{inr(net)}</dd></div>
            <div><dt>To account</dt><dd className="mono">{kyc.accountHolder} •••• {kyc.accountLast4}</dd></div>
          </dl>
          <p className="muted small-note">The amount leaves your wallet now. You can cancel while the request is still waiting for review.</p>
          <OtpBox purpose="confirm this withdrawal" send={(ch) => api.sendWithdrawalOtp(ch)} code={code} onCode={setCode} />
          {error && <div className="alert">{error}</div>}
          <div className="actions end">
            <button className="btn ghost" onClick={() => { setConfirm(false); setCode(''); setError(''); }} disabled={busy}>Back</button>
            <button className="btn" onClick={submit} disabled={busy || code.length !== 6}>{busy ? 'Requesting…' : 'Confirm'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

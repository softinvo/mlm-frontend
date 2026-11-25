import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AmountInput from '../components/AmountInput';
import Modal from '../components/Modal';
import { inr, toPaise } from '../format';
import { WalletSummary } from '../types';

export default function WalletTransfer() {
  const [s, setS] = useState<WalletSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = () => api.wallet().then(setS).catch((e: Error) => setError(e.message));
  useEffect(() => { load(); }, []);
  if (!s) return <div className="content">{error ? <div className="alert">{error}</div> : <p className="muted">Loading…</p>}</div>;

  const paise = toPaise(amount);
  let amountError = '';
  if (amount && !paise) amountError = 'Enter a valid amount';
  else if (paise && paise < 100) amountError = 'Minimum transfer is ₹1';
  else if (paise && paise > s.incomeBalancePaise) amountError = 'More than your income wallet balance';

  async function submit() {
    setBusy(true); setError(''); setDone('');
    try {
      await api.transfer(paise!);
      setDone(`${inr(paise!)} moved to your shopping wallet.`);
      setAmount(''); await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); setConfirm(false); }
  }

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Move earnings into your shopping wallet to pay for products.</p></div>

      <div className="flow">
        <div className="card stat"><span className="muted">Income wallet</span><strong>{inr(s.incomeBalancePaise)}</strong><small className="muted">Withdrawable · from</small></div>
        <span className="arrow" aria-hidden="true">→</span>
        <div className="card stat"><span className="muted">Shopping wallet</span><strong>{inr(s.shoppingBalancePaise)}</strong><small className="muted">Products only · to</small></div>
      </div>

      <section className="card narrow">
        <AmountInput label="Amount to move" value={amount} onChange={(v) => { setAmount(v); setDone(''); }} error={amountError} max={s.incomeBalancePaise} hint="Minimum ₹1" />
        <div className="notice warn">Transfers are one-way. Shopping wallet money can only be spent on products — it can’t be withdrawn or moved back.</div>
        {error && <div className="alert">{error}</div>}
        {done && <div className="notice" role="status">✓ {done} <Link to="/dashboard/wallet/shopping-history">View shopping wallet</Link></div>}
        <button className="btn" disabled={!paise || !!amountError} onClick={() => setConfirm(true)}>Transfer</button>
      </section>

      {confirm && paise && (
        <Modal title="Confirm transfer" onClose={() => setConfirm(false)}>
          <dl className="breakdown">
            <div><dt>Move</dt><dd>{inr(paise)}</dd></div>
            <div><dt>Income wallet after</dt><dd>{inr(s.incomeBalancePaise - paise)}</dd></div>
            <div><dt>Shopping wallet after</dt><dd>{inr(s.shoppingBalancePaise + paise)}</dd></div>
          </dl>
          <p className="muted small-note">This can’t be undone.</p>
          <div className="actions end">
            <button className="btn ghost" onClick={() => setConfirm(false)} disabled={busy}>Back</button>
            <button className="btn" onClick={submit} disabled={busy}>{busy ? 'Moving…' : 'Confirm transfer'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

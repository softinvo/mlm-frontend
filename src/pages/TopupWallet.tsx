import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AmountInput from '../components/AmountInput';
import Icon from '../components/Icon';
import { inr, toPaise } from '../format';
import { FundInfo, FundPage } from '../types';

const PRESETS = [500, 1000, 2000, 5000];

export default function TopupWallet() {
  const nav = useNavigate();
  const [info, setInfo] = useState<FundInfo | null>(null);
  const [funds, setFunds] = useState<FundPage | null>(null);
  const [amount, setAmount] = useState('1000');
  const [error, setError] = useState('');

  useEffect(() => {
    api.fundInfo().then(setInfo).catch((e: Error) => setError(e.message));
    api.funds({ page: 1, limit: 1 }).then(setFunds).catch(() => {});
  }, []);

  if (!info) return <div className="content">{error ? <div className="alert">{error}</div> : <p className="muted">Loading…</p>}</div>;

  const { limits } = info;
  const paise = toPaise(amount);
  let amountError = '';
  if (amount && !paise) amountError = 'Enter a valid amount';
  else if (paise && paise < limits.minPaise) amountError = `Minimum top-up is ${inr(limits.minPaise)}`;
  else if (paise && paise > limits.maxPaise) amountError = `Maximum per request is ${inr(limits.maxPaise)}`;

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Add money to your shopping wallet to pay for products.</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Shopping wallet</span><strong>{inr(info.shoppingBalancePaise)}</strong><small className="muted">Spend on products only</small></div>
        <div className="card stat"><span className="muted">Waiting for confirmation</span><strong>{funds ? inr(funds.summary.pendingPaise) : '—'}</strong><small className="muted">{funds ? `${funds.summary.pendingCount} request${funds.summary.pendingCount === 1 ? '' : 's'}` : ' '}</small></div>
        <div className="card stat"><span className="muted">Total added</span><strong>{funds ? inr(funds.summary.creditedPaise) : '—'}</strong><small className="muted"><Link to="/dashboard/deposit/fund-history">View history</Link></small></div>
      </div>

      <div className="two-col">
        <section className="card">
          <h3>How much do you want to add?</h3>
          <div className="chips-row" role="group" aria-label="Quick amounts">
            {PRESETS.map((r) => (
              <button key={r} type="button" className={`pill ${paise === r * 100 ? 'on' : ''}`} onClick={() => setAmount(String(r))}>{inr(r * 100).replace('.00', '')}</button>
            ))}
          </div>
          <AmountInput label="Amount" value={amount} onChange={setAmount} error={amountError} hint={`Between ${inr(limits.minPaise)} and ${inr(limits.maxPaise)}`} />
        </section>

        <section className="card method-card">
          <h3>Payment method</h3>

          <div className="methods" role="radiogroup" aria-label="Payment method">
            <label className="method off" aria-disabled="true">
              <input type="radio" name="m" disabled />
              <span className="method-icon" aria-hidden="true"><Icon name="card" size={20} /></span>
              <span className="method-body">
                <strong>UPI, cards &amp; net banking</strong>
                <small className="muted">Pay online and get the money instantly.</small>
              </span>
              <span className="tag">Coming soon</span>
            </label>

            <label className="method on">
              <input type="radio" name="m" checked readOnly />
              <span className="method-icon" aria-hidden="true"><Icon name="bank" size={20} /></span>
              <span className="method-body">
                <strong>Bank transfer or UPI to our account</strong>
                <small className="muted">Pay us directly, then tell us the payment reference.</small>
              </span>
              <span className="tag ok">Available</span>
            </label>
          </div>

          <ol className="steps" aria-label="How it works">
            <li><b>1</b><span><strong>Pay</strong> using the account details on the next screen.</span></li>
            <li><b>2</b><span><strong>Submit</strong> your bank reference (UTR) and the payment date.</span></li>
            <li><b>3</b><span><strong>We credit</strong> your wallet once we confirm the payment in our bank statement.</span></li>
          </ol>

          <div className="cta">
            <div className="cta-amount">
              <small className="muted">You’re adding</small>
              <strong>{paise && !amountError ? inr(paise) : '—'}</strong>
            </div>
            <button className="btn" disabled={!paise || !!amountError} onClick={() => nav(`/dashboard/deposit/fund-request?amount=${paise! / 100}`)}>
              Continue to payment details →
            </button>
          </div>

          <p className="method-note"><Icon name="shield" size={16} /> Top-ups go to your shopping wallet and can’t be withdrawn as cash.</p>
        </section>
      </div>
    </div>
  );
}

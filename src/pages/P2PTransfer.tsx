import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AmountInput from '../components/AmountInput';
import Modal from '../components/Modal';
import { date, inr, toPaise } from '../format';
import { useUrlFilters } from '../hooks';
import { P2PPage, P2PRecipient, WalletSummary } from '../types';

const LIMIT = 6;
const DIRECTIONS = { all: 'All transfers', sent: 'Sent', received: 'Received' } as const;

export default function P2PTransfer() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [code, setCode] = useState('');
  const [recipient, setRecipient] = useState<P2PRecipient | null>(null);
  const [codeError, setCodeError] = useState('');
  const [looking, setLooking] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [history, setHistory] = useState<P2PPage | null>(null);
  const [tick, setTick] = useState(0);
  const { params, update, page, setPage } = useUrlFilters();
  const dir = (params.get('direction') as keyof typeof DIRECTIONS) in DIRECTIONS ? (params.get('direction') as keyof typeof DIRECTIONS) : 'all';

  useEffect(() => { api.wallet().then(setWallet).catch((e: Error) => setError(e.message)); }, [tick]);
  useEffect(() => {
    let stale = false;
    api.p2pHistory({ direction: dir, page, limit: LIMIT }).then((d) => { if (!stale) setHistory(d); }).catch(() => {});
    return () => { stale = true; };
  }, [dir, page, tick]);

  // Look the member up as soon as an ID is typed, so a wrong ID is caught before any money moves.
  useEffect(() => {
    setRecipient(null); setCodeError('');
    const c = code.trim();
    if (c.length < 3) return;
    setLooking(true);
    let stale = false;
    const t = setTimeout(() => {
      api.p2pLookup(c)
        .then((r) => { if (!stale) setRecipient(r); })
        .catch((e: Error) => { if (!stale) setCodeError(e.message); })
        .finally(() => { if (!stale) setLooking(false); });
    }, 400);
    return () => { stale = true; clearTimeout(t); setLooking(false); };
  }, [code]);

  // One key per distinct transfer: a double click or retry can never send twice.
  const sig = JSON.stringify([recipient?.memberCode, amount, note]);
  const key = useRef({ sig: '', value: '' });
  if (key.current.sig !== sig) key.current = { sig, value: crypto.randomUUID() };

  const paise = toPaise(amount);
  const balance = wallet?.shoppingBalancePaise ?? 0;
  const limit = history?.dailyLimitPaise ?? 0;
  const sentToday = history?.sentTodayPaise ?? 0;
  let amountError = '';
  if (amount && !paise) amountError = 'Enter a valid amount';
  else if (paise && paise < 100) amountError = 'Minimum transfer is ₹1';
  else if (paise && paise > balance) amountError = 'More than your shopping wallet balance';
  else if (paise && limit && sentToday + paise > limit) amountError = `Over your daily limit (${inr(Math.max(0, limit - sentToday))} left today)`;
  const canSend = !!recipient && !!paise && !amountError;

  async function send() {
    setBusy(true); setError(''); setDone('');
    try {
      await api.p2pSend({ toMemberCode: recipient!.memberCode, amountPaise: paise!, note: note.trim() || undefined, clientKey: key.current.value });
      setDone(`${inr(paise!)} sent to ${recipient!.name}`);
      setAmount(''); setNote(''); setCode(''); setTick((t) => t + 1);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); setConfirm(false); }
  }

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Send shopping wallet credit to another member. It can only be spent on products.</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Shopping wallet</span><strong>{wallet ? inr(balance) : '—'}</strong><small className="muted">Available to send</small></div>
        <div className="card stat"><span className="muted">Sent in last 24 hours</span><strong>{history ? inr(sentToday) : '—'}</strong><small className="muted">Daily limit {history ? inr(limit) : '—'}</small></div>
        <div className="card stat"><span className="muted">Need more credit?</span><small><Link to="/dashboard/wallet/transfer">Move earnings to your shopping wallet</Link></small></div>
      </div>

      <div className="two-col">
        <section className="card">
          <h3>Send credit</h3>
          <label className="field">
            <span>Member ID</span>
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setDone(''); }} placeholder="e.g. MDEMO0003" autoComplete="off" maxLength={20} aria-invalid={!!codeError} />
            {looking && <small className="muted">Checking…</small>}
            {codeError && <small className="error">{codeError}</small>}
            {recipient && <small className="found">✓ {recipient.name} · {recipient.memberCode}</small>}
          </label>
          <AmountInput label="Amount" value={amount} onChange={(v) => { setAmount(v); setDone(''); }} error={amountError} max={Math.min(balance, Math.max(0, limit - sentToday))} hint="Minimum ₹1" />
          <label className="field">
            <span>Note (optional)</span>
            <input value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="Shown to the recipient" />
          </label>
          <div className="notice warn">Transfers are instant and can’t be undone. Only send to people you know.</div>
          {error && <div className="alert">{error}</div>}
          {done && <div className="notice" role="status">✓ {done}</div>}
          <button className="btn" disabled={!canSend} onClick={() => setConfirm(true)}>Review transfer</button>
        </section>

        <section className="card">
          <div className="row-between">
            <h3>Recent transfers</h3>
            <select className="sort" aria-label="Filter transfers" value={dir} onChange={(e) => update({ direction: e.target.value === 'all' ? undefined : e.target.value })}>
              {Object.entries(DIRECTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {!history ? <p className="muted">Loading…</p> : history.items.length === 0 ? (
            <div className="empty tight"><strong>No transfers yet</strong><p className="muted">Transfers you send or receive will show here.</p></div>
          ) : (
            <ul className="list">
              {history.items.map((t) => (
                <li key={t.id}>
                  <div><strong>{t.direction === 'SENT' ? `To ${t.counterparty}` : `From ${t.counterparty}`}</strong><small className="muted block">{date(t.createdAt)}{t.note ? ` · ${t.note}` : ''}</small></div>
                  <strong className={t.direction === 'SENT' ? 'neg' : 'pos'}>{t.direction === 'SENT' ? '−' : '+'}{inr(t.amountPaise)}</strong>
                </li>
              ))}
            </ul>
          )}
          {history && history.pages > 1 && (
            <div className="pager nobox">
              <span className="muted">{history.page} / {history.pages}</span>
              <div>
                <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button className="btn ghost small" disabled={page >= history.pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {confirm && recipient && paise && (
        <Modal title="Confirm transfer" onClose={() => setConfirm(false)}>
          <dl className="breakdown">
            <div><dt>Send to</dt><dd>{recipient.name} ({recipient.memberCode})</dd></div>
            <div><dt>Amount</dt><dd>{inr(paise)}</dd></div>
            {note.trim() && <div><dt>Note</dt><dd>{note.trim()}</dd></div>}
            <div><dt>Your balance after</dt><dd>{inr(balance - paise)}</dd></div>
          </dl>
          <p className="muted small-note">This can’t be undone. Check the name above is the person you mean to pay.</p>
          <div className="actions end">
            <button className="btn ghost" onClick={() => setConfirm(false)} disabled={busy}>Back</button>
            <button className="btn" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send now'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

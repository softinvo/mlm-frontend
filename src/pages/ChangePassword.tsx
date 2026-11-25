import { FormEvent, useState } from 'react';
import { api, ApiError } from '../api';

function PasswordInput({ label, value, onChange, error, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <div className="pw">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={!!error} required />
        <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {error && <small className="error">{error}</small>}
    </label>
  );
}

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const rules = [
    { ok: next.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(next), label: 'Contains a letter' },
    { ok: /\d/.test(next), label: 'Contains a number' },
    { ok: next.length > 0 && next !== current, label: 'Different from current password' },
  ];
  const score = rules.filter((r) => r.ok).length + (next.length >= 12 ? 1 : 0) + (/[^A-Za-z0-9]/.test(next) ? 1 : 0);
  const strength = next ? (score <= 2 ? 'Weak' : score <= 4 ? 'Okay' : 'Strong') : '';
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = current && rules.every((r) => r.ok) && confirm === next;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true); setError(''); setFieldErrors({}); setDone(false);
    try {
      await api.changePassword(current, next);
      setDone(true); setCurrent(''); setNext(''); setConfirm('');
    } catch (ex) {
      if (ex instanceof ApiError && ex.details) setFieldErrors(ex.details);
      setError((ex as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="content">
      <div className="page-head">
        <p className="muted">Choose a strong password you don’t use anywhere else.</p>
      </div>

      <form onSubmit={submit} className="card narrow" noValidate>
        {/* Helps password managers attach the right account */}
        <input type="text" name="username" autoComplete="username" hidden readOnly />
        <PasswordInput label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" error={fieldErrors.currentPassword?.[0]} />
        <PasswordInput label="New password" value={next} onChange={setNext} autoComplete="new-password" error={fieldErrors.newPassword?.[0]} />

        {next && (
          <div className="strength" aria-live="polite">
            <div className={`meter s-${strength.toLowerCase()}`}><i /><i /><i /></div>
            <span className="muted">{strength}</span>
          </div>
        )}
        <ul className="rules">
          {rules.map((r) => <li key={r.label} className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '○'} {r.label}</li>)}
        </ul>

        <PasswordInput label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={mismatch ? 'Passwords do not match' : undefined} />

        {error && Object.keys(fieldErrors).length === 0 && <div className="alert">{error}</div>}
        {done && <div className="notice" role="status">✓ Password changed. Use it next time you sign in.</div>}
        <button className="btn" disabled={busy || !valid}>{busy ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  );
}

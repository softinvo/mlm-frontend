import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';
import { OtpChannel } from '../types';

/** Forgot password: a one-time code by SMS or email, then a new password. */
export default function ForgotPassword() {
  const [step, setStep] = useState<'ask' | 'reset' | 'done'>('ask');
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('SMS');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.forgotPassword(identifier.trim(), channel); setStep('reset'); } catch (ex) { setError((ex as Error).message); } finally { setBusy(false); }
  }
  async function reset(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.resetPassword(identifier.trim(), code, password); setStep('done'); } catch (ex) { setError((ex as Error).message); } finally { setBusy(false); }
  }

  if (step === 'done') return (
    <AuthLayout title="Password changed" subtitle="You can now sign in with your new password.">
      <Link className="btn" to="/login">Go to sign in</Link>
    </AuthLayout>
  );
  return (
    <AuthLayout title="Forgot your password?" subtitle={step === 'ask' ? 'Enter your email or mobile number and we will send you a one-time code.' : 'Enter the code we sent you and choose a new password.'}>
      {step === 'ask' ? (
        <form onSubmit={ask}>
          <Field label="Email or 10-digit mobile number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          <div className="field"><span>Send the code by</span>
            <div className="pills" role="radiogroup" aria-label="Send the code by">
              {(['SMS', 'EMAIL'] as const).map((c) => <button type="button" key={c} role="radio" aria-checked={channel === c} className={channel === c ? 'on' : ''} onClick={() => setChannel(c)}>{c === 'SMS' ? 'SMS' : 'Email'}</button>)}
            </div>
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="btn" disabled={busy || identifier.trim().length < 5}>{busy ? 'Sending…' : 'Send code'}</button>
        </form>
      ) : (
        <form onSubmit={reset}>
          <div className="notice" role="status">If an account matches <strong>{identifier}</strong>, a code is on its way by {channel === 'SMS' ? 'SMS' : 'email'}. It is valid for a few minutes.</div>
          <Field label="6-digit code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoComplete="one-time-code" />
          <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          <p className="muted small-note">At least 8 characters, with a letter and a number.</p>
          {error && <div className="alert">{error}</div>}
          <button className="btn" disabled={busy || code.length !== 6 || password.length < 8}>{busy ? 'Saving…' : 'Change password'}</button>
          <p className="muted"><button type="button" className="link-btn" onClick={() => { setStep('ask'); setCode(''); setError(''); }}>Send a new code</button></p>
        </form>
      )}
      <p className="muted"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  );
}

import { useEffect, useState } from 'react';
import { OtpChannel, OtpSent } from '../types';

/** "Send me a code" + a field for the 6 digits. The member picks SMS or email; a new code can be requested after a short wait. */
export default function OtpBox({ send, code, onCode, defaultChannel = 'SMS', purpose }: {
  send: (channel: OtpChannel) => Promise<OtpSent>; code: string; onCode: (v: string) => void; defaultChannel?: OtpChannel; purpose: string;
}) {
  const [channel, setChannel] = useState<OtpChannel>(defaultChannel);
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  async function go() {
    setBusy(true); setError('');
    try { setSent(await send(channel)); setWait(30); onCode(''); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="otp-box">
      <div className="field"><span>Send my code by</span>
        <div className="pills" role="radiogroup" aria-label="Send my code by">
          {(['SMS', 'EMAIL'] as const).map((c) => <button type="button" key={c} role="radio" aria-checked={channel === c} className={channel === c ? 'on' : ''} onClick={() => setChannel(c)}>{c === 'SMS' ? 'SMS to my mobile' : 'Email'}</button>)}
        </div>
      </div>
      <button type="button" className="btn ghost" disabled={busy || wait > 0} onClick={go}>{busy ? 'Sending…' : sent ? (wait > 0 ? `Send again in ${wait}s` : 'Send a new code') : 'Send code'}</button>
      {error && <div className="alert">{error}</div>}
      {sent && (
        <>
          <p className="muted small-note" role="status">We sent a 6-digit code to {sent.sentTo} to {purpose}. It is valid for {sent.expiresInMinutes} minutes.</p>
          <label className="field"><span>Enter the code</span>
            <input className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" aria-label="6-digit code" value={code} onChange={(e) => onCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </label>
        </>
      )}
    </div>
  );
}

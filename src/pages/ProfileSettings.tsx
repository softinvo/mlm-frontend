import { FormEvent, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, ApiError } from '../api';
import Field from '../components/Field';
import { INDIAN_STATES } from '../data';
import { date } from '../format';
import { OtpChannel, Profile, ProfileInput } from '../types';
import type { MemberCtx } from '../components/MemberLayout';

const toInput = (p: Profile): ProfileInput => ({ name: p.name, phone: p.phone, dateOfBirth: p.dateOfBirth, gender: p.gender, address: { ...p.address } });

export default function ProfileSettings() {
  const [channel, setChannel] = useState<OtpChannel>('SMS');
  const [channelMsg, setChannelMsg] = useState('');
  const changeChannel = (c: OtpChannel) => { const prev = channel; setChannel(c); setChannelMsg(''); api.setOtpChannel(c).then(() => setChannelMsg('Saved.')).catch((e: Error) => { setChannel(prev); setChannelMsg(e.message); }); };
  const { setDisplayName } = useOutletContext<MemberCtx>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.profile().then((p) => { setProfile(p); setForm(toInput(p)); setChannel(p.otpChannel ?? 'SMS'); }).catch((e: Error) => setError(e.message));
  }, []);

  if (!form || !profile) {
    return <div className="content">{error ? <div className="alert">{error}</div> : <p className="muted">Loading profile…</p>}</div>;
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(toInput(profile));
  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => { setForm({ ...form, [k]: v }); setSaved(false); };
  const setAddr = (k: keyof ProfileInput['address'], v: string) => set('address', { ...form.address, [k]: v });
  const err = (k: string) => errors[k]?.[0];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({}); setSaved(false);
    try {
      const p = await api.updateProfile(form!);
      setProfile(p); setForm(toInput(p)); setSaved(true); setDisplayName(p.name);
    } catch (ex) {
      if (ex instanceof ApiError && ex.details) setErrors(ex.details);
      setError((ex as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="content">
      <div className="page-head">
        <p className="muted">Keep your personal details up to date.</p>
      </div>

      <form onSubmit={submit} className="stack" noValidate>
        <section className="card">
          <h3>Account</h3>
          <dl className="facts">
            <div><dt>Member ID</dt><dd>{profile.memberCode}</dd></div>
            <div><dt>Rank</dt><dd>{profile.rank}</dd></div>
            <div><dt>Sponsor</dt><dd>{profile.sponsorCode ?? '—'}</dd></div>
            <div><dt>Franchise</dt><dd>{profile.franchise?.name ?? '—'}</dd></div>
            <div><dt>Member since</dt><dd>{date(profile.joinedAt)}</dd></div>
          </dl>
        </section>

        <section className="card">
          <h3>Personal details</h3>
          <div className="form-grid">
            <Field label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} error={err('name')} required autoComplete="name" />
            <Field label="Email (cannot be changed)" value={profile.email} disabled readOnly />
            <Field label="Mobile number" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set('phone', e.target.value)} error={err('phone')} required autoComplete="tel-national" />
            <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} error={err('dateOfBirth')} autoComplete="bday" />
            <label className="field">
              <span>Gender</span>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value as ProfileInput['gender'])}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <h3>Address</h3>
          <div className="form-grid">
            <div className="span-2"><Field label="Address line 1" value={form.address.line1} onChange={(e) => setAddr('line1', e.target.value)} error={err('address.line1')} autoComplete="address-line1" /></div>
            <div className="span-2"><Field label="Address line 2" value={form.address.line2} onChange={(e) => setAddr('line2', e.target.value)} error={err('address.line2')} autoComplete="address-line2" /></div>
            <Field label="City" value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} error={err('address.city')} autoComplete="address-level2" />
            <label className="field">
              <span>State</span>
              <select value={form.address.state} onChange={(e) => setAddr('state', e.target.value)} autoComplete="address-level1">
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <Field label="Pincode" inputMode="numeric" maxLength={6} value={form.address.pincode} onChange={(e) => setAddr('pincode', e.target.value)} error={err('address.pincode')} autoComplete="postal-code" />
          </div>
        </section>

        {error && Object.keys(errors).length === 0 && <div className="alert">{error}</div>}
        {saved && <div className="notice" role="status">✓ Profile updated</div>}
        <div className="actions">
          <button className="btn" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="btn ghost" disabled={busy || !dirty} onClick={() => { setForm(toInput(profile)); setErrors({}); setError(''); }}>Reset</button>
        </div>
      </form>

      <section className="card">
        <h3>One-time codes</h3>
        <p className="muted small-note">When a shop asks to take a payment from your shopping wallet, we send you a code to read out to them. Choose where it should go. For withdrawals and password reset you pick each time.</p>
        <div className="pills" role="radiogroup" aria-label="Send my codes by">
          {(['SMS', 'EMAIL'] as const).map((c) => <button type="button" key={c} role="radio" aria-checked={channel === c} className={channel === c ? 'on' : ''} onClick={() => changeChannel(c)}>{c === 'SMS' ? 'SMS to my mobile' : 'Email'}</button>)}
        </div>
        {channelMsg && <p className="muted small-note" role="status">{channelMsg}</p>}
      </section>
    </div>
  );
}

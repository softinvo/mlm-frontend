import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';

export default function Register() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    sponsorCode: params.get('ref') ?? '', franchiseCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    try {
      const { token } = await api.register(form);
      signIn(token);
      nav('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <AuthLayout title="Create your account" subtitle="You need a sponsor code and a franchise code to join.">
      <form onSubmit={submit}>
        <Field label="Full name" value={form.name} onChange={set('name')} error={errors.name?.[0]} required />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email?.[0]} required />
        <Field label="Mobile number" inputMode="numeric" maxLength={10} value={form.phone} onChange={set('phone')} error={errors.phone?.[0]} required />
        <Field label="Password (min 8 characters)" type="password" value={form.password} onChange={set('password')} error={errors.password?.[0]} required />
        <div className="row">
          <Field label="Sponsor code" value={form.sponsorCode} onChange={set('sponsorCode')} error={errors.sponsorCode?.[0]} required />
          <Field label="Franchise code" value={form.franchiseCode} onChange={set('franchiseCode')} error={errors.franchiseCode?.[0]} required />
        </div>
        {error && <div className="alert">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="muted small-note">By creating an account you agree to our <Link to="/terms" target="_blank">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>.</p>
      <p className="muted">Already a member? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { FRANCHISE_APP } from './WrongApp';
import AuthLayout from '../components/AuthLayout';
import Field from '../components/Field';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [wrongApp, setWrongApp] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setWrongApp(false);
    try {
      const { token, role } = await api.login(email, password);
      if (role !== 'MEMBER' && role !== 'CUSTOMER') { setWrongApp(true); return; } // franchise and head office use the other app
      signIn(token);
      nav('/'); // the router sends each role to its own panel
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your member account.">
      <form onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <div className="alert">{error}</div>}
        {wrongApp && <div className="alert">Franchise and head-office accounts sign in at <a href={FRANCHISE_APP}>{FRANCHISE_APP.replace(/^https?:\/\//, '')}</a></div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted"><Link to="/forgot-password">Forgot your password?</Link></p>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import BarChart from '../components/BarChart';
import CashbackSummary from '../components/CashbackSummary';
import { date, inr } from '../format';
import { CashbackData, Dashboard as Data } from '../types';

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="card stat">
    <span className="muted">{label}</span>
    <strong>{value}</strong>
    {hint && <small className="muted">{hint}</small>}
  </div>
);

const Badge = ({ status }: { status: string }) => <span className={`badge ${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>;

export default function Dashboard() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [cashback, setCashback] = useState<CashbackData | null>(null);
  useEffect(() => { api.cashback().then(setCashback).catch(() => {}); }, []); // a missing card is better than a broken dashboard

  useEffect(() => {
    api.dashboard().then(setData).catch((err: ApiError) => {
      if (err.status === 401 || err.status === 403) { signOut(); nav('/login'); }
      else setError(err.message);
    });
  }, []);

  if (error) return <div className="center"><div className="alert">{error}</div></div>;
  if (!data) return <div className="center muted">Loading dashboard…</div>;

  const { profile, wallet, team } = data;
  const link = `${location.origin}/register?ref=${profile.memberCode}`;
  const copy = () => navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });

  return (
    <div className="content">
        <section className="hero card">
          <div>
            <h2>Hello, {profile.name.split(' ')[0]} 👋</h2>
            <p className="muted">
              <span className="chip">{profile.rank}</span>
              <span className="chip">ID {profile.memberCode}</span>
              <span className={`chip kyc-${profile.kycStatus.toLowerCase()}`}>KYC {profile.kycStatus.replace('_', ' ').toLowerCase()}</span>
            </p>
          </div>
          <div className="invite">
            <span className="muted">Your invite link</span>
            <div className="invite-row"><code>{link}</code><button className="btn small" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
          </div>
        </section>

        <section className="grid stats">
          <Stat label="Wallet balance" value={inr(wallet.balancePaise)} hint="Available to withdraw" />
          <Stat label="Pending commission" value={inr(wallet.pendingCommissionPaise)} hint="In cooling-off period" />
          <Stat label="Total earned" value={inr(wallet.totalEarnedPaise)} hint="Approved commissions" />
          <Stat label="Team size" value={String(team.totalDownline)} hint={`${team.directs} direct`} />
        </section>

        {cashback && (cashback.config.enabled || cashback.items.length > 0) && (
          <CashbackSummary data={cashback} action={<Link className="btn small" to="/dashboard/income/cashback">View details →</Link>} />
        )}

        <section className="grid two">
          <div className="card">
            <h3>Earnings, last 6 months</h3>
            <BarChart data={data.earningsByMonth} />
          </div>
          <div className="card">
            <h3>Team by level</h3>
            <table>
              <thead><tr><th>Level</th><th>Members</th><th className="num">Earned</th></tr></thead>
              <tbody>
                {team.levels.map((l) => (
                  <tr key={l.level}><td>Level {l.level}</td><td>{l.members}</td><td className="num">{inr(l.earnedPaise)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid two">
          <div className="card">
            <h3>Recent commissions</h3>
            {data.recentCommissions.length === 0 ? <p className="muted">Nothing yet.</p> : (
              <ul className="list">
                {data.recentCommissions.map((c) => (
                  <li key={c._id}>
                    <div><strong>Level {c.level}</strong><small className="muted">{date(c.createdAt)}</small></div>
                    <div className="right"><strong>{inr(c.amountPaise)}</strong><Badge status={c.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h3>My recent orders</h3>
            {data.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
              <ul className="list">
                {data.recentOrders.map((o) => (
                  <li key={o._id}>
                    <div><strong>Order …{o._id.slice(-5)}</strong><small className="muted">{date(o.createdAt)}</small></div>
                    <div className="right"><strong>{inr(o.totalPaise)}</strong><Badge status={o.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <p className="disclaimer muted">Commissions are paid only on verified retail product sales, net of refunds. Earnings are not guaranteed and vary by individual effort.</p>
      </div>
  );
}

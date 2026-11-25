import { useEffect, useState } from 'react';
import { api } from '../api';
import { date, inr } from '../format';
import { PurchaseStatusData } from '../types';

/** Global Purchase Status: how much the member's whole team is buying. Read-only. */
export default function PurchaseStatus() {
  const [d, setD] = useState<PurchaseStatusData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let stale = false; api.purchaseStatus().then((x) => { if (!stale) setD(x); }).catch((e: Error) => { if (!stale) setError(e.message); }); return () => { stale = true; }; }, []);
  if (error) return <div className="content"><div className="alert">{error}</div></div>;
  if (!d) return <div className="content"><p className="muted">Loading…</p></div>;
  const t = d.totals;
  const levels = d.levels.filter((l) => l.members > 0);

  return (
    <div className="content">
      <div className="page-head"><p className="muted">How your whole team is buying: every member below you, at every level. Orders that were cancelled are left out and refunds are taken off.</p></div>

      <div className="grid stats four">
        <div className="card stat"><span className="muted">Team members</span><strong>{t.teamSize}</strong><small className="muted">{t.buyers} have bought</small></div>
        <div className="card stat"><span className="muted">Bought in last {d.windowDays} days</span><strong>{t.active}</strong><small className="muted">{t.teamSize ? Math.round((t.active / t.teamSize) * 100) : 0}% of your team</small></div>
        <div className="card stat"><span className="muted">Team purchases</span><strong>{inr(t.valuePaise)}</strong><small className="muted">{t.orders} orders in all</small></div>
        <div className="card stat"><span className="muted">Last {d.windowDays} days</span><strong>{inr(t.recentValuePaise)}</strong><small className="muted">{t.recentOrders} orders</small></div>
      </div>

      <div className="card">
        <h3>By level</h3>
        {levels.length === 0 ? (
          <div className="empty"><strong>No team yet</strong><p className="muted">Members you sponsor, and the members they sponsor, will appear here with their purchases.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="team">
              <thead><tr><th>Level</th><th className="num">Members</th><th className="num">Have bought</th><th className="num">Active ({d.windowDays}d)</th><th className="num">Orders</th><th className="num">Purchases</th></tr></thead>
              <tbody>
                {levels.map((l) => (
                  <tr key={l.level}>
                    <td data-label="Level">Level {l.level}</td><td data-label="Members" className="num">{l.members}</td><td data-label="Have bought" className="num">{l.buyers}</td>
                    <td data-label="Active" className="num">{l.active}</td><td data-label="Orders" className="num">{l.orders}</td><td data-label="Purchases" className="num"><strong>{inr(l.valuePaise)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Latest team purchases</h3>
        {d.recent.length === 0 ? <p className="muted">No team purchases yet.</p> : (
          <div className="table-wrap">
            <table className="team">
              <thead><tr><th>Date</th><th>Member</th><th>Level</th><th>Type</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{date(r.at)}</td>
                    <td data-label="Member"><div><strong className="sp">{r.buyerName}</strong><small className="muted block">{r.buyerCode}</small></div></td>
                    <td data-label="Level">Level {r.level}</td><td data-label="Type">{r.kind}</td>
                    <td data-label="Amount" className="num"><strong>{inr(r.valuePaise)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="disclaimer muted">This page only shows purchases. It does not by itself earn anything: commission is paid on delivered retail orders under the commission plan.</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';
import { inr } from '../format';
import { RewardsData } from '../types';

const NAME: Record<string, string> = { ASSOCIATE: 'Associate', SILVER: 'Silver', GOLD: 'Gold', DIAMOND: 'Diamond' };

/** Rewards & Awards Status: the member's rank and how close they are to the next one. Ranks are confirmed by the head office. */
export default function RewardsStatus() {
  const [d, setD] = useState<RewardsData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let stale = false; api.rewards().then((x) => { if (!stale) setD(x); }).catch((e: Error) => { if (!stale) setError(e.message); }); return () => { stale = true; }; }, []);
  if (error) return <div className="content"><div className="alert">{error}</div></div>;
  if (!d) return <div className="content"><p className="muted">Loading…</p></div>;
  const next = d.ladder.find((l) => l.rank === d.next);

  return (
    <div className="content">
      <div className="page-head"><p className="muted">Your rank and your progress towards the next one. Ranks are confirmed by the head office.</p></div>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Your rank</span><strong>{NAME[d.rank] ?? d.rank}</strong><small className="muted">{d.next ? `Next: ${NAME[d.next] ?? d.next}` : 'Highest rank'}</small></div>
        <div className="card stat"><span className="muted">Team purchases (delivered)</span><strong>{inr(d.stats.teamVolumePaise)}</strong><small className="muted">Whole team, net of refunds</small></div>
        <div className="card stat"><span className="muted">Active direct members</span><strong>{d.stats.activeDirects}</strong><small className="muted">Of {d.stats.directs} · bought in the last {d.stats.windowDays} days</small></div>
      </div>

      {next?.requirement && next.progress ? (
        <div className="card">
          <h3>Progress to {NAME[next.rank] ?? next.rank}</h3>
          <div className="rw-goal"><span>Team purchases {inr(d.stats.teamVolumePaise)} of {inr(next.requirement.minTeamVolumePaise)}</span><div className="cb-bar"><span style={{ width: `${next.progress.volumePct}%` }} /></div></div>
          <div className="rw-goal"><span>Active direct members {d.stats.activeDirects} of {next.requirement.minActiveDirects}</span><div className="cb-bar"><span style={{ width: `${next.progress.directsPct}%` }} /></div></div>
          {next.progress.met && <div className="notice">You meet the requirements for {NAME[next.rank] ?? next.rank}. The head office confirms rank changes.</div>}
        </div>
      ) : d.next && (
        <div className="card empty"><strong>Requirements not published yet</strong><p className="muted">The head office has not published what is needed for {NAME[d.next] ?? d.next}. It will appear here when it does.</p></div>
      )}

      <div className="card">
        <h3>Rank ladder</h3>
        <div className="table-wrap">
          <table className="team">
            <thead><tr><th>Rank</th><th className="num">Team purchases</th><th className="num">Active directs</th><th>Status</th></tr></thead>
            <tbody>
              {d.ladder.map((l) => (
                <tr key={l.rank}>
                  <td data-label="Rank"><strong>{NAME[l.rank] ?? l.rank}</strong></td>
                  <td data-label="Team purchases" className="num">{l.requirement ? inr(l.requirement.minTeamVolumePaise) : l.rank === 'ASSOCIATE' ? 'Starting rank' : '—'}</td>
                  <td data-label="Active directs" className="num">{l.requirement ? l.requirement.minActiveDirects : l.rank === 'ASSOCIATE' ? '—' : '—'}</td>
                  <td data-label="Status">{l.current ? <span className="badge approved">Your rank</span> : l.held ? <span className="badge delivered">Reached</span> : l.requirement ? <span className="badge pending">{l.progress?.met ? 'Requirements met' : 'Not yet'}</span> : <span className="muted">Not published</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="disclaimer muted">This page shows progress only. Ranks are set by the head office, and any reward linked to a rank is announced by the head office before it applies. Nothing here is a guarantee of earnings.</p>
    </div>
  );
}

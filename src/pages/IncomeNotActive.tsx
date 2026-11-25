import { Link } from 'react-router-dom';
import { inr } from '../format';

export type InactiveIncome = 'cashback' | 'repurchase' | 'rank-rewards' | 'global-magic' | 'global-rank' | 'team-passive';

const COPY: Record<InactiveIncome, { subtitle: string; what: string; points: string[] }> = {
  cashback: {
    subtitle: 'Cashback on your own purchases.',
    what: 'Cashback rewards you for buying products. Once it’s active, each eligible delivered order would show its cashback here.',
    points: ['Based on your own delivered orders', 'Released after the return period, like other income', 'Reduced if an order is refunded'],
  },
  repurchase: {
    subtitle: 'Royalty on repeat purchases in your team.',
    what: 'Repurchase royalty rewards you when members in your team reorder products. Once it’s active, each qualifying order would be listed here.',
    points: ['Based on verified repeat product orders', 'Released after the return period', 'Reduced if an order is refunded'],
  },
  'rank-rewards': {
    subtitle: 'Rewards for reaching ranks.',
    what: 'Rank rewards recognise your progress. Once it’s active, you’ll see your current rank, what’s needed for the next one, and any rewards earned.',
    points: ['Ranks depend on genuine retail sales volume', 'Each reward is recorded once', 'Rank requirements will be shown clearly before you start'],
  },
  'global-magic': {
    subtitle: 'Global Magic income.',
    what: 'Global Magic is a points-based income. Its rules aren’t published yet. When it launches, the full rules and your points will appear here.',
    points: ['Eligibility and points rules will be shown in full', 'Based on verified product sales', 'Nothing is earned until it is announced and active'],
  },
  'global-rank': {
    subtitle: 'Royalty for global ranks.',
    what: 'Global Rank Royalty is paid to members who reach top ranks. Its rules aren’t published yet. When it launches, requirements and your standing will appear here.',
    points: ['Rank requirements will be shown in full', 'Based on verified product sales', 'Nothing is earned until it is announced and active'],
  },
  'team-passive': {
    subtitle: 'Team-based income.',
    what: 'This income type isn’t available yet. When it launches, the rules, your qualifying activity and your earnings history will appear here.',
    points: ['Rules will be published before it starts', 'Only genuine retail product sales count', 'Nothing is earned until it is announced and active'],
  },
};

export default function IncomeNotActive({ kind }: { kind: InactiveIncome }) {
  const c = COPY[kind];
  return (
    <div className="content">
      <div className="page-head"><p className="muted">{c.subtitle}</p></div>

      <section className="card hero-status warn">
        <div className="big-icon" aria-hidden="true">⏳</div>
        <div>
          <h2>Not active yet</h2>
          <p className="muted">{c.what}</p>
          <p className="muted"><strong>Nothing is being earned or paid here right now.</strong></p>
        </div>
      </section>

      <div className="grid stats three">
        <div className="card stat"><span className="muted">Earned</span><strong>{inr(0)}</strong><small className="muted">Starts when this income is active</small></div>
        <div className="card stat"><span className="muted">Pending release</span><strong>{inr(0)}</strong><small className="muted">Nothing waiting</small></div>
        <div className="card stat"><span className="muted">Entries</span><strong>0</strong><small className="muted">No history yet</small></div>
      </div>

      <div className="two-col">
        <section className="card">
          <h3>What to expect</h3>
          <ul className="bullets">{c.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        <section className="card">
          <h3>Income you can earn today</h3>
          <p className="muted">Commission is paid on delivered retail orders in your team.</p>
          <div className="actions wrap">
            <Link className="btn small add-btn" to="/dashboard/income/direct-sponsor">Direct Sponsor Income</Link>
            <Link className="btn ghost small add-btn" to="/dashboard/income/level">Level Income</Link>
          </div>
        </section>
      </div>

      <p className="disclaimer muted">Earnings are not guaranteed and depend on genuine retail sales. Rules for any new income type are published before it starts.</p>
    </div>
  );
}

import { ReactNode } from 'react';
import { inr } from '../format';
import { CashbackData } from '../types';
import Icon from './Icon';

/** The cashback headline: the rule, what is credited every day, and how much of the total has been paid. Used on the dashboard and the Cashback page. */
export default function CashbackSummary({ data, action }: { data: CashbackData; action?: ReactNode }) {
  const { config: c, totals: t } = data;
  const daily = data.items.filter((i) => i.status === 'ACTIVE').reduce((n, i) => n + i.dailyPaise, 0);
  const all = t.earnedPaise + t.upcomingPaise;
  const pct = all > 0 ? Math.round((t.earnedPaise / all) * 100) : 0;
  return (
    <section className="card cb-dash" aria-label="Cashback">
      <div className="cb-dash-top">
        <span className="cb-dash-icon" aria-hidden="true"><Icon name="trend" size={22} /></span>
        <div className="cb-dash-title">
          <h3>Cashback</h3>
          <p className="cb-dash-chips"><span className="chip">{c.percentPerDay}% a day</span><span className="chip">up to {c.days} days</span><span className="chip">{c.maxTotalPercent}% back at most</span></p>
        </div>
        {action}
      </div>
      <div className="cb-dash-body">
        <div className="cb-dash-today">
          <span className="muted">Credited to your wallet every day</span>
          <strong>{daily > 0 ? `+${inr(daily)}` : inr(0)}</strong>
          <small className="muted">{t.active > 0 ? `${t.active} purchase${t.active === 1 ? '' : 's'} paying now` : 'Starts the day after an eligible order is delivered'}</small>
        </div>
        <div className="cb-dash-progress">
          <div className="cb-dash-bar" role="progressbar" aria-label="Cashback earned so far" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
          <div className="cb-dash-legend">
            <span><i aria-hidden="true" />Earned <strong>{inr(t.earnedPaise)}</strong></span>
            <span><i className="todo" aria-hidden="true" />Still to come <strong>{inr(t.upcomingPaise)}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}

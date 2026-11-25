import { TeamSummary } from '../types';

const Stat = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="card stat"><span className="muted">{label}</span><strong>{value}</strong><small className="muted">{hint}</small></div>
);

export default function LevelOverview({ summary }: { summary?: TeamSummary }) {
  if (!summary) {
    return <div className="grid stats">{[0, 1, 2, 3].map((i) => <div key={i} className="card stat skeleton"><span>&nbsp;</span><strong>&nbsp;</strong></div>)}</div>;
  }
  const deepest = summary.levels.reduce((d, l) => (l.total > 0 ? l.level : d), 0);
  const pct = summary.total ? Math.round((summary.active / summary.total) * 100) : 0;
  return (
    <div className="grid stats">
      <Stat label="Total team" value={String(summary.total)} hint={`Across ${deepest} level${deepest === 1 ? '' : 's'}`} />
      <Stat label="Active" value={String(summary.active)} hint={`${pct}% of your team`} />
      <Stat label="Inactive" value={String(summary.inactive)} hint={`No order in ${summary.windowDays} days`} />
      <Stat label="Deepest level" value={deepest ? `Level ${deepest}` : '—'} hint="Furthest member below you" />
    </div>
  );
}

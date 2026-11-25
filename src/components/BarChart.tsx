import { inr, monthLabel } from '../format';

export default function BarChart({ data }: { data: { month: string; totalPaise: number }[] }) {
  if (!data.length) return <p className="muted">No earnings yet.</p>;
  const max = Math.max(...data.map((d) => d.totalPaise), 1);
  return (
    <div className="bars" role="img" aria-label="Monthly earnings">
      {data.map((d) => (
        <div className="bar" key={d.month} title={inr(d.totalPaise)}>
          <span className="bar-value">{inr(d.totalPaise).replace(/\.00$/, '')}</span>
          <div className="bar-fill" style={{ height: `${Math.max((d.totalPaise / max) * 100, 3)}%` }} />
          <span className="bar-label">{monthLabel(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

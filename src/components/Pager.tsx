export default function Pager({ page, pages, total, limit, loading, onPage }: { page: number; pages: number; total: number; limit: number; loading?: boolean; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="pager">
      <span className="muted">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div>
        <button className="btn ghost small" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="muted pg">{page} / {pages}</span>
        <button className="btn ghost small" disabled={page >= pages || loading} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

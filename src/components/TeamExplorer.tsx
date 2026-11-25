import { ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { date } from '../format';
import { SortKey, StatusFilter, TeamMember, TeamPage, TeamQuery, TeamSummary } from '../types';

const LIMIT = 10;

const SORTS: { value: string; label: string; sort: SortKey; dir: 'asc' | 'desc' }[] = [
  { value: 'joined:desc', label: 'Newest first', sort: 'joined', dir: 'desc' },
  { value: 'joined:asc', label: 'Oldest first', sort: 'joined', dir: 'asc' },
  { value: 'name:asc', label: 'Name A–Z', sort: 'name', dir: 'asc' },
  { value: 'level:asc', label: 'Level: low to high', sort: 'level', dir: 'asc' },
  { value: 'level:desc', label: 'Level: high to low', sort: 'level', dir: 'desc' },
];

interface Props {
  subtitle: ReactNode;
  fetcher: (q: TeamQuery) => Promise<TeamPage & { summary?: TeamSummary }>;
  /** Rendered above the list; gets the latest summary and level filter controls. */
  overview?: (ctx: { summary?: TeamSummary; level?: number; setLevel: (l?: number) => void }) => ReactNode;
  /** Show a level dropdown in the toolbar (needs the fetcher to return a summary). */
  levelFilter?: boolean;
  statusFilter?: boolean;
  showLevel?: boolean;
  showSponsor?: boolean;
  onExport?: (q: TeamQuery) => Promise<void>;
  emptyText: string;
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function TeamExplorer({
  subtitle, fetcher, overview, levelFilter, statusFilter = true, showLevel = true, showSponsor = true, onExport, emptyText,
}: Props) {
  // Filters live in the URL, so a filtered view can be bookmarked, shared and survives refresh / back.
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';
  const level = Number(params.get('level')) || undefined;
  const statusParam = params.get('status');
  const status: StatusFilter = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
  const sortOpt = SORTS.find((s) => s.value === params.get('sort')) ?? SORTS[0];

  const update = (patch: Record<string, string | undefined>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (!('page' in patch)) next.delete('page'); // any filter change returns to page 1
      return next;
    }, { replace: true });

  const [searchInput, setSearchInput] = useState(q);
  const debounced = useDebounced(searchInput.trim());
  useEffect(() => { if (debounced !== q) update({ q: debounced || undefined }); }, [debounced]);

  const [data, setData] = useState<(TeamPage & { summary?: TeamSummary }) | null>(null);
  const [summary, setSummary] = useState<TeamSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState(false);

  const query: TeamQuery = { page, limit: LIMIT, search: q || undefined, status, level, sort: sortOpt.sort, dir: sortOpt.dir };

  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    fetcher(query)
      .then((d) => { if (!stale) { setData(d); if (d.summary) setSummary(d.summary); } })
      .catch((e: Error) => { if (!stale) setError(e.message); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [page, q, status, level, sortOpt.value]);

  async function exportCsv() {
    setExporting(true); setError('');
    try { await onExport!(query); } catch (e) { setError((e as Error).message); } finally { setExporting(false); }
  }

  const from = data && data.total ? (data.page - 1) * data.limit + 1 : 0;
  const to = data ? Math.min(data.page * data.limit, data.total) : 0;
  const filtered = !!(q || level || status !== 'all');
  const activeCount = (level ? 1 : 0) + (status !== 'all' ? 1 : 0) + (sortOpt.value !== SORTS[0].value ? 1 : 0);
  const clearFilters = () => { setSearchInput(''); update({ q: undefined, level: undefined, status: undefined }); };

  return (
    <div className="content">
      <div className="page-head"><p className="muted">{subtitle}</p></div>

      {overview?.({ summary, level, setLevel: (l) => update({ level: l ? String(l) : undefined }) })}

      <div className="card">
        <div className="toolbar tb-desktop">
          <input
            type="search" className="search" placeholder="Search by name or member ID" aria-label="Search team"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          />
          {levelFilter && (
            <select className="sort" aria-label="Filter by level" value={level ?? ""} onChange={(e) => update({ level: e.target.value || undefined })}>
              <option value="">All levels</option>
              {(summary?.levels ?? []).filter((l) => l.total > 0 || l.level === level).map((l) => (
                <option key={l.level} value={l.level}>Level {l.level} ({l.total})</option>
              ))}
              {level && !summary && <option value={level}>Level {level}</option>}
            </select>
          )}
          {statusFilter && (
            <select className="sort" aria-label="Filter by status" value={status} onChange={(e) => update({ status: e.target.value === "all" ? undefined : e.target.value })}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
          <select className="sort" aria-label="Sort by" value={sortOpt.value} onChange={(e) => update({ sort: e.target.value === SORTS[0].value ? undefined : e.target.value })}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {onExport && (
            <button className="btn ghost small export" onClick={exportCsv} disabled={exporting || !data?.total}>
              {exporting ? 'Exporting…' : '⤓ Export CSV'}
            </button>
          )}
        </div>

        <div className="tb-mobile">
          <input type="search" className="search" placeholder="Search members" aria-label="Search by name or member ID" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button type="button" className={`filter-btn ${activeCount ? 'on' : ''}`} onClick={() => setSheet(true)} aria-label={`Sort and filter${activeCount ? `, ${activeCount} active` : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {activeCount > 0 && <b className="filter-count">{activeCount}</b>}
          </button>
        </div>

        {(level || q || status !== 'all' || sortOpt.value !== SORTS[0].value) && (
          <div className="active-filters">
            {status !== 'all' && <span className="chip tb-mobile-chip">{status === 'active' ? 'Active' : 'Inactive'} <button aria-label="Clear status filter" onClick={() => update({ status: undefined })}>×</button></span>}
            {sortOpt.value !== SORTS[0].value && <span className="chip tb-mobile-chip">{sortOpt.label} <button aria-label="Reset sort" onClick={() => update({ sort: undefined })}>×</button></span>}
            {level && <span className="chip">Level {level} <button aria-label="Clear level filter" onClick={() => update({ level: undefined })}>×</button></span>}
            {q && <span className="chip">“{q}” <button aria-label="Clear search" onClick={() => { setSearchInput(''); update({ q: undefined }); }}>×</button></span>}
          </div>
        )}

        {error ? (
          <div className="alert">{error}</div>
        ) : !data ? (
          <p className="muted pad">Loading…</p>
        ) : data.items.length === 0 ? (
          <div className="empty">
            <strong>{filtered ? 'No matching members' : 'Nothing here yet'}</strong>
            <p className="muted">{filtered ? 'Try a different search or filter.' : emptyText}</p>
            {filtered && <button className="btn ghost small" onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className={`table-wrap ${loading ? 'busy' : ''}`}>
            <table className="team team-compact">
              <thead>
                <tr>
                  <th>Member</th>{showLevel && <th>Level</th>}{showSponsor && <th>Sponsor</th>}<th>Rank</th><th className="col-joined">Joined</th><th className="col-mobile">Mobile</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((m: TeamMember) => (
                  <tr key={m.id}>
                    <td data-label="Member">
                      <div className="who">
                        <span className="avatar" aria-hidden="true">{initials(m.name)}</span>
                        <div><strong>{m.name}</strong><small className="muted">{m.memberCode}</small></div>
                      </div>
                    </td>
                    {showLevel && <td data-label="Level">Level {m.level}</td>}
                    {showSponsor && (
                      <td data-label="Sponsor">
                        {m.level === 1 ? <span className="you">You</span> : (
                          <div><strong className="sp">{m.sponsorName ?? '—'}</strong><small className="muted block">{m.sponsorCode}</small></div>
                        )}
                      </td>
                    )}
                    <td data-label="Rank"><span className="chip rank">{m.rank}</span></td>
                    <td data-label="Joined" className="col-joined">{date(m.joinedAt)}</td>
                    <td data-label="Mobile" className="mono col-mobile">{m.phone}</td>
                    <td data-label="Status"><span className={`badge ${m.active ? 'active' : 'inactive'}`}>{m.active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="pager">
            <span className="muted">Showing {from}–{to} of {data.total}</span>
            <div>
              <button className="btn ghost small" disabled={page <= 1 || loading} onClick={() => update({ page: String(page - 1) === '1' ? undefined : String(page - 1) })}>Previous</button>
              <span className="muted pg">{data.page} / {data.pages}</span>
              <button className="btn ghost small" disabled={page >= data.pages || loading} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </div>
          </div>
        )}
      </div>
      {sheet && (
        <FilterSheet
          onClose={() => setSheet(false)} levelFilter={!!levelFilter} statusFilter={statusFilter} summary={summary}
          value={{ level, status, sort: sortOpt.value }} total={data?.total}
          onApply={(v) => { update({ level: v.level ? String(v.level) : undefined, status: v.status === 'all' ? undefined : v.status, sort: v.sort === SORTS[0].value ? undefined : v.sort }); setSheet(false); }}
          onExport={onExport ? () => { setSheet(false); void exportCsv(); } : undefined} canExport={!!data?.total && !exporting}
        />
      )}
    </div>
  );
}


/** Bottom sheet for phones: level, status and sort in one place, applied together. */
function FilterSheet({ onClose, onApply, onExport, canExport, levelFilter, statusFilter, summary, value, total }: {
  onClose: () => void; onApply: (v: { level?: number; status: StatusFilter; sort: string }) => void; onExport?: () => void; canExport: boolean;
  levelFilter: boolean; statusFilter: boolean; summary?: TeamSummary; value: { level?: number; status: StatusFilter; sort: string }; total?: number;
}) {
  const [level, setLevel] = useState(value.level);
  const [status, setStatus] = useState<StatusFilter>(value.status);
  const [sort, setSort] = useState(value.sort);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const levels = (summary?.levels ?? []).filter((l) => l.total > 0 || l.level === level);
  const changed = level !== value.level || status !== value.status || sort !== value.sort;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Sort and filter">
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head"><h2>Sort &amp; filter</h2><button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="sheet-body">
          {levelFilter && (
            <section><h3>Level</h3>
              <div className="pills" role="radiogroup" aria-label="Level">
                <button type="button" role="radio" aria-checked={!level} className={!level ? 'on' : ''} onClick={() => setLevel(undefined)}>All levels</button>
                {levels.map((l) => <button type="button" role="radio" aria-checked={level === l.level} key={l.level} className={level === l.level ? 'on' : ''} onClick={() => setLevel(l.level)}>Level {l.level} <small>{l.total}</small></button>)}
              </div>
            </section>
          )}
          {statusFilter && (
            <section><h3>Status</h3>
              <div className="pills" role="radiogroup" aria-label="Status">
                {([['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']] as const).map(([v, l]) => <button type="button" role="radio" aria-checked={status === v} key={v} className={status === v ? 'on' : ''} onClick={() => setStatus(v)}>{l}</button>)}
              </div>
            </section>
          )}
          <section><h3>Sort by</h3>
            <div className="sort-list" role="radiogroup" aria-label="Sort by">
              {SORTS.map((o) => <button type="button" role="radio" aria-checked={sort === o.value} key={o.value} className={sort === o.value ? 'on' : ''} onClick={() => setSort(o.value)}><span>{o.label}</span><i aria-hidden="true" /></button>)}
            </div>
          </section>
          {onExport && <button type="button" className="link-btn" onClick={onExport} disabled={!canExport}>⤓ Export this list as CSV</button>}
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn ghost" onClick={() => { setLevel(undefined); setStatus('all'); setSort(SORTS[0].value); }}>Reset</button>
          <button type="button" className="btn" onClick={() => onApply({ level, status, sort })}>{changed || total === undefined ? 'Show results' : `Show ${total} result${total === 1 ? '' : 's'}`}</button>
        </div>
      </div>
    </div>
  );
}

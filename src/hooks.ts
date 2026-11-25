import { useSearchParams } from 'react-router-dom';

/** URL-backed filters: any change except `page` itself resets to page 1. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const update = (patch: Record<string, string | undefined>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace: true });
  const page = Math.max(1, Number(params.get('page')) || 1);
  const setPage = (p: number) => update({ page: p <= 1 ? undefined : String(p) });
  return { params, update, page, setPage };
}

import { useCallback, useEffect, useState } from 'react';

/** Loads a list whenever `deps` change; `reload()` refetches after an action. Ignores stale responses. */
export function useList<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let stale = false;
    setLoading(true); setError('');
    fetcher().then((d) => { if (!stale) setData(d); }).catch((e: Error) => { if (!stale) setError(e.message); }).finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}

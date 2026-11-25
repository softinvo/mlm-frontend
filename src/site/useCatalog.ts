import { useEffect, useState } from 'react';
import { api } from '../api';
import { PublicCatalog } from '../types';

/** The live catalog for the public pages. A failure just means no products are listed, never a broken page. */
export function useCatalog() {
  const [data, setData] = useState<PublicCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let stale = false; api.publicCatalog().then((d) => { if (!stale) setData(d); }).catch(() => { if (!stale) setFailed(true); }); return () => { stale = true; }; }, []);
  return { data, failed, loading: !data && !failed };
}

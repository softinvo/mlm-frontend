import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Blocks from './Blocks';
import { useSite } from './SiteContext';
import { SitePageKey } from './types';

/** A public page whose whole content is the list of blocks the head office arranged for it. Links like /contact#enquire scroll to their block. */
export default function BlockPage({ page }: { page: SitePageKey }) {
  const site = useSite();
  const { hash, pathname } = useLocation();
  const blocks = site.pages[page] ?? [];
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    const t = setInterval(() => { // the blocks render after the content arrives, so look for a moment
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); clearInterval(t); } else if (++tries > 20) clearInterval(t);
    }, 150);
    return () => clearInterval(t);
  }, [hash, pathname, blocks.length]);
  return <Blocks blocks={blocks} />;
}

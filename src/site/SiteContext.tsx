import { createContext, CSSProperties, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { FALLBACK_SITE } from './fallback';
import { SiteContent, SiteSettings } from './types';

/** Replaces {{name}} everywhere in the content with the company name from Settings, so one setting renames the whole site. */
const withName = (site: SiteContent): SiteContent => {
  const name = site.settings.name;
  const walk = (v: unknown): unknown => (typeof v === 'string' ? v.split('{{name}}').join(name) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(site) as SiteContent;
};

const Ctx = createContext<SiteContent>(withName(FALLBACK_SITE));
export const useSite = () => useContext(Ctx);
export const useSettings = (): SiteSettings => useContext(Ctx).settings;

/** Loads the website's content (managed in the admin app) once and shares it with every public page. */
export function SiteProvider({ children }: { children: (themeStyle: CSSProperties) => ReactNode }) {
  const [site, setSite] = useState<SiteContent>(() => withName(FALLBACK_SITE));
  useEffect(() => { let stale = false; api.publicSite().then((d) => { if (!stale) setSite(withName(d)); }).catch(() => {}); return () => { stale = true; }; }, []);
  useEffect(() => { document.title = site.settings.name; }, [site.settings.name]);
  const t = site.settings.theme;
  // The admin's colours become the website's design tokens (everything on the public site reads these).
  const style = {
    '--bg': t.cream, '--surface': t.card, '--text': t.forest, '--muted': t.mute, '--border': t.line,
    '--primary': t.forest, '--primary-ink': t.cream, '--primary-soft': t.sage, '--accent': t.gold,
    '--hero-a': t.forest, '--hero-b': t.forestDeep, '--hero-ink': t.cream, '--gold': t.gold, '--deep': t.forestDeep,
  } as CSSProperties;
  return <Ctx.Provider value={site}>{children(style)}</Ctx.Provider>;
}

import { SiteContent } from './types';
import defaults from './defaultSite.json';

/**
 * The website's built-in content, shown whenever the API can't be reached (and until the live content arrives).
 * It is generated from the backend's defaults, so it is always the full site: run `npm run export:site` in the backend after changing them.
 */
export const FALLBACK_SITE = defaults as unknown as SiteContent;

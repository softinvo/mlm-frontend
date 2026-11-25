export interface SiteLink { label: string; to: string }
export interface SiteTheme { forest: string; forestDeep: string; cream: string; card: string; sage: string; line: string; gold: string; mute: string }
export interface SiteSettings {
  name: string; tagline: string; logoUrl: string; email: string; phone: string; whatsapp: string; address: string; hours: string; footerAbout: string; footerNote: string; disclaimer: string;
  nav: { label: string; to: string }[]; theme: SiteTheme;
}
export interface SiteCard { title: string; text: string; imageUrl: string; link: SiteLink; tag: string; badge: string; note: string; listLabel: string; list: string[] }
interface B { id: string; visible: boolean }
export type SiteBlock =
  | (B & { type: 'pagehero'; kicker: string; title: string; text: string; primary: SiteLink; secondary: SiteLink })
  | (B & { type: 'hero'; kicker: string; title: string; text: string; primary: SiteLink; secondary: SiteLink; noteText: string; noteLink: SiteLink; imageUrl: string })
  | (B & { type: 'strip'; items: { label: string; text: string }[] })
  | (B & { type: 'cards'; kicker: string; title: string; intro: string; columns: 2 | 3 | 4; cta: SiteLink; cards: SiteCard[] })
  | (B & { type: 'stats'; kicker: string; title: string; intro: string; items: { value: string; label: string }[]; note: string; cta: SiteLink })
  | (B & { type: 'chips'; kicker: string; title: string; intro: string; items: string[]; cta: SiteLink })
  | (B & { type: 'callout'; label: string; value: string; title: string; text: string })
  | (B & { type: 'quote'; kicker: string; title: string; intro: string; products: string[]; roles: string[]; successText: string })
  | (B & { type: 'products'; kicker: string; title: string; intro: string; show: 'all' | 'kits' | 'products'; limit: number; tabs: boolean; cta: SiteLink })
  | (B & { type: 'split'; kicker: string; title: string; text: string; bullets: string[]; imageUrl: string; imageSide: 'left' | 'right'; cta: SiteLink })
  | (B & { type: 'steps'; kicker: string; title: string; intro: string; steps: { title: string; text: string }[] })
  | (B & { type: 'faq'; kicker: string; title: string; items: { q: string; a: string }[] })
  | (B & { type: 'levels'; kicker: string; title: string; intro: string; note: string })
  | (B & { type: 'gallery'; includeProducts: boolean; kicker: string; title: string; intro: string; limit: number; cta: SiteLink })
  | (B & { type: 'cashback'; kicker: string; title: string; intro: string; note: string; cta: SiteLink })
  | (B & { type: 'plans'; kicker: string; title: string; intro: string; note: string; cta: SiteLink })
  | (B & { type: 'contact'; formTitle: string; infoTitle: string; infoNote: string })
  | (B & { type: 'cta'; title: string; text: string; primary: SiteLink; secondary: SiteLink })
  | (B & { type: 'text'; kicker: string; title: string; paragraphs: string[] });
export type SitePageKey = 'home' | 'about' | 'products' | 'franchise' | 'opportunity' | 'gallery' | 'contact';
export interface SiteContent { settings: SiteSettings; pages: Record<SitePageKey, SiteBlock[]> }

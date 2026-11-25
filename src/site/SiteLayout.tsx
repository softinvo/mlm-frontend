import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { SiteProvider, useSettings } from './SiteContext';
import './site.css';

const year = new Date().getFullYear();
const HEADER_ITEMS = 6; // the rest go under "More" so the header never gets crowded

function Logo() {
  const SITE = useSettings();
  return SITE.logoUrl ? <img className="site-logo-img" src={SITE.logoUrl} alt={SITE.name} /> : <><span className="site-logo" aria-hidden="true">◆</span><span>{SITE.name}</span></>;
}

const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5h.5a8.5 8.5 0 0 1 8 8z" /></svg>
);

function Shell({ themeStyle }: { themeStyle: React.CSSProperties }) {
  const SITE = useSettings();
  const { authed } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMore(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 8); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  useEffect(() => {
    if (!more) return;
    const off = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMore(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMore(false); };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, [more]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  const items = SITE.nav;
  const shown = items.slice(0, HEADER_ITEMS);
  const rest = items.slice(HEADER_ITEMS);
  const link = (n: { label: string; to: string }, cls = '') => <NavLink key={n.to + n.label} to={n.to} end={n.to === '/'} className={({ isActive }) => `site-link ${isActive ? 'on' : ''} ${cls}`}>{n.label}</NavLink>;
  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${SITE.name}, I am interested in your products.`)}` : '';

  return (
    <div className="site" style={themeStyle}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="site-wrap site-bar">
          <Link to="/" className="site-brand" aria-label={`${SITE.name} home`}><Logo /></Link>
          <nav className="site-nav" aria-label="Main">
            {shown.map((n) => link(n))}
            {rest.length > 0 && (
              <div className="site-more" ref={moreRef}>
                <button type="button" className={`site-link ${more || rest.some((n) => n.to === pathname) ? 'on' : ''}`} aria-expanded={more} aria-haspopup="true" onClick={() => setMore(!more)}>More <span aria-hidden="true">▾</span></button>
                {more && <div className="site-more-pop" role="menu">{rest.map((n) => <NavLink key={n.to} to={n.to} role="menuitem" className={({ isActive }) => `site-more-item ${isActive ? 'on' : ''}`}>{n.label}</NavLink>)}</div>}
              </div>
            )}
            {authed ? <Link className="site-link cta" to="/dashboard">Dashboard</Link> : <><Link className="site-link ghost" to="/login">Sign in</Link><Link className="site-link cta" to="/register">Sign up</Link></>}
          </nav>
          <div className="site-tools">
            <button type="button" className="site-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="site-drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <nav className="site-drawer" aria-label="Main menu">
            {items.map((n) => link(n, 'drawer-link'))}
            {authed ? <Link className="site-link cta drawer-link" to="/dashboard">Dashboard</Link> : <><Link className="site-link ghost drawer-link" to="/login">Sign in</Link><Link className="site-link cta drawer-link" to="/register">Sign up</Link></>}
          </nav>
        </div>
      )}

      <main id="main"><Outlet /></main>

      {wa && <a className="wa-float" href={wa} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><WhatsAppIcon /><span>WhatsApp</span></a>}

      <footer className="site-footer">
        <div className="site-wrap footer-grid">
          <div className="footer-about">
            <Link to="/" className="site-brand"><Logo /></Link>
            <p>{SITE.footerAbout || SITE.tagline}</p>
            {SITE.address && <p className="footer-addr">{SITE.address}</p>}
            {wa && <a className="footer-wa" href={wa} target="_blank" rel="noreferrer">WhatsApp our team</a>}
          </div>
          <div>
            <h4>Pages</h4>
            <ul>{items.map((n) => <li key={n.to + n.label}><Link to={n.to}>{n.label}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Your account</h4>
            <ul>{authed ? <li><Link to="/dashboard">Dashboard</Link></li> : <><li><Link to="/login">Sign in</Link></li><li><Link to="/register">Sign up</Link></li></>}<li><Link to="/contact#enquire">Send an enquiry</Link></li></ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul><li><Link to="/terms">Terms &amp; Conditions</Link></li><li><Link to="/privacy">Privacy Policy</Link></li></ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="footer-contact">
              {SITE.email && <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>}
              {SITE.phone && <li><a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></li>}
              {SITE.hours && <li className="muted">{SITE.hours}</li>}
            </ul>
          </div>
        </div>
        <div className="site-wrap footer-bottom">
          {SITE.footerNote && <p>{SITE.footerNote}</p>}
          {SITE.disclaimer && <p className="disclaimer">{SITE.disclaimer}</p>}
          <p className="footer-legal"><span>© {year} {SITE.name}. All rights reserved.</span><span className="footer-legal-links"><Link to="/terms">Terms &amp; Conditions</Link><Link to="/privacy">Privacy Policy</Link></span></p>
        </div>
      </footer>
    </div>
  );
}

export default function SiteLayout() {
  return <SiteProvider>{(themeStyle) => <Shell themeStyle={themeStyle} />}</SiteProvider>;
}

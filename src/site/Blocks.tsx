import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Modal from '../components/Modal';
import Thumb from '../components/Thumb';
import { inr } from '../format';
import Reveal from './Reveal';
import { useSettings } from './SiteContext';
import { SiteBlock, SiteLink } from './types';
import { useCatalog } from './useCatalog';

/** A link that works for in-app paths (/register), anchors, web addresses, mailto: and tel:. Empty links render nothing. */
export function SiteLinkEl({ link, className }: { link?: SiteLink; className: string }) {
  if (!link || !link.label || !link.to) return null;
  return /^\//.test(link.to) ? <Link className={className} to={link.to}>{link.label}</Link> : <a className={className} href={link.to} {...(/^https?:/.test(link.to) ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label}</a>;
}

const Head = ({ kicker, title, intro, center = true }: { kicker?: string; title?: string; intro?: string; center?: boolean }) =>
  !kicker && !title && !intro ? null : (
    <Reveal as="header" className={`section-head ${center ? '' : 'left'}`}>
      {kicker && <span className="kicker">{kicker}</span>}
      {title && <h2>{title}</h2>}
      {intro && <p>{intro}</p>}
    </Reveal>
  );

const Section = ({ alt, children, className = '', id }: { alt: boolean; children: ReactNode; className?: string; id?: string }) => <section id={id} className={`section ${alt ? 'alt' : ''} ${className}`}><div className="site-wrap">{children}</div></section>;

/** Status words (Certified, Live, In progress…) get a colour. */
const tone = (t: string) => (/certified|live|done|ready/i.test(t) ? 'ok' : /progress|soon|pending|upcoming/i.test(t) ? 'wip' : '');

function Hero({ b }: { b: Extract<SiteBlock, { type: 'hero' }> }) {
  const { data } = useCatalog();
  const featured = [...(data?.packages ?? []).slice(0, 2).map((p) => ({ ...p, tag: 'Joining kit' })), ...(data?.products ?? []).slice(0, 2).map((p) => ({ ...p, tag: 'Product' }))].slice(0, 4);
  return (
    <section className="lp-hero">
      <div className="site-wrap hero-grid">
        <div className="hero-copy">
          {b.kicker && <span className="kicker anim a1">{b.kicker}</span>}
          <h1 className="anim a2">{b.title}</h1>
          {b.text && <p className="lead anim a3">{b.text}</p>}
          <div className="hero-actions anim a4"><SiteLinkEl link={b.primary} className="btn gold" /><SiteLinkEl link={b.secondary} className="btn ghost" /></div>
          {(b.noteText || b.noteLink?.label) && <p className="hero-note anim a5">{b.noteText} <SiteLinkEl link={b.noteLink} className="" /></p>}
        </div>
        <div className="hero-visual anim a3">
          {b.imageUrl ? <div className="hero-photo"><img src={b.imageUrl} alt="" /></div> : featured.length > 0 ? (
            <div className="hero-cards">
              {featured.map((p, i) => (
                <Link to="/products" key={p.id} className={`hero-card c${i}`}>
                  <Thumb url={p.imageUrl} name={p.name} size={72} />
                  <div><small>{p.tag}</small><strong>{p.name}</strong><span>{inr(p.pricePaise)}</span></div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Products({ b, alt }: { b: Extract<SiteBlock, { type: 'products' }>; alt: boolean }) {
  const { data, loading, failed } = useCatalog();
  const [tab, setTab] = useState<'all' | 'kits' | 'products'>(b.show);
  const [view, setView] = useState<{ name: string; url: string } | null>(null);
  const cut = <T,>(l: T[]) => (b.limit > 0 ? l.slice(0, b.limit) : l);
  const kits = tab === 'products' ? [] : cut(data?.packages ?? []);
  const items = tab === 'kits' ? [] : cut(data?.products ?? []);
  const card = (p: { id: string; name: string; description: string; pricePaise: number; imageUrl: string }, tag: string, i: number) => (
    <Reveal as="article" key={p.id} className="product" delay={(i % 4) * 80}>
      <div className="product-photo">{p.imageUrl ? <button type="button" className="photo-btn" onClick={() => setView({ name: p.name, url: p.imageUrl })} aria-label={`View ${p.name} larger`}><Thumb url={p.imageUrl} name={p.name} size={160} /></button> : <Thumb name={p.name} size={160} />}</div>
      <small className="muted">{tag}</small><h3>{p.name}</h3>
      {p.description && <p className="muted product-desc">{p.description}</p>}
      <strong>{inr(p.pricePaise)}</strong><small className="muted">Price includes taxes</small>
    </Reveal>
  );
  return (
    <Section alt={alt} id={b.id}>
      <Head kicker={b.kicker} title={b.title} intro={b.intro} />
      {b.tabs && <div className="tabs" role="tablist">{([['all', 'All'], ['kits', 'Joining kits'], ['products', 'Repurchase products']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>}
      {loading ? <p className="muted lp-center">Loading products…</p> : failed ? <p className="muted lp-center">We couldn’t load the products just now. Please try again in a moment.</p> : kits.length + items.length === 0 ? <p className="muted lp-center">Products will appear here soon.</p> : (
        <>
          {b.tabs ? (
            <>
              {kits.length > 0 && <><h3 className="grid-title">Joining kits</h3><div className="product-grid">{kits.map((p, i) => card(p, 'Joining kit', i))}</div></>}
              {items.length > 0 && <><h3 className="grid-title">Repurchase products</h3><div className="product-grid">{items.map((p, i) => card(p, 'Product', i))}</div></>}
            </>
          ) : (
            <div className="product-grid">{[...kits.map((p) => ({ p, tag: 'Joining kit' })), ...items.map((p) => ({ p, tag: 'Product' }))].map((x, i) => card(x.p, x.tag, i))}</div>
          )}
        </>
      )}
      <div className="lp-center"><SiteLinkEl link={b.cta} className="btn ghost" /></div>
      {view && <Modal title={view.name} onClose={() => setView(null)}><img className="photo-large" src={view.url} alt={view.name} /></Modal>}
    </Section>
  );
}

function Levels({ b, alt }: { b: Extract<SiteBlock, { type: 'levels' }>; alt: boolean }) {
  const { data } = useCatalog();
  const levels = data?.plan?.levels ?? [];
  const royalty = data?.plan?.repurchaseLevels ?? [];
  if (!levels.length && !royalty.length) return null;
  return (
    <Section alt={alt}>
      <div className="lp-two">
        <Reveal className="prose">{b.kicker && <span className="kicker">{b.kicker}</span>}<h2>{b.title}</h2>{b.intro && <p>{b.intro}</p>}{b.note && <p className="muted">{b.note}</p>}</Reveal>
        <Reveal className="level-table" delay={120}>
          {levels.length > 0 && <>
            <div className="lt-head"><span>{royalty.length ? 'Joining packages' : 'Level'}</span><span>Share of retail sales</span></div>
            {levels.map((l) => <div className="lt-row" key={l.level}><span>{l.level === 1 ? 'Level 1 (your direct team)' : `Level ${l.level}`}</span><strong>{l.percent}%</strong></div>)}
          </>}
          {royalty.length > 0 && <>
            <div className="lt-head"><span>Repurchase royalty</span><span>On product purchases</span></div>
            {royalty.map((l) => <div className="lt-row" key={`r${l.level}`}><span>{l.level === 1 ? 'Level 1 (your direct team)' : `Level ${l.level}`}</span><strong>{l.percent}%</strong></div>)}
            <div className="lt-row lt-total"><span>Total</span><strong>{Math.round(royalty.reduce((n, l) => n + l.percent, 0) * 100) / 100}%</strong></div>
          </>}
        </Reveal>
      </div>
    </Section>
  );
}

function Gallery({ b, alt }: { b: Extract<SiteBlock, { type: 'gallery' }>; alt: boolean }) {
  const { data } = useCatalog();
  const [mine, setMine] = useState<{ src: string; caption: string }[]>([]);
  const [view, setView] = useState<{ src: string; caption: string } | null>(null);
  useEffect(() => { let stale = false; api.publicGallery().then((d) => { if (!stale) setMine(d.items.map((p) => ({ src: p.url, caption: p.caption }))); }).catch(() => {}); return () => { stale = true; }; }, []);
  const all = [...mine, ...(b.includeProducts ? [...(data?.packages ?? []), ...(data?.products ?? [])].filter((p) => p.imageUrl).map((p) => ({ src: p.imageUrl, caption: p.name })) : [])];
  const photos = b.limit > 0 ? all.slice(0, b.limit) : all;
  return (
    <Section alt={alt} id={b.id}>
      <Head kicker={b.kicker} title={b.title} intro={b.intro} />
      {photos.length === 0 ? <div className="empty-state"><span aria-hidden="true">📷</span><h3>Photos are coming soon</h3><p className="muted">We’re putting our gallery together. Please check back shortly.</p></div> : (
        <ul className="gallery">{photos.map((p, i) => <li key={p.src + i}><button type="button" onClick={() => setView(p)} aria-label={`View photo: ${p.caption}`}><img src={p.src} alt={p.caption} loading="lazy" /><span>{p.caption}</span></button></li>)}</ul>
      )}
      {b.cta?.label && photos.length > 0 && <div className="lp-center"><SiteLinkEl link={b.cta} className="btn ghost" /></div>}
      {view && <Modal title={view.caption || 'Photo'} onClose={() => setView(null)}><img className="photo-large" src={view.src} alt={view.caption} /></Modal>}
    </Section>
  );
}

/** "1% a day for 30 days": shown only while the head office has cashback switched on, straight from the live rules. */
function Cashback({ b, alt }: { b: Extract<SiteBlock, { type: 'cashback' }>; alt: boolean }) {
  const { data } = useCatalog();
  const c = data?.cashback;
  if (!c) return null;
  const num = (n: number) => String(Math.round(n * 100) / 100);
  const perDay = (c.percentPerDay * 1000) / 100; // on ₹1,000
  return (
    <Section alt={alt} id={b.id}>
      <div className="lp-two">
        <Reveal className="prose">
          {b.kicker && <span className="kicker">{b.kicker}</span>}<h2>{b.title}</h2>{b.intro && <p>{b.intro}</p>}
          {b.note && <p className="muted">{b.note}</p>}
          {b.cta?.label && <SiteLinkEl link={b.cta} className="btn" />}
        </Reveal>
        <Reveal className="cb-card" delay={120}>
          <div className="cb-big"><strong>{num(c.percentPerDay)}%</strong><span>a day</span></div>
          <ul className="cb-facts">
            <li><strong>{c.days} days</strong><span>of cashback on each purchase</span></li>
            <li><strong>{num(c.totalPercent)}%</strong><span>back in total, at most</span></li>
          </ul>
          <p className="cb-eg">Example: ₹1,000 of eligible products pays <strong>₹{num(perDay)}</strong> a day, <strong>₹{num(perDay * c.days)}</strong> over {c.days} days.</p>
        </Reveal>
      </div>
    </Section>
  );
}

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

/** The franchise plans (Mini, Standard, Premium…), live from the head office's franchise types. */
function Plans({ b, alt }: { b: Extract<SiteBlock, { type: 'plans' }>; alt: boolean }) {
  const { data } = useCatalog();
  const plans = data?.plans ?? [];
  if (!plans.length) return null;
  const top = Math.max(...plans.map((p) => p.rank));
  const lower = (p: { rank: number }) => plans.filter((x) => x.rank < p.rank).map((x) => x.name);
  return (
    <Section alt={alt} id={b.id}>
      <Head kicker={b.kicker} title={b.title} intro={b.intro} />
      <div className={`plan-grid p${Math.min(plans.length, 4)}`}>
        {plans.map((p, i) => {
          const manages = lower(p);
          return (
            <Reveal as="article" key={p.name} className={`plan ${p.rank === top && plans.length > 1 ? 'top' : ''}`} delay={i * 100}>
              {p.rank === top && plans.length > 1 && <span className="plan-flag">Largest plan</span>}
              <h3>{p.name}</h3>
              {p.description && <p className="plan-desc">{p.description}</p>}
              <div className="plan-figs">
                <div><small>Opening investment</small><strong>{p.investmentPaise > 0 ? rupees(p.investmentPaise) : 'On request'}</strong></div>
                <div><small>Your discount</small><strong>{p.discountPercent}%</strong></div>
              </div>
              <ul className="ticks">
                <li>{p.discountPercent}% off the retail price on every product you stock</li>
                <li>Opening stock supplied against your investment</li>
                {p.maxMembers > 0 && <li>Serve up to {p.maxMembers.toLocaleString('en-IN')} members</li>}
                <li>{manages.length ? `Can supply and manage ${manages.join(' and ')} franchises` : 'Serves members directly'}</li>
              </ul>
              <SiteLinkEl link={b.cta} className="btn ghost" />
            </Reveal>
          );
        })}
      </div>
      {b.note && <p className="stat-note">{b.note}</p>}
    </Section>
  );
}

function Contact({ b, alt }: { b: Extract<SiteBlock, { type: 'contact' }>; alt: boolean }) {
  const s = useSettings();
  const empty = { name: '', email: '', phone: '', subject: '', message: '', website: '' };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const ok = f.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email) && f.message.trim().length >= 10 && (!f.phone || /^[6-9]\d{9}$/.test(f.phone));
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!ok) return;
    setBusy(true); setError('');
    try { await api.sendContact({ name: f.name.trim(), email: f.email.trim(), phone: f.phone || undefined, subject: f.subject.trim() || undefined, message: f.message.trim(), website: f.website }); setSent(true); }
    catch (ex) { setError((ex as Error).message); } finally { setBusy(false); }
  }
  return (
    <Section alt={alt} id={b.id}>
      <div className="contact-grid">
        <Reveal className="contact-card">
          {sent ? (
            <div className="sent"><span aria-hidden="true">✓</span><h2>Message sent</h2><p>Thank you, {f.name.split(' ')[0]}. We’ll get back to you at {f.email} soon.</p><button className="btn ghost" onClick={() => { setSent(false); setF(empty); }}>Send another</button></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2>{b.formTitle || 'Send a message'}</h2>
              <div className="form-2">
                <label className="field"><span>Your name</span><input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" required /></label>
                <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} maxLength={120} autoComplete="email" required /></label>
              </div>
              <div className="form-2">
                <label className="field"><span>Mobile (optional)</span><input inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} autoComplete="tel" /></label>
                <label className="field"><span>Subject (optional)</span><input value={f.subject} onChange={set('subject')} maxLength={120} /></label>
              </div>
              <label className="field"><span>Message</span><textarea value={f.message} onChange={set('message')} rows={6} maxLength={4000} required /></label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={set('website')} />
              {error && <div className="alert">{error}</div>}
              <button className="btn" disabled={!ok || busy}>{busy ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </Reveal>
        <Reveal as="aside" className="contact-info" delay={120}>
          <h2>{b.infoTitle || 'Reach us directly'}</h2>
          <ul>
            {s.email && <li><span aria-hidden="true">✉</span><div><strong>Email</strong><a href={`mailto:${s.email}`}>{s.email}</a></div></li>}
            {s.phone && <li><span aria-hidden="true">☎</span><div><strong>Phone</strong><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></div></li>}
            {s.address && <li><span aria-hidden="true">⌂</span><div><strong>Head office</strong><span>{s.address}</span></div></li>}
            {s.hours && <li><span aria-hidden="true">◷</span><div><strong>Hours</strong><span>{s.hours}</span></div></li>}
          </ul>
          {b.infoNote && <p className="muted">{b.infoNote}</p>}
        </Reveal>
      </div>
    </Section>
  );
}

function Faq({ b, alt }: { b: Extract<SiteBlock, { type: 'faq' }>; alt: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section alt={alt} className="lp-narrow">
      <Head kicker={b.kicker} title={b.title} />
      <div className="faq">{b.items.map((it, i) => (
        <Reveal key={i} className={`faq-item ${open === i ? 'open' : ''}`} delay={i * 50}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{it.q}<span aria-hidden="true">{open === i ? '−' : '+'}</span></button>
          {open === i && <p>{it.a}</p>}
        </Reveal>
      ))}</div>
    </Section>
  );
}

/** The enquiry form: two short steps (what you are interested in, then who you are). Sent to the head office like any website message. */
function Quote({ b, alt }: { b: Extract<SiteBlock, { type: 'quote' }>; alt: boolean }) {
  const s = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [f, setF] = useState({ product: '', destination: '', role: b.roles[0] ?? '', name: '', email: '', phone: '', note: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const step1 = f.product.trim().length > 0;
  const step2 = f.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email) && (!f.phone || /^[6-9]\d{9}$/.test(f.phone));
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!step2) return;
    setBusy(true); setError('');
    const message = [`Enquiry`, `Interested in: ${f.product}`, f.destination && `City or area: ${f.destination}`, f.role && `I am: ${f.role}`, f.note && `Notes: ${f.note}`].filter(Boolean).join('\n');
    try { await api.sendContact({ name: f.name.trim(), email: f.email.trim(), phone: f.phone || undefined, subject: `Enquiry: ${f.product}`, message, website: f.website }); setSent(true); }
    catch (ex) { setError((ex as Error).message); } finally { setBusy(false); }
  }
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${s.name}, I am interested in your products.`)}` : '';
  return (
    <Section id={b.id} alt={alt}>
      <div className="quote-grid">
        <Reveal className="quote-copy">
          {b.kicker && <span className="kicker">{b.kicker}</span>}<h2>{b.title}</h2>{b.intro && <p>{b.intro}</p>}
          <ul className="quote-contacts">
            {s.address && <li><span aria-hidden="true">⌂</span>{s.address}</li>}
            {wa && <li><span aria-hidden="true">✆</span><a href={wa} target="_blank" rel="noreferrer">WhatsApp our team{s.phone ? `  ${s.phone}` : ''}</a></li>}
            {!wa && s.phone && <li><span aria-hidden="true">☎</span><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></li>}
            {s.email && <li><span aria-hidden="true">✉</span><a href={`mailto:${s.email}`}>{s.email}</a></li>}
          </ul>
        </Reveal>
        <Reveal className="contact-card quote-card" delay={120}>
          {sent ? (
            <div className="sent"><span aria-hidden="true">✓</span><h2>Enquiry sent</h2><p>{b.successText || 'Thank you. We will come back to you shortly.'}</p><button className="btn ghost" onClick={() => { setSent(false); setStep(1); setF({ ...f, product: '', destination: '', note: '' }); }}>Send another</button></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h3 className="quote-title">Send an enquiry <small>Step {step} of 2</small></h3>
              {step === 1 ? (
                <>
                  <label className="field"><span>I am interested in</span><select value={f.product} onChange={set('product')}><option value="">Select…</option>{b.products.map((p) => <option key={p}>{p}</option>)}</select></label>
                  <label className="field"><span>Your city or area (optional)</span><input value={f.destination} onChange={set('destination')} maxLength={80} placeholder="e.g. Pune" /></label>
                  {b.roles.length > 0 && <div className="field"><span>I am</span><div className="pills" role="radiogroup" aria-label="I am">{b.roles.map((r) => <button type="button" key={r} role="radio" aria-checked={f.role === r} className={f.role === r ? 'on' : ''} onClick={() => setF({ ...f, role: r })}>{r}</button>)}</div></div>}
                  <button type="button" className="btn" disabled={!step1} onClick={() => setStep(2)}>Continue</button>
                </>
              ) : (
                <>
                  <p className="muted quote-summary">{f.product}{f.destination ? ` · ${f.destination}` : ''}</p>
                  <div className="form-2">
                    <label className="field"><span>Your name</span><input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" required /></label>
                    <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} maxLength={120} autoComplete="email" required /></label>
                  </div>
                  <label className="field"><span>Mobile (optional)</span><input inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} autoComplete="tel" /></label>
                  <label className="field"><span>Anything else? (optional)</span><textarea value={f.note} onChange={set('note')} rows={3} maxLength={1000} /></label>
                  <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.website} onChange={set('website')} />
                  {error && <div className="alert">{error}</div>}
                  <div className="quote-actions"><button type="button" className="btn ghost" onClick={() => setStep(1)}>Back</button><button className="btn" disabled={!step2 || busy}>{busy ? 'Sending…' : 'Send enquiry'}</button></div>
                </>
              )}
            </form>
          )}
        </Reveal>
      </div>
    </Section>
  );
}

/** Renders one page's blocks in order. Hidden blocks are skipped; content sections alternate cream and sage. */
export default function Blocks({ blocks }: { blocks: SiteBlock[] }) {
  let n = 0;
  const out: ReactNode[] = [];
  for (const b of blocks) {
    if (!b.visible) continue;
    const alt = n % 2 === 1;
    switch (b.type) {
      case 'hero': out.push(<Hero key={b.id} b={b} />); break;
      case 'pagehero': out.push(<section key={b.id} id={b.id} className="page-hero"><div className="site-wrap">{b.kicker && <span className="kicker anim a1">{b.kicker}</span>}<h1 className="anim a2">{b.title}</h1>{b.text && <p className="lead anim a3">{b.text}</p>}{(b.primary?.label || b.secondary?.label) && <div className="hero-actions anim a4"><SiteLinkEl link={b.primary} className="btn" /><SiteLinkEl link={b.secondary} className="btn ghost" /></div>}</div></section>); break;
      case 'strip': out.push(<section key={b.id} id={b.id} className="strip"><div className="site-wrap strip-grid">{b.items.map((it, i) => <Reveal key={i} className="strip-item" delay={i * 80}><strong>{it.label}</strong><span>{it.text}</span></Reveal>)}</div></section>); break;
      case 'cards': n++; out.push(
        <Section key={b.id} id={b.id} alt={alt}>
          <Head kicker={b.kicker} title={b.title} intro={b.intro} />
          <div className={`offer-grid cols-${b.columns}`}>{b.cards.map((c, i) => (
            <Reveal as="article" key={i} className="offer" delay={(i % 4) * 90}>
              {c.imageUrl && <div className="offer-photo"><img src={c.imageUrl} alt="" loading="lazy" /></div>}
              {(c.tag || c.badge) && <div className="offer-tags">{c.tag && <span className="offer-tag">{c.tag}</span>}{c.badge && <span className={`status-pill ${tone(c.badge)}`}>{c.badge}</span>}</div>}
              <h3>{c.title}</h3>{c.text && <p>{c.text}</p>}{c.note && <p className="offer-note">{c.note}</p>}
              {c.list.length > 0 && <div className="offer-list">{c.listLabel && <span className="kicker">{c.listLabel}</span>}<ul>{c.list.map((t, k) => <li key={k}>{t}</li>)}</ul></div>}
              <SiteLinkEl link={c.link} className="text-link" />
            </Reveal>
          ))}</div>
          {b.cta?.label && <div className="lp-center"><SiteLinkEl link={b.cta} className="btn ghost" /></div>}
        </Section>); break;
      case 'stats': n++; out.push(
        <Section key={b.id} id={b.id} alt={alt}>
          <Head kicker={b.kicker} title={b.title} intro={b.intro} />
          <div className={`stat-grid s${Math.min(b.items.length, 4)}`}>{b.items.map((it, i) => <Reveal key={i} className="stat" delay={i * 90}><strong>{it.value}</strong><span>{it.label}</span></Reveal>)}</div>
          {b.note && <p className="stat-note">{b.note}</p>}
          {b.cta?.label && <div className="lp-center"><SiteLinkEl link={b.cta} className="btn ghost" /></div>}
        </Section>); break;
      case 'chips': n++; out.push(
        <Section key={b.id} id={b.id} alt={alt}>
          <Head kicker={b.kicker} title={b.title} intro={b.intro} />
          <ul className="chip-list">{b.items.map((t, i) => <Reveal as="li" key={i} delay={i * 50}>{t}</Reveal>)}</ul>
          {b.cta?.label && <div className="lp-center"><SiteLinkEl link={b.cta} className="btn ghost" /></div>}
        </Section>); break;
      case 'callout': out.push(
        <section key={b.id} id={b.id} className="callout-wrap"><div className="site-wrap"><Reveal className="callout"><span className="callout-label">{b.label}</span><strong className="callout-value">{b.value}</strong><div><h3>{b.title}</h3>{b.text && <small>{b.text}</small>}</div></Reveal></div></section>); break;
      case 'cashback': n++; out.push(<Cashback key={b.id} b={b} alt={alt} />); break;
      case 'plans': n++; out.push(<Plans key={b.id} b={b} alt={alt} />); break;
      case 'quote': n++; out.push(<Quote key={b.id} b={b} alt={alt} />); break;
      case 'products': n++; out.push(<Products key={b.id} b={b} alt={alt} />); break;
      case 'split': n++; out.push(
        <Section key={b.id} id={b.id} alt={alt}>
          <div className={`split ${b.imageSide === 'left' ? 'flip' : ''} ${b.imageUrl ? '' : 'no-img'}`}>
            <Reveal className="split-copy">
              {b.kicker && <span className="kicker">{b.kicker}</span>}<h2>{b.title}</h2>{b.text && <p>{b.text}</p>}
              {b.bullets.length > 0 && <ul className="ticks">{b.bullets.map((t, i) => <li key={i}>{t}</li>)}</ul>}
              <SiteLinkEl link={b.cta} className="btn ghost" />
            </Reveal>
            {b.imageUrl && <Reveal className="split-photo" delay={120}><img src={b.imageUrl} alt="" loading="lazy" /></Reveal>}
          </div>
        </Section>); break;
      case 'steps': n++; out.push(
        <Section key={b.id} id={b.id} alt={alt}>
          <Head kicker={b.kicker} title={b.title} intro={b.intro} />
          <ol className="how-steps">{b.steps.map((s, i) => <Reveal as="li" key={i} delay={i * 120}><span className="step-n">{i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></Reveal>)}</ol>
        </Section>); break;
      case 'faq': n++; out.push(<Faq key={b.id} b={b} alt={alt} />); break;
      case 'levels': n++; out.push(<Levels key={b.id} b={b} alt={alt} />); break;
      case 'gallery': n++; out.push(<Gallery key={b.id} b={b} alt={alt} />); break;
      case 'contact': n++; out.push(<Contact key={b.id} b={b} alt={alt} />); break;
      case 'text': n++; out.push(<Section key={b.id} alt={alt} className="lp-narrow"><Reveal className="prose">{b.kicker && <span className="kicker">{b.kicker}</span>}{b.title && <h2>{b.title}</h2>}{b.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</Reveal></Section>); break;
      case 'cta': out.push(
        <section key={b.id} id={b.id} className="cta-band"><Reveal className="site-wrap cta-inner"><div><h2>{b.title}</h2>{b.text && <p>{b.text}</p>}</div><div className="hero-actions"><SiteLinkEl link={b.primary} className="btn gold" /><SiteLinkEl link={b.secondary} className="btn ghost" /></div></Reveal></section>); break;
    }
  }
  return <>{out}</>;
}

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_UPDATED } from './config';

export interface LegalSection { id: string; title: string; body: ReactNode }

/** A long-form legal page: title, last-updated date, a contents list and numbered sections. */
export default function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <section className="page-hero">
        <div className="site-wrap">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="lead">{intro}</p>
          <p className="legal-updated">Last updated: {LEGAL_UPDATED}</p>
        </div>
      </section>
      <section className="section">
        <div className="site-wrap legal-grid">
          <nav className="legal-toc" aria-label="On this page">
            <strong>On this page</strong>
            <ol>{sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
            <div className="legal-links"><Link to="/terms">Terms &amp; Conditions</Link><Link to="/privacy">Privacy Policy</Link><Link to="/contact">Contact us</Link></div>
          </nav>
          <article className="legal">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id}>
                <h2><span>{i + 1}.</span> {s.title}</h2>
                {s.body}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}

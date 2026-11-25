import { ReactNode } from 'react';
import { useSite } from '../site/SiteContext';
import './auth-site.css';

const POINTS = ['Commission only on verified retail sales', 'Every order and payout visible in your portal', 'Support tickets answered by the head office'];

/** The body of the sign-in and sign-up pages. It sits inside the website's header and footer (see SiteLayout). */
export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const site = useSite();
  const hero = site.pages.home.find((b) => b.type === 'hero');
  const headline = hero && hero.type === 'hero' && hero.title ? hero.title : 'Products you’ll use. A network you can trust.';
  return (
    <section className="auth-page">
      <div className="site-wrap">
        <div className="auth-card">
          <aside className="auth-hero">
            <div className="auth-hero-body">
              <span className="auth-kicker">Member portal</span>
              <h2>{headline}</h2>
              <ul className="auth-points">{POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </aside>
          <main className="auth-panel">
            <h1>{title}</h1>
            <p className="auth-sub">{subtitle}</p>
            {children}
          </main>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { findRoute, navGroups } from '../nav';
import Icon from './Icon';
import ProfileMenu from './ProfileMenu';
import ThemeToggle from './ThemeToggle';

/** Passed to pages through <Outlet context>. */
export interface MemberCtx { setDisplayName: (name: string) => void }

const Brand = () => (<div className="brand"><span className="brand-mark">M</span><span>Member Portal</span></div>);

export default function MemberLayout() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const areaRef = useRef<HTMLElement>(null);
  const [me, setMe] = useState({ name: 'Member', memberCode: '' });
  const [ticketsWaiting, setTicketsWaiting] = useState(0);
  const SUPPORT_PATH = '/dashboard/support/tickets';

  useEffect(() => {
    api.profile().then((p) => setMe({ name: p.name, memberCode: p.memberCode })).catch(() => {});
  }, []);

  // Support tickets waiting for this member's reply: shown as a badge.
  useEffect(() => {
    const loadSupport = () => api.supportSummary().then((d) => setTicketsWaiting(d.needsReply)).catch(() => {});
    loadSupport();
    const t = setInterval(loadSupport, 30_000);
    return () => clearInterval(t);
  }, [pathname]);

  // Keep the group containing the current page expanded; close the mobile drawer on navigation.
  useEffect(() => {
    const g = navGroups.find((g) => g.label === findRoute(pathname)?.group);
    if (g) setOpen((o) => ({ ...o, [g.label]: true }));
    setDrawer(false);
    areaRef.current?.scrollTo({ top: 0 }); // new page starts at the top of the main area
  }, [pathname]);

  const logout = () => { signOut(); nav('/login'); };
  const current = findRoute(pathname);
  const title = pathname.startsWith('/dashboard/support/tickets/') ? 'Ticket' : current?.label ?? 'Dashboard';

  return (
    <div className="layout">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Main navigation">
        <Brand />
        <nav>
          <NavLink to="/dashboard" end className="nav-item">
            <Icon name="home" /> <span className="grow">Dashboard</span>
          </NavLink>

          <p className="nav-label">Menu</p>
          {navGroups.map((g) => {
            const isOpen = !!open[g.label];
            const hasActive = g.label === findRoute(pathname)?.group;
            return (
              <div className="nav-group" key={g.label}>
                <button
                  className={`nav-item ${hasActive ? 'has-active' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpen({ ...open, [g.label]: !isOpen })}
                >
                  <Icon name={g.icon} />
                  <span className="grow">{g.label}</span>
                  {ticketsWaiting > 0 && g.items.some((i) => i.path === SUPPORT_PATH) && !isOpen && <span className="nav-badge" aria-label={`${ticketsWaiting} tickets waiting for your reply`}>{ticketsWaiting}</span>}
                  <Icon name="chevron" size={14} className={`chev ${isOpen ? 'up' : ''}`} />
                </button>
                {isOpen && (
                  <ul className="nav-sub">
                    {g.items.map((i) => (
                      <li key={i.path}><NavLink to={i.path}>{i.label}{i.path === SUPPORT_PATH && ticketsWaiting > 0 && <span className="nav-badge">{ticketsWaiting}</span>}</NavLink></li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <div className="side-foot">
          <button className="nav-item logout" onClick={logout}>
            <Icon name="logout" /> <span className="grow">Logout</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="pagebar">
          <button className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
            <Icon name="menu" size={20} />
          </button>

          <div className="pagebar-title">
            <h1>{title}</h1>
            <nav aria-label="Breadcrumb" className="crumbs">
              <Link to="/dashboard">Home</Link>
              {current && <><span aria-hidden="true" className="crumb-mid">/</span><span className="crumb-mid">{current.group}</span></>}
              <span aria-hidden="true">/</span>
              <span aria-current="page">{title}</span>
            </nav>
          </div>

          <div className="pagebar-right">
            <ThemeToggle />
            <ProfileMenu name={me.name} memberCode={me.memberCode} onLogout={logout} />
          </div>
        </header>

        <main className="main-area" ref={areaRef}>
          <div className="container">
            <Outlet context={{ setDisplayName: (name: string) => setMe((m) => ({ ...m, name })) } satisfies MemberCtx} />
          </div>
        </main>
      </div>
    </div>
  );
}

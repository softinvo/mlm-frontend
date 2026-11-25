import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

const initials = (name: string) => name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';

interface Props { name: string; memberCode: string; onLogout: () => void; links?: { to: string; label: string; icon: 'user' | 'lock' }[] }

const MEMBER_LINKS: NonNullable<Props['links']> = [
  { to: '/dashboard/profile/settings', label: 'Profile Setting', icon: 'user' },
  { to: '/dashboard/profile/password', label: 'Change Password', icon: 'lock' },
];

export default function ProfileMenu({ name, memberCode, onLogout, links = MEMBER_LINKS }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="pmenu" ref={ref}>
      <button className="pmenu-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} aria-label="Account menu">
        <span className="avatar lg" aria-hidden="true">{initials(name)}</span>
        <span className="pmenu-name">{name}</span>
        <Icon name="chevron" size={14} className={`chev ${open ? 'up' : ''}`} />
      </button>
      {open && (
        <div className="pmenu-pop" role="menu">
          <div className="pmenu-head">
            <span className="avatar lg" aria-hidden="true">{initials(name)}</span>
            <div><strong>{name}</strong><small className="muted">{memberCode}</small></div>
          </div>
          {links.map((l) => <Link key={l.to} role="menuitem" to={l.to}><Icon name={l.icon} /> {l.label}</Link>)}
          <button role="menuitem" className="danger" onClick={onLogout}><Icon name="logout" /> Logout</button>
        </div>
      )}
    </div>
  );
}

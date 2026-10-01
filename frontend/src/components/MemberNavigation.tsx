import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Calendar, Film, Users, Heart, UserCircle, Menu, X } from 'lucide-react';

const LINKS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/feed', label: 'Feed', icon: MessageSquare },
  { path: '/events', label: 'Events', icon: Calendar },
  { path: '/gallery', label: 'Gallery', icon: Film },
  { path: '/directory', label: 'Directory', icon: Users },
  { path: '/prayer-requests', label: 'Prayer Wall', icon: Heart },
  { path: '/user/profile', label: 'My Profile', icon: UserCircle },
];

// One navigation bar for every member page, within the existing router context.
export default function MemberNavigation() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <nav className="gsc-member-navigation" aria-label="Church member navigation"
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          document.getElementById('gsc-navigation-toggle')?.focus();
        }
      }}>
      <div className="gsc-member-navigation-top">
        <Link to="/" className="gsc-navigation-brand" aria-label="Good Samaritan Church home">
          <img src="/uccp-logo-transparent.png" alt="" width="40" height="40" />
          <span>Good Samaritan Church<small>Member community</small></span>
        </Link>
        <button id="gsc-navigation-toggle" type="button" className="gsc-navigation-toggle"
          aria-expanded={open} aria-controls="gsc-member-links" onClick={() => setOpen(value => !value)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span>{open ? 'Close' : 'Menu'}</span>
        </button>
        <div id="gsc-member-links" className={`gsc-member-links ${open ? 'is-open' : ''}`}>
          {LINKS.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end className={({ isActive }) => `gsc-member-link ${isActive ? 'is-active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

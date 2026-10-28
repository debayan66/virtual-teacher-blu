import { motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { BluLogo } from './BluMark';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { ToastStack, Tooltip } from './ui';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  hint: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Create', icon: 'spark', hint: 'Landing + lesson console' },
  { to: '/studio', label: 'Lesson Studio', icon: 'studio', hint: 'Cinematic scene playback' },
  { to: '/languages', label: 'Languages', icon: 'globe', hint: 'Offline language gallery' },
  { to: '/library', label: 'Library', icon: 'layers', hint: 'Your generated lessons' },
  { to: '/export', label: 'Export', icon: 'film', hint: 'Render video from a lesson' },
];

function BackendStatusPill() {
  const { backend, backendInfo, probe } = useStore();
  const label =
    backend === 'checking'
      ? 'Checking backend'
      : backend === 'online'
        ? `Local backend ${backendInfo?.version ?? ''}`.trim()
        : 'Backend offline';
  const tone = backend === 'online' ? 'ok' : backend === 'offline' ? 'warn' : 'live';

  return (
    <button
      className="backend-pill"
      onClick={() => void probe()}
      title="Probe the local backend again"
      data-state={backend}
    >
      <span className={tone === 'ok' ? 'dot dot-ok' : tone === 'warn' ? 'dot dot-warn' : 'dot dot-live'} />
      <span className="backend-pill-text">{label}</span>
      <Icon name="refresh" size={12} className={backend === 'checking' ? 'spin' : undefined} />
    </button>
  );
}

/** Signed-in account menu: profile, progress, settings, logout. */
function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  async function onLogout() {
    setOpen(false);
    await logout(); // clears the session cookie + all user state
    navigate('/login', { replace: true });
  }

  return (
    <div className="user-menu" ref={wrap}>
      <button
        className="user-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" aria-hidden="true">
          {initials || '☺'}
        </span>
        <span className="user-name">{user.name}</span>
        <Icon
          name="chevron"
          size={13}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}
        />
      </button>
      {open && (
        <motion.div
          className="user-pop"
          role="menu"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="user-pop-head">
            <b>{user.name}</b>
            <span>{user.email}</span>
            <span className="user-pop-role">{user.role}</span>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="grid" size={15} /> Profile
          </Link>
          <Link to="/profile#progress" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="clock" size={15} /> Learning progress
          </Link>
          <Link to="/profile#settings" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="sliders" size={15} /> Settings
          </Link>
          <hr />
          <button className="is-danger" role="menuitem" onClick={() => void onLogout()}>
            <Icon name="arrowRight" size={15} /> Log out
          </button>
        </motion.div>
      )}
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { toasts, dismiss } = useStore();
  const location = useLocation();

  // Collapse the rail automatically on narrower laptops.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1180px)');
    const apply = () => setOpen(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const active = NAV.find((n) => n.to === location.pathname) ?? NAV[0];

  return (
    <div className={open ? 'shell rail-open' : 'shell'}>
      <nav className="rail" aria-label="Primary">
        <div className="rail-brand">
          <BluLogo open={open} size={34} />
        </div>

        <ul className="rail-list">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'rail-item is-active' : 'rail-item')}
                aria-current={location.pathname === item.to ? 'page' : undefined}
              >
                {location.pathname === item.to && (
                  <motion.span
                    className="rail-indicator"
                    layoutId="rail-active"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
                <span className="rail-icon">
                  <Icon name={item.icon} size={19} />
                </span>
                <span className="rail-label">{item.label}</span>
                {!open && (
                  <span className="rail-tip" role="tooltip">
                    {item.label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="rail-foot">
          <div className={open ? 'rail-status is-open' : 'rail-status'} title="Local assets installed · app works without internet">
            <span className="orbit" aria-hidden="true">
              <i />
            </span>
            <span className="rail-status-text">
              <b>Local</b>
              <i>Offline assets ready</i>
            </span>
          </div>
          <button
            className="rail-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          >
            <Icon name="panel" size={17} style={{ transform: open ? 'none' : 'rotate(180deg)' }} />
            {open && <span>Collapse</span>}
          </button>
        </div>
        <span className="rail-edge" aria-hidden="true" />
      </nav>

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>Blu</span>
            <Icon name="chevronRight" size={12} />
            <span style={{ color: 'var(--ink-2)' }}>{active.label}</span>
          </div>
          <div className="topbar-title">{active.hint}</div>
          <div style={{ flex: 1 }} />
          <BackendStatusPill />
          <UserMenu />
          <Tooltip label="Motion follows your system reduced-motion setting">
            <span className="pill" aria-hidden="true">
              <Icon name="spark" size={12} />
              Motion aware
            </span>
          </Tooltip>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
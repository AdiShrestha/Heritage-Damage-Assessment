import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';

function getStatusCopy(status) {
  if (status === 'ok') return 'System Online';
  if (status === 'degraded') return 'Degraded';
  if (status === 'error') return 'Offline';
  return 'Checking';
}

function getDotClass(status) {
  if (status === 'ok') return 'bg-[#1E6B3C]';
  if (status === 'degraded') return 'bg-[#B8860B]';
  if (status === 'error') return 'bg-red-400';
  return 'bg-white/70';
}

function PagodaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="24" width="48" height="36" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="14" y="14" width="36" height="12" rx="2" fill="currentColor" opacity="0.7" />
      <rect x="20" y="6" width="24" height="10" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="22" y="32" width="20" height="20" rx="1" fill="rgba(255,255,255,0.2)" />
      <path d="M32 34l5 10H27z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { status } = useHealth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) =>
    `rounded-lg px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 ease-out ${
      isActive ? 'bg-[#251c19] text-[#fff8ee] shadow-sm' : 'text-[#66564e] hover:bg-[#f3e5d5] hover:text-[#251c19]'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between rounded-[22px] border border-[#d7c3b1] bg-[#fffaf3]/90 px-4 py-3 text-[#251c19] shadow-lg shadow-[#5f321d]/10 backdrop-blur-xl sm:px-5">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#a4432d] text-[#fff8ee] transition-colors duration-200 group-hover:bg-[#251c19]">
            <PagodaIcon />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-[#251c19]">
              Heritage Assessment
            </div>
            <div className="text-xs text-[#8b6e61] font-display italic">
              AI-Powered Damage Detection
            </div>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-1 rounded-xl border border-[#e3d4c6] bg-white/65 p-1 md:flex">
          <NavLink to="/" end className={navClass}>
            Assess
          </NavLink>
          <NavLink to="/models" className={navClass}>
            Models
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#dfcfc0] bg-white/70 text-[#65554d] transition duration-200 hover:border-[#a4432d] hover:text-[#a4432d] sm:inline-flex"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#dfcfc0] bg-white/70 px-3 py-2 text-sm text-[#65554d]">
            <span className={`h-2 w-2 rounded-full ${getDotClass(status)} ${status === 'ok' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{getStatusCopy(status)}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-lg border border-[#dfcfc0] bg-white/70 p-2 text-[#65554d] transition-colors duration-150 ease-in-out hover:text-[#a4432d] md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="mx-auto mt-2 max-w-[1280px] rounded-2xl border border-[#d7c3b1] bg-[#fffaf3]/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink to="/" end className={navClass}>
              Assess
            </NavLink>
            <NavLink to="/models" className={navClass}>
              Models
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}

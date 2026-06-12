import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
    `text-sm tracking-wide transition-colors duration-150 ease-in-out ${
      isActive ? 'font-semibold text-[#F7EDE8]' : 'text-[#E2DCD6] hover:text-[#F7EDE8]'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#1C1816] text-white shadow-lg">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="text-[#D4A04A] transition-colors duration-200 group-hover:text-[#E8C47A]">
            <PagodaIcon />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-[#F5F0EB]">
              Heritage Assessment
            </div>
            <div className="text-xs text-[#A69A92] font-display italic">
              AI-Powered Damage Detection
            </div>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-8 md:flex">
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
          <div className="flex items-center gap-2 text-sm text-[#E2DCD6]">
            <span className={`h-2 w-2 rounded-full ${getDotClass(status)} ${status === 'ok' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{getStatusCopy(status)}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-[#E2DCD6] transition-colors duration-150 ease-in-out hover:bg-white/10 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="h-[2px] bg-gradient-to-r from-[#A63A2A] via-[#D4A04A] to-[#A63A2A]" />

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#1C1816] px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3">
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

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
  if (status === 'ok') return 'bg-success';
  if (status === 'degraded') return 'bg-warning';
  if (status === 'error') return 'bg-red-400';
  return 'bg-white/70';
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { status } = useHealth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) =>
    `text-sm transition-colors duration-150 ease-in-out ${
      isActive ? 'font-semibold text-white' : 'text-white/75 hover:text-white'
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primary text-white">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <div className="text-lg font-medium tracking-tight">Heritage Assessment</div>
          <div className="text-xs text-white/70">AI-Powered Damage Detection</div>
        </div>

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
          <div className="flex items-center gap-2 text-sm text-white/85">
            <span className={`h-2.5 w-2.5 rounded-full ${getDotClass(status)} ${status === 'ok' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{getStatusCopy(status)}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-white transition-colors duration-150 ease-in-out hover:bg-white/10 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-primary px-4 py-3 md:hidden">
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

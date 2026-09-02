import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  MessageSquare,
  Moon,
  ScrollText,
  Sun,
  Table2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusStrip } from './StatusStrip';
import { UserMenu } from './UserMenu';

/**
 * Navigation.
 *
 * `gen:feature` appends generated features to this array — keep the shape and
 * the trailing marker comment intact or the generator's insertion point moves.
 */
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/items', label: 'Items', icon: Boxes },
  { to: '/datasets', label: 'Datasets', icon: Table2 },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/chat', label: 'Assistant', icon: MessageSquare },
  { to: '/audit', label: 'Audit log', icon: ScrollText },
  // gen:feature inserts here — do not remove this comment
];

export function AppShell() {
  const [dark, setDark] = useDarkMode();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4">
          <span className="grid size-6 place-items-center rounded bg-[var(--color-signal)] font-display text-[13px] font-700 text-white">
            G
          </span>
          <span className="font-display text-[15px] font-600 tracking-tight">GVHAX</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--color-signal-soft)] font-500 text-[var(--color-signal)]'
                    : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-2">
          <NavLink
            to="/_kit"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[var(--color-signal-soft)] font-500 text-[var(--color-signal)]'
                  : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]',
              )
            }
          >
            <LayoutGrid className="size-4 shrink-0" />
            Component kit
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4">
          {/* Mobile nav: the sidebar collapses, so surface the links inline. */}
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded px-2 py-1 text-xs',
                    isActive ? 'bg-[var(--color-signal-soft)] text-[var(--color-signal)]' : 'text-[var(--muted)]',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="grid size-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <UserMenu />
          </div>
        </header>

        <StatusStrip />

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function useDarkMode(): [boolean, (v: boolean) => void] {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('gvhax.theme');
      if (stored) return stored === 'dark';
    } catch {
      /* private mode — fall through to the system preference */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('gvhax.theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  return [dark, setDark];
}

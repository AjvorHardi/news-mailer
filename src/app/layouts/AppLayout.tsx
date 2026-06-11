import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router';
import clsx from 'clsx';

const navItems = [
  { label: 'Overview', path: '' },
  { label: 'Subscribers', path: 'subscribers' },
  { label: 'Forms', path: 'forms' },
  { label: 'Segments', path: 'segments' },
  { label: 'Campaigns', path: 'campaigns' },
  { label: 'Activity', path: 'activity' },
  { label: 'Settings', path: 'settings' },
];

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { newsletterId = 'demo-newsletter' } = useParams();
  const basePath = `/app/newsletters/${newsletterId}`;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/app" className="text-sm font-semibold tracking-[0.18em] uppercase">
            NEWS-MAILER
          </Link>
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 text-neutral-800 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="lg:flex">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white lg:block">
          <SidebarContent basePath={basePath} />
        </aside>

        <div
          className={clsx(
            'fixed inset-0 z-40 bg-neutral-950/40 lg:hidden',
            isMobileNavOpen ? 'block' : 'hidden',
          )}
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
        />
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-72 border-r border-neutral-200 bg-white transition-transform lg:hidden',
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
            <Link to="/app" className="text-sm font-semibold tracking-[0.18em] uppercase">
              NEWS-MAILER
            </Link>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsMobileNavOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 text-neutral-800 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <SidebarContent basePath={basePath} onNavigate={() => setIsMobileNavOpen(false)} />
        </aside>

        <main className="min-h-screen flex-1 lg:pl-64">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  basePath: string;
  onNavigate?: () => void;
};

function SidebarContent({ basePath, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-6 py-5">
        <Link to="/app" className="text-sm font-semibold tracking-[0.18em] uppercase">
          NEWS-MAILER
        </Link>
        <p className="mt-3 text-sm text-neutral-500">Newsletter workspace</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const to = item.path ? `${basePath}/${item.path}` : basePath;

          return (
            <NavLink
              key={item.label}
              to={to}
              end={!item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'block rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-neutral-950 focus:outline-none',
                  isActive
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950',
                )
              }
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 px-6 py-4 text-sm text-neutral-500">
        Phase 1 shell
      </div>
    </div>
  );
}

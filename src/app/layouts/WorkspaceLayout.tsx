import { ArrowLeft, Menu } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
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

type WorkspaceLayoutProps = {
  footerAction?: ReactNode;
  basePath: string;
  footerLabel: string;
  workspaceListPath?: string;
};

export function WorkspaceLayout({ basePath, footerAction, footerLabel, workspaceListPath }: WorkspaceLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {!isMobileSidebarOpen && (
        <SidebarToggleButton
          ariaLabel="Open navigation"
          className="fixed top-4 left-4 z-30 inline-flex min-[1120px]:hidden"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SidebarToggleButton>
      )}

      {!isDesktopSidebarOpen && (
        <SidebarToggleButton
          ariaLabel="Open navigation"
          className="fixed top-4 left-4 z-30 hidden min-[1120px]:inline-flex"
          onClick={() => setIsDesktopSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SidebarToggleButton>
      )}

      <div className="min-[1120px]:flex">
        {isDesktopSidebarOpen && (
          <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white min-[1120px]:block">
            <SidebarContent
              basePath={basePath}
              footerAction={footerAction}
              footerLabel={footerLabel}
              onClose={() => setIsDesktopSidebarOpen(false)}
              workspaceListPath={workspaceListPath}
            />
          </aside>
        )}

        <div
          className={clsx(
            'fixed inset-0 z-40 bg-neutral-950/40 min-[1120px]:hidden',
            isMobileSidebarOpen ? 'block' : 'hidden',
          )}
          aria-hidden="true"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-72 border-r border-neutral-200 bg-white transition-transform min-[1120px]:hidden',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent
            basePath={basePath}
            footerAction={footerAction}
            footerLabel={footerLabel}
            onClose={() => setIsMobileSidebarOpen(false)}
            onNavigate={() => setIsMobileSidebarOpen(false)}
            workspaceListPath={workspaceListPath}
          />
        </aside>

        <main className="min-h-screen flex-1 min-[1120px]:pl-[17rem]">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-6 min-[1120px]:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

type SidebarContentProps = {
  basePath: string;
  footerAction?: ReactNode;
  footerLabel: string;
  onClose: () => void;
  onNavigate?: () => void;
  workspaceListPath?: string;
};

function SidebarContent({ basePath, footerAction, footerLabel, onClose, onNavigate, workspaceListPath }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-neutral-200 px-4">
        <SidebarToggleButton ariaLabel="Close navigation" className="inline-flex" onClick={onClose}>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </SidebarToggleButton>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {workspaceListPath ? (
          <div className="mb-3">
            <NavLink
              to={workspaceListPath}
              end
              onClick={onNavigate}
              className="font-display flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to newsletters
            </NavLink>
          </div>
        ) : null}
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
                  'font-display block rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-neutral-950 focus:outline-none',
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
      <div className="space-y-3 border-t border-neutral-200 px-6 py-4">
        <div className="text-sm break-words text-neutral-500">{footerLabel}</div>
        {footerAction ? <div>{footerAction}</div> : null}
      </div>
    </div>
  );
}

type SidebarToggleButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  onClick: () => void;
};

function SidebarToggleButton({ ariaLabel, children, className, onClick }: SidebarToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={clsx(
        'h-10 w-10 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-950 focus:outline-none',
        className,
      )}
    >
      {children}
    </button>
  );
}

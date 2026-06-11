import { Link, Outlet } from 'react-router';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold tracking-[0.18em] text-neutral-950 uppercase">
            NEWS-MAILER
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/demo"
              className="rounded-md px-3 py-2 font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              Demo
            </Link>
            <Link
              to="/login"
              className="rounded-md px-3 py-2 font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-neutral-950 px-3 py-2 font-medium text-white hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

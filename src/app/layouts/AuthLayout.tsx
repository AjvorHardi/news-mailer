import { Link, Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold tracking-[0.18em] uppercase">
            NEWS-MAILER
          </Link>
          <Link
            to="/demo"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
          >
            Try demo
          </Link>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-12">
        <Outlet />
      </main>
    </div>
  );
}

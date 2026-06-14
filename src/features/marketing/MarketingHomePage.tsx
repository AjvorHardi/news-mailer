import { Link } from 'react-router';

export function MarketingHomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl content-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-neutral-500 uppercase">Newsletter SaaS MVP</p>
        <h1 className="font-display mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-neutral-950 sm:text-6xl">
          NEWS-MAILER
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          Create newsletters, manage subscribers, build public signup forms, and send polished campaigns from a clean
          workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/demo"
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none"
          >
            Try demo
          </Link>
          <Link
            to="/register"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none"
          >
            Create account
          </Link>
        </div>
      </div>
      <div className="border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="border-b border-neutral-200 pb-4">
          <p className="text-sm font-medium text-neutral-950">Today</p>
          <p className="mt-1 text-sm text-neutral-500">Campaign operations</p>
        </div>
        <div className="grid grid-cols-3 gap-3 py-5">
          {[
            ['Subscribers', '1,248'],
            ['Forms', '4'],
            ['Campaigns', '12'],
          ].map(([label, value]) => (
            <div key={label} className="border border-neutral-200 p-4">
              <p className="font-mono-ui text-2xl font-semibold text-neutral-950">{value}</p>
              <p className="mt-1 text-xs text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {['June product notes', 'New subscriber welcome', 'Founder update'].map((campaign) => (
            <div key={campaign} className="flex items-center justify-between border border-neutral-200 px-4 py-3">
              <span className="text-sm font-medium text-neutral-900">{campaign}</span>
              <span className="text-xs text-neutral-500">Draft</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

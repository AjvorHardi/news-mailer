import { Link } from 'react-router';
import { DEMO_NEWSLETTER_ID } from '../../lib/demo-storage';
import { PageHeader } from '../../shared/ui/PageHeader';

export function DemoHomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Demo mode"
        title="Try NEWS-MAILER without an account"
        description="Seeded demo data, localStorage persistence, and simulated sending will be added in the next demo phases."
        actions={
          <Link
            to="/demo"
            className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none"
          >
            Open demo
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {['Subscribers', 'Signup forms', 'Campaign activity'].map((item) => (
          <div key={item} className="border border-neutral-200 bg-white p-5">
            <h2 className="font-display text-base font-semibold text-neutral-950">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Demo functionality placeholder.</p>
          </div>
        ))}
      </div>
      <p className="font-mono-ui mt-6 text-xs text-neutral-500">Seed newsletter: {DEMO_NEWSLETTER_ID}</p>
    </section>
  );
}

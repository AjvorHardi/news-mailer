import { PageHeader } from '../../shared/ui/PageHeader';

export function NewsletterOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Newsletter overview"
        description="Subscriber count, forms count, campaign count, and recent campaigns will appear here."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Subscribers', '0'],
          ['Forms', '0'],
          ['Campaigns', '0'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-200 bg-white p-5">
            <p className="text-3xl font-semibold text-neutral-950">{value}</p>
            <p className="mt-1 text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold text-neutral-950">Recent campaigns</h2>
        <p className="mt-2 text-sm text-neutral-600">Draft and sent campaign summaries will be added in later phases.</p>
      </section>
    </div>
  );
}

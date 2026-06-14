import { RotateCcw } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useDemoOverview, useResetDemoData } from './useDemoOverview';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function DemoOverviewPage() {
  const overviewQuery = useDemoOverview();
  const resetDemoData = useResetDemoData();

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Demo overview" title="Loading demo workspace" description="Preparing seeded local data." />
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Demo overview" title="Demo workspace unavailable" />
        <EmptyState
          title="Demo data could not be loaded"
          description="Reset the seeded data and try again."
          action={
            <Button type="button" onClick={() => resetDemoData.mutate()} disabled={resetDemoData.isPending}>
              Reset demo data
            </Button>
          }
        />
      </div>
    );
  }

  const overview = overviewQuery.data;

  if (!overview) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Demo overview" title="Demo workspace unavailable" />
        <EmptyState title="Demo data is missing" description="Reset the seeded data and try again." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Demo overview"
        title={overview.newsletterName}
        description={overview.newsletterDescription ?? 'Explore the seeded NEWS-MAILER workspace.'}
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => resetDemoData.mutate()}
            disabled={resetDemoData.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reset demo
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Subscribers', overview.subscriberCount],
          ['Subscribed', overview.subscribedCount],
          ['Forms', overview.formCount],
          ['Campaigns', overview.campaignCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-200 bg-white p-5">
            <p className="font-mono-ui text-3xl font-semibold text-neutral-950">{value}</p>
            <p className="mt-1 text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-neutral-950">Recent campaigns</h2>
          <p className="mt-1 text-sm text-neutral-500">Seeded draft and sent campaigns will appear here.</p>
        </div>
        {overview.recentCampaigns.length > 0 ? (
          <div className="divide-y divide-neutral-200">
            {overview.recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-sm font-semibold text-neutral-950">{campaign.subject}</h3>
                  <p className="mt-1 text-xs text-neutral-500">Updated {formatDate(campaign.updatedAt)}</p>
                </div>
                <span className="inline-flex w-fit rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 capitalize">
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="No campaigns yet" description="Create a campaign in a later phase to populate this list." />
          </div>
        )}
      </section>
    </div>
  );
}

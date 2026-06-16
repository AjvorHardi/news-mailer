import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import type { ActivityStats, Campaign } from '../../shared/types/domain';
import { useDemoActivityCampaigns, useDemoActivityStats } from './useDemoActivity';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function DemoActivityPage() {
  const statsQuery = useDemoActivityStats();
  const campaignsQuery = useDemoActivityCampaigns();
  const sentCampaigns = (campaignsQuery.data ?? [])
    .filter((campaign) => campaign.status === 'sent' || campaign.status === 'failed')
    .sort((firstCampaign, secondCampaign) => secondCampaign.updatedAt.localeCompare(firstCampaign.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Demo activity"
        title="Delivery activity"
        description="Review simulated recipient snapshots and delivery status totals from demo campaign sends."
      />

      {statsQuery.isLoading || campaignsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading activity...</div>
      ) : null}

      {statsQuery.isError || campaignsQuery.isError ? (
        <EmptyState
          title="Activity could not be loaded"
          description="Return to the demo overview if you need to restore all seeded demo data."
        />
      ) : null}

      {statsQuery.data ? <ActivityStatsGrid stats={statsQuery.data} /> : null}

      {statsQuery.data && statsQuery.data.total === 0 ? (
        <EmptyState
          title="No delivery activity yet"
          description="Send a draft campaign from the campaigns page to create simulated recipient snapshots."
        />
      ) : null}

      {sentCampaigns.length > 0 ? <RecentSentCampaigns campaigns={sentCampaigns} /> : null}
    </div>
  );
}

function ActivityStatsGrid({ stats }: { stats: ActivityStats }) {
  const items = [
    ['Total', stats.total],
    ['Pending', stats.pending],
    ['Sent', stats.sent],
    ['Delivered', stats.delivered],
    ['Bounced', stats.bounced],
    ['Failed', stats.failed],
  ];

  return (
    <section className="grid gap-4 min-[520px]:grid-cols-2 lg:grid-cols-6">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-neutral-200 bg-white p-5">
          <p className="font-mono-ui text-3xl font-semibold text-neutral-950">{value}</p>
          <p className="mt-1 text-sm text-neutral-500">{label}</p>
        </div>
      ))}
    </section>
  );
}

function RecentSentCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">Recent sent campaigns</h2>
        <p className="mt-1 text-sm text-neutral-500">Simulated sends only. No email provider is called.</p>
      </div>
      <div className="divide-y divide-neutral-200">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-neutral-950">{campaign.subject}</h3>
              <p className="mt-1 text-xs text-neutral-500">
                {campaign.sentAt ? `Sent ${formatDate(campaign.sentAt)}` : `Updated ${formatDate(campaign.updatedAt)}`}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 capitalize">
              {campaign.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

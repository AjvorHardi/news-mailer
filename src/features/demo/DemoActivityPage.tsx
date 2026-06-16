import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import type { ActivityStats, Campaign, CampaignRecipient } from '../../shared/types/domain';
import { useDemoActivityCampaigns, useDemoActivityRecipients, useDemoActivityStats } from './useDemoActivity';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatOptionalDate(value: string | null) {
  return value ? formatDate(value) : '-';
}

export function DemoActivityPage() {
  const statsQuery = useDemoActivityStats();
  const recipientsQuery = useDemoActivityRecipients();
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

      {statsQuery.isLoading || recipientsQuery.isLoading || campaignsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading activity...</div>
      ) : null}

      {statsQuery.isError || recipientsQuery.isError || campaignsQuery.isError ? (
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

      {recipientsQuery.data && recipientsQuery.data.length > 0 ? (
        <RecipientDeliveryTable campaigns={campaignsQuery.data ?? []} recipients={recipientsQuery.data} />
      ) : null}
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

function RecipientDeliveryTable({
  campaigns,
  recipients,
}: {
  campaigns: Campaign[];
  recipients: CampaignRecipient[];
}) {
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign.subject]));
  const sortedRecipients = [...recipients].sort((firstRecipient, secondRecipient) =>
    secondRecipient.createdAt.localeCompare(firstRecipient.createdAt),
  );

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">Recipient deliveries</h2>
        <p className="mt-1 text-sm text-neutral-500">Snapshot rows captured when a campaign is simulated.</p>
      </div>

      <div className="hidden overflow-x-auto min-[1040px]:block">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Recipient
              </th>
              <th scope="col" className="px-4 py-3">
                Campaign
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Sent
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Delivered
              </th>
              <th scope="col" className="px-4 py-3">
                Failure
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sortedRecipients.map((recipient) => (
              <tr key={recipient.id} className="align-middle">
                <td className="px-4 py-4 align-middle">
                  <div className="font-medium text-neutral-950">{recipient.email}</div>
                  <div className="mt-1 text-xs text-neutral-500">{recipient.name ?? 'No name'}</div>
                </td>
                <td className="px-4 py-4 align-middle text-neutral-700">
                  {campaignsById.get(recipient.campaignId) ?? 'Unknown campaign'}
                </td>
                <td className="px-4 py-4 text-center align-middle">
                  <DeliveryStatusBadge status={recipient.status} />
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">
                  {formatOptionalDate(recipient.sentAt)}
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">
                  {formatOptionalDate(recipient.deliveredAt)}
                </td>
                <td className="px-4 py-4 align-middle text-neutral-700">{recipient.failureReason ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-neutral-200 min-[1040px]:hidden">
        {sortedRecipients.map((recipient) => (
          <article key={recipient.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-neutral-950">{recipient.email}</h3>
                <p className="mt-1 truncate text-xs text-neutral-500">
                  {campaignsById.get(recipient.campaignId) ?? 'Unknown campaign'}
                </p>
              </div>
              <DeliveryStatusBadge status={recipient.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-medium text-neutral-500">Name</dt>
                <dd className="mt-1 text-neutral-950">{recipient.name ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Sent</dt>
                <dd className="mt-1 text-neutral-950">{formatOptionalDate(recipient.sentAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Delivered</dt>
                <dd className="mt-1 text-neutral-950">{formatOptionalDate(recipient.deliveredAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Failure</dt>
                <dd className="mt-1 text-neutral-950">{recipient.failureReason ?? '-'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeliveryStatusBadge({ status }: { status: CampaignRecipient['status'] }) {
  return (
    <span className="inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 capitalize">
      {status}
    </span>
  );
}

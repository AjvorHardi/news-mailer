import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useDemoOverview } from '../demo/useDemoOverview';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function NewsletterOverviewPage() {
  const overviewQuery = useDemoOverview();

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Overview" title="Loading newsletter" />
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Overview" title="Newsletter unavailable" />
        <EmptyState title="Newsletter data could not be loaded" description={overviewQuery.error.message} />
      </div>
    );
  }

  const overview = overviewQuery.data;

  if (!overview) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Overview" title="Newsletter unavailable" />
        <EmptyState title="Newsletter data could not be loaded" description="Refresh the workspace and try again." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={overview.newsletterName}
        description={overview.newsletterDescription ?? 'Track audience growth, signup forms, and recent campaigns.'}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Subscribers', overview.subscriberCount.toString(), `${overview.subscribedCount} subscribed`],
          ['Forms', overview.formCount.toString(), 'Signup forms'],
          ['Campaigns', overview.campaignCount.toString(), 'Drafts and sends'],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-lg border border-neutral-200 bg-white p-5">
            <p className="font-mono-ui text-3xl font-semibold text-neutral-950">{value}</p>
            <p className="mt-1 text-sm text-neutral-500">{label}</p>
            <p className="mt-3 text-xs text-neutral-500">{detail}</p>
          </div>
        ))}
      </div>
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-neutral-950">Recent campaigns</h2>
        {overview.recentCampaigns.length > 0 ? (
          <div className="mt-4 divide-y divide-neutral-200">
            {overview.recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-950">{campaign.subject}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {campaign.status} - updated {formatDate(campaign.updatedAt)}
                  </p>
                </div>
                <span className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600">
                  {campaign.audienceType === 'segment' ? 'Segment' : 'All subscribers'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">No campaigns yet.</p>
        )}
      </section>
    </div>
  );
}

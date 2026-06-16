import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { campaignInputSchema } from '../../shared/schemas/domainSchemas';
import type { Campaign, Segment, Subscriber } from '../../shared/types/domain';
import { useDemoCampaigns, countCampaignRecipients, useSaveDemoCampaignDraft } from './useDemoCampaigns';
import { useDemoSegments } from './useDemoSegments';
import { useDemoSubscribers } from './useDemoSubscribers';
import type { z } from 'zod';

const emptySubscribers: Subscriber[] = [];
const emptySegments: Segment[] = [];

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

type CampaignFormInput = z.input<typeof campaignInputSchema>;
type CampaignFormValues = z.output<typeof campaignInputSchema>;

export function DemoCampaignsPage() {
  const campaignsQuery = useDemoCampaigns();
  const subscribersQuery = useDemoSubscribers();
  const segmentsQuery = useDemoSegments();
  const saveCampaign = useSaveDemoCampaignDraft();
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const subscribers = subscribersQuery.data ?? emptySubscribers;
  const segments = segmentsQuery.data ?? emptySegments;
  const segmentsById = useMemo(() => new Map(segments.map((segment) => [segment.id, segment.name])), [segments]);

  function openCreateEditor() {
    saveCampaign.reset();
    setEditingCampaign(null);
    setIsEditorOpen(true);
  }

  function openEditEditor(campaign: Campaign) {
    saveCampaign.reset();
    setEditingCampaign(campaign);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    saveCampaign.reset();
    setEditingCampaign(null);
    setIsEditorOpen(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actionsLayout="responsive-inline"
        eyebrow="Demo campaigns"
        title="Campaign drafts"
        description="Create newsletter drafts, choose an audience, and compose content before simulated sending is added."
        actions={
          <Button
            type="button"
            className="h-10 w-10 px-0 md:w-auto md:px-4"
            aria-label="New campaign"
            onClick={openCreateEditor}
            disabled={saveCampaign.isPending}
          >
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">New campaign</span>
          </Button>
        }
      />

      {saveCampaign.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {saveCampaign.error.message}
        </div>
      ) : null}

      {isEditorOpen ? (
        <DemoCampaignEditor
          key={editingCampaign?.id ?? 'new-campaign'}
          campaign={editingCampaign}
          error={saveCampaign.error}
          isSubmitting={saveCampaign.isPending}
          onCancel={closeEditor}
          onSubmit={async (values) => {
            await saveCampaign.mutateAsync({
              campaignId: editingCampaign?.id,
              input: values,
            });

            closeEditor();
          }}
        />
      ) : null}

      {campaignsQuery.isLoading || subscribersQuery.isLoading || segmentsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading campaigns...</div>
      ) : null}

      {campaignsQuery.isError || subscribersQuery.isError || segmentsQuery.isError ? (
        <EmptyState
          title="Campaigns could not be loaded"
          description="Return to the demo overview if you need to restore all seeded demo data."
        />
      ) : null}

      {campaignsQuery.data && campaignsQuery.data.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create a draft campaign to start composing newsletter content."
          action={
            <Button type="button" onClick={openCreateEditor} disabled={saveCampaign.isPending}>
              New campaign
            </Button>
          }
        />
      ) : null}

      {campaignsQuery.data && campaignsQuery.data.length > 0 ? (
        <CampaignsList
          campaigns={campaignsQuery.data}
          onEdit={openEditEditor}
          segments={segments}
          segmentsById={segmentsById}
          subscribers={subscribers}
        />
      ) : null}
    </div>
  );
}

type CampaignsListProps = {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  segments: Segment[];
  segmentsById: Map<string, string>;
  subscribers: Subscriber[];
};

function CampaignsList({ campaigns, onEdit, segments, segmentsById, subscribers }: CampaignsListProps) {
  const sortedCampaigns = [...campaigns].sort((firstCampaign, secondCampaign) =>
    secondCampaign.updatedAt.localeCompare(firstCampaign.updatedAt),
  );

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="hidden overflow-x-auto min-[960px]:block">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Campaign
              </th>
              <th scope="col" className="px-4 py-3">
                Audience
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Recipients
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sortedCampaigns.map((campaign) => (
              <tr key={campaign.id} className="align-middle">
                <td className="px-4 py-4 align-middle">
                  <div className="font-medium text-neutral-950">{campaign.subject}</div>
                  <div className="mt-1 text-xs text-neutral-500">{campaign.bodyHtml ? 'Content drafted' : 'No body yet'}</div>
                </td>
                <td className="px-4 py-4 align-middle text-neutral-700">
                  {getAudienceLabel(campaign, segmentsById)}
                </td>
                <td className="font-mono-ui px-4 py-4 text-center align-middle text-neutral-700">
                  {countCampaignRecipients(subscribers, segments, campaign.audienceType, campaign.segmentId)}
                </td>
                <td className="px-4 py-4 text-center align-middle">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">{formatDate(campaign.updatedAt)}</td>
                <td className="px-4 py-4 text-center align-middle">
                  <CampaignActions campaign={campaign} onEdit={onEdit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-neutral-200 min-[960px]:hidden">
        {sortedCampaigns.map((campaign) => (
          <article key={campaign.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-neutral-950">{campaign.subject}</h2>
                <p className="mt-1 text-xs text-neutral-500">{getAudienceLabel(campaign, segmentsById)}</p>
              </div>
              <StatusBadge status={campaign.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-medium text-neutral-500">Recipients</dt>
                <dd className="font-mono-ui mt-1 text-neutral-950">
                  {countCampaignRecipients(subscribers, segments, campaign.audienceType, campaign.segmentId)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Updated</dt>
                <dd className="mt-1 text-neutral-950">{formatDate(campaign.updatedAt)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end">
              <CampaignActions campaign={campaign} onEdit={onEdit} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function getAudienceLabel(campaign: Campaign, segmentsById: Map<string, string>) {
  if (campaign.audienceType === 'segment') {
    return campaign.segmentId ? segmentsById.get(campaign.segmentId) ?? 'Missing segment' : 'Missing segment';
  }

  return 'All subscribed';
}

function StatusBadge({ status }: { status: Campaign['status'] }) {
  return (
    <span className="inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 capitalize">
      {status}
    </span>
  );
}

function CampaignActions({ campaign, onEdit }: { campaign: Campaign; onEdit: (campaign: Campaign) => void }) {
  if (campaign.status !== 'draft') {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-neutral-200 px-3 text-xs text-neutral-500">
        Locked
      </span>
    );
  }

  return (
    <IconButton label={`Edit ${campaign.subject}`} onClick={() => onEdit(campaign)}>
      <Pencil className="h-4 w-4" aria-hidden="true" />
    </IconButton>
  );
}

type IconButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
};

function IconButton({ children, disabled, label, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {children}
    </button>
  );
}

type DemoCampaignEditorProps = {
  campaign: Campaign | null;
  error: Error | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CampaignFormValues) => Promise<void>;
};

function DemoCampaignEditor({ campaign, error, isSubmitting, onCancel, onSubmit }: DemoCampaignEditorProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CampaignFormInput, unknown, CampaignFormValues>({
    resolver: zodResolver(campaignInputSchema),
    defaultValues: {
      subject: campaign?.subject ?? '',
      bodyJson: campaign?.bodyJson ?? null,
      bodyHtml: campaign?.bodyHtml ?? null,
      audienceType: campaign?.audienceType ?? 'all_subscribed',
      segmentId: campaign?.segmentId ?? null,
    },
  });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          {campaign ? 'Edit draft campaign' : 'Create draft campaign'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Drafts are saved locally in demo mode. Sending is added in Phase 8.</p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input label="Subject" type="text" placeholder="June product notes" {...register('subject')} />
          {errors.subject ? <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p> : null}
        </div>

        <input type="hidden" {...register('bodyJson')} />
        <input type="hidden" {...register('bodyHtml')} />
        <input type="hidden" {...register('audienceType')} />
        <input type="hidden" {...register('segmentId')} />

        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {campaign ? 'Save draft' : 'Create draft'}
          </Button>
        </div>
      </form>
    </section>
  );
}

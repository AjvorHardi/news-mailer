import { Pencil, Plus, Send } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { campaignInputSchema } from '../../shared/schemas/domainSchemas';
import type { Campaign, CampaignAudienceType, Id, Segment, Subscriber } from '../../shared/types/domain';
import { sanitizeCampaignHtml } from '../../shared/utils/sanitizeCampaignHtml';
import {
  useDemoCampaigns,
  countCampaignRecipients,
  useDemoCampaignRecipientCount,
  useSaveDemoCampaignDraft,
  useSendDemoCampaign,
} from './useDemoCampaigns';
import { useDemoSegments } from './useDemoSegments';
import { useDemoSubscribers } from './useDemoSubscribers';
import { useDemoWorkspace } from './demoWorkspaceContext';
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
  const { mode } = useDemoWorkspace();
  const campaignsQuery = useDemoCampaigns();
  const subscribersQuery = useDemoSubscribers();
  const segmentsQuery = useDemoSegments();
  const saveCampaign = useSaveDemoCampaignDraft();
  const sendCampaign = useSendDemoCampaign();
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [sendResultMessage, setSendResultMessage] = useState<string | null>(null);
  const subscribers = subscribersQuery.data ?? emptySubscribers;
  const segments = segmentsQuery.data ?? emptySegments;
  const segmentsById = useMemo(() => new Map(segments.map((segment) => [segment.id, segment.name])), [segments]);

  function openCreateEditor() {
    saveCampaign.reset();
    sendCampaign.reset();
    setSendResultMessage(null);
    setEditingCampaign(null);
    setIsEditorOpen(true);
  }

  function openEditEditor(campaign: Campaign) {
    saveCampaign.reset();
    sendCampaign.reset();
    setSendResultMessage(null);
    setEditingCampaign(campaign);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    saveCampaign.reset();
    setEditingCampaign(null);
    setIsEditorOpen(false);
  }

  async function sendCampaignById(campaign: Campaign) {
    sendCampaign.reset();
    setSendResultMessage(null);
    setSendingCampaignId(campaign.id);

    try {
      const result = await sendCampaign.mutateAsync(campaign.id);
      const sentCount = result.recipients.filter((recipient) => recipient.status === 'sent').length;
      const failedCount = result.recipients.filter((recipient) => recipient.status === 'failed').length;

      if (mode === 'app') {
        setSendResultMessage(
          sentCount > 0
            ? `Sent to your login email. ${failedCount} recipient(s) skipped for testing. Check Activity.`
            : 'No email matched your login email. Add yourself as a subscriber, then try again.',
        );
      } else {
        setSendResultMessage(
          result.recipients.length > 0
            ? `Send created ${result.recipients.length} recipient snapshots for "${result.campaign.subject}".`
            : `No subscribed recipients matched "${result.campaign.subject}", so the send was marked failed.`,
        );
      }
    } finally {
      setSendingCampaignId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actionsLayout="responsive-inline"
        eyebrow="Campaigns"
        title="Campaign drafts"
        description="Create newsletter drafts, choose an audience, and compose content."
        actions={
          <Button
            type="button"
            className="h-10 w-10 px-0 md:w-auto md:px-4"
            aria-label="New campaign"
            onClick={openCreateEditor}
            disabled={saveCampaign.isPending || sendCampaign.isPending}
          >
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">New campaign</span>
          </Button>
        }
      />

      {saveCampaign.error || sendCampaign.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {saveCampaign.error?.message ?? sendCampaign.error?.message}
        </div>
      ) : null}

      {sendResultMessage ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          {sendResultMessage}
        </div>
      ) : null}

      {isEditorOpen ? (
        <DemoCampaignEditor
          key={editingCampaign?.id ?? 'new-campaign'}
          campaign={editingCampaign}
          error={saveCampaign.error}
          isSubmitting={saveCampaign.isPending}
          onCancel={closeEditor}
          segments={segments}
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
          description="Refresh the workspace and try again."
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
          isMutating={saveCampaign.isPending || sendCampaign.isPending}
          onEdit={openEditEditor}
          onSend={sendCampaignById}
          segments={segments}
          segmentsById={segmentsById}
          sendingCampaignId={sendingCampaignId}
          subscribers={subscribers}
        />
      ) : null}
    </div>
  );
}

type CampaignsListProps = {
  campaigns: Campaign[];
  isMutating: boolean;
  onEdit: (campaign: Campaign) => void;
  onSend: (campaign: Campaign) => void;
  segments: Segment[];
  segmentsById: Map<string, string>;
  sendingCampaignId: string | null;
  subscribers: Subscriber[];
};

function CampaignsList({
  campaigns,
  isMutating,
  onEdit,
  onSend,
  segments,
  segmentsById,
  sendingCampaignId,
  subscribers,
}: CampaignsListProps) {
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
                  <CampaignActions
                    campaign={campaign}
                    isMutating={isMutating}
                    isSending={sendingCampaignId === campaign.id}
                    onEdit={onEdit}
                    onSend={onSend}
                  />
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
              <CampaignActions
                campaign={campaign}
                isMutating={isMutating}
                isSending={sendingCampaignId === campaign.id}
                onEdit={onEdit}
                onSend={onSend}
              />
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

function CampaignActions({
  campaign,
  isMutating,
  isSending,
  onEdit,
  onSend,
}: {
  campaign: Campaign;
  isMutating: boolean;
  isSending: boolean;
  onEdit: (campaign: Campaign) => void;
  onSend: (campaign: Campaign) => void;
}) {
  if (campaign.status !== 'draft') {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-neutral-200 px-3 text-xs text-neutral-500">
        Locked
      </span>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${campaign.subject}`} disabled={isMutating} onClick={() => onEdit(campaign)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <IconButton label={`Simulate send ${campaign.subject}`} disabled={isMutating} onClick={() => onSend(campaign)}>
        <Send className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{isSending ? 'Sending' : 'Send'}</span>
      </IconButton>
    </div>
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
  segments: Segment[];
};

function DemoCampaignEditor({ campaign, error, isSubmitting, onCancel, onSubmit, segments }: DemoCampaignEditorProps) {
  const defaultSegmentId =
    campaign?.segmentId && segments.some((segment) => segment.id === campaign.segmentId)
      ? campaign.segmentId
      : segments[0]?.id ?? null;
  const defaultAudienceType: CampaignAudienceType =
    campaign?.audienceType === 'segment' && defaultSegmentId ? 'segment' : 'all_subscribed';
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<CampaignFormInput, unknown, CampaignFormValues>({
    resolver: zodResolver(campaignInputSchema),
    defaultValues: {
      subject: campaign?.subject ?? '',
      bodyJson: campaign?.bodyJson ?? null,
      bodyHtml: campaign?.bodyHtml ?? null,
      audienceType: defaultAudienceType,
      segmentId: defaultAudienceType === 'segment' ? defaultSegmentId : null,
    },
  });
  const audienceType = useWatch({ control, name: 'audienceType' });
  const segmentId = useWatch({ control, name: 'segmentId' });
  const recipientCountQuery = useDemoCampaignRecipientCount(audienceType, segmentId);
  const editor = useEditor({
    extensions: [StarterKit],
    content: campaign?.bodyHtml || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'campaign-editor-content min-h-56 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 focus:outline-none',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setValue('bodyJson', currentEditor.getJSON(), { shouldDirty: true });
      setValue('bodyHtml', currentEditor.getHTML(), { shouldDirty: true });
    },
  });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          {campaign ? 'Edit draft campaign' : 'Create draft campaign'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Drafts are saved to the current workspace.</p>
      </div>

      <form
        className="mt-5 space-y-5"
        onSubmit={handleSubmit((values) =>
          onSubmit({
            ...values,
            bodyJson: editor?.getJSON() ?? values.bodyJson,
            bodyHtml: sanitizeCampaignHtml(editor?.getHTML() ?? values.bodyHtml),
            audienceType,
            segmentId: audienceType === 'segment' ? segmentId : null,
          }),
        )}
      >
        <div>
          <Input label="Subject" type="text" placeholder="June product notes" {...register('subject')} />
          {errors.subject ? <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p> : null}
        </div>

        <CampaignAudienceSelector
          audienceType={audienceType}
          count={recipientCountQuery.data}
          isCountLoading={recipientCountQuery.isLoading}
          segmentId={segmentId}
          segments={segments}
          onAudienceTypeChange={(nextAudienceType) => {
            setValue('audienceType', nextAudienceType, { shouldDirty: true, shouldValidate: true });
            setValue('segmentId', nextAudienceType === 'segment' ? segments[0]?.id ?? null : null, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onSegmentChange={(nextSegmentId) =>
            setValue('segmentId', nextSegmentId, { shouldDirty: true, shouldValidate: true })
          }
        />

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <EditorButton
              label="Bold"
              isActive={editor?.isActive('bold') ?? false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              B
            </EditorButton>
            <EditorButton
              label="Italic"
              isActive={editor?.isActive('italic') ?? false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              I
            </EditorButton>
            <EditorButton
              label="Heading"
              isActive={editor?.isActive('heading', { level: 2 }) ?? false}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </EditorButton>
            <EditorButton
              label="Bullet list"
              isActive={editor?.isActive('bulletList') ?? false}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              List
            </EditorButton>
          </div>
          <EditorContent editor={editor} />
        </div>

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

type CampaignAudienceSelectorProps = {
  audienceType: CampaignAudienceType;
  count?: number;
  isCountLoading: boolean;
  onAudienceTypeChange: (audienceType: CampaignAudienceType) => void;
  onSegmentChange: (segmentId: Id) => void;
  segmentId: Id | null;
  segments: Segment[];
};

function CampaignAudienceSelector({
  audienceType,
  count,
  isCountLoading,
  onAudienceTypeChange,
  onSegmentChange,
  segmentId,
  segments,
}: CampaignAudienceSelectorProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-neutral-950">Audience</h3>
          <p className="mt-1 text-xs text-neutral-500">Only subscribed subscribers are counted.</p>
        </div>
        <div className="font-mono-ui text-2xl font-semibold text-neutral-950">
          {isCountLoading ? '...' : count ?? 0}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Audience type</span>
          <select
            value={audienceType}
            onChange={(event) => onAudienceTypeChange(event.target.value === 'segment' ? 'segment' : 'all_subscribed')}
            className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
          >
            <option value="all_subscribed">All subscribed</option>
            <option value="segment" disabled={segments.length === 0}>
              Saved segment
            </option>
          </select>
        </label>

        {audienceType === 'segment' ? (
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Segment</span>
            <select
              value={segmentId ?? ''}
              onChange={(event) => onSegmentChange(event.target.value)}
              className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}

type EditorButtonProps = {
  children: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
};

function EditorButton({ children, isActive, label, onClick }: EditorButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={clsx(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-medium focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none',
        isActive
          ? 'border-neutral-950 bg-neutral-950 text-white'
          : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100',
      )}
    >
      {children}
    </button>
  );
}

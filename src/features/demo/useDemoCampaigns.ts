import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaveCampaignInput } from '../../lib/repositories/contracts';
import type { Campaign, Id, Segment, Subscriber } from '../../shared/types/domain';
import { subscriberMatchesRules } from '../../lib/demo-storage';
import { useDemoWorkspace } from './demoWorkspaceContext';

type WorkspaceMode = 'app' | 'demo';

function demoOverviewQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'overview', newsletterId] as const;
}

function demoCampaignsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'campaigns', newsletterId] as const;
}

function demoCampaignQueryKey(mode: WorkspaceMode, newsletterId: Id, campaignId: Id) {
  return [mode, 'campaigns', newsletterId, campaignId] as const;
}

function demoCampaignRecipientCountQueryKey(
  mode: WorkspaceMode,
  newsletterId: Id,
  audienceType: Campaign['audienceType'],
  segmentId: Id | null,
) {
  return [mode, 'campaigns', newsletterId, 'recipient-count', audienceType, segmentId] as const;
}

function demoActivityQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'activity', newsletterId] as const;
}

export function useDemoCampaigns() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignsQueryKey(mode, newsletterId),
    queryFn: () => repositories.campaigns.list(newsletterId),
  });
}

export function useDemoCampaign(campaignId: Id | null) {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: campaignId ? demoCampaignQueryKey(mode, newsletterId, campaignId) : [mode, 'campaigns', newsletterId, 'missing'],
    queryFn: () => repositories.campaigns.get(newsletterId, campaignId ?? ''),
    enabled: Boolean(campaignId),
  });
}

export function useSaveDemoCampaignDraft() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, input }: { campaignId?: Id; input: SaveCampaignInput }) =>
      repositories.campaigns.saveDraft(newsletterId, input, campaignId),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: demoCampaignsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignQueryKey(mode, newsletterId, campaign.id) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
    },
  });
}

export function useSendDemoCampaign() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: Id) => repositories.campaigns.send(newsletterId, campaignId),
    onSuccess: ({ campaign }) => {
      void queryClient.invalidateQueries({ queryKey: demoCampaignsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignQueryKey(mode, newsletterId, campaign.id) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoActivityQueryKey(mode, newsletterId) });
    },
  });
}

export function useDemoCampaignRecipientCount(audienceType: Campaign['audienceType'], segmentId: Id | null) {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignRecipientCountQueryKey(mode, newsletterId, audienceType, segmentId),
    queryFn: async () => {
      const [subscribers, segments] = await Promise.all([
        repositories.subscribers.list(newsletterId),
        repositories.segments.list(newsletterId),
      ]);

      return countCampaignRecipients(subscribers, segments, audienceType, segmentId);
    },
  });
}

export function countCampaignRecipients(
  subscribers: Subscriber[],
  segments: Segment[],
  audienceType: Campaign['audienceType'],
  segmentId: Id | null,
) {
  const segment = audienceType === 'segment' ? segments.find((candidate) => candidate.id === segmentId) ?? null : null;

  if (audienceType === 'segment' && !segment) {
    return 0;
  }

  return subscribers.filter((subscriber) => {
    if (subscriber.status !== 'subscribed') {
      return false;
    }

    return segment ? subscriberMatchesRules(subscriber, segment.rules) : true;
  }).length;
}

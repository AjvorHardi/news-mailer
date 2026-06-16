import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaveCampaignInput } from '../../lib/repositories/contracts';
import type { Campaign, Id, Segment, Subscriber } from '../../shared/types/domain';
import { subscriberMatchesRules } from '../../lib/demo-storage';
import { useDemoWorkspace } from './demoWorkspaceContext';

function demoOverviewQueryKey(newsletterId: Id) {
  return ['demo', 'overview', newsletterId] as const;
}

function demoCampaignsQueryKey(newsletterId: Id) {
  return ['demo', 'campaigns', newsletterId] as const;
}

function demoCampaignQueryKey(newsletterId: Id, campaignId: Id) {
  return ['demo', 'campaigns', newsletterId, campaignId] as const;
}

function demoCampaignRecipientCountQueryKey(newsletterId: Id, audienceType: Campaign['audienceType'], segmentId: Id | null) {
  return ['demo', 'campaigns', newsletterId, 'recipient-count', audienceType, segmentId] as const;
}

function demoActivityQueryKey(newsletterId: Id) {
  return ['demo', 'activity', newsletterId] as const;
}

export function useDemoCampaigns() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignsQueryKey(newsletterId),
    queryFn: () => repositories.campaigns.list(newsletterId),
  });
}

export function useDemoCampaign(campaignId: Id | null) {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: campaignId ? demoCampaignQueryKey(newsletterId, campaignId) : ['demo', 'campaigns', newsletterId, 'missing'],
    queryFn: () => repositories.campaigns.get(newsletterId, campaignId ?? ''),
    enabled: Boolean(campaignId),
  });
}

export function useSaveDemoCampaignDraft() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, input }: { campaignId?: Id; input: SaveCampaignInput }) =>
      repositories.campaigns.saveDraft(newsletterId, input, campaignId),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: demoCampaignsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignQueryKey(newsletterId, campaign.id) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
    },
  });
}

export function useSendDemoCampaign() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: Id) => repositories.campaigns.send(newsletterId, campaignId),
    onSuccess: ({ campaign }) => {
      void queryClient.invalidateQueries({ queryKey: demoCampaignsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignQueryKey(newsletterId, campaign.id) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoActivityQueryKey(newsletterId) });
    },
  });
}

export function useDemoCampaignRecipientCount(audienceType: Campaign['audienceType'], segmentId: Id | null) {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignRecipientCountQueryKey(newsletterId, audienceType, segmentId),
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

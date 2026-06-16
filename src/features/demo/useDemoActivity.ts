import { useQuery } from '@tanstack/react-query';
import type { Id } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

function demoActivityStatsQueryKey(newsletterId: Id) {
  return ['demo', 'activity', newsletterId, 'stats'] as const;
}

function demoActivityRecipientsQueryKey(newsletterId: Id) {
  return ['demo', 'activity', newsletterId, 'recipients'] as const;
}

function demoCampaignsQueryKey(newsletterId: Id) {
  return ['demo', 'campaigns', newsletterId] as const;
}

export function useDemoActivityStats() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoActivityStatsQueryKey(newsletterId),
    queryFn: () => repositories.activity.getStats(newsletterId),
  });
}

export function useDemoActivityRecipients() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoActivityRecipientsQueryKey(newsletterId),
    queryFn: () => repositories.activity.listRecipients(newsletterId),
  });
}

export function useDemoActivityCampaigns() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignsQueryKey(newsletterId),
    queryFn: () => repositories.campaigns.list(newsletterId),
  });
}

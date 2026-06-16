import { useQuery } from '@tanstack/react-query';
import type { Id } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

type WorkspaceMode = 'app' | 'demo';

function demoActivityStatsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'activity', newsletterId, 'stats'] as const;
}

function demoActivityRecipientsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'activity', newsletterId, 'recipients'] as const;
}

function demoCampaignsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'campaigns', newsletterId] as const;
}

export function useDemoActivityStats() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoActivityStatsQueryKey(mode, newsletterId),
    queryFn: () => repositories.activity.getStats(newsletterId),
  });
}

export function useDemoActivityRecipients() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoActivityRecipientsQueryKey(mode, newsletterId),
    queryFn: () => repositories.activity.listRecipients(newsletterId),
  });
}

export function useDemoActivityCampaigns() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoCampaignsQueryKey(mode, newsletterId),
    queryFn: () => repositories.campaigns.list(newsletterId),
  });
}

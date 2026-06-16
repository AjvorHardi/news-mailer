import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaveSegmentInput } from '../../lib/repositories/contracts';
import type { Id, SegmentRule } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

type WorkspaceMode = 'app' | 'demo';

function demoOverviewQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'overview', newsletterId] as const;
}

function demoSegmentsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'segments', newsletterId] as const;
}

function demoCampaignRecipientCountsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'campaigns', newsletterId, 'recipient-count'] as const;
}

function demoSegmentMatchCountQueryKey(mode: WorkspaceMode, newsletterId: Id, rules: SegmentRule[]) {
  return [mode, 'segments', newsletterId, 'match-count', rules] as const;
}

export function useDemoSegments() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSegmentsQueryKey(mode, newsletterId),
    queryFn: () => repositories.segments.list(newsletterId),
  });
}

export function useSaveDemoSegment() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, segmentId }: { input: SaveSegmentInput; segmentId?: Id }) =>
      repositories.segments.save(newsletterId, input, segmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSegmentsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: [mode, 'segments', newsletterId, 'match-count'] });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useRemoveDemoSegment() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentId: Id) => repositories.segments.remove(newsletterId, segmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSegmentsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useDemoSegmentMatchCount(rules: SegmentRule[], enabled = true) {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSegmentMatchCountQueryKey(mode, newsletterId, rules),
    queryFn: () => repositories.segments.countMatches(newsletterId, rules),
    enabled,
  });
}

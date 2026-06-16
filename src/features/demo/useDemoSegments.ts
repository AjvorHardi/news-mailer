import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SaveSegmentInput } from '../../lib/repositories/contracts';
import type { Id, SegmentRule } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

function demoOverviewQueryKey(newsletterId: Id) {
  return ['demo', 'overview', newsletterId] as const;
}

function demoSegmentsQueryKey(newsletterId: Id) {
  return ['demo', 'segments', newsletterId] as const;
}

function demoCampaignRecipientCountsQueryKey(newsletterId: Id) {
  return ['demo', 'campaigns', newsletterId, 'recipient-count'] as const;
}

function demoSegmentMatchCountQueryKey(newsletterId: Id, rules: SegmentRule[]) {
  return ['demo', 'segments', newsletterId, 'match-count', rules] as const;
}

export function useDemoSegments() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSegmentsQueryKey(newsletterId),
    queryFn: () => repositories.segments.list(newsletterId),
  });
}

export function useSaveDemoSegment() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, segmentId }: { input: SaveSegmentInput; segmentId?: Id }) =>
      repositories.segments.save(newsletterId, input, segmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSegmentsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: ['demo', 'segments', newsletterId, 'match-count'] });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useRemoveDemoSegment() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segmentId: Id) => repositories.segments.remove(newsletterId, segmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSegmentsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useDemoSegmentMatchCount(rules: SegmentRule[], enabled = true) {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSegmentMatchCountQueryKey(newsletterId, rules),
    queryFn: () => repositories.segments.countMatches(newsletterId, rules),
    enabled,
  });
}

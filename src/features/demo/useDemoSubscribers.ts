import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpsertSubscriberInput } from '../../lib/repositories/contracts';
import type { Id, SubscriberStatus } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

function demoOverviewQueryKey(newsletterId: Id) {
  return ['demo', 'overview', newsletterId] as const;
}

function demoSubscribersQueryKey(newsletterId: Id) {
  return ['demo', 'subscribers', newsletterId] as const;
}

function demoSignupFormsQueryKey(newsletterId: Id) {
  return ['demo', 'signup-forms', newsletterId] as const;
}

function demoSegmentMatchCountsQueryKey(newsletterId: Id) {
  return ['demo', 'segments', newsletterId, 'match-count'] as const;
}

function demoCampaignRecipientCountsQueryKey(newsletterId: Id) {
  return ['demo', 'campaigns', newsletterId, 'recipient-count'] as const;
}

export function useDemoSubscribers() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSubscribersQueryKey(newsletterId),
    queryFn: () => repositories.subscribers.list(newsletterId),
  });
}

export function useDemoSubscriberSourceForms() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSignupFormsQueryKey(newsletterId),
    queryFn: () => repositories.signupForms.list(newsletterId),
  });
}

export function useUpsertDemoSubscriber() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertSubscriberInput) => repositories.subscribers.upsert(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useCreateDemoSubscriber() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertSubscriberInput) => repositories.subscribers.create(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useUpdateDemoSubscriber() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriberId, input }: { subscriberId: Id; input: UpsertSubscriberInput }) =>
      repositories.subscribers.update(newsletterId, subscriberId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useRemoveDemoSubscriber() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriberId: Id) => repositories.subscribers.remove(newsletterId, subscriberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

export function useSetDemoSubscriberStatus() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriberId, status }: { subscriberId: Id; status: SubscriberStatus }) =>
      repositories.subscribers.setStatus(newsletterId, subscriberId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(newsletterId) });
    },
  });
}

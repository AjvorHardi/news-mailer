import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpsertSubscriberInput } from '../../lib/repositories/contracts';
import type { Id, SubscriberStatus } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

type WorkspaceMode = 'app' | 'demo';

function demoOverviewQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'overview', newsletterId] as const;
}

function demoSubscribersQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'subscribers', newsletterId] as const;
}

function demoSignupFormsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'signup-forms', newsletterId] as const;
}

function demoSegmentMatchCountsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'segments', newsletterId, 'match-count'] as const;
}

function demoCampaignRecipientCountsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'campaigns', newsletterId, 'recipient-count'] as const;
}

export function useDemoSubscribers() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSubscribersQueryKey(mode, newsletterId),
    queryFn: () => repositories.subscribers.list(newsletterId),
  });
}

export function useDemoSubscriberSourceForms() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSignupFormsQueryKey(mode, newsletterId),
    queryFn: () => repositories.signupForms.list(newsletterId),
  });
}

export function useUpsertDemoSubscriber() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertSubscriberInput) => repositories.subscribers.upsert(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useCreateDemoSubscriber() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertSubscriberInput) => repositories.subscribers.create(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useUpdateDemoSubscriber() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriberId, input }: { subscriberId: Id; input: UpsertSubscriberInput }) =>
      repositories.subscribers.update(newsletterId, subscriberId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useRemoveDemoSubscriber() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriberId: Id) => repositories.subscribers.remove(newsletterId, subscriberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

export function useSetDemoSubscriberStatus() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriberId, status }: { subscriberId: Id; status: SubscriberStatus }) =>
      repositories.subscribers.setStatus(newsletterId, subscriberId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSubscribersQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoCampaignRecipientCountsQueryKey(mode, newsletterId) });
    },
  });
}

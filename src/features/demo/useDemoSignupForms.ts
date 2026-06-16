import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSignupFormInput, UpdateSignupFormInput } from '../../lib/repositories/contracts';
import type { Id } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

function demoOverviewQueryKey(newsletterId: Id) {
  return ['demo', 'overview', newsletterId] as const;
}

function demoSignupFormsQueryKey(newsletterId: Id) {
  return ['demo', 'signup-forms', newsletterId] as const;
}

function demoSegmentMatchCountsQueryKey(newsletterId: Id) {
  return ['demo', 'segments', newsletterId, 'match-count'] as const;
}

export function useDemoSignupForms() {
  const { newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSignupFormsQueryKey(newsletterId),
    queryFn: () => repositories.signupForms.list(newsletterId),
  });
}

export function useCreateDemoSignupForm() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSignupFormInput) => repositories.signupForms.create(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
    },
  });
}

export function useUpdateDemoSignupForm() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, input }: { formId: Id; input: UpdateSignupFormInput }) =>
      repositories.signupForms.update(newsletterId, formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
    },
  });
}

export function useSetDemoSignupFormActive() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, isActive }: { formId: Id; isActive: boolean }) =>
      repositories.signupForms.update(newsletterId, formId, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
    },
  });
}

export function useRemoveDemoSignupForm() {
  const { newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: Id) => repositories.signupForms.remove(newsletterId, formId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(newsletterId) });
      void queryClient.invalidateQueries({ queryKey: ['demo', 'subscribers', newsletterId] });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(newsletterId) });
    },
  });
}

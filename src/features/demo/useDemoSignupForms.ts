import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSignupFormInput, UpdateSignupFormInput } from '../../lib/repositories/contracts';
import type { Id } from '../../shared/types/domain';
import { useDemoWorkspace } from './demoWorkspaceContext';

type WorkspaceMode = 'app' | 'demo';

function demoOverviewQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'overview', newsletterId] as const;
}

function demoSignupFormsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'signup-forms', newsletterId] as const;
}

function demoSegmentMatchCountsQueryKey(mode: WorkspaceMode, newsletterId: Id) {
  return [mode, 'segments', newsletterId, 'match-count'] as const;
}

export function useDemoSignupForms() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();

  return useQuery({
    queryKey: demoSignupFormsQueryKey(mode, newsletterId),
    queryFn: () => repositories.signupForms.list(newsletterId),
  });
}

export function useCreateDemoSignupForm() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSignupFormInput) => repositories.signupForms.create(newsletterId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
    },
  });
}

export function useUpdateDemoSignupForm() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, input }: { formId: Id; input: UpdateSignupFormInput }) =>
      repositories.signupForms.update(newsletterId, formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
    },
  });
}

export function useSetDemoSignupFormActive() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formId, isActive }: { formId: Id; isActive: boolean }) =>
      repositories.signupForms.update(newsletterId, formId, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
    },
  });
}

export function useRemoveDemoSignupForm() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: Id) => repositories.signupForms.remove(newsletterId, formId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: demoSignupFormsQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: demoOverviewQueryKey(mode, newsletterId) });
      void queryClient.invalidateQueries({ queryKey: [mode, 'subscribers', newsletterId] });
      void queryClient.invalidateQueries({ queryKey: demoSegmentMatchCountsQueryKey(mode, newsletterId) });
    },
  });
}

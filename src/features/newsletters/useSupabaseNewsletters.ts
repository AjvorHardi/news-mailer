import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateNewsletterInput } from '../../lib/repositories/contracts';
import { ensureSupabaseProfile, SupabaseNewsletterRepository } from '../../lib/supabase/supabaseRepositories';
import { useAuth } from '../auth/authContext';

const newsletterRepository = new SupabaseNewsletterRepository();

function newslettersQueryKey() {
  return ['app', 'newsletters'] as const;
}

function profileQueryKey() {
  return ['app', 'profile'] as const;
}

export function useEnsureSupabaseProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileQueryKey(),
    queryFn: () =>
      ensureSupabaseProfile({
        email: user?.email ?? '',
        fullName: typeof user?.user_metadata.fullName === 'string' ? user.user_metadata.fullName : null,
        selectedPlan: typeof user?.user_metadata.selectedPlan === 'string' ? user.user_metadata.selectedPlan : null,
        subscriberLimit:
          typeof user?.user_metadata.subscriberLimit === 'number' ? user.user_metadata.subscriberLimit : null,
      }),
    enabled: Boolean(user?.email),
  });
}

export function useSupabaseNewsletters() {
  return useQuery({
    queryKey: newslettersQueryKey(),
    queryFn: () => newsletterRepository.list(),
  });
}

export function useCreateSupabaseNewsletter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNewsletterInput) => newsletterRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newslettersQueryKey() });
    },
  });
}

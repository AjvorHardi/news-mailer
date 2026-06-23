import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateNewsletterInput } from '../../lib/repositories/contracts';
import { ensureSupabaseProfile, SupabaseNewsletterRepository } from '../../lib/supabase/supabaseRepositories';
import { useAuth } from '../auth/authContext';

const newsletterRepository = new SupabaseNewsletterRepository();

function newslettersQueryKey(userId: string | undefined) {
  return ['app', 'newsletters', userId] as const;
}

function profileQueryKey(userId: string | undefined) {
  return ['app', 'profile', userId] as const;
}

export function useEnsureSupabaseProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileQueryKey(user?.id),
    queryFn: () =>
      ensureSupabaseProfile({
        email: user?.email ?? '',
        fullName: typeof user?.user_metadata.fullName === 'string' ? user.user_metadata.fullName : null,
        selectedPlan: typeof user?.user_metadata.selectedPlan === 'string' ? user.user_metadata.selectedPlan : null,
        subscriberLimit:
          typeof user?.user_metadata.subscriberLimit === 'number' ? user.user_metadata.subscriberLimit : null,
      }),
    enabled: Boolean(user?.id && user?.email),
  });
}

export function useSupabaseNewsletters() {
  const { user } = useAuth();

  return useQuery({
    queryKey: newslettersQueryKey(user?.id),
    queryFn: () => newsletterRepository.list(),
    enabled: Boolean(user?.id),
  });
}

export function useCreateSupabaseNewsletter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateNewsletterInput) => newsletterRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newslettersQueryKey(user?.id) });
    },
  });
}

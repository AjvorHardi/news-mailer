import { useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../shared/ui/Button';
import { isSupabaseConfigured, requireSupabaseClient } from '../../lib/supabase/client';

export function PublicUnsubscribePage() {
  const { token } = useParams();
  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Unsubscribe token is missing.');
      }

      const client = requireSupabaseClient();
      const { data, error } = await client.functions.invoke<{ ok: boolean }>('unsubscribe', {
        body: { token },
      });

      if (error) {
        throw new Error(error.message || 'Unsubscribe request could not be completed.');
      }

      if (!data?.ok) {
        throw new Error('Unsubscribe request could not be completed.');
      }
    },
  });
  const canSubmit = Boolean(token) && isSupabaseConfigured && !unsubscribe.isPending && !unsubscribe.isSuccess;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="font-display text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Unsubscribe</p>
        <h1 className="font-display mt-3 text-2xl font-semibold text-neutral-950">Manage email preferences</h1>
        {unsubscribe.isSuccess ? (
          <p className="mt-2 text-sm leading-6 text-neutral-600" role="status" aria-live="polite">
            You have been unsubscribed. Future campaign sends will exclude this address.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Confirm that you want to stop receiving future emails from this newsletter.
          </p>
        )}

        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
            Supabase is not configured for public unsubscribe requests.
          </div>
        ) : null}

        {!token ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
            This unsubscribe link is missing its token.
          </div>
        ) : null}

        {unsubscribe.error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600" role="alert">
            {unsubscribe.error.message}
          </div>
        ) : null}

        <div className="mt-6">
          <Button
            type="button"
            variant="danger"
            className="w-full sm:w-auto"
            disabled={!canSubmit}
            onClick={() => unsubscribe.mutate()}
          >
            {unsubscribe.isPending ? 'Unsubscribing...' : unsubscribe.isSuccess ? 'Unsubscribed' : 'Unsubscribe'}
          </Button>
        </div>
      </div>
    </section>
  );
}

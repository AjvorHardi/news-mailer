import { useParams } from 'react-router';
import { Button } from '../../shared/ui/Button';

export function PublicUnsubscribePage() {
  const { token } = useParams();

  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="font-display text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Unsubscribe</p>
        <h1 className="font-display mt-3 text-2xl font-semibold text-neutral-950">Manage email preferences</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Token-based unsubscribe handling will be connected through a public Edge Function later.
        </p>
        <p className="font-mono-ui mt-4 break-all rounded-md bg-neutral-100 p-3 text-xs text-neutral-600">{token}</p>
        <div className="mt-6">
          <Button type="button" variant="danger" disabled>
            Unsubscribe
          </Button>
        </div>
      </div>
    </section>
  );
}

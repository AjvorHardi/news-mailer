import { useParams } from 'react-router';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';

export function PublicSubscribePage() {
  const { formSlug } = useParams();

  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">Public signup form</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-950">Subscribe to this newsletter</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Public form loading for <span className="font-medium text-neutral-950">{formSlug}</span> will use a safe Edge
          Function in a later phase.
        </p>
        <form className="mt-6 space-y-4">
          <Input label="Email" type="email" placeholder="reader@example.com" disabled />
          <Input label="Name" type="text" placeholder="Optional" disabled />
          <Button type="button" disabled>
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}

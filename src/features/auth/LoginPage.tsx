import { Link } from 'react-router';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';

export function LoginPage() {
  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Log in</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Supabase authentication will be connected in a later phase.</p>
      <form className="mt-6 space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" disabled />
        <Input label="Password" type="password" placeholder="Password" disabled />
        <Button type="button" disabled className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-5 text-sm text-neutral-600">
        No account?{' '}
        <Link to="/register" className="font-medium text-neutral-950 underline underline-offset-4">
          Create one
        </Link>
      </p>
    </section>
  );
}

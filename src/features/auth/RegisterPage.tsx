import { Link } from 'react-router';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';

export function RegisterPage() {
  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Create account</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        The pricing slider and Supabase signup flow will be added after the shell is reviewed.
      </p>
      <form className="mt-6 space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" disabled />
        <Input label="Password" type="password" placeholder="Password" disabled />
        <div>
          <label htmlFor="subscribers" className="text-sm font-medium text-neutral-800">
            Subscriber tier
          </label>
          <input id="subscribers" type="range" min="500" max="20000" step="500" disabled className="mt-3 w-full" />
          <p className="mt-2 text-sm text-neutral-500">$10/month up to 500 subscribers</p>
        </div>
        <Button type="button" disabled className="w-full">
          Sign up
        </Button>
      </form>
      <p className="mt-5 text-sm text-neutral-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-neutral-950 underline underline-offset-4">
          Log in
        </Link>
      </p>
    </section>
  );
}

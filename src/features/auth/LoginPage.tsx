import { Link, Navigate, useNavigate } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useAuth } from './authContext';

const loginSchema = z.object({
  email: z.email('Use a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInput = z.input<typeof loginSchema>;
type LoginFormValues = z.output<typeof loginSchema>;

export function LoginPage() {
  const { isConfigured, isLoading, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (!isLoading && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Log in</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Use your Supabase Auth email and password.</p>

      {!isConfigured ? (
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local env file.
        </div>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setAuthError(null);

          try {
            await signIn(values.email, values.password);
            navigate('/app', { replace: true });
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Login failed');
          }
        })}
      >
        <div>
          <Input label="Email" type="email" placeholder="you@example.com" disabled={!isConfigured || isLoading} {...register('email')} />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <Input label="Password" type="password" placeholder="Password" disabled={!isConfigured || isLoading} {...register('password')} />
          {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        <Button type="submit" disabled={!isConfigured || isLoading} className="w-full">
          {isLoading ? 'Checking session...' : 'Log in'}
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

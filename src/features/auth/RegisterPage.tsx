import { Link, Navigate, useNavigate } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useAuth } from './authContext';

const registerSchema = z
  .object({
    email: z.email('Use a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormInput = z.input<typeof registerSchema>;
type RegisterFormValues = z.output<typeof registerSchema>;

function formatSubscriberLimit(value: number) {
  return new Intl.NumberFormat('en').format(value);
}

function getPlanLabel(subscriberLimit: number) {
  const price = subscriberLimit <= 500 ? 10 : Math.ceil(subscriberLimit / 1000) * 10;
  return `$${price}/month up to ${formatSubscriberLimit(subscriberLimit)} subscribers`;
}

export function RegisterPage() {
  const { isConfigured, isLoading, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [subscriberLimit, setSubscriberLimit] = useState(500);
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const selectedPlan = getPlanLabel(subscriberLimit);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (!isLoading && user) {
    return <Navigate to="/app" replace />;
  }

  if (confirmationEmail) {
    return (
      <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-neutral-950">Check your email</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Supabase accepted the signup for {confirmationEmail}. Confirm the email address, then log in.
        </p>
        <Button type="button" className="mt-6 w-full" onClick={() => navigate('/login')}>
          Go to login
        </Button>
      </section>
    );
  }

  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Create account</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Create a Supabase Auth account for the real workspace.</p>

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
            const result = await signUp(values.email, values.password, {
              subscriberLimit,
              selectedPlan,
            });

            if (result.needsEmailConfirmation) {
              setConfirmationEmail(values.email);
              return;
            }

            navigate('/app', { replace: true });
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Registration failed');
          }
        })}
      >
        <div>
          <Input label="Email" type="email" placeholder="you@example.com" disabled={!isConfigured || isLoading} {...register('email')} />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <Input label="Password" type="password" placeholder="At least 8 characters" disabled={!isConfigured || isLoading} {...register('password')} />
          {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        <div>
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            disabled={!isConfigured || isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
        </div>
        <div>
          <label htmlFor="subscribers" className="text-sm font-medium text-neutral-800">
            Subscriber tier
          </label>
          <input
            id="subscribers"
            type="range"
            min="500"
            max="20000"
            step="500"
            value={subscriberLimit}
            disabled={!isConfigured || isLoading}
            onChange={(event) => setSubscriberLimit(Number(event.target.value))}
            className="mt-3 w-full"
          />
          <p className="mt-2 text-sm text-neutral-500">{selectedPlan}</p>
        </div>
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        <Button type="submit" disabled={!isConfigured || isLoading} className="w-full">
          {isLoading ? 'Checking session...' : 'Sign up'}
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

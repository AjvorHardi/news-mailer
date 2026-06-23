import { Link } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useAuth } from './authContext';

const forgotPasswordSchema = z.object({
  email: z.email('Use a valid email address'),
});

type ForgotPasswordFormInput = z.input<typeof forgotPasswordSchema>;
type ForgotPasswordFormValues = z.output<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { isConfigured, isLoading, requestPasswordReset } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormInput, unknown, ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  const isDisabled = !isConfigured || isLoading || isSubmitting;

  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Reset password</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Enter your account email and we will send a password reset link if the account exists.
      </p>

      {!isConfigured ? (
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local env file.
        </div>
      ) : null}

      {didSubmit ? (
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          If an account exists for that email, a reset link has been sent.
        </div>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setAuthError(null);
          setDidSubmit(false);

          try {
            await requestPasswordReset(values.email, `${window.location.origin}/reset-password`);
            setDidSubmit(true);
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Password reset request failed');
          }
        })}
      >
        <div>
          <Input label="Email" type="email" placeholder="you@example.com" disabled={isDisabled} {...register('email')} />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        <Button type="submit" disabled={isDisabled} className="w-full">
          {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>
      <p className="mt-5 text-sm text-neutral-600">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-neutral-950 underline underline-offset-4">
          Log in
        </Link>
      </p>
    </section>
  );
}

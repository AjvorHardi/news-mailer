import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useAuth } from './authContext';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormInput = z.input<typeof resetPasswordSchema>;
type ResetPasswordFormValues = z.output<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const { isConfigured, isLoading, isPasswordRecovery, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormInput, unknown, ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  const canUpdate = Boolean(isConfigured && isPasswordRecovery);
  const isDisabled = !canUpdate || isLoading || isSubmitting;

  return (
    <section className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h1 className="font-display text-2xl font-semibold text-neutral-950">Choose new password</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Set a new password for your NEWS-MAILER account.</p>

      {!isConfigured ? (
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local env file.
        </div>
      ) : null}

      {!isLoading && isConfigured && !isPasswordRecovery ? (
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          This reset link is missing, expired, or already used. Request a new password reset link.
        </div>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setAuthError(null);

          try {
            await updatePassword(values.password);
            await signOut();
            navigate('/login', { replace: true, state: { passwordReset: true } });
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Password update failed');
          }
        })}
      >
        <div>
          <Input label="New password" type="password" placeholder="At least 8 characters" disabled={isDisabled} {...register('password')} />
          {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
        </div>
        <div>
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            disabled={isDisabled}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
        </div>
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
        <Button type="submit" disabled={isDisabled} className="w-full">
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
      <p className="mt-5 text-sm text-neutral-600">
        Need another link?{' '}
        <Link to="/forgot-password" className="font-medium text-neutral-950 underline underline-offset-4">
          Request password reset
        </Link>
      </p>
    </section>
  );
}

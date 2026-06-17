import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { Input } from '../../shared/ui/Input';
import { PageHeader } from '../../shared/ui/PageHeader';
import { updateNewsletterSettingsSchema } from '../../shared/schemas/domainSchemas';
import { useDemoWorkspace } from '../demo/demoWorkspaceContext';
import type { z } from 'zod';

type SettingsFormInput = z.input<typeof updateNewsletterSettingsSchema>;
type SettingsFormValues = z.output<typeof updateNewsletterSettingsSchema>;

export function SettingsPage() {
  const { mode, newsletterId, repositories } = useDemoWorkspace();
  const queryClient = useQueryClient();
  const newsletterQuery = useQuery({
    queryKey: [mode, 'newsletter-settings', newsletterId],
    queryFn: () => repositories.newsletters.get(newsletterId),
  });
  const updateSettings = useMutation({
    mutationFn: (values: SettingsFormValues) => repositories.newsletters.updateSettings(newsletterId, values),
    onSuccess: (newsletter) => {
      void queryClient.invalidateQueries({ queryKey: [mode, 'newsletter-settings', newsletterId] });
      void queryClient.invalidateQueries({ queryKey: [mode, 'overview', newsletterId] });
      reset({
        name: newsletter.name,
        description: newsletter.description ?? '',
        senderName: newsletter.senderName,
        fromEmail: newsletter.fromEmail,
      });
    },
  });
  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(updateNewsletterSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      senderName: '',
      fromEmail: '',
    },
  });

  useEffect(() => {
    if (!newsletterQuery.data) {
      return;
    }

    reset({
      name: newsletterQuery.data.name,
      description: newsletterQuery.data.description ?? '',
      senderName: newsletterQuery.data.senderName,
      fromEmail: newsletterQuery.data.fromEmail,
    });
  }, [newsletterQuery.data, reset]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Newsletter settings"
        description="Manage the sender details used across forms, campaigns, and activity."
      />

      {newsletterQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading settings...</div>
      ) : null}

      {newsletterQuery.isError ? (
        <EmptyState title="Settings could not be loaded" description={newsletterQuery.error.message} />
      ) : null}

      {newsletterQuery.data ? (
        <section className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) =>
              updateSettings.mutate({
                ...values,
                description: values.description?.trim() ? values.description.trim() : null,
              }),
            )}
          >
            <div>
              <Input label="Newsletter name" type="text" {...register('name')} />
              {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <Input label="Description" type="text" {...register('description')} />
              {errors.description ? <p className="mt-2 text-sm text-red-600">{errors.description.message}</p> : null}
            </div>
            <div>
              <Input label="Sender name" type="text" {...register('senderName')} />
              {errors.senderName ? <p className="mt-2 text-sm text-red-600">{errors.senderName.message}</p> : null}
            </div>
            <div>
              <Input label="From email" type="email" {...register('fromEmail')} />
              {errors.fromEmail ? <p className="mt-2 text-sm text-red-600">{errors.fromEmail.message}</p> : null}
              {mode === 'app' ? (
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Resend must allow this sender before production use. Portfolio sends remain restricted to your own login email.
                </p>
              ) : null}
            </div>

            {updateSettings.error ? (
              <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
                {updateSettings.error.message}
              </div>
            ) : null}

            {updateSettings.isSuccess ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Settings saved.
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save settings'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

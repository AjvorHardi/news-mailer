import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { createNewsletterSchema } from '../../shared/schemas/domainSchemas';
import { useCreateSupabaseNewsletter, useEnsureSupabaseProfile, useSupabaseNewsletters } from './useSupabaseNewsletters';
import type { z } from 'zod';

type NewsletterFormInput = z.input<typeof createNewsletterSchema>;
type NewsletterFormValues = z.output<typeof createNewsletterSchema>;

export function NewsletterSelectPage() {
  const navigate = useNavigate();
  const profileQuery = useEnsureSupabaseProfile();
  const newslettersQuery = useSupabaseNewsletters();
  const createNewsletter = useCreateSupabaseNewsletter();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<NewsletterFormInput, unknown, NewsletterFormValues>({
    resolver: zodResolver(createNewsletterSchema),
    defaultValues: {
      name: '',
      description: '',
      senderName: '',
    },
  });
  const isLoading = profileQuery.isLoading || newslettersQuery.isLoading;
  const error = profileQuery.error ?? newslettersQuery.error ?? createNewsletter.error;

  function closeCreateForm() {
    reset();
    createNewsletter.reset();
    setIsCreateFormOpen(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Newsletter workspace"
        description="Select an existing newsletter or create a workspace for authenticated app data."
        actions={
          <Button type="button" onClick={() => setIsCreateFormOpen(true)} disabled={createNewsletter.isPending}>
            Create newsletter
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Workspace data could not be loaded'}
        </div>
      ) : null}

      {isCreateFormOpen ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="border-b border-neutral-200 pb-4">
            <h2 className="font-display text-base font-semibold text-neutral-950">Create newsletter</h2>
            <p className="mt-1 text-sm text-neutral-500">This creates a real newsletter row scoped to your Supabase user.</p>
          </div>
          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              const newsletter = await createNewsletter.mutateAsync({
                ...values,
                description: values.description?.trim() ? values.description.trim() : null,
              });

              closeCreateForm();
              navigate(`/app/newsletters/${newsletter.id}`);
            })}
          >
            <div>
              <Input label="Newsletter name" type="text" placeholder="Product Notes" {...register('name')} />
              {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <Input label="Sender name" type="text" placeholder="Your name or company" {...register('senderName')} />
              {errors.senderName ? <p className="mt-2 text-sm text-red-600">{errors.senderName.message}</p> : null}
            </div>
            <div className="md:col-span-2">
              <Input label="Description" type="text" placeholder="Optional" {...register('description')} />
              {errors.description ? <p className="mt-2 text-sm text-red-600">{errors.description.message}</p> : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
              <Button type="button" variant="secondary" onClick={closeCreateForm} disabled={createNewsletter.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createNewsletter.isPending}>
                Create newsletter
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading workspace...</div>
      ) : null}

      {newslettersQuery.data && newslettersQuery.data.length === 0 ? (
        <EmptyState
          title="No newsletters yet"
          description="Create your first newsletter workspace to start using authenticated app data."
          action={
            <Button type="button" onClick={() => setIsCreateFormOpen(true)} disabled={createNewsletter.isPending}>
              Create newsletter
            </Button>
          }
        />
      ) : null}

      {newslettersQuery.data && newslettersQuery.data.length > 0 ? (
        <section className="rounded-lg border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-200">
            {newslettersQuery.data.map((newsletter) => (
              <Link
                key={newsletter.id}
                to={`/app/newsletters/${newsletter.id}`}
                className="block px-5 py-4 hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-base font-semibold text-neutral-950">{newsletter.name}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{newsletter.description ?? 'No description'}</p>
                  </div>
                  <span className="font-mono-ui text-xs text-neutral-500">{newsletter.fromEmail}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

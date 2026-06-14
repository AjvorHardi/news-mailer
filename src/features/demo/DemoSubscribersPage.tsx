import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { subscriberInputSchema } from '../../shared/schemas/domainSchemas';
import type { SignupForm, Subscriber } from '../../shared/types/domain';
import {
  useDemoSubscriberSourceForms,
  useDemoSubscribers,
  useRemoveDemoSubscriber,
  useSetDemoSubscriberStatus,
  useUpdateDemoSubscriber,
  useUpsertDemoSubscriber,
} from './useDemoSubscribers';
import type { z } from 'zod';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getStatusLabel(status: Subscriber['status']) {
  return status === 'subscribed' ? 'Subscribed' : 'Unsubscribed';
}

type SubscriberFormInput = z.input<typeof subscriberInputSchema>;
type SubscriberFormValues = z.output<typeof subscriberInputSchema>;

export function DemoSubscribersPage() {
  const subscribersQuery = useDemoSubscribers();
  const sourceFormsQuery = useDemoSubscriberSourceForms();
  const upsertSubscriber = useUpsertDemoSubscriber();
  const updateSubscriber = useUpdateDemoSubscriber();
  const setSubscriberStatus = useSetDemoSubscriberStatus();
  const removeSubscriber = useRemoveDemoSubscriber();
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sourceForms = useMemo(() => sourceFormsQuery.data ?? [], [sourceFormsQuery.data]);
  const formsById = useMemo(() => new Map(sourceForms.map((form) => [form.id, form.internalName])), [sourceForms]);
  const isMutating =
    upsertSubscriber.isPending || updateSubscriber.isPending || setSubscriberStatus.isPending || removeSubscriber.isPending;

  function openCreateForm() {
    setEditingSubscriber(null);
    setIsFormOpen(true);
  }

  function openEditForm(subscriber: Subscriber) {
    setEditingSubscriber(subscriber);
    setIsFormOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Demo subscribers"
        title="Subscriber list"
        description="Manage seeded subscribers in localStorage. Changes persist until the demo is reset."
        actions={
          <Button type="button" onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add subscriber
          </Button>
        }
      />

      {isFormOpen ? (
        <DemoSubscriberForm
          subscriber={editingSubscriber}
          sourceForms={sourceForms}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={async (values) => {
            const input = {
              ...values,
              name: values.name?.trim() ? values.name.trim() : null,
              sourceFormId: values.sourceFormId || null,
            };

            if (editingSubscriber) {
              await updateSubscriber.mutateAsync({ subscriberId: editingSubscriber.id, input });
            } else {
              await upsertSubscriber.mutateAsync(input);
            }

            setIsFormOpen(false);
            setEditingSubscriber(null);
          }}
          error={upsertSubscriber.error ?? updateSubscriber.error}
          isSubmitting={upsertSubscriber.isPending || updateSubscriber.isPending}
        />
      ) : null}

      {subscribersQuery.isLoading || sourceFormsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading subscribers...</div>
      ) : null}

      {subscribersQuery.isError || sourceFormsQuery.isError ? (
        <EmptyState title="Subscribers could not be loaded" description="Reset the demo data from the overview and try again." />
      ) : null}

      {subscribersQuery.data && subscribersQuery.data.length === 0 ? (
        <EmptyState
          title="No subscribers yet"
          description="The add subscriber flow will be enabled in the next Phase 4 milestone."
        />
      ) : null}

      {subscribersQuery.data && subscribersQuery.data.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {subscribersQuery.data.map((subscriber) => (
                  <tr key={subscriber.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-neutral-950">{subscriber.email}</div>
                      <div className="font-mono-ui mt-1 text-xs text-neutral-500">{subscriber.emailNormalized}</div>
                    </td>
                    <td className="px-4 py-4 text-neutral-700">{subscriber.name ?? '-'}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {getStatusLabel(subscriber.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-700">
                      {subscriber.sourceFormId ? formsById.get(subscriber.sourceFormId) ?? 'Unknown form' : 'Manual'}
                    </td>
                    <td className="px-4 py-4 text-neutral-700">{formatDate(subscriber.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="secondary" disabled={isMutating} onClick={() => openEditForm(subscriber)}>
                          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isMutating}
                          onClick={() =>
                            setSubscriberStatus.mutate({
                              subscriberId: subscriber.id,
                              status: subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed',
                            })
                          }
                        >
                          {subscriber.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          disabled={isMutating}
                          onClick={() => removeSubscriber.mutate(subscriber.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

type DemoSubscriberFormProps = {
  subscriber: Subscriber | null;
  sourceForms: SignupForm[];
  error: Error | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: SubscriberFormValues) => Promise<void>;
};

function DemoSubscriberForm({
  subscriber,
  sourceForms,
  error,
  isSubmitting,
  onCancel,
  onSubmit,
}: DemoSubscriberFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SubscriberFormInput, unknown, SubscriberFormValues>({
    resolver: zodResolver(subscriberInputSchema),
    defaultValues: {
      email: subscriber?.email ?? '',
      name: subscriber?.name ?? '',
      status: subscriber?.status ?? 'subscribed',
      sourceFormId: subscriber?.sourceFormId ?? '',
    },
  });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          {subscriber ? 'Edit subscriber' : 'Add subscriber'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Subscriber changes are stored in localStorage for demo mode.</p>
      </div>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input label="Email" type="email" placeholder="reader@example.com" {...register('email')} />
          {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <Input label="Name" type="text" placeholder="Optional" {...register('name')} />
          {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <label htmlFor="subscriber-status" className="block">
          <span className="text-sm font-medium text-neutral-800">Status</span>
          <select
            id="subscriber-status"
            className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            {...register('status')}
          >
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </label>

        <label htmlFor="subscriber-source-form" className="block">
          <span className="text-sm font-medium text-neutral-800">Source form</span>
          <select
            id="subscriber-source-form"
            className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            {...register('sourceFormId')}
          >
            <option value="">Manual</option>
            {sourceForms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.internalName}
              </option>
            ))}
          </select>
        </label>

        {errors.sourceFormId ? <p className="text-sm text-red-600 md:col-span-2">{errors.sourceFormId.message}</p> : null}
        {error ? <p className="text-sm text-red-600 md:col-span-2">{error.message}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {subscriber ? 'Save subscriber' : 'Add subscriber'}
          </Button>
        </div>
      </form>
    </section>
  );
}

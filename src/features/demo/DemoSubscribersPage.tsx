import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, UserCheck, UserMinus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { subscriberInputSchema } from '../../shared/schemas/domainSchemas';
import type { SignupForm, Subscriber } from '../../shared/types/domain';
import {
  useCreateDemoSubscriber,
  useDemoSubscriberSourceForms,
  useDemoSubscribers,
  useRemoveDemoSubscriber,
  useSetDemoSubscriberStatus,
  useUpdateDemoSubscriber,
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
  const createSubscriber = useCreateDemoSubscriber();
  const updateSubscriber = useUpdateDemoSubscriber();
  const setSubscriberStatus = useSetDemoSubscriberStatus();
  const removeSubscriber = useRemoveDemoSubscriber();
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [expandedSubscriberIds, setExpandedSubscriberIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sourceForms = useMemo(() => sourceFormsQuery.data ?? [], [sourceFormsQuery.data]);
  const formsById = useMemo(() => new Map(sourceForms.map((form) => [form.id, form.internalName])), [sourceForms]);
  const isMutating =
    createSubscriber.isPending ||
    updateSubscriber.isPending ||
    setSubscriberStatus.isPending ||
    removeSubscriber.isPending;

  function openCreateForm() {
    createSubscriber.reset();
    updateSubscriber.reset();
    setEditingSubscriber(null);
    setIsFormOpen(true);
  }

  function openEditForm(subscriber: Subscriber) {
    createSubscriber.reset();
    updateSubscriber.reset();
    setEditingSubscriber(subscriber);
    setIsFormOpen(true);
  }

  function closeForm() {
    createSubscriber.reset();
    updateSubscriber.reset();
    setIsFormOpen(false);
    setEditingSubscriber(null);
  }

  function toggleExpandedRow(subscriberId: string) {
    setExpandedSubscriberIds((currentIds) =>
      currentIds.includes(subscriberId)
        ? currentIds.filter((currentId) => currentId !== subscriberId)
        : [...currentIds, subscriberId],
    );
  }

  function toggleSubscriberStatus(subscriber: Subscriber) {
    setSubscriberStatus.mutate({
      subscriberId: subscriber.id,
      status: subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed',
    });
  }

  function removeSubscriberById(subscriber: Subscriber) {
    removeSubscriber.mutate(subscriber.id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actionsLayout="responsive-inline"
        eyebrow="Subscribers"
        title="Subscriber list"
        actions={
          <Button
            type="button"
            className="h-10 w-10 px-0 md:w-auto md:px-4"
            aria-label="Add subscriber"
            onClick={openCreateForm}
            disabled={isMutating}
          >
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">Add subscriber</span>
          </Button>
        }
      />

      {setSubscriberStatus.error || removeSubscriber.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {setSubscriberStatus.error?.message ?? removeSubscriber.error?.message}
        </div>
      ) : null}

      {isFormOpen ? (
        <DemoSubscriberForm
          subscriber={editingSubscriber}
          sourceForms={sourceForms}
          onCancel={closeForm}
          onSubmit={async (values) => {
            const input = {
              ...values,
              name: values.name?.trim() ? values.name.trim() : null,
              sourceFormId: values.sourceFormId || null,
            };

            if (editingSubscriber) {
              await updateSubscriber.mutateAsync({ subscriberId: editingSubscriber.id, input });
            } else {
              await createSubscriber.mutateAsync(input);
            }

            closeForm();
          }}
          error={createSubscriber.error ?? updateSubscriber.error}
          isSubmitting={createSubscriber.isPending || updateSubscriber.isPending}
        />
      ) : null}

      {subscribersQuery.isLoading || sourceFormsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading subscribers...</div>
      ) : null}

      {subscribersQuery.isError || sourceFormsQuery.isError ? (
        <EmptyState
          title="Subscribers could not be loaded"
          description="Refresh the workspace and try again."
        />
      ) : null}

      {subscribersQuery.data && subscribersQuery.data.length === 0 ? (
        <EmptyState
          title="No subscribers yet"
          description="Add a subscriber manually or publish a signup form to start growing the list."
        />
      ) : null}

      {subscribersQuery.data && subscribersQuery.data.length > 0 ? (
        <CompactSubscribersList
          expandedSubscriberIds={expandedSubscriberIds}
          formsById={formsById}
          isMutating={isMutating}
          onEdit={openEditForm}
          onRemove={removeSubscriberById}
          onToggleExpanded={toggleExpandedRow}
          onToggleStatus={toggleSubscriberStatus}
          subscribers={subscribersQuery.data}
        />
      ) : null}

      {subscribersQuery.data && subscribersQuery.data.length > 0 ? (
        <DesktopSubscribersTable
          formsById={formsById}
          isMutating={isMutating}
          onEdit={openEditForm}
          onRemove={removeSubscriberById}
          onToggleStatus={toggleSubscriberStatus}
          subscribers={subscribersQuery.data}
        />
      ) : null}
    </div>
  );
}

type SubscriberListProps = {
  formsById: Map<string, string>;
  isMutating: boolean;
  onEdit: (subscriber: Subscriber) => void;
  onRemove: (subscriber: Subscriber) => void;
  onToggleStatus: (subscriber: Subscriber) => void;
  subscribers: Subscriber[];
};

type CompactSubscribersListProps = SubscriberListProps & {
  expandedSubscriberIds: string[];
  onToggleExpanded: (subscriberId: string) => void;
};

function CompactSubscribersList({
  expandedSubscriberIds,
  formsById,
  isMutating,
  onEdit,
  onRemove,
  onToggleExpanded,
  onToggleStatus,
  subscribers,
}: CompactSubscribersListProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white min-[1120px]:hidden">
      <div className="divide-y divide-neutral-200">
        {subscribers.map((subscriber) => (
          <CompactSubscriberRow
            key={subscriber.id}
            formsById={formsById}
            isExpanded={expandedSubscriberIds.includes(subscriber.id)}
            isMutating={isMutating}
            onEdit={onEdit}
            onRemove={onRemove}
            onToggleExpanded={onToggleExpanded}
            onToggleStatus={onToggleStatus}
            subscriber={subscriber}
          />
        ))}
      </div>
    </section>
  );
}

type CompactSubscriberRowProps = Omit<SubscriberListProps, 'subscribers'> & {
  isExpanded: boolean;
  onToggleExpanded: (subscriberId: string) => void;
  subscriber: Subscriber;
};

function CompactSubscriberRow({
  formsById,
  isExpanded,
  isMutating,
  onEdit,
  onRemove,
  onToggleExpanded,
  onToggleStatus,
  subscriber,
}: CompactSubscriberRowProps) {
  const sourceLabel = getSourceLabel(subscriber, formsById);

  return (
    <article>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-3 min-[600px]:grid-cols-[minmax(0,1fr)_auto_auto] min-[800px]:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => onToggleExpanded(subscriber.id)}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md text-left focus:ring-2 focus:ring-neutral-950 focus:outline-none"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-950">{subscriber.email}</span>
            <span className="mt-1 block truncate text-xs text-neutral-500">{subscriber.name ?? 'No name'}</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          )}
        </button>
        <div className="hidden justify-self-center min-[600px]:block">
          <StatusBadge status={subscriber.status} />
        </div>
        <div className="hidden justify-self-center text-xs text-neutral-500 min-[800px]:block">
          {formatDate(subscriber.createdAt)}
        </div>
        <SubscriberActions
          isMutating={isMutating}
          onEdit={onEdit}
          onRemove={onRemove}
          onToggleStatus={onToggleStatus}
          subscriber={subscriber}
        />
      </div>

      {isExpanded ? (
        <dl className="grid grid-cols-2 gap-3 border-t border-neutral-200 bg-neutral-50 px-3 py-4 text-xs">
          <div>
            <dt className="font-medium text-neutral-500">Status</dt>
            <dd className="mt-1 text-neutral-950">{getStatusLabel(subscriber.status)}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Source</dt>
            <dd className="mt-1 text-neutral-950">{sourceLabel}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Created</dt>
            <dd className="mt-1 text-neutral-950">{formatDate(subscriber.createdAt)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-neutral-500">Normalized email</dt>
            <dd className="font-mono-ui mt-1 truncate text-neutral-950">{subscriber.emailNormalized}</dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}

function DesktopSubscribersTable({
  formsById,
  isMutating,
  onEdit,
  onRemove,
  onToggleStatus,
  subscribers,
}: SubscriberListProps) {
  return (
    <section className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white min-[1120px]:block">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-center">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Source
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id} className="align-middle">
                <td className="px-4 py-4 text-center align-middle">
                  <div className="font-medium text-neutral-950">{subscriber.email}</div>
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">{subscriber.name ?? '-'}</td>
                <td className="px-4 py-4 text-center align-middle">
                  <StatusBadge status={subscriber.status} />
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">
                  {getSourceLabel(subscriber, formsById)}
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">{formatDate(subscriber.createdAt)}</td>
                <td className="px-4 py-4 text-center align-middle">
                  <SubscriberActions
                    isMutating={isMutating}
                    onEdit={onEdit}
                    onRemove={onRemove}
                    onToggleStatus={onToggleStatus}
                    subscriber={subscriber}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getSourceLabel(subscriber: Subscriber, formsById: Map<string, string>) {
  return subscriber.sourceFormId ? formsById.get(subscriber.sourceFormId) ?? 'Unknown form' : 'Manual';
}

function StatusBadge({ status }: { status: Subscriber['status'] }) {
  return (
    <span className="inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {getStatusLabel(status)}
    </span>
  );
}

type SubscriberActionsProps = {
  isMutating: boolean;
  onEdit: (subscriber: Subscriber) => void;
  onRemove: (subscriber: Subscriber) => void;
  onToggleStatus: (subscriber: Subscriber) => void;
  subscriber: Subscriber;
};

function SubscriberActions({
  isMutating,
  onEdit,
  onRemove,
  onToggleStatus,
  subscriber,
}: SubscriberActionsProps) {
  const statusActionLabel = subscriber.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe';

  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${subscriber.email}`} disabled={isMutating} onClick={() => onEdit(subscriber)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <IconButton
        label={`${statusActionLabel} ${subscriber.email}`}
        disabled={isMutating}
        onClick={() => onToggleStatus(subscriber)}
      >
        {subscriber.status === 'subscribed' ? (
          <UserMinus className="h-4 w-4" aria-hidden="true" />
        ) : (
          <UserCheck className="h-4 w-4" aria-hidden="true" />
        )}
      </IconButton>
      <IconButton
        label={`Remove ${subscriber.email}`}
        variant="danger"
        disabled={isMutating}
        onClick={() => onRemove(subscriber)}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}

type IconButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  variant?: 'secondary' | 'danger';
};

function IconButton({ children, disabled, label, onClick, variant = 'secondary' }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'secondary' && 'border-neutral-300 text-neutral-800 hover:bg-neutral-100',
        variant === 'danger' && 'border-red-600 text-red-600 hover:bg-red-50',
      )}
    >
      {children}
    </button>
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
        <p className="mt-1 text-sm text-neutral-500">Subscriber changes are saved to the current workspace.</p>
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

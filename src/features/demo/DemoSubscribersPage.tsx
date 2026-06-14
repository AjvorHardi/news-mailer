import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import type { Subscriber } from '../../shared/types/domain';
import {
  useDemoSubscriberSourceForms,
  useDemoSubscribers,
  useRemoveDemoSubscriber,
  useSetDemoSubscriberStatus,
} from './useDemoSubscribers';

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

export function DemoSubscribersPage() {
  const subscribersQuery = useDemoSubscribers();
  const sourceFormsQuery = useDemoSubscriberSourceForms();
  const setSubscriberStatus = useSetDemoSubscriberStatus();
  const removeSubscriber = useRemoveDemoSubscriber();

  const formsById = new Map((sourceFormsQuery.data ?? []).map((form) => [form.id, form.internalName]));
  const isMutating = setSubscriberStatus.isPending || removeSubscriber.isPending;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Demo subscribers"
        title="Subscriber list"
        description="Manage seeded subscribers in localStorage. Changes persist until the demo is reset."
        actions={
          <Button type="button" disabled>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add subscriber
          </Button>
        }
      />

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
                        <Button type="button" variant="secondary" disabled>
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

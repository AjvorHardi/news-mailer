import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import type { SignupForm } from '../../shared/types/domain';
import { useResetDemoData } from './useDemoOverview';
import {
  useDemoSignupForms,
  useRemoveDemoSignupForm,
  useSetDemoSignupFormActive,
} from './useDemoSignupForms';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getPublicPath(form: SignupForm) {
  return `/subscribe/${form.slug}`;
}

export function DemoSignupFormsPage() {
  const formsQuery = useDemoSignupForms();
  const setFormActive = useSetDemoSignupFormActive();
  const removeForm = useRemoveDemoSignupForm();
  const resetDemoData = useResetDemoData();
  const isMutating = setFormActive.isPending || removeForm.isPending || resetDemoData.isPending;

  function toggleFormActive(form: SignupForm) {
    setFormActive.mutate({ formId: form.id, isActive: !form.isActive });
  }

  function removeFormById(form: SignupForm) {
    removeForm.mutate(form.id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actionsLayout="responsive-inline"
        eyebrow="Demo forms"
        title="Signup forms"
        description="Manage local demo signup forms and preview the public subscription copy before real subscribe behavior is added."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-10 px-0 md:w-auto md:px-4"
              aria-label="Reset demo"
              onClick={() => resetDemoData.mutate()}
              disabled={isMutating}
            >
              <RotateCcw className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
              <span className="hidden md:inline">Reset demo</span>
            </Button>
            <Button
              type="button"
              className="h-10 w-10 px-0 md:w-auto md:px-4"
              aria-label="Create form"
              disabled
            >
              <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
              <span className="hidden md:inline">Create form</span>
            </Button>
          </>
        }
      />

      {setFormActive.error || removeForm.error || resetDemoData.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {setFormActive.error?.message ?? removeForm.error?.message ?? resetDemoData.error?.message}
        </div>
      ) : null}

      {formsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading signup forms...</div>
      ) : null}

      {formsQuery.isError ? (
        <EmptyState
          title="Signup forms could not be loaded"
          description="Reset the demo data and try again."
          action={
            <Button type="button" variant="secondary" onClick={() => resetDemoData.mutate()} disabled={isMutating}>
              Reset demo
            </Button>
          }
        />
      ) : null}

      {formsQuery.data && formsQuery.data.length === 0 ? (
        <EmptyState
          title="No signup forms yet"
          description="Create a form to define the copy and public slug visitors will use to subscribe."
        />
      ) : null}

      {formsQuery.data && formsQuery.data.length > 0 ? (
        <FormsList
          forms={formsQuery.data}
          isMutating={isMutating}
          onRemove={removeFormById}
          onToggleActive={toggleFormActive}
        />
      ) : null}
    </div>
  );
}

type FormsListProps = {
  forms: SignupForm[];
  isMutating: boolean;
  onRemove: (form: SignupForm) => void;
  onToggleActive: (form: SignupForm) => void;
};

function FormsList({ forms, isMutating, onRemove, onToggleActive }: FormsListProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="hidden overflow-x-auto min-[960px]:block">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Form
              </th>
              <th scope="col" className="px-4 py-3">
                Public path
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Updated
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {forms.map((form) => (
              <tr key={form.id} className="align-middle">
                <td className="px-4 py-4 align-middle">
                  <div className="font-medium text-neutral-950">{form.internalName}</div>
                  <div className="font-mono-ui mt-1 text-xs text-neutral-500">{form.slug}</div>
                </td>
                <td className="font-mono-ui px-4 py-4 align-middle text-xs text-neutral-700">{getPublicPath(form)}</td>
                <td className="px-4 py-4 text-center align-middle">
                  <StatusBadge isActive={form.isActive} />
                </td>
                <td className="px-4 py-4 text-center align-middle text-neutral-700">{formatDate(form.updatedAt)}</td>
                <td className="px-4 py-4 text-center align-middle">
                  <FormActions
                    form={form}
                    isMutating={isMutating}
                    onRemove={onRemove}
                    onToggleActive={onToggleActive}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-neutral-200 min-[960px]:hidden">
        {forms.map((form) => (
          <article key={form.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-neutral-950">{form.internalName}</h2>
                <p className="font-mono-ui mt-1 truncate text-xs text-neutral-500">{getPublicPath(form)}</p>
              </div>
              <StatusBadge isActive={form.isActive} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="font-medium text-neutral-500">Slug</dt>
                <dd className="font-mono-ui mt-1 truncate text-neutral-950">{form.slug}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Updated</dt>
                <dd className="mt-1 text-neutral-950">{formatDate(form.updatedAt)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end">
              <FormActions
                form={form}
                isMutating={isMutating}
                onRemove={onRemove}
                onToggleActive={onToggleActive}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className="inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

type FormActionsProps = {
  form: SignupForm;
  isMutating: boolean;
  onRemove: (form: SignupForm) => void;
  onToggleActive: (form: SignupForm) => void;
};

function FormActions({ form, isMutating, onRemove, onToggleActive }: FormActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${form.internalName}`} disabled>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <Button type="button" size="sm" variant="secondary" disabled={isMutating} onClick={() => onToggleActive(form)}>
        {form.isActive ? 'Deactivate' : 'Activate'}
      </Button>
      <IconButton
        label={`Delete ${form.internalName}`}
        variant="danger"
        disabled={isMutating}
        onClick={() => onRemove(form)}
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
  onClick?: () => void;
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

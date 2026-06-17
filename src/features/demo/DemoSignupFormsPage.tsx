import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { signupFormInputSchema } from '../../shared/schemas/domainSchemas';
import type { SignupForm } from '../../shared/types/domain';
import {
  useCreateDemoSignupForm,
  useDemoSignupForms,
  useRemoveDemoSignupForm,
  useSetDemoSignupFormActive,
  useUpdateDemoSignupForm,
} from './useDemoSignupForms';
import type { z } from 'zod';

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

type SignupFormInput = z.input<typeof signupFormInputSchema>;
type SignupFormValues = z.output<typeof signupFormInputSchema>;

const defaultFormValues: SignupFormInput = {
  internalName: '',
  slug: '',
  heading: '',
  buttonText: 'Subscribe',
  successMessage: '',
  backgroundColor: '#ffffff',
  textColor: '#171717',
  buttonColor: '#171717',
  buttonTextColor: '#ffffff',
  isActive: true,
};

export function DemoSignupFormsPage() {
  const formsQuery = useDemoSignupForms();
  const createForm = useCreateDemoSignupForm();
  const updateForm = useUpdateDemoSignupForm();
  const setFormActive = useSetDemoSignupFormActive();
  const removeForm = useRemoveDemoSignupForm();
  const [editingForm, setEditingForm] = useState<SignupForm | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const isMutating =
    createForm.isPending ||
    updateForm.isPending ||
    setFormActive.isPending ||
    removeForm.isPending;

  function openCreateForm() {
    createForm.reset();
    updateForm.reset();
    setEditingForm(null);
    setIsEditorOpen(true);
  }

  function openEditForm(form: SignupForm) {
    createForm.reset();
    updateForm.reset();
    setEditingForm(form);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    createForm.reset();
    updateForm.reset();
    setEditingForm(null);
    setIsEditorOpen(false);
  }

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
        eyebrow="Forms"
        title="Signup forms"
        description="Manage signup forms and preview the public subscription copy."
        actions={
          <Button
            type="button"
            className="h-10 w-10 px-0 md:w-auto md:px-4"
            aria-label="Create form"
            onClick={openCreateForm}
            disabled={isMutating}
          >
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">Create form</span>
          </Button>
        }
      />

      {setFormActive.error || removeForm.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {setFormActive.error?.message ?? removeForm.error?.message}
        </div>
      ) : null}

      {isEditorOpen ? (
        <DemoSignupFormEditor
          key={editingForm?.id ?? 'new-form'}
          form={editingForm}
          error={createForm.error ?? updateForm.error}
          isSubmitting={createForm.isPending || updateForm.isPending}
          onCancel={closeEditor}
          onSubmit={async (values) => {
            const input = {
              ...values,
              successMessage: values.successMessage?.trim() || null,
            };

            if (editingForm) {
              await updateForm.mutateAsync({ formId: editingForm.id, input });
            } else {
              await createForm.mutateAsync(input);
            }

            closeEditor();
          }}
        />
      ) : null}

      {formsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading signup forms...</div>
      ) : null}

      {formsQuery.isError ? (
        <EmptyState
          title="Signup forms could not be loaded"
          description="Refresh the workspace and try again."
        />
      ) : null}

      {formsQuery.data && formsQuery.data.length === 0 ? (
        <EmptyState
          title="No signup forms yet"
          description="Create a form to define the copy and public slug visitors will use to subscribe."
          action={
            <Button type="button" onClick={openCreateForm} disabled={isMutating}>
              Create form
            </Button>
          }
        />
      ) : null}

      {formsQuery.data && formsQuery.data.length > 0 ? (
        <FormsList
          forms={formsQuery.data}
          isMutating={isMutating}
          onEdit={openEditForm}
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
  onEdit: (form: SignupForm) => void;
  onRemove: (form: SignupForm) => void;
  onToggleActive: (form: SignupForm) => void;
};

function FormsList({ forms, isMutating, onEdit, onRemove, onToggleActive }: FormsListProps) {
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
                    onEdit={onEdit}
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
                onEdit={onEdit}
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
  onEdit: (form: SignupForm) => void;
  onRemove: (form: SignupForm) => void;
  onToggleActive: (form: SignupForm) => void;
};

function FormActions({ form, isMutating, onEdit, onRemove, onToggleActive }: FormActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${form.internalName}`} disabled={isMutating} onClick={() => onEdit(form)}>
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

type DemoSignupFormEditorProps = {
  error: Error | null;
  form: SignupForm | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: SignupFormValues) => Promise<void>;
};

function DemoSignupFormEditor({
  error,
  form,
  isSubmitting,
  onCancel,
  onSubmit,
}: DemoSignupFormEditorProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupFormInputSchema),
    defaultValues: form
      ? {
          internalName: form.internalName,
          slug: form.slug,
          heading: form.heading,
          buttonText: form.buttonText,
          successMessage: form.successMessage ?? '',
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          buttonColor: form.buttonColor,
          buttonTextColor: form.buttonTextColor,
          isActive: form.isActive,
        }
      : defaultFormValues,
  });
  const previewValues = useWatch({ control });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          {form ? 'Edit signup form' : 'Create signup form'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Form changes are saved to the current workspace.</p>
      </div>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input label="Internal name" type="text" placeholder="Homepage footer" {...register('internalName')} />
          {errors.internalName ? <p className="mt-2 text-sm text-red-600">{errors.internalName.message}</p> : null}
        </div>

        <div>
          <Input label="Public slug" type="text" placeholder="product-notes" {...register('slug')} />
          {errors.slug ? <p className="mt-2 text-sm text-red-600">{errors.slug.message}</p> : null}
        </div>

        <div>
          <Input label="Heading" type="text" placeholder="Get weekly product notes" {...register('heading')} />
          {errors.heading ? <p className="mt-2 text-sm text-red-600">{errors.heading.message}</p> : null}
        </div>

        <div>
          <Input label="Button text" type="text" placeholder="Subscribe" {...register('buttonText')} />
          {errors.buttonText ? <p className="mt-2 text-sm text-red-600">{errors.buttonText.message}</p> : null}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Success message (optional)"
            type="text"
            placeholder="Thanks for subscribing."
            {...register('successMessage')}
          />
          {errors.successMessage ? <p className="mt-2 text-sm text-red-600">{errors.successMessage.message}</p> : null}
        </div>

        <ColorField
          label="Background color"
          name="backgroundColor"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.backgroundColor?.message}
        />
        <ColorField
          label="Text color"
          name="textColor"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.textColor?.message}
        />
        <ColorField
          label="Button color"
          name="buttonColor"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.buttonColor?.message}
        />
        <ColorField
          label="Button text color"
          name="buttonTextColor"
          register={register}
          setValue={setValue}
          watch={watch}
          error={errors.buttonTextColor?.message}
        />

        <label className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-3 md:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
            {...register('isActive')}
          />
          <span>
            <span className="block text-sm font-medium text-neutral-800">Active public form</span>
            <span className="block text-xs text-neutral-500">Inactive forms stay saved but cannot be found publicly.</span>
          </span>
        </label>

        <div className="md:col-span-2">
          <SignupFormPreview values={{ ...defaultFormValues, ...previewValues }} />
        </div>

        {error ? <p className="text-sm text-red-600 md:col-span-2">{error.message}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {form ? 'Save form' : 'Create form'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SignupFormPreview({ values }: { values: SignupFormInput }) {
  const slug = values.slug?.trim() || 'form-slug';
  const heading = values.heading?.trim() || 'Signup form heading';
  const buttonText = values.buttonText?.trim() || 'Subscribe';

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col gap-1 border-b border-neutral-200 pb-3 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-neutral-950">Live preview</h3>
          <p className="mt-1 text-xs text-neutral-500">Public subscribers will see this form at the generated signup URL.</p>
        </div>
        <p className="font-mono-ui text-xs text-neutral-500">/subscribe/{slug}</p>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div
          className="mx-auto max-w-md rounded-md border border-neutral-200 p-5"
          style={{
            backgroundColor: values.backgroundColor,
            color: values.textColor,
          }}
        >
          <h4 className="font-display text-xl font-semibold">{heading}</h4>
          <div className="mt-5 grid gap-3 min-[520px]:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                disabled
                placeholder="reader@example.com"
                className="block h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 placeholder:text-neutral-400"
              />
            </label>
            <button
              type="button"
              disabled
              className="h-10 rounded-md px-4 text-sm font-medium disabled:opacity-100"
              style={{
                backgroundColor: values.buttonColor,
                color: values.buttonTextColor,
              }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type ColorFieldName = 'backgroundColor' | 'textColor' | 'buttonColor' | 'buttonTextColor';

type ColorFieldProps = {
  error?: string;
  label: string;
  name: ColorFieldName;
  register: UseFormRegister<SignupFormInput>;
  setValue: UseFormSetValue<SignupFormInput>;
  watch: UseFormWatch<SignupFormInput>;
};

function ColorField({ error, label, name, register, setValue, watch }: ColorFieldProps) {
  const value = watch(name);

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <Input label={label} type="text" placeholder="#171717" {...register(name)} />
        <label className="block">
          <span className="sr-only">{label} picker</span>
          <input
            type="color"
            value={getColorPickerValue(value)}
            onChange={(event) => setValue(name, event.target.value, { shouldDirty: true, shouldValidate: true })}
            className="h-10 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function getColorPickerValue(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
}

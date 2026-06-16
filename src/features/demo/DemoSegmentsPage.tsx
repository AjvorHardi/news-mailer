import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Input } from '../../shared/ui/Input';
import { segmentInputSchema } from '../../shared/schemas/domainSchemas';
import type { Segment, SegmentRule, SignupForm } from '../../shared/types/domain';
import { useDemoSignupForms } from './useDemoSignupForms';
import { useDemoSegmentMatchCount, useDemoSegments, useRemoveDemoSegment, useSaveDemoSegment } from './useDemoSegments';
import type { z } from 'zod';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function createRuleId() {
  return `rule-${crypto.randomUUID()}`;
}

function createStatusRule(): SegmentRule {
  return {
    id: createRuleId(),
    field: 'status',
    operator: 'equals',
    value: 'subscribed',
  };
}

type SegmentFormInput = z.input<typeof segmentInputSchema>;
type SegmentFormValues = z.output<typeof segmentInputSchema>;

export function DemoSegmentsPage() {
  const segmentsQuery = useDemoSegments();
  const formsQuery = useDemoSignupForms();
  const saveSegment = useSaveDemoSegment();
  const removeSegment = useRemoveDemoSegment();
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const isMutating = saveSegment.isPending || removeSegment.isPending;
  const forms = formsQuery.data ?? [];
  const formsById = new Map(forms.map((form) => [form.id, form.internalName]));

  function openCreateForm() {
    saveSegment.reset();
    setEditingSegment(null);
    setIsEditorOpen(true);
  }

  function openEditForm(segment: Segment) {
    saveSegment.reset();
    setEditingSegment(segment);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    saveSegment.reset();
    setEditingSegment(null);
    setIsEditorOpen(false);
  }

  function removeSegmentById(segment: Segment) {
    removeSegment.mutate(segment.id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actionsLayout="responsive-inline"
        eyebrow="Demo segments"
        title="Audience segments"
        description="Build explainable demo audiences from safe predefined rule rows."
        actions={
          <Button
            type="button"
            className="h-10 w-10 px-0 md:w-auto md:px-4"
            aria-label="Create segment"
            onClick={openCreateForm}
            disabled={isMutating || formsQuery.isLoading}
          >
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">Create segment</span>
          </Button>
        }
      />

      {saveSegment.error || removeSegment.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {saveSegment.error?.message ?? removeSegment.error?.message}
        </div>
      ) : null}

      {isEditorOpen ? (
        <DemoSegmentEditor
          key={editingSegment?.id ?? 'new-segment'}
          forms={forms}
          segment={editingSegment}
          error={saveSegment.error}
          isSubmitting={saveSegment.isPending}
          onCancel={closeEditor}
          onSubmit={async (values) => {
            await saveSegment.mutateAsync({
              input: values,
              segmentId: editingSegment?.id,
            });

            closeEditor();
          }}
        />
      ) : null}

      {segmentsQuery.isLoading || formsQuery.isLoading ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading segments...</div>
      ) : null}

      {segmentsQuery.isError || formsQuery.isError ? (
        <EmptyState
          title="Segments could not be loaded"
          description="Return to the demo overview if you need to restore all seeded demo data."
        />
      ) : null}

      {segmentsQuery.data && segmentsQuery.data.length === 0 ? (
        <EmptyState
          title="No segments yet"
          description="Create a segment to group subscribers by status, signup form, or signup date."
          action={
            <Button type="button" onClick={openCreateForm} disabled={isMutating || formsQuery.isLoading}>
              Create segment
            </Button>
          }
        />
      ) : null}

      {segmentsQuery.data && segmentsQuery.data.length > 0 ? (
        <SegmentsList
          formsById={formsById}
          isMutating={isMutating}
          onEdit={openEditForm}
          onRemove={removeSegmentById}
          segments={segmentsQuery.data}
        />
      ) : null}
    </div>
  );
}

type SegmentsListProps = {
  formsById: Map<string, string>;
  isMutating: boolean;
  onEdit: (segment: Segment) => void;
  onRemove: (segment: Segment) => void;
  segments: Segment[];
};

function SegmentsList({ formsById, isMutating, onEdit, onRemove, segments }: SegmentsListProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="hidden overflow-x-auto min-[960px]:block">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold tracking-[0.12em] text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                Segment
              </th>
              <th scope="col" className="px-4 py-3">
                Rules
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Matches
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
            {segments.map((segment) => (
              <SegmentTableRow
                key={segment.id}
                formsById={formsById}
                isMutating={isMutating}
                onEdit={onEdit}
                onRemove={onRemove}
                segment={segment}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-neutral-200 min-[960px]:hidden">
        {segments.map((segment) => (
          <SegmentCard
            key={segment.id}
            formsById={formsById}
            isMutating={isMutating}
            onEdit={onEdit}
            onRemove={onRemove}
            segment={segment}
          />
        ))}
      </div>
    </section>
  );
}

type SegmentRowProps = {
  formsById: Map<string, string>;
  isMutating: boolean;
  onEdit: (segment: Segment) => void;
  onRemove: (segment: Segment) => void;
  segment: Segment;
};

function SegmentTableRow({ formsById, isMutating, onEdit, onRemove, segment }: SegmentRowProps) {
  const matchCountQuery = useDemoSegmentMatchCount(segment.rules);

  return (
    <tr className="align-middle">
      <td className="px-4 py-4 align-middle">
        <div className="font-medium text-neutral-950">{segment.name}</div>
        <div className="mt-1 text-xs text-neutral-500">{segment.rules.length} rule rows</div>
      </td>
      <td className="px-4 py-4 align-middle text-neutral-700">{formatRulesSummary(segment.rules, formsById)}</td>
      <td className="px-4 py-4 text-center align-middle">
        <MatchCount count={matchCountQuery.data} isLoading={matchCountQuery.isLoading} />
      </td>
      <td className="px-4 py-4 text-center align-middle text-neutral-700">{formatDate(segment.updatedAt)}</td>
      <td className="px-4 py-4 text-center align-middle">
        <SegmentActions isMutating={isMutating} onEdit={onEdit} onRemove={onRemove} segment={segment} />
      </td>
    </tr>
  );
}

function SegmentCard({ formsById, isMutating, onEdit, onRemove, segment }: SegmentRowProps) {
  const matchCountQuery = useDemoSegmentMatchCount(segment.rules);

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-neutral-950">{segment.name}</h2>
          <p className="mt-1 text-xs text-neutral-500">{segment.rules.length} rule rows</p>
        </div>
        <MatchCount count={matchCountQuery.data} isLoading={matchCountQuery.isLoading} />
      </div>
      <dl className="mt-4 grid gap-3 text-xs min-[640px]:grid-cols-2">
        <div>
          <dt className="font-medium text-neutral-500">Rules</dt>
          <dd className="mt-1 text-neutral-950">{formatRulesSummary(segment.rules, formsById)}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-500">Updated</dt>
          <dd className="mt-1 text-neutral-950">{formatDate(segment.updatedAt)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-end">
        <SegmentActions isMutating={isMutating} onEdit={onEdit} onRemove={onRemove} segment={segment} />
      </div>
    </article>
  );
}

function MatchCount({ count, isLoading }: { count?: number; isLoading: boolean }) {
  return (
    <span className="font-mono-ui inline-flex rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {isLoading ? '...' : count}
    </span>
  );
}

type SegmentActionsProps = {
  isMutating: boolean;
  onEdit: (segment: Segment) => void;
  onRemove: (segment: Segment) => void;
  segment: Segment;
};

function SegmentActions({ isMutating, onEdit, onRemove, segment }: SegmentActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${segment.name}`} disabled={isMutating} onClick={() => onEdit(segment)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </IconButton>
      <IconButton
        label={`Delete ${segment.name}`}
        variant="danger"
        disabled={isMutating}
        onClick={() => onRemove(segment)}
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

function formatRulesSummary(rules: SegmentRule[], formsById: Map<string, string>) {
  return rules.map((rule) => formatRuleSummary(rule, formsById)).join(' and ');
}

function formatRuleSummary(rule: SegmentRule, formsById: Map<string, string>) {
  if (rule.field === 'status') {
    return `Status is ${rule.value}`;
  }

  if (rule.field === 'source_form_id') {
    return `Source form is ${formsById.get(rule.value) ?? 'Unknown form'}`;
  }

  return `Signed up after ${formatDate(rule.value)}`;
}

type DemoSegmentEditorProps = {
  error: Error | null;
  forms: SignupForm[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: SegmentFormValues) => Promise<void>;
  segment: Segment | null;
};

function DemoSegmentEditor({ error, forms, isSubmitting, onCancel, onSubmit, segment }: DemoSegmentEditorProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SegmentFormInput, unknown, SegmentFormValues>({
    resolver: zodResolver(segmentInputSchema),
    defaultValues: {
      name: segment?.name ?? '',
      rules: segment?.rules ?? [createStatusRule()],
    },
  });
  const { append, fields, remove, update } = useFieldArray({
    control,
    name: 'rules',
  });
  const watchedRules = useWatch({ control, name: 'rules' });

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          {segment ? 'Edit segment' : 'Create segment'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Segment rules are limited to predefined fields and operators for deterministic matching.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input label="Segment name" type="text" placeholder="Active subscribers" {...register('name')} />
          {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-semibold text-neutral-950">Rules</h3>
            <Button type="button" size="sm" variant="secondary" onClick={() => append(createStatusRule())}>
              Add rule
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const rule = watchedRules[index] ?? field;

              return (
                <RuleRow
                  key={field.id}
                  canRemove={fields.length > 1}
                  error={errors.rules?.[index]?.value?.message}
                  forms={forms}
                  onRemove={() => remove(index)}
                  onUpdate={(nextRule) => update(index, nextRule)}
                  rule={rule}
                />
              );
            })}
          </div>
          {typeof errors.rules?.message === 'string' ? <p className="text-sm text-red-600">{errors.rules.message}</p> : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {segment ? 'Save segment' : 'Create segment'}
          </Button>
        </div>
      </form>
    </section>
  );
}

type RuleRowProps = {
  canRemove: boolean;
  error?: string;
  forms: SignupForm[];
  onRemove: () => void;
  onUpdate: (rule: SegmentRule) => void;
  rule: SegmentRule;
};

function RuleRow({ canRemove, error, forms, onRemove, onUpdate, rule }: RuleRowProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="grid gap-3 min-[760px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] min-[760px]:items-end">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Field</span>
          <select
            value={rule.field}
            onChange={(event) => onUpdate(createRuleForField(event.target.value, forms))}
            className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
          >
            <option value="status">Status</option>
            <option value="source_form_id">Source form</option>
            <option value="created_at">Signed up after</option>
          </select>
        </label>

        {rule.field === 'status' ? (
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Value</span>
            <select
              value={rule.value}
              onChange={(event) =>
                onUpdate({ ...rule, value: event.target.value === 'unsubscribed' ? 'unsubscribed' : 'subscribed' })
              }
              className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </label>
        ) : null}

        {rule.field === 'source_form_id' ? (
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Value</span>
            <select
              value={rule.value}
              onChange={(event) => onUpdate({ ...rule, value: event.target.value })}
              className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            >
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.internalName}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {rule.field === 'created_at' ? (
          <label className="block">
            <span className="text-sm font-medium text-neutral-800">Value</span>
            <input
              type="date"
              value={toDateInputValue(rule.value)}
              onChange={(event) => onUpdate({ ...rule, value: toIsoDateTime(event.target.value) })}
              className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950 focus:outline-none"
            />
          </label>
        ) : null}

        <Button type="button" variant="danger" size="sm" onClick={onRemove} disabled={!canRemove}>
          Remove
        </Button>
      </div>

      <p className="mt-3 text-xs text-neutral-500">{formatRuleSummary(rule, new Map(forms.map((form) => [form.id, form.internalName])))}</p>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function createRuleForField(field: string, forms: SignupForm[]): SegmentRule {
  if (field === 'source_form_id') {
    return {
      id: createRuleId(),
      field: 'source_form_id',
      operator: 'equals',
      value: forms[0]?.id ?? '',
    };
  }

  if (field === 'created_at') {
    return {
      id: createRuleId(),
      field: 'created_at',
      operator: 'after',
      value: toIsoDateTime(new Date().toISOString().slice(0, 10)),
    };
  }

  return createStatusRule();
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function toIsoDateTime(value: string) {
  return `${value}T00:00:00.000Z`;
}

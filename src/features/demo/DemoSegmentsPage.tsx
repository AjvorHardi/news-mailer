import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';
import type { Segment, SegmentRule } from '../../shared/types/domain';
import { useDemoSignupForms } from './useDemoSignupForms';
import { useDemoSegmentMatchCount, useDemoSegments, useRemoveDemoSegment } from './useDemoSegments';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function DemoSegmentsPage() {
  const segmentsQuery = useDemoSegments();
  const formsQuery = useDemoSignupForms();
  const removeSegment = useRemoveDemoSegment();
  const isMutating = removeSegment.isPending;
  const formsById = new Map((formsQuery.data ?? []).map((form) => [form.id, form.internalName]));

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
          <Button type="button" className="h-10 w-10 px-0 md:w-auto md:px-4" aria-label="Create segment" disabled>
            <Plus className="h-4 w-4 shrink-0 md:mr-2" aria-hidden="true" />
            <span className="hidden md:inline">Create segment</span>
          </Button>
        }
      />

      {removeSegment.error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">
          {removeSegment.error.message}
        </div>
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
        />
      ) : null}

      {segmentsQuery.data && segmentsQuery.data.length > 0 ? (
        <SegmentsList
          formsById={formsById}
          isMutating={isMutating}
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
  onRemove: (segment: Segment) => void;
  segments: Segment[];
};

function SegmentsList({ formsById, isMutating, onRemove, segments }: SegmentsListProps) {
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
  onRemove: (segment: Segment) => void;
  segment: Segment;
};

function SegmentTableRow({ formsById, isMutating, onRemove, segment }: SegmentRowProps) {
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
        <SegmentActions isMutating={isMutating} onRemove={onRemove} segment={segment} />
      </td>
    </tr>
  );
}

function SegmentCard({ formsById, isMutating, onRemove, segment }: SegmentRowProps) {
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
        <SegmentActions isMutating={isMutating} onRemove={onRemove} segment={segment} />
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
  onRemove: (segment: Segment) => void;
  segment: Segment;
};

function SegmentActions({ isMutating, onRemove, segment }: SegmentActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton label={`Edit ${segment.name}`} disabled>
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

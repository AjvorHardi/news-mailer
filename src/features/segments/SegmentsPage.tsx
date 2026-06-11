import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function SegmentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Segments"
        title="Audience segments"
        description="Safe rule rows for signed-up-after, source-form-equals, and status-equals will live here."
        actions={<Button type="button" disabled>Create segment</Button>}
      />
      <EmptyState
        title="Segment builder placeholder"
        description="Dynamic match counts will be wired after demo subscriber and form data exist."
      />
    </div>
  );
}

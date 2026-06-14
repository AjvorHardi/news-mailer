import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function SubscribersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Subscribers"
        title="Subscriber list"
        description="The table will include email, name, status, source, and created date."
        actions={<Button type="button" disabled>Add subscriber</Button>}
      />
      <EmptyState
        title="No subscriber data connected"
        description="Subscriber CRUD and normalized email uniqueness will be implemented in the demo subscribers phase."
      />
    </div>
  );
}

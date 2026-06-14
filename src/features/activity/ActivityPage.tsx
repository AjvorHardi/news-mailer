import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function ActivityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Activity"
        title="Delivery activity"
        description="Delivery totals and per-recipient status rows will appear here after simulated and real sends exist."
      />
      <EmptyState
        title="No delivery activity yet"
        description="Campaign recipient snapshots and webhook-derived delivery statuses are planned for later phases."
      />
    </div>
  );
}

import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function FormsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Forms"
        title="Signup forms"
        description="Internal names, public slugs, editable copy, color controls, and live previews will be added here."
        actions={<Button type="button" disabled>Create form</Button>}
      />
      <EmptyState title="Form builder placeholder" description="The live preview builder is planned for its own phase." />
    </div>
  );
}

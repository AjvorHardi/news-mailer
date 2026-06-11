import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function CampaignsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campaigns"
        title="Campaign editor"
        description="The Notion-style composer, subject input, TipTap body editor, and recipient selector will be added later."
        actions={<Button type="button" disabled>New campaign</Button>}
      />
      <EmptyState
        title="Campaign editor placeholder"
        description="Real Resend sending remains gated until the HTML rendering and sanitization strategy is chosen."
      />
    </div>
  );
}

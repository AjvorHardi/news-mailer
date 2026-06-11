import { Link } from 'react-router';
import { EmptyState } from '../../shared/ui/EmptyState';
import { PageHeader } from '../../shared/ui/PageHeader';

export function NewsletterSelectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Newsletter workspace"
        description="Real newsletter selection and onboarding will be connected after authentication and data access are in place."
      />
      <EmptyState
        title="Open the phase shell"
        description="Use the placeholder newsletter route to review the app navigation and page structure for Phase 1."
        action={
          <Link
            to="/app/newsletters/demo-newsletter"
            className="inline-flex rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 focus:outline-none"
          >
            Open newsletter
          </Link>
        }
      />
    </div>
  );
}

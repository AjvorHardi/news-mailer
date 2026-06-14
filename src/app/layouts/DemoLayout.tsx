import { WorkspaceLayout } from './WorkspaceLayout';
import { DEMO_NEWSLETTER_ID } from '../../lib/demo-storage';

export function DemoLayout() {
  return (
    <WorkspaceLayout
      basePath="/demo"
      footerLabel={`Demo data: ${DEMO_NEWSLETTER_ID}`}
    />
  );
}

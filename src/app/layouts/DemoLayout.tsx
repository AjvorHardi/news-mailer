import { WorkspaceLayout } from './WorkspaceLayout';
import { DEMO_NEWSLETTER_ID } from '../../lib/demo-storage';

export function DemoLayout() {
  return (
    <WorkspaceLayout
      basePath="/demo"
      homePath="/demo"
      label="Demo workspace"
      footerLabel={`Demo data: ${DEMO_NEWSLETTER_ID}`}
    />
  );
}

import { useParams } from 'react-router';
import { WorkspaceLayout } from './WorkspaceLayout';

export function AppLayout() {
  const { newsletterId = 'demo-newsletter' } = useParams();

  return (
    <WorkspaceLayout
      basePath={`/app/newsletters/${newsletterId}`}
      homePath="/app"
      label="Newsletter workspace"
      footerLabel="Phase 1 shell"
    />
  );
}

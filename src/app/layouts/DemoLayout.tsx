import { useNavigate } from 'react-router';
import { WorkspaceLayout } from './WorkspaceLayout';
import { DEMO_NEWSLETTER_ID } from '../../lib/demo-storage';
import { Button } from '../../shared/ui/Button';

export function DemoLayout() {
  const navigate = useNavigate();

  return (
    <WorkspaceLayout
      basePath="/demo"
      footerLabel={`Demo data: ${DEMO_NEWSLETTER_ID}`}
      footerAction={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/')}
        >
          Exit demo
        </Button>
      }
    />
  );
}

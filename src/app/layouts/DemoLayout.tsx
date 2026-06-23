import { useNavigate } from 'react-router';
import { WorkspaceLayout } from './WorkspaceLayout';
import { Button } from '../../shared/ui/Button';

export function DemoLayout() {
  const navigate = useNavigate();

  return (
    <WorkspaceLayout
      basePath="/demo"
      footerLabel="DEMO WORKSPACE"
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

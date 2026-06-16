import { useNavigate, useParams } from 'react-router';
import { WorkspaceLayout } from './WorkspaceLayout';
import { Button } from '../../shared/ui/Button';
import { useAuth } from '../../features/auth/authContext';

export function AppLayout() {
  const { newsletterId = 'demo-newsletter' } = useParams();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <WorkspaceLayout
      basePath={`/app/newsletters/${newsletterId}`}
      footerLabel={user?.email ?? 'Authenticated workspace'}
      footerAction={
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await signOut();
            navigate('/login', { replace: true });
          }}
        >
          Log out
        </Button>
      }
    />
  );
}

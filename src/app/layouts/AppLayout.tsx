import { useNavigate, useParams } from 'react-router';
import { useMemo } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { Button } from '../../shared/ui/Button';
import { useAuth } from '../../features/auth/authContext';
import { DemoWorkspaceContext } from '../../features/demo/demoWorkspaceContext';
import { createSupabaseRepositories } from '../../lib/supabase/supabaseRepositories';

export function AppLayout() {
  const { newsletterId = 'demo-newsletter' } = useParams();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const repositories = useMemo(() => createSupabaseRepositories(), []);

  return (
    <DemoWorkspaceContext.Provider value={{ newsletterId, mode: 'app', repositories }}>
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
    </DemoWorkspaceContext.Provider>
  );
}

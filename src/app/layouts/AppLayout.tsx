import { Navigate, Outlet, useNavigate, useParams } from 'react-router';
import { useMemo } from 'react';
import { WorkspaceLayout } from './WorkspaceLayout';
import { Button } from '../../shared/ui/Button';
import { useAuth } from '../../features/auth/authContext';
import { DemoWorkspaceContext } from '../../features/demo/demoWorkspaceContext';
import { createSupabaseRepositories } from '../../lib/supabase/supabaseRepositories';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AppLayout() {
  const { newsletterId } = useParams();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const repositories = useMemo(() => createSupabaseRepositories(), []);
  const footerAction = (
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
  );

  if (!newsletterId) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-950">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="font-display text-sm font-semibold text-neutral-950">NEWS-MAILER</p>
              <p className="mt-1 text-sm text-neutral-500">{user?.email ?? 'Authenticated workspace'}</p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-32">{footerAction}</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    );
  }

  if (!uuidPattern.test(newsletterId)) {
    return <Navigate to="/app" replace />;
  }

  return (
    <DemoWorkspaceContext.Provider value={{ newsletterId, mode: 'app', repositories }}>
      <WorkspaceLayout
        basePath={`/app/newsletters/${newsletterId}`}
        footerLabel={user?.email ?? 'Authenticated workspace'}
        footerAction={footerAction}
      />
    </DemoWorkspaceContext.Provider>
  );
}

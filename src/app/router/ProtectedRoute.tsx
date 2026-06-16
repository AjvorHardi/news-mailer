import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../features/auth/authContext';

export function ProtectedRoute() {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-20 text-center text-sm text-neutral-600">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export default function ProtectedRoute({
  requiredRole
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Current state:', { user, role, loading, requiredRole });

  if (loading) {
    console.log('ProtectedRoute - Still loading, showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    console.log('ProtectedRoute - Wrong role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname }} replace />;
  }

  console.log('ProtectedRoute - Access granted, rendering outlet');
  return <Outlet />;
}
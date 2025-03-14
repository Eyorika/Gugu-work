import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({
  children,
  requiredRole
}: ProtectedRouteProps) {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {

    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && role !== requiredRole) {

    return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname }} replace />;
  }

  return <>{children}</>;
}
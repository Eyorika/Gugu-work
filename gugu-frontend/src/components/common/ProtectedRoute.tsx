import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';
import { JSX } from 'react';

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: JSX.Element;
  requiredRole?: UserRole;
}) {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
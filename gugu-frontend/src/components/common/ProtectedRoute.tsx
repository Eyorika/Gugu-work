import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';
import { ReactNode } from 'react';

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: UserRole;
}) {
  const { user, role } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (typeof user === 'undefined' || typeof role === 'undefined') {
    return <div>Loading...</div>; // Replace with your loading component
  }

  // Redirect unauthenticated users
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
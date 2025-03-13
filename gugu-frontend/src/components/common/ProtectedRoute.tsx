import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';
<<<<<<< HEAD
import { ReactNode } from 'react';
=======
import { JSX } from 'react';
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
<<<<<<< HEAD
  children: ReactNode;
=======
  children: JSX.Element;
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  requiredRole?: UserRole;
}) {
  const { user, role } = useAuth();
  const location = useLocation();

<<<<<<< HEAD
  // Show loading state while auth is being checked
  if (typeof user === 'undefined' || typeof role === 'undefined') {
    return <div>Loading...</div>; // Replace with your loading component
  }

  // Redirect unauthenticated users
=======
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

<<<<<<< HEAD
  // Check role if required
=======
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

<<<<<<< HEAD
  return <>{children}</>;
=======
  return children;
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
}
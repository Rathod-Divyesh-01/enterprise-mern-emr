import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * ProtectedRoute component handles route authentication and role-based permissions.
 *
 * @param {React.ReactNode} children - Component(s) to render if authorized.
 * @param {Array<string>} allowedRoles - Optional list of permitted user roles (e.g., ['SUPER_ADMIN', 'RECEPTIONIST']).
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show a loading state while checking authentication status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return path state
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user's role is not authorized, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-bold text-red-700 mb-2">Access Denied</h3>
        <p className="text-sm text-red-600 mb-4">
          You do not have permission to access this page. Required role: {allowedRoles.join(', ')}
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
}
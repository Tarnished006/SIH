import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccessDeniedPage from '../../pages/AccessDeniedPage';

export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Verifying Statutory Authentication Token...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and current user's role is not included
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <AccessDeniedPage attemptedRoute={location.pathname} requiredRoles={allowedRoles} />;
  }

  return children;
};

export default RoleProtectedRoute;

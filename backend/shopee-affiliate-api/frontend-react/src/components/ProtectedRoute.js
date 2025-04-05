import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiresAuth = true, allowSalesMartins = false }) => {
  const { isAuthenticated, loading, isSalesMartinsAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requiresAuth && !isAuthenticated) {
    // Allow Sales Martins access when specified
    if (allowSalesMartins && isSalesMartinsAccess && location.pathname.startsWith('/sales-martins')) {
      return children;
    }
    
    // Redirect to login for pages that need authentication
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

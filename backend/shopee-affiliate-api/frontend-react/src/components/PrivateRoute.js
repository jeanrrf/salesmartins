import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Admin users can access all routes
  if (user && user.role === 'admin') {
    return children;
  }

  // Normal users can only access /sales-martins route
  if (user && user.role !== 'admin') {
    if (!location.pathname.startsWith('/sales-martins')) {
      return <Navigate to="/sales-martins" />;
    }
  }

  return children;
};

export default PrivateRoute;
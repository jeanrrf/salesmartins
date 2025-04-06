// AppRoutes.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
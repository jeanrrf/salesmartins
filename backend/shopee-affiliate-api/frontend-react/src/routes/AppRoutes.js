import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import SalesMartins from '../pages/SalesMartins/SalesMartins';
import PerformanceAnalysis from '../pages/PerformanceAnalysis/PerformanceAnalysis';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/sales-martins" element={<SalesMartins />} />
    <Route path="/performance-analysis" element={<PerformanceAnalysis />} />
    {/* Add other routes as needed */}
  </Routes>
);

export default AppRoutes;

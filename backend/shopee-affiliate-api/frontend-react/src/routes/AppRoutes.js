import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProductDetails from '../pages/ProductDetails';
import SalesMartins from '../pages/SalesMartins/SalesMartins';
import ChampionProducts from '../pages/ChampionProducts/ChampionProducts';
import CategoryRepair from '../pages/CategoryRepair/CategoryRepair';
import PerformanceAnalysis from '../pages/PerformanceAnalysis/PerformanceAnalysis';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Verificar se a rota padrão está redirecionando para SalesMartins */}
      <Route path="/" element={<Navigate to="/sales-martins" replace />} />
      <Route path="/sales-martins" element={<SalesMartins />} />

      {/* Manter outras rotas com proteção de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/product/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
      <Route path="/champion-products" element={<PrivateRoute><ChampionProducts /></PrivateRoute>} />
      <Route path="/category-repair" element={<PrivateRoute><CategoryRepair /></PrivateRoute>} />
      <Route path="/performance-analysis" element={<PerformanceAnalysis />} />

      {/* Redirecionar qualquer rota desconhecida para sales-martins */}
      <Route path="*" element={<Navigate to="/sales-martins" replace />} />
    </Routes>
  );
};

export default AppRoutes;

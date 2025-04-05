import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ChampionProducts from './pages/ChampionProducts/ChampionProducts';
import Vitrine from './pages/Vitrine/Vitrine';
import PerformanceAnalysis from './pages/PerformanceAnalysis/PerformanceAnalysis';
import CategoryRepair from './pages/CategoryRepair/CategoryRepair';
import ProductDetails from './pages/ProductDetails';
import SalesMartins from './pages/SalesMartins/SalesMartins';
import './App.css';
import { ProductProvider } from './contexts/ProductContext';
import { AuthProvider } from './contexts/AuthContext';

// AppRoutes component moved outside and exported
export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/sales-martins" element={<SalesMartins />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/champion-products" element={<PrivateRoute><ChampionProducts /></PrivateRoute>} />
        <Route path="/vitrine" element={<Vitrine />} />
        <Route path="/performance-analysis" element={<PrivateRoute><PerformanceAnalysis /></PrivateRoute>} />
        <Route path="/category-repair" element={<CategoryRepair />} />
        <Route path="/produto/:id" element={<ProductDetails />} />
      </Route>
    </Routes>
  );
};

// Main App component
const App = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <AppRoutes />
      </ProductProvider>
    </AuthProvider>
  );
};

export default App;
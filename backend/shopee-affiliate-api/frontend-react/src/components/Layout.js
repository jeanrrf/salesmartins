import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  useAuth(); // Ensure the hook is still called if needed for side effects

  return (
    <div className="app-container">
      <Header />
      <main className="main-content fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
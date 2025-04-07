import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProductManagement from './pages/ProductManagement';
import ProductSearch from './pages/ProductSearch';
import './assets/styles/global.css';

const App = () => {
    return (
        <AuthProvider>
            <ProductProvider>
                <Router>
                    <Header />
                    <Switch>
                        <Route path="/" exact component={Dashboard} />
                        <Route path="/login" component={Login} />
                        <Route path="/products/manage" component={ProductManagement} />
                        <Route path="/products/search" component={ProductSearch} />
                    </Switch>
                    <Footer />
                </Router>
            </ProductProvider>
        </AuthProvider>
    );
};

export default App;
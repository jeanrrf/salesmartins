import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import ProductSearch from './pages/ProductSearch';
import './assets/styles/global.css';

const App = () => {
    return (
        <ProductProvider>
            <Router>
                <Header />
                <div className="container">
                    <Switch>
                        <Route path="/" exact component={Dashboard} />
                        <Route path="/products/manage" component={ProductManagement} />
                        <Route path="/products/search" component={ProductSearch} />
                    </Switch>
                </div>
                <Footer />
            </Router>
        </ProductProvider>
    );
};

export default App;
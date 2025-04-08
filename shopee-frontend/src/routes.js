import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import ProductSearch from './pages/ProductSearch';

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={Dashboard} />
                <Route path="/products/manage" component={ProductManagement} />
                <Route path="/products/search" component={ProductSearch} />
            </Switch>
        </Router>
    );
};

export default Routes;
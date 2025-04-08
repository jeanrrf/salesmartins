import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h2>Navigation</h2>
            <ul>
                <li>
                    <Link to="/">Dashboard</Link>
                </li>
                <li>
                    <Link to="/product-search">Product Search</Link>
                </li>
                <li>
                    <Link to="/products/manage">Product Management</Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Assuming you will create a CSS file for styling

const Header = () => {
    return (
        <header className="header">
            <div className="logo">
                <Link to="/">Shopee Clone</Link>
            </div>
            <nav className="navigation">
                <ul>
                    <li>
                        <Link to="/product-search">Product Search</Link>
                    </li>
                    <li>
                        <Link to="/product-management">Product Management</Link>
                    </li>
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;
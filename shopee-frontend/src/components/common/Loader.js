import React from 'react';
import './Loader.css'; // Assuming you have a CSS file for loader styles

const Loader = () => {
    return (
        <div className="loader">
            <div className="spinner"></div>
            <p>Loading...</p>
        </div>
    );
};

export default Loader;
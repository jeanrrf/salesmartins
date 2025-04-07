import React from 'react';
import './Button.css'; // Assuming you have a CSS file for button styles

const Button = ({ onClick, children, type = 'button', className = '' }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`custom-button ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
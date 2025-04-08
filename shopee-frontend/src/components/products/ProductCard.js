import React from 'react';
import './ProductCard.css';

// Default local placeholder image path
const defaultImagePath = '/placeholder-product.png';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
    // Handle image error by replacing with default image
    const handleImageError = (e) => {
        e.target.src = defaultImagePath;
        e.target.onerror = null; // Prevent infinite loop if default image also fails
    };

    return (
        <div className="product-card">
            <img
                src={product?.imageUrl || defaultImagePath}
                alt={product?.name || 'Product Image'}
                className="product-image"
                onError={handleImageError}
            />
            <h3 className="product-name">{product?.name || 'Unnamed Product'}</h3>
            <p className="product-price">
                {product?.price !== undefined ? `$${product.price.toFixed(2)}` : 'Price not available'}
            </p>
            <p className="product-sales">
                {product?.sales !== undefined ? `Sales: ${product.sales}` : 'Sales data not available'}
            </p>
            <button
                onClick={() => onAddToCart(product?.id)}
                className="add-to-cart-button"
                disabled={!product?.id}
            >
                Add to Cart
            </button>
            <button
                onClick={() => onViewDetails(product?.id)}
                className="view-details-button"
                disabled={!product?.id}
            >
                View Details
            </button>
        </div>
    );
};

export default ProductCard;
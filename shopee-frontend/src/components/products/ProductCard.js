import React from 'react';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
    return (
        <div className="product-card">
            <img src={product.imageUrl} alt={product.name} className="product-image" />
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-sales">Sales: {product.sales}</p>
            <button onClick={() => onAddToCart(product.id)} className="add-to-cart-button">
                Add to Cart
            </button>
            <button onClick={() => onViewDetails(product.id)} className="view-details-button">
                View Details
            </button>
        </div>
    );
};

export default ProductCard;
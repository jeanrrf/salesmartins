import React from 'react';
import { Card } from 'react-bootstrap';
import { FaShoppingBag } from 'react-icons/fa';

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateDiscount = () => {
    if (product.original_price && product.price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  };

  return (
    <Card className="product-card h-100">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={product.image_url || product.image} 
          alt={product.name}
        />
        {calculateDiscount() > 0 && (
          <div className="discount-badge">
            {calculateDiscount()}% OFF
          </div>
        )}
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="product-title">{product.name}</Card.Title>
        <div className="mt-auto">
          {product.original_price && (
            <div className="original-price">
              {formatPrice(product.original_price)}
            </div>
          )}
          <div className="current-price">
            {formatPrice(product.price)}
          </div>
          <a 
            href={product.affiliateUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary mt-2 w-100"
          >
            <FaShoppingBag className="me-2" />
            Ver Oferta
          </a>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;

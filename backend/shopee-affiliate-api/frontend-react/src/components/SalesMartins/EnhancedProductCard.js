import React, { useState } from 'react';
import { FaStar, FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import styles from './EnhancedProductCard.module.css';

const EnhancedProductCard = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  // Format price using Intl API
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product.original_price && product.original_price > product.price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  };

  const discountPercentage = getDiscountPercentage();

  // Generate stars based on rating
  const renderRatingStars = (rating) => {
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<FaStar key={i} className={styles.starFull} />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<FaStar key={i} className={styles.starHalf} />);
      } else {
        stars.push(<FaStar key={i} className={styles.starEmpty} />);
      }
    }

    return stars;
  };

  // Toggle description visibility
  const toggleDescription = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {!imageError ? (
          <img 
            src={product.image_url}
            alt={product.name}
            className={styles.productImage}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.fallbackImage}>
            <FaShoppingCart size={40} />
            <span>Imagem não disponível</span>
          </div>
        )}
        
        {discountPercentage > 0 && (
          <div className={styles.discount} aria-label={`${discountPercentage}% de desconto`}>
            -{discountPercentage}%
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.titleContainer}>
          <h3 className={styles.title} title={product.name}>{product.name}</h3>
          {product.description && (
            <button
              className={styles.infoButton}
              onClick={toggleDescription}
              aria-label="Ver detalhes do produto"
            >
              <FaInfoCircle />
            </button>
          )}
        </div>

        {/* Full description overlay that appears on hover/click */}
        {showFullDescription && product.description && (
          <div className={styles.descriptionOverlay}>
            <div className={styles.descriptionContent}>
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <button
                className={styles.closeButton}
                onClick={toggleDescription}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
        
        <div className={styles.priceRow}>
          <div className={styles.priceWrapper}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className={styles.originalPrice}>{formatPrice(product.original_price)}</span>
            )}
          </div>
        </div>
        
        <div className={styles.infoRow}>
          {product.rating_star > 0 && (
            <div className={styles.rating} title={`Avaliação: ${product.rating_star}/5`}>
              <div className={styles.stars}>
                {renderRatingStars(product.rating_star)}
              </div>
              <span className={styles.ratingValue}>{product.rating_star.toFixed(1)}</span>
            </div>
          )}

          {product.sales > 0 && (
            <div className={styles.sales} title={`${product.sales} vendidos`}>
              {product.sales} vendidos
            </div>
          )}
        </div>
        
        <a 
          href={product.affiliate_link || product.short_link || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.button}
          aria-label={`Comprar ${product.name}`}
        >
          <FaShoppingCart className={styles.buttonIcon} />
          <span>Comprar</span>
        </a>
      </div>
    </div>
  );
};

export default EnhancedProductCard;

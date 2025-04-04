import React, { useState } from 'react';
import { FaImage, FaShoppingBag, FaFire, FaShippingFast } from 'react-icons/fa';
import styles from './ProductCard.module.css';

const RatingStars = ({ rating }) => {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      stars.push(<span key={i} className={styles.starFilled}>★</span>);
    } else if (i - 0.5 === roundedRating) {
      stars.push(<span key={i} className={styles.starHalf}>★</span>);
    } else {
      stars.push(<span key={i} className={styles.starEmpty}>★</span>);
    }
  }
  
  return <div className={styles.ratingStars}>{stars}</div>;
};

const EnhancedProductCard = ({ 
  product,
  productImageUrl,
  featured = false 
}) => {
  const {
    image,
    image_url,
    name,
    category_name: categoryName,
    price,
    original_price: originalPrice,
    rating_star: ratingStar = 0,
    discount_percentage: discountPercentage,
    free_shipping: freeShipping = false,
    rating_count: ratingCount = '0',
    sales = 0,
    tags = [],
    affiliateUrl = '',
    affiliate_url = ''
  } = product || {};

  const [imageError, setImageError] = useState(false);
  const imageUrl = productImageUrl || (product && (image_url || image)) || '';
  
  const handleImageError = () => {
    setImageError(true);
  };

  const calculatedDiscountPercentage = discountPercentage || 
    (originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0);
  
  const formatSalesNumber = (num) => {
    if (!num) return '0';
    if (typeof num === 'string') {
      num = parseInt(num.replace(/[^\d]/g, ''), 10);
      if (isNaN(num)) return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formattedSales = formatSalesNumber(sales);
  const formattedRatingCount = typeof ratingCount === 'number' 
    ? formatSalesNumber(ratingCount) 
    : ratingCount;

  const hasDiscount = calculatedDiscountPercentage > 0 && originalPrice && price;

  const getAffiliateUrl = () => {
    return affiliateUrl || 
           affiliate_url || 
           '#';
  };

  const formatPrice = (price) => {
    if (!price) return 'R$ 0,00';
    if (typeof price === 'string' && price.includes('R$')) return price;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={`${styles.productCard} ${featured ? styles.featured : ''}`}>
      <div className={styles.imageContainer}>
        {!imageError ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className={styles.productImage}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.fallbackImageContainer}>
            <FaImage className={styles.fallbackImageIcon} />
            <div>Imagem não disponível</div>
          </div>
        )}
        
        {hasDiscount && (
          <div className={styles.discountTag}>
            -{calculatedDiscountPercentage}%
          </div>
        )}
      </div>
      <div className={styles.contentContainer}>
        <h3 className={styles.productTitle}>{name}</h3>
        
        {categoryName && (
          <div className={styles.categoryName}>
            {categoryName}
          </div>
        )}
        
        <div className={styles.ratingContainer}>
          <RatingStars rating={parseFloat(ratingStar) || 0} />
          <span className={styles.ratingCount}>({formattedRatingCount})</span>
        </div>
        
        <div className={styles.priceContainer}>
          {hasDiscount ? (
            <>
              <div className={styles.originalPriceWrapper}>
                <span className={styles.originalPrice}>
                  {formatPrice(originalPrice)}
                </span>
              </div>
              <div className={styles.currentPriceWrapper}>
                <span className={styles.currentPrice}>
                  {formatPrice(price)}
                </span>
                <span className={styles.discountPill}>
                  Economize {calculatedDiscountPercentage}%
                </span>
              </div>
            </>
          ) : (
            <div className={styles.currentPriceWrapper}>
              <span className={styles.currentPrice}>
                {formatPrice(price)}
              </span>
            </div>
          )}
        </div>
        
        <div className={styles.productSales}>
          <FaFire /> {formattedSales} vendidos
        </div>
        
        <div className={styles.productTags}>
          {freeShipping && (
            <span className={`${styles.productTag} ${styles.freeShipping}`}>
              <FaShippingFast /> Frete Grátis
            </span>
          )}
          {tags && Array.isArray(tags) && tags.map((tag, index) => (
            <span key={index} className={styles.productTag}>{tag}</span>
          ))}
        </div>
        
        <a 
          href={getAffiliateUrl()}
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.buyButton}
        >
          <FaShoppingBag className={styles.bagIcon} /> Ver Oferta
        </a>
      </div>
    </div>
  );
};

export default EnhancedProductCard;

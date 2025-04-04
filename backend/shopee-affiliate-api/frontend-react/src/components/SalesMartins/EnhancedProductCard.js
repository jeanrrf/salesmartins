import React, { useState } from 'react';
import { FaImage, FaShoppingBag, FaFire, FaShippingFast } from 'react-icons/fa';
import styles from './ProductCard.module.css';
import pageStyles from '../../pages/SalesMartins/SalesMartins.module.css';

const RatingStars = ({ rating }) => {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      stars.push(<span key={i} className={pageStyles.starFilled}>★</span>);
    } else if (i - 0.5 === roundedRating) {
      stars.push(<span key={i} className={pageStyles.starHalf}>★</span>);
    } else {
      stars.push(<span key={i} className={pageStyles.starEmpty}>★</span>);
    }
  }
  
  return <div className={pageStyles.productRatingStars}>{stars}</div>;
};

const EnhancedProductCard = ({ 
  product,
  productImageUrl,
  price = 0,
  originalPrice = 0,
  sales = 0,
  ratingStar = 0,
  name = '',
  featured = false 
}) => {
  const {
    image,
    image_url,
    category_id: categoryId,
    category_name: categoryName,
    discount_percentage: discountPercentage,
    free_shipping: freeShipping = false,
    rating_count: ratingCount = '0',
    tags = [],
    affiliateUrl = '',
    affiliate_url = ''
  } = product || {};

  // State for tracking image loading
  const [imageError, setImageError] = useState(false);
  const imageUrl = productImageUrl || (product && (image_url || image)) || '';
  
  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Calcular o percentual de desconto se não fornecido
  const calculatedDiscountPercentage = discountPercentage || 
    (originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0);
  
  // Formatar valores para exibição
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

  const formattedSales = formatSalesNumber(sales || (product && product.sales));
  const formattedRatingCount = typeof ratingCount === 'number' 
    ? formatSalesNumber(ratingCount) 
    : ratingCount;

  // Verificar se há desconto
  const hasDiscount = calculatedDiscountPercentage > 0 && originalPrice && price;

  // Obter a URL do afiliado
  const getAffiliateUrl = () => {
    return affiliateUrl || 
           affiliate_url || 
           (product && (product.affiliate_url || product.affiliateUrl)) || 
           '#';
  };

  // Formatar preço para exibição
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
            alt={name || (product && product.name)} 
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
          <div className={styles.discountBadge}>
            {calculatedDiscountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className={styles.productTitle}>{name || (product && product.name)}</h3>
        
        {/* Categoria do produto */}
        {categoryName && (
          <div className={styles.categoryTag}>
            {categoryName}
          </div>
        )}
        
        {/* Avaliação com estrelas */}
        <div className={styles.productRatingContainer}>
          <RatingStars rating={ratingStar || (product && product.rating_star) || 0} />
          <span className={styles.productRatingCount}>({formattedRatingCount})</span>
        </div>
        
        {/* Preço e desconto */}
        <div className={styles.productMeta}>
          <div>
            {hasDiscount && (
              <span className={styles.productOriginalPrice}>
                {formatPrice(originalPrice || (product && product.original_price))}
              </span>
            )}
            <span className={styles.productPrice}>
              {formatPrice(price || (product && product.price))}
            </span>
          </div>
          {hasDiscount && (
            <span className={styles.productDiscount}>{calculatedDiscountPercentage}% OFF</span>
          )}
        </div>
        
        {/* Vendas */}
        <div className={styles.productSales}>
          <FaFire /> {formattedSales} vendidos
        </div>
        
        {/* Tags e frete */}
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
          className={styles.productButton}
        >
          <FaShoppingBag className="me-2" /> Ver Oferta
        </a>
      </div>
    </div>
  );
};

export default EnhancedProductCard;

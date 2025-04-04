import React, { useState } from 'react';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaFire, FaShippingFast, FaImage, FaShoppingBag 
} from 'react-icons/fa';
import styles from '../../pages/SalesMartins/SalesMartins.module.css';

// Componente para exibir estrelas de avaliação
const RatingStars = ({ rating = 0 }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} />);
    } else {
      stars.push(<FaRegStar key={i} />);
    }
  }
  
  return <div className={styles.productRatingStars}>{stars}</div>;
};

// Formatar número para exibição de vendas (ex: 1200 -> 1.2k)
const formatSalesNumber = (sales) => {
  if (!sales) return '0';
  
  const num = typeof sales === 'string' ? parseInt(sales, 10) : sales;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  
  return num.toString();
};

const EnhancedProductCard = ({ product, onClick }) => {
  // Campos com fallbacks para garantir que o componente não quebre
  const {
    name = 'Produto sem nome',
    price = 0,
    original_price: originalPrice,
    image_url: productImageUrl,
    rating_star: ratingStar = 0,
    sales = 0,
    discount_percentage: discountPercentage,
    free_shipping: freeShipping = false,
    rating_count: ratingCount = '0',
    tags = [],
    affiliateUrl = '',
    affiliate_url = ''
  } = product || {};

  // Use a reliable fallback image that won't cause ERR_NAME_NOT_RESOLVED
  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjYiIGZpbGw9IiM1NTU1NTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+UHJvZHV0bzwvdGV4dD48L3N2Zz4=';

  // State for tracking image loading
  const [imageError, setImageError] = useState(false);
  const imageUrl = productImageUrl || (product && product.image) || '';
  
  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // Calcular o percentual de desconto se não fornecido
  const calculatedDiscountPercentage = discountPercentage || 
    (originalPrice && price ? Math.round((1 - price / originalPrice) * 100) : 0);
  
  // Formatar valores para exibição
  const formattedSales = formatSalesNumber(sales);
  const formattedRatingCount = typeof ratingCount === 'number' 
    ? formatSalesNumber(ratingCount) 
    : ratingCount;

  // Verificar se há desconto
  const hasDiscount = calculatedDiscountPercentage > 0 && originalPrice && price;

  // Obter a URL do afiliado, tentando diferentes propriedades possíveis
  const getAffiliateUrl = () => {
    return affiliateUrl || affiliate_url || (product && product.affiliate_url) || '#';
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
    <div className={styles.productCard}>
      <div className={styles.imageContainer}>
        {!imageError ? (
          <img 
            src={imageUrl || fallbackImage} 
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
          <div className={styles.discountBadge}>
            {calculatedDiscountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className={styles.productTitle}>{name}</h3>
        
        {/* Avaliação com estrelas */}
        <div className={styles.productRatingContainer}>
          <RatingStars rating={ratingStar} />
          <span className={styles.productRatingCount}>({formattedRatingCount})</span>
        </div>
        
        {/* Preço e desconto - Sempre mostrar preço original se tiver desconto */}
        <div className={styles.productMeta}>
          <div>
            {hasDiscount && (
              <span className={styles.productOriginalPrice}>
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className={styles.productPrice}>
              {formatPrice(price)}
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

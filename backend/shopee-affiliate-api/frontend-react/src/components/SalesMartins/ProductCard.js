import React, { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { 
  FaShoppingBag, FaRegHeart, FaHeart, 
  FaStar, FaStarHalfAlt, FaRegStar 
} from 'react-icons/fa';
import styles from './ProductCard.module.css';

// Componente para exibir estrelas de avaliação
const RatingStars = ({ rating = 0 }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className={styles.starFilled} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className={styles.starHalf} />);
    } else {
      stars.push(<FaRegStar key={i} className={styles.starEmpty} />);
    }
  }
  
  return <div className={styles.ratingStars}>{stars}</div>;
};

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.price) {
      const original = parseFloat(product.originalPrice);
      const current = parseFloat(product.price);
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    } else if (product.original_price && product.price) {
      const original = parseFloat(product.original_price);
      const current = parseFloat(product.price);
      if (original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    }
    return 0;
  };

  const formatPrice = (price) => {
    if (!price) return 'R$ 0,00';
    if (typeof price === 'string' && price.includes('R$')) return price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Format rating count
  const formatRatingCount = (count) => {
    if (!count) return '0';
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    
    if (isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    
    return num.toString();
  };

  const discount = calculateDiscount();

  // Get original price from product
  const originalPrice = product.originalPrice || product.original_price;
  
  // Get rating values with fallbacks
  const rating = product.rating || product.rating_star || 0;
  const ratingCount = product.rating_count || 0;
  const formattedRatingCount = formatRatingCount(ratingCount);

  // Get affiliate URL from different possible properties
  const getAffiliateUrl = () => {
    return product.affiliateUrl || 
           product.affiliate_url || 
           (product.affiliate && product.affiliate.url) || 
           '#';
  };

  // Check if we have a valid product with image
  if (!product || (!product.image && !product.image_url)) {
    return null;
  }

  return (
    <Card className={styles.productCard}>
      <div className={styles.imageContainer}>
        <Card.Img 
          variant="top" 
          src={product.image_url || product.image} 
          alt={product.name} 
          className={styles.productImage}
        />
        {discount > 0 && (
          <Badge className={styles.discountTag}>-{discount}%</Badge>
        )}
        <button 
          className={styles.favoriteButton}
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isFavorite ? 
            <FaHeart className={styles.favoriteIconActive} /> : 
            <FaRegHeart className={styles.favoriteIcon} />
          }
        </button>
      </div>
      <Card.Body className={styles.contentContainer}>
        <Card.Title className={styles.productTitle}>{product.name}</Card.Title>
        
        {/* Avaliação com estrelas */}
        <div className={styles.ratingContainer}>
          <RatingStars rating={rating} />
          <span className={styles.ratingCount}>({formattedRatingCount})</span>
        </div>
        
        <div className={styles.priceContainer}>
          {/* Sempre mostrar o preço original se houver desconto */}
          {discount > 0 && (
            <span className={styles.originalPrice}>
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className={styles.currentPrice}>{formatPrice(product.price)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.discountPill}>
            {discount}% OFF
          </div>
        )}
        {product.category_name && (
          <div className={styles.categoryName}>{product.category_name}</div>
        )}
        <a 
          href={getAffiliateUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.buyButton}
        >
          <FaShoppingBag className={styles.bagIcon} />
          <span>Comprar</span>
        </a>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;

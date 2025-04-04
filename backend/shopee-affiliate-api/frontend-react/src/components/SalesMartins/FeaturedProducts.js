import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import ProductCard from './ProductCard';
import { affiliateService } from '../../services/api';
import styles from './FeaturedProducts.module.css';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Get products sorted by discount to feature the best deals
        const response = await affiliateService.getDatabaseProducts({ 
          sortBy: 'discount', 
          limit: 4
        });
        
        // Filter out products without images
        const validProducts = (response?.data?.data?.products || []).filter(
          product => product.image_url || product.image
        );
        
        setFeaturedProducts(validProducts);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError('Erro ao carregar produtos em destaque.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Card to display when there are no products
  const EmptyState = () => (
    <Card className={styles.emptyStateCard}>
      <Card.Body className="text-center">
        <h3>Em breve Novidades</h3>
        <p>Aguarde produtos em destaque</p>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return <div className={styles.loadingText}>Carregando destaques...</div>;
  }

  return (
    <div className={styles.featuredContainer}>
      <h3 className={styles.featuredTitle}>Produtos em Destaque</h3>
      {featuredProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <Row>
          {featuredProducts.map(product => (
            <Col key={product.id} lg={3} md={6} className="mb-4">
              <ProductCard product={product} featured={true} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default FeaturedProducts;

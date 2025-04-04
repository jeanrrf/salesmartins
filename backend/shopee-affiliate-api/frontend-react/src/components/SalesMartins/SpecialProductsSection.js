import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { affiliateService } from '../../services/api';
import EnhancedProductCard from './EnhancedProductCard';
import styles from './ProductCatalog.module.css';
import pageStyles from '../../pages/SalesMartins/SalesMartins.module.css';

const SpecialProductsSection = ({ 
  title, 
  icon, 
  sectionClass = '',
  filterParams = {},
  limit = 4 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          ...filterParams,
          limit
        };
        const response = await affiliateService.getDatabaseProducts(params);
        if (response.data?.data?.products) {
          setProducts(response.data.data.products);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos especiais:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filterParams, limit]);

  if (loading) {
    return (
      <Container className={`${pageStyles.specialSection} ${pageStyles[sectionClass]} text-center py-5`}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className={`${pageStyles.specialSection} ${pageStyles[sectionClass]}`}>
      <Container>
        <div className={pageStyles.sectionHeader}>
          <span className={pageStyles.sectionIcon}>{icon}</span>
          <h2 className={pageStyles.sectionTitleSpecial}>{title}</h2>
        </div>
        <Row>
          {products.map(product => (
            <Col key={product.id} xs={12} sm={6} md={3}>
              <EnhancedProductCard product={product} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default SpecialProductsSection;

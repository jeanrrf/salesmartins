import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { affiliateService } from '../../services/api';
import EnhancedProductCard from './EnhancedProductCard';
import styles from '../../pages/SalesMartins/SalesMartins.module.css';

const SpecialProductsSection = ({ 
  title, 
  icon, 
  sectionClass, 
  categoryId, 
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
        
        // Preparar parâmetros para a API
        const params = {
          limit,
          page: 1,
          ...filterParams
        };
        
        // Se temos uma categoria específica, usamos a API de categoria
        let response;
        if (categoryId) {
          response = await affiliateService.getProductsByCategory(categoryId, params);
        } else {
          // Usar a API específica para produtos especiais
          response = await affiliateService.getSpecialProducts(params);
        }
        
        // Extrair produtos da resposta, lidando com diferentes formatos
        let extractedProducts = [];
        if (response && response.data) {
          if (response.data.products) {
            extractedProducts = response.data.products;
          } else if (response.data.data && response.data.data.products) {
            extractedProducts = response.data.data.products;
          } else if (Array.isArray(response.data)) {
            extractedProducts = response.data;
          } else if (Array.isArray(response.data.data)) {
            extractedProducts = response.data.data;
          }
        }
        
        setProducts(extractedProducts);
      } catch (err) {
        console.error('Erro ao buscar produtos especiais:', err);
        setError('Não foi possível carregar os produtos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, filterParams, limit]);

  if (loading) {
    return (
      <div className={`${styles.specialSection} ${styles[sectionClass]}`}>
        <Container className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando produtos especiais...</p>
        </Container>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className={`${styles.specialSection} ${styles[sectionClass]}`}>
        <Container>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>{icon}</span>
            <h2 className={styles.sectionTitleSpecial}>{title}</h2>
          </div>
          <div className={`${styles.comingSoonMessage} text-center py-5`}>
            <div className={styles.comingSoonIcon}>✨</div>
            <h3 className={styles.comingSoonTitle}>Em Breve Novidades!</h3>
            <p className={styles.comingSoonText}>
              Estamos trabalhando para trazer as melhores ofertas para você.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className={`${styles.specialSection} ${styles[sectionClass]}`}>
      <Container>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>{icon}</span>
          <h2 className={styles.sectionTitleSpecial}>{title}</h2>
        </div>
        <Row>
          {products.map((product) => (
            <Col key={product.id || product.itemId} md={3} sm={6} className="mb-4">
              <EnhancedProductCard product={product} />
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default SpecialProductsSection;

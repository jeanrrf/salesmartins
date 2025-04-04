import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { affiliateService } from '../../services/api';
import ProductCard from '../../components/ProductCard';

const SpecialProductsSection = ({ title, params }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await affiliateService.getSpecialProducts(params);
        setProducts(response.data?.data?.products || []);
      } catch (error) {
        console.error('Erro ao buscar produtos especiais:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!products.length) return null;

  return (
    <Container>
      <h3>{title}</h3>
      <Row>
        {products.map(product => (
          <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default SpecialProductsSection;

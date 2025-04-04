import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import axios from 'axios';
import { useToast } from '../../hooks/UseToast';
import styles from './ChampionProducts.module.css';

const ChampionProducts = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    keywords: '',
    limit: 25
  });
  const toast = useToast();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/affiliate/search', {
        params: {
          keywords: filters.keywords,
          limit: filters.limit
        }
      });
      setProducts(response.data);
      toast.showSuccess('Produtos carregados com sucesso!');
    } catch (error) {
      toast.showError('Erro ao buscar produtos. Verifique os logs.');
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const removeProduct = (id) => {
    setProducts(products.filter(product => product.id !== id));
    toast.showInfo('Produto removido da lista.');
  };

  const generateAffiliateLinks = async () => {
    try {
      await axios.post('/api/affiliate/generate-links', {
        products
      });
      toast.showSuccess('Links de afiliados gerados e salvos com sucesso!');
    } catch (error) {
      toast.showError('Erro ao gerar links de afiliados. Verifique os logs.');
      console.error('Erro ao gerar links de afiliados:', error);
    }
  };

  return (
    <Container>
      <h1 className={styles.pageTitle}>Buscador de Produtos</h1>

      <Card className={styles.filterCard}>
        <Card.Body>
          <Form onSubmit={(e) => { e.preventDefault(); fetchProducts(); }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Palavras-chave</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="keywords" 
                    value={filters.keywords} 
                    onChange={handleFilterChange}
                    placeholder="Digite palavras-chave"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantidade</Form.Label>
                  <Form.Select 
                    name="limit" 
                    value={filters.limit} 
                    onChange={handleFilterChange}
                  >
                    <option value={1}>1</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="w-100">
                  Buscar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        {products.map(product => (
          <Col md={3} sm={6} key={product.id} className="mb-4">
            <Card className={styles.productCard}>
              <Card.Img 
                variant="top" 
                src={product.image} 
                alt={product.name}
                className={styles.productImage}
              />
              <Card.Body>
                <Card.Title className={styles.cardTitle}>{product.name}</Card.Title>
                <div className={styles.productPrice}>R$ {product.price}</div>
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => removeProduct(product.id)}
                >
                  Remover
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {products.length > 0 && (
        <div className="text-center mt-4">
          <Button 
            className={styles.generateButton}
            variant="success" 
            onClick={generateAffiliateLinks}
          >
            Gerar Links de Afiliados
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ChampionProducts;
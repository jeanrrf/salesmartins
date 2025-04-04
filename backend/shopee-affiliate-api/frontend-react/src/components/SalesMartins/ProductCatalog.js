import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Pagination } from 'react-bootstrap';
import { affiliateService } from '../../services/api';
import EnhancedProductCard from './EnhancedProductCard';
import styles from '../../pages/SalesMartins/SalesMartins.module.css';

const ProductCatalog = ({ 
  categoryId = 'all', 
  searchQuery = '',
  limit = 12,
  CardComponent = EnhancedProductCard
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isFilterChange, setIsFilterChange] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setIsFilterChange(true);
  }, [categoryId, searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          limit,
          search: searchQuery || undefined
        };
        
        let response;
        if (categoryId && categoryId !== 'all') {
          response = await affiliateService.getProductsByCategory(categoryId, params);
        } else {
          response = await affiliateService.getDatabaseProducts(params);
        }
        
        if (response.data?.data) {
          const { products, totalCount } = response.data.data;
          setProducts(products || []);
          setTotalProducts(totalCount || 0);
          setTotalPages(Math.ceil(totalCount / limit) || 1);
        } else if (response.data?.products) {
          const { products, totalCount } = response.data;
          setProducts(products || []);
          setTotalProducts(totalCount || 0);
          setTotalPages(Math.ceil(totalCount / limit) || 1);
        } else {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(1);
        }
        
        setIsFilterChange(false);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Não foi possível carregar os produtos.');
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
        setIsFilterChange(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchQuery, currentPage, limit]);

  const handlePageChange = (page) => {
    if (page !== currentPage) {
      const currentScrollPosition = window.scrollY;
      setCurrentPage(page);
      setTimeout(() => {
        window.scrollTo({
          top: currentScrollPosition,
          behavior: 'instant'
        });
      }, 100);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    const maxPages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );
    
    if (startPage > 1) {
      items.push(
        <Pagination.Item 
          key={1} 
          onClick={() => handlePageChange(1)}
          active={currentPage === 1}
        >
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          onClick={() => handlePageChange(page)}
          active={currentPage === page}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
          active={currentPage === totalPages}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );
    
    return (
      <Pagination className="justify-content-center mt-4">{items}</Pagination>
    );
  };

  if (loading && isFilterChange) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando produtos...</p>
      </Container>
    );
  }

  if (error || products.length === 0) {
    return (
      <Container>
        <div className={`${styles.comingSoonMessage} text-center py-5`}>
          <div className={styles.comingSoonIcon}>✨</div>
          <h3 className={styles.comingSoonTitle}>Em Breve Novidades!</h3>
          <p className={styles.comingSoonText}>
            Estamos trabalhando para trazer as melhores ofertas para você.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-3 d-flex justify-content-between">
        <span className="text-muted">
          Mostrando {products.length} de {totalProducts} produtos
        </span>
      </div>
      
      {loading && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
          <span className="ms-2">Atualizando produtos...</span>
        </div>
      )}
      
      <Row>
        {products.map((product) => (
          <Col key={product.id || product.itemId} lg={3} md={4} sm={6} className="mb-4">
            <CardComponent product={product} />
          </Col>
        ))}
      </Row>
      
      {renderPagination()}
    </Container>
  );
};

export default ProductCatalog;

import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Pagination } from 'react-bootstrap';
import EnhancedProductCard from './EnhancedProductCard';
import styles from './ProductCatalog.module.css';

const ProductCatalog = ({ 
  products = [],
  searchQuery = '',
  limit = 16, // Aumentado para caber mais produtos por página
  CardComponent = EnhancedProductCard
}) => {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const catalogRef = useRef(null);

  // Filtra produtos com base na busca
  useEffect(() => {
    let result = [...products];

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        (product.name?.toLowerCase().includes(query)) ||
        (product.description?.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
    setTotalPages(Math.ceil(result.length / limit) || 1);
    setCurrentPage(1); // Reset para a primeira página quando há nova filtragem
  }, [products, searchQuery, limit]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to the catalog container instead of page top
    setTimeout(() => {
      if (catalogRef && catalogRef.current) {
        catalogRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Produtos paginados
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

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
        aria-label="Página anterior"
      />
    );
    
    if (startPage > 1) {
      items.push(
        <Pagination.Item 
          key={1} 
          onClick={() => handlePageChange(1)}
          aria-label="Ir para página 1"
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
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
          aria-label={`Ir para página ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
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
          aria-label={`Ir para página ${totalPages}`}
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
        aria-label="Próxima página"
      />
    );
    
    return <Pagination className="justify-content-center mt-4">{items}</Pagination>;
  };

  if (filteredProducts.length === 0 && searchQuery) {
    return (
      <div className="text-center py-4">
        <p>Nenhum produto encontrado para a busca "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className={styles.catalogContainer} ref={catalogRef}>
      <Row className={styles.productsRow}>
        {paginatedProducts.map((product) => (
          <Col key={product.id || product.shopee_id} xl={3} lg={4} md={6} sm={6} className="mb-4">
            <CardComponent product={product} />
          </Col>
        ))}
      </Row>
      
      {renderPagination()}
    </div>
  );
};

export default ProductCatalog;

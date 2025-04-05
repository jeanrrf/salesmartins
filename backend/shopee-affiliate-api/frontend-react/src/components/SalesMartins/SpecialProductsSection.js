import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import EnhancedProductCard from './EnhancedProductCard';
import axios from 'axios';
import pageStyles from '../../pages/SalesMartins/SalesMartins.module.css';
import styles from './SpecialProductsSection.module.css';

const SpecialProductsSection = ({ 
  title, 
  icon, 
  sectionClass,
  filterParams = {},
  limit = 4,
  CardComponent = EnhancedProductCard
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  const memoizedParams = JSON.stringify(filterParams); // Create a stable reference

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        setNoResults(false);

        // Prepare query parameters
        const params = {
          ...filterParams,
          limit
        };

        const response = await axios.get('/api/products', { params });

        if (response.data?.success) {
          // Apply filters on the client side as needed
          let filteredProducts = response.data.data || [];

          // Apply category filter if specified
          if (filterParams.categoryId) {
            filteredProducts = filteredProducts.filter(
              product => product.category_id === parseInt(filterParams.categoryId)
            );
          }

          // Apply rating filter if specified
          if (filterParams.minRating) {
            filteredProducts = filteredProducts.filter(
              product => product.rating_star >= parseFloat(filterParams.minRating)
            );
          }

          // Apply discount filter if specified
          if (filterParams.minDiscount) {
            filteredProducts = filteredProducts.filter(product => {
              const originalPrice = parseFloat(product.original_price || product.price);
              const currentPrice = parseFloat(product.price);
              const discountPercentage = ((originalPrice - currentPrice) / originalPrice) * 100;
              return discountPercentage >= parseFloat(filterParams.minDiscount);
            });
          }

          // Sort by the specified criteria
          switch (filterParams.sortBy) {
            case 'discount':
              filteredProducts.sort((a, b) => {
                const discountA = ((parseFloat(a.original_price || a.price) - parseFloat(a.price)) / parseFloat(a.original_price || a.price)) * 100;
                const discountB = ((parseFloat(b.original_price || b.price) - parseFloat(b.price)) / parseFloat(b.original_price || b.price)) * 100;
                return discountB - discountA;
              });
              break;
            case 'rating':
              filteredProducts.sort((a, b) => b.rating_star - a.rating_star);
              break;
            case 'sales':
              filteredProducts.sort((a, b) => b.sales - a.sales);
              break;
            default:
              break;
          }

          // Limit the number of products
          filteredProducts = filteredProducts.slice(0, limit);

          setProducts(filteredProducts);
          setNoResults(filteredProducts.length === 0);
        } else {
          setError('Erro ao carregar produtos');
        }
      } catch (err) {
        console.error('Erro ao carregar produtos especiais:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [memoizedParams, limit]); // Use memoizedParams instead of filterParams object

  // Don't render anything if there are no products to show
  if ((noResults || products.length === 0) && !loading) {
    return null;
  }

  return (
    <div className={`${pageStyles.specialSection} ${pageStyles[sectionClass]}`} style={{ zIndex: 1 }}>
      <Container fluid> {/* Changed from Container to Container fluid for full width */}
        <div className={pageStyles.sectionHeader} style={{ paddingLeft: "20px" }}>
          <span className={pageStyles.sectionIcon}>{icon}</span>
          <h2 className={pageStyles.sectionTitle}>{title}</h2>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" aria-label="Carregando produtos especiais" />
          </div>
        ) : error ? (
          <p className="text-center text-danger">{error}</p>
        ) : (
              <Row className={`${styles.productsRow} w-100`}> {/* Added w-100 for full width */}
                {products.map(product => (
                  <Col key={product.id} xs={6} sm={4} md={3} lg={3} className={styles.productCol}>
                    <CardComponent product={product} />
                  </Col>
                ))}
              </Row>
        )}
      </Container>
    </div>
  );
};

export default SpecialProductsSection;

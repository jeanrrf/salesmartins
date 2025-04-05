import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { affiliateService } from '../services/api';
import { useEffect, useState } from 'react';

// Replace local image import with URL constant
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/400x300?text=Product+Image";

const ProductDetailsContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProductImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 10px;
  margin-bottom: 1.5rem;
`;

const ProductTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #333;
`;

const ProductDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: #555;
  margin-bottom: 1.5rem;
`;

const ProductPrice = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #e4145a;
  margin-bottom: 1.5rem;
`;

const CategoryBadge = styled.span`
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e4145a;
    color: white;
  }
`;

const RelatedProductsSection = styled.div`
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 2rem;
`;

const RelatedProductsTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const RelatedProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const RelatedProductCard = styled.div`
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RelatedProductImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
`;

const RelatedProductInfo = styled.div`
  padding: 1rem;
`;

const RelatedProductName = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const RelatedProductPrice = styled.div`
  font-weight: bold;
  color: #e4145a;
`;

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const relatedProductsRef = useRef(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await affiliateService.getLinkById(id);
        setProduct(response.data);
        
        // After getting product details, fetch related products by category
        if (response.data && response.data.categoryId) {
          fetchRelatedProducts(response.data.categoryId);
          setSelectedCategory(response.data.categoryId);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const fetchRelatedProducts = async (categoryId) => {
    try {
      const response = await affiliateService.getProductsByCategory(categoryId, { limit: 8 });
      if (response.data && response.data.data && response.data.data.products) {
        // Filter out the current product from related products
        const filteredProducts = response.data.data.products.filter(
          relatedProduct => relatedProduct.id !== parseInt(id)
        );
        setRelatedProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos relacionados:', error);
    }
  };

  const handleCategoryClick = (categoryId, categoryName) => {
    setSelectedCategory(categoryId);
    fetchRelatedProducts(categoryId);
    
    // Scroll to related products section
    if (relatedProductsRef && relatedProductsRef.current) {
      relatedProductsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!product) {
    return <p>Produto não encontrado.</p>;
  }

  return (
    <ProductDetailsContainer>
      <ProductImage 
        src={product.image || PLACEHOLDER_IMAGE} 
        alt={product.name} 
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = PLACEHOLDER_IMAGE;
        }}
      />
      <ProductTitle>{product.name}</ProductTitle>
      <ProductPrice>{new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(product.price)}</ProductPrice>
      
      {product.categoryName && (
        <div style={{ marginBottom: '1rem' }}>
          <CategoryBadge 
            onClick={() => handleCategoryClick(product.categoryId, product.categoryName)}
          >
            {product.categoryName}
          </CategoryBadge>
        </div>
      )}
      
      <ProductDescription>{product.description || 'Descrição não disponível.'}</ProductDescription>
      
      <RelatedProductsSection ref={relatedProductsRef}>
        <RelatedProductsTitle>
          Produtos relacionados {selectedCategory && product.categoryName ? `em ${product.categoryName}` : ''}
        </RelatedProductsTitle>
        
        {relatedProducts.length > 0 ? (
          <RelatedProductsGrid>
            {relatedProducts.map(relatedProduct => (
              <RelatedProductCard key={relatedProduct.id}>
                <RelatedProductImage 
                  src={relatedProduct.image_url || PLACEHOLDER_IMAGE} 
                  alt={relatedProduct.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
                <RelatedProductInfo>
                  <RelatedProductName>{relatedProduct.name}</RelatedProductName>
                  <RelatedProductPrice>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(relatedProduct.price)}
                  </RelatedProductPrice>
                </RelatedProductInfo>
              </RelatedProductCard>
            ))}
          </RelatedProductsGrid>
        ) : (
          <p>Não há produtos relacionados disponíveis.</p>
        )}
      </RelatedProductsSection>
    </ProductDetailsContainer>
  );
};

export default ProductDetails;
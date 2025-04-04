import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { affiliateService } from '../services/api';
import { useEffect, useState } from 'react';

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

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await affiliateService.getLinkById(id);
        setProduct(response.data);
      } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!product) {
    return <p>Produto não encontrado.</p>;
  }

  return (
    <ProductDetailsContainer>
      <ProductImage src={product.image} alt={product.name} />
      <ProductTitle>{product.name}</ProductTitle>
      <ProductPrice>{new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(product.price)}</ProductPrice>
      <ProductDescription>{product.description || 'Descrição não disponível.'}</ProductDescription>
    </ProductDetailsContainer>
  );
};

export default ProductDetails;
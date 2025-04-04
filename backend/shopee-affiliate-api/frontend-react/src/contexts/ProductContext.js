import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get('/products');
        setProducts(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Erro ao carregar os produtos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, error, setProducts, setLoading }}>
      {children}
    </ProductContext.Provider>
  );
};
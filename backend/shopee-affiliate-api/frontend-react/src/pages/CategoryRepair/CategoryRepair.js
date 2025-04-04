import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Alert } from 'react-bootstrap';
import api from '../../services/api';
import styles from './CategoryRepair.module.css';

const CategoryRepair = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUncategorizedProducts();
    fetchCategories();
  }, []);

  const fetchUncategorizedProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/uncategorized-products');
      console.log('API response:', response.data);
      
      // Ensure products is always an array
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setProducts(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error('API response format unexpected:', response.data);
        setProducts([]);
        setErrorMessage('Formato de resposta inesperado da API.');
      }
    } catch (error) {
      console.error('Error fetching uncategorized products:', error);
      setErrorMessage('Erro ao carregar produtos sem categoria: ' + (error.response?.data?.message || error.message));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      console.log('Categorias carregadas:', response.data);
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error('Invalid category data format:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setErrorMessage('Erro ao carregar categorias: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCategoryChange = (productId, newCategoryId) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId) {
          // Find the category name for the selected ID
          const selectedCategory = categories.find(cat => cat.id === newCategoryId);
          const categoryName = selectedCategory ? selectedCategory.name : '';
          console.log(`Categoria selecionada para produto ${productId}:`, {
            id: newCategoryId,
            nome: categoryName
          });
          
          return {
            ...product,
            categoryId: newCategoryId,
            categoryName: categoryName // Usando o nome correto da categoria selecionada
          };
        }
        return product;
      })
    );
  };

  const saveChanges = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      console.log('Enviando dados para o servidor:', { products });
      const response = await api.post('/products/update-categories', { products });
      console.log('Resposta do servidor:', response.data);
      setSuccessMessage('Categorias atualizadas com sucesso!');
      fetchUncategorizedProducts(); // Refresh the list
    } catch (error) {
      console.error('Error saving category changes:', error);
      setErrorMessage('Erro ao salvar alterações: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Reparador de Categorias</h1>
      
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      {loading ? (
        <p>Carregando...</p>
      ) : Array.isArray(products) && products.length > 0 ? (
        <>
          <p>Total de produtos sem categoria: {products.length}</p>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Shopee ID</th>
                <th>Nome</th>
                <th>Categoria Atual</th>
                <th>Nova Categoria</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.shopee_id || 'N/A'}</td>
                  <td>{product.name}</td>
                  <td>{product.category_name || product.categoryName || 'Sem categoria'}</td>
                  <td>
                    <Form.Select 
                      value={product.categoryId || product.category_id || ''}
                      onChange={(e) => handleCategoryChange(product.id, e.target.value)}
                    >
                      <option value="">Selecione uma categoria</option>
                      {Array.isArray(categories) && categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button onClick={saveChanges} disabled={loading} className={styles.saveButton}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </>
      ) : (
        <Alert variant="info">Não há produtos sem categoria para exibir.</Alert>
      )}
    </div>
  );
};

export default CategoryRepair;
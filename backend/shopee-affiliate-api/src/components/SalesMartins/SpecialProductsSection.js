import React, { useEffect, useState } from 'react';

const SpecialProductsSection = ({ filterParams }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  // Create a stable reference for filterParams
  const memoizedParams = JSON.stringify(filterParams);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        setNoResults(false);

        const response = await fetch(`/api/products?filter=${filterParams}`);
        const data = await response.json();
        setProducts(data);
        if (data.length === 0) {
          setNoResults(true);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [memoizedParams]); // Fix: Added memoizedParams as a dependency

  return (
    <div>
      <h2>Special Products</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {noResults && <p>No products found.</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default SpecialProductsSection;
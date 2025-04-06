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

        // Use the parsed value from memoizedParams instead of filterParams directly
        const parsedParams = JSON.parse(memoizedParams);
        const queryString = new URLSearchParams(parsedParams).toString();
        const response = await fetch(`/api/products?${queryString}`);
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
  }, [filterParams]); // Added 'filterParams' to the dependency array

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
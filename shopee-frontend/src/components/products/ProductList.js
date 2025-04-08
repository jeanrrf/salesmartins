import React from 'react';
import ProductCard from './ProductCard';
import './ProductList.css';
import { ErrorBoundary } from 'react-error-boundary';

// Componente para exibir quando ocorre um erro
const ErrorFallback = ({ error, resetErrorBoundary }) => {
    return (
        <div className="error-container">
            <h3>Ocorreu um erro ao carregar os produtos</h3>
            <p>{error.message}</p>
            <button onClick={resetErrorBoundary}>Tentar novamente</button>
        </div>
    );
};

const ProductList = ({ products, loading, error, dataSource, onRefresh }) => {
    // Converter para array se não for
    const productArray = Array.isArray(products) ? products : [];

    if (loading) {
        return (
            <div className="product-list-container">
                <div className="loading-spinner">Carregando produtos...</div>
            </div>
        );
    }

    return (
        <div className="product-list-container">
            {dataSource === 'api' && (
                <div className="data-source-indicator api">
                    Usando dados da API Shopee
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={onRefresh} className="retry-button">
                        Tentar novamente
                    </button>
                </div>
            )}

            {productArray.length === 0 ? (
                <p className="no-products">
                    {error ? 'Falha ao carregar produtos.' : 'Nenhum produto encontrado. Ajuste seus filtros ou tente novamente.'}
                </p>
            ) : (
                <ErrorBoundary
                    FallbackComponent={ErrorFallback}
                    onReset={onRefresh}
                >
                    <div className="product-grid">
                        {productArray.map(product => (
                            <ProductCard
                                key={product.id || product.itemId || Math.random().toString(36).substring(2, 9)}
                                product={product}
                                onAddToCart={(id) => console.log('Adicionar ao carrinho:', id)}
                            />
                        ))}
                    </div>
                </ErrorBoundary>
            )}
        </div>
    );
};

export default ProductList;
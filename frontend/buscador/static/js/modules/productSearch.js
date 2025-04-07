//###################################################################################################
//# Arquivo: productSearch.js                                                                      #
//# Descrição: Este script realiza a conexão com a API e processa os dados recebidos.              #
//# Autor: Jean Rosso                                                                              #
//# Data: 28 de março de 2025                                                                      #
//###################################################################################################

import { api, notify } from './utils.js';
import { CategoryLoader } from './categoryLoader.js';

export class ProductSearch {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.searchResults = [];
        this.isLoading = false;
        this.categoryLoader = new CategoryLoader();
    }

    async initialize() {
        try {
            // Inicializar o carregador de categorias apenas para informações de produto
            await this.categoryLoader.initialize();
            
            // Inicializar componentes básicos
            this._setupEventListeners();
            
            // Carregar produtos iniciais
            await this.loadProducts();
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar o módulo de busca:', error);
            notify.error('Falha ao inicializar o buscador de produtos.');
            return false;
        }
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this._showLoading();
        
        try {
            // Carregar produtos do backend
            const response = await fetch('http://localhost:8001/db/products');
            if (!response.ok) {
                throw new Error(`Erro ao carregar produtos: ${response.status}`);
            }
            
            const products = await response.json();
            this.products = products.map(product => {
                // Adicionar informação da categoria completa para cada produto
                if (product.category_id) {
                    product.category_full_path = this.categoryLoader.getCategoryFullPath(product.category_id);
                }
                return product;
            });
            
            this.filteredProducts = [...this.products];
            
            // Exibir produtos
            this._renderProducts(this.filteredProducts);
            this._updateResultsCount();
            
            // Verificar produtos sem categoria
            this._checkProductsWithoutCategories();
            
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            notify.error('Falha ao carregar produtos. Por favor, tente novamente.');
        } finally {
            this.isLoading = false;
            this._hideLoading();
        }
    }

    /**
     * Verifica produtos sem categorias e alerta o usuário
     */
    _checkProductsWithoutCategories() {
        const productsWithoutCategory = this.products.filter(product => !product.category_id);
        
        if (productsWithoutCategory.length > 0) {
            const categoryRepairLink = document.createElement('a');
            categoryRepairLink.href = '../category-repair.html';
            categoryRepairLink.className = 'alert-link';
            categoryRepairLink.textContent = 'página de reparo de categorias';
            
            notify.warning(`${productsWithoutCategory.length} produtos estão sem categoria. Visite a ${categoryRepairLink.outerHTML} para corrigir.`, 8000);
        }
    }

    searchProducts(query = '') {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        this.filteredProducts = [...this.products];
        
        // Filtrar por termo de busca
        if (searchTerms.length > 0) {
            this.filteredProducts = this.filteredProducts.filter(product => {
                const productName = (product.name || '').toLowerCase();
                const productDesc = (product.description || '').toLowerCase();
                
                return searchTerms.every(term => 
                    productName.includes(term) || productDesc.includes(term)
                );
            });
        }
        
        // Aplicar ordenação
        this._applySorting();
        
        this._renderProducts(this.filteredProducts);
        this._updateResultsCount();
    }

    /**
     * Aplica ordenação aos produtos filtrados
     */
    _applySorting() {
        const sortSelect = document.getElementById('sort-select');
        if (!sortSelect) return;
        
        const sortValue = sortSelect.value;
        
        switch (sortValue) {
            case 'sales':
                this.filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
                break;
                
            case 'price-asc':
                this.filteredProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                break;
                
            case 'price-desc':
                this.filteredProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
                break;
                
            case 'commission':
                this.filteredProducts.sort((a, b) => 
                    (parseFloat(b.commissionRate) || 0) - (parseFloat(a.commissionRate) || 0)
                );
                break;
                
            default:
                // Nenhuma ordenação especial
                break;
        }
    }

    _renderProducts(products) {
        const container = document.getElementById('products-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            document.getElementById('no-results')?.style.display = 'block';
            return;
        }
        
        document.getElementById('no-results')?.style.display = 'none';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-4 mb-4';
            productCard.dataset.productId = product.id;
            
            // Adicionar badges de categoria e outras informações
            const categoryBadge = product.category_id 
                ? `<span class="category-badge">${product.category_name || 'Categoria'}</span>` 
                : `<span class="category-badge bg-danger">Sem Categoria</span>`;
                
            // Adicionar badge de desconto se houver
            const discountBadge = product.priceDiscountRate && parseFloat(product.priceDiscountRate) > 0 
                ? `<span class="promo-badge">-${product.priceDiscountRate}%</span>` 
                : '';
                
            productCard.innerHTML = `
                <div class="card product-card" data-product-id="${product.id}">
                    ${categoryBadge}
                    ${discountBadge}
                    <img src="${product.image_url || 'https://placehold.co/400x300?text=Sem+Imagem'}" class="card-img-top product-image" alt="${product.name}" onerror="this.src='static/images/no-image.png';">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${this._formatPrice(product.price)}</p>
                        <div class="stats-container mb-3">
                            <span><i class="bi bi-graph-up"></i> ${product.sales || 0} vendas</span>
                            <span><i class="bi bi-tags"></i> ${parseFloat(product.commissionRate || 0) * 100}% comissão</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-sm btn-primary view-product" data-product-id="${product.id}">
                                <i class="bi bi-eye"></i> Visualizar
                            </button>
                            <button class="btn btn-sm btn-outline-secondary quick-link" data-product-id="${product.id}">
                                <i class="bi bi-link"></i> Link Rápido
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(productCard);
        });
        
        this._setupProductEventListeners();
    }

    _setupEventListeners() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-query');
        const searchButton = document.getElementById('search-button');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchProducts(searchInput.value);
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                // Evita busca automática a cada digitação
                // Se quiser busca automática, descomente as linhas abaixo:
                // if (!searchInput.value) {
                //     this.searchProducts('');
                // }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.searchProducts(searchInput?.value || '');
            });
        }

        // Adiciona evento de ordenação
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this._applySorting();
                this._renderProducts(this.filteredProducts);
            });
        }
    }
    
    _setupProductEventListeners() {
        // Implementar listeners para os botões dos produtos
        document.querySelectorAll('.view-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this._showProductDetails(productId);
            });
        });
        
        document.querySelectorAll('.quick-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this._generateQuickLink(productId);
            });
        });
    }
    
    _showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Implementar visualização de detalhes do produto
        console.log('Mostrar detalhes do produto:', product);
        // TODO: Implementar modal de detalhes
    }
    
    _generateQuickLink(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Implementar geração rápida de link
        console.log('Gerar link rápido para:', product);
        // TODO: Implementar geração de link
    }
    
    _showLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.style.display = 'none';
        }
    }
    
    _hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.style.display = 'flex';
        }
    }
    
    _updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            const count = this.filteredProducts.length;
            countElement.textContent = `Exibindo ${count} produto${count !== 1 ? 's' : ''}`;
        }
    }
    
    _formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    }
    
    // Funções para geração de links e exportação em massa
    generateLinks() {
        // Implementar geração em massa de links
        console.log('Gerando links para todos os produtos...');
        return Promise.resolve(true);
    }
    
    saveToDatabase() {
        // Implementar salvamento no banco de dados
        console.log('Salvando produtos no banco de dados...');
        return Promise.resolve(true);
    }
    
    getAffiliateLinkStats() {
        // Retornar estatísticas de links gerados
        const total = this.products.length;
        const withLinks = this.products.filter(p => p.affiliate_link).length;
        const percentage = total > 0 ? Math.round((withLinks / total) * 100) : 0;
        
        return {
            total,
            withLinks,
            percentage
        };
    }
}

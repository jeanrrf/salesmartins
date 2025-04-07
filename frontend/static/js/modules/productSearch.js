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
            // Inicializar o carregador de categorias
            await this.categoryLoader.initialize();
            
            // Preencher o filtro de categorias
            this.populateCategoryFilter();
            
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

    /**
     * Preenche o filtro de categorias com os dados carregados
     */
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = this.categoryLoader.getCategorySelectOptions();
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
            categoryRepairLink.href = 'category-repair.html';
            categoryRepairLink.className = 'alert-link';
            categoryRepairLink.textContent = 'página de reparo de categorias';
            
            notify.warning(`${productsWithoutCategory.length} produtos estão sem categoria. Visite a ${categoryRepairLink.outerHTML} para corrigir.`, 8000);
        }
    }

    searchProducts(query = '', category = '') {
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
        
        // Filtrar por categoria
        if (category) {
            this.filteredProducts = this.filteredProducts.filter(product => {
                // Se o produto tem a categoria exata
                if (product.category_id === category) return true;
                
                // Se é categoria de nível 1 e o produto pertence a alguma subcategoria dela
                const productCategory = this.categoryLoader.getCategoryById(product.category_id);
                if (!productCategory) return false;
                
                // Se estamos filtrando por categoria nível 1 e o produto está em uma subcategoria dela
                if (productCategory.level === 2 && productCategory.parent_id === category) return true;
                
                // Se estamos filtrando por categoria nível 2 e o produto está em uma subcategoria dela
                if (productCategory.level === 3 && productCategory.parent_id === category) return true;
                
                return false;
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
        const categoryFilter = document.getElementById('category-filter');
        const searchButton = document.getElementById('search-button');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchProducts(searchInput.value, categoryFilter?.value || '');
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                // Evita busca automática a cada digitação
                // Se quiser busca automática, descomente as linhas abaixo:
                // if (!searchInput.value) {
                //     this.searchProducts('', categoryFilter?.value || '');
                // }
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.searchProducts(searchInput?.value || '', categoryFilter.value);
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.searchProducts(searchInput?.value || '', categoryFilter?.value || '');
            });
        }
    }
    
    _setupProductEventListeners() {
        document.querySelectorAll('.view-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this._viewProduct(productId);
            });
        });
        
        document.querySelectorAll('.quick-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this._generateQuickLink(productId);
            });
        });
    }
    
    _viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        console.log('Visualizando produto:', product);
        
        alert(`Visualizando: ${product.name}\nPreço: ${this._formatPrice(product.price)}`);
    }
    
    _generateQuickLink(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        console.log('Gerando link rápido para:', product);
        
        const link = `https://exemplo.com/produto/${productId}?ref=sentinnell`;
        
        navigator.clipboard.writeText(link)
            .then(() => notify.success('Link copiado para a área de transferência!'))
            .catch(() => notify.error('Não foi possível copiar o link.'));
    }
    
    _updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `${this.filteredProducts.length} produtos encontrados`;
        }
    }
    
    _showLoading() {
        document.getElementById('loading-indicator')?.style.display = 'block';
    }
    
    _hideLoading() {
        document.getElementById('loading-indicator')?.style.display = 'none';
    }
    
    _formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    }
}
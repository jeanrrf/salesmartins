//###################################################################################################
//# Arquivo: productSearch.js                                                                      #
//# Descrição: Este script realiza a conexão com a API e processa os dados recebidos.              #
//# Autor: Jean Rosso                                                                              #
//# Data: 28 de março de 2025                                                                      #
//###################################################################################################

import { CategoryManager } from './categoryManager.js';
import { LinkGenerator } from './linkGenerator.js';
import { TemplateManager } from './templateManager.js';
import { UIManager } from './uiManager.js';
import { api, dom, notify, handleImageError } from './utils.js';

export class ProductSearch {
    constructor() {
        this.categoryManager = new CategoryManager();
        this.templateManager = new TemplateManager();
        this.linkGenerator = new LinkGenerator(this.templateManager, this.categoryManager);
        this.uiManager = new UIManager();

        this.currentProducts = [];
        this.recommendations = [];
        this.filters = {
            minPrice: null,
            maxPrice: null,
            minCommission: null
        };

        this.selectedItems = new Set();

        this.initializeEventListeners();
    }

    async initialize() {
        // Initialize any necessary state
        this.setupFilterToggles();
        this.initSelectionControls();
    }

    setupFilterToggles() {
        const filterToggle = document.getElementById('filter-toggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                const quickFilters = document.getElementById('quick-filters');
                if (quickFilters) {
                    const isVisible = quickFilters.style.display !== 'none';
                    dom.toggle('quick-filters', !isVisible);
                }
            });
        }
    }

    initializeEventListeners() {
        // Search form submission
        document.getElementById('search-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.performSearch();
        });

        // Price filter
        document.getElementById('apply-price-filter')?.addEventListener('click', () => {
            this.filters.minPrice = parseFloat(document.getElementById('min-price').value) || null;
            this.filters.maxPrice = parseFloat(document.getElementById('max-price').value) || null;
            this.applyFilters();
        });

        // Commission filters
        document.querySelectorAll('.commission-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const value = parseFloat(e.target.dataset.value);
                this.filters.minCommission = value;

                // Update active state of commission buttons
                document.querySelectorAll('.commission-filter').forEach(btn => {
                    btn.classList.remove('active', 'btn-primary');
                    btn.classList.add('btn-outline-secondary');
                });
                e.target.classList.add('active', 'btn-primary');
                e.target.classList.remove('btn-outline-secondary');

                this.applyFilters();
            });
        });

        document.getElementById('update-categories')?.addEventListener('click', () => this.updateCategories());
        document.getElementById('adjust-templates')?.addEventListener('click', () => this.adjustTemplates());
        document.getElementById('generate-links')?.addEventListener('click', () => this.generateLinks());
        document.getElementById('save-database')?.addEventListener('click', () => this.saveToDatabase());

        // Botão mágico para gerar links sequenciais
        document.getElementById('generate-sequential-links')?.addEventListener('click', async () => {
            try {
                if (!this.currentProducts.length) {
                    notify.warning('Faça uma busca primeiro para gerar os links.');
                    return;
                }

                dom.show('loading-indicator');

                // Gerar links para todos os produtos
                await this.generateLinks();

                // Atualizar a exibição dos produtos
                this.renderResults();

                notify.success('Links sequenciais gerados com sucesso! Clique em "Exportar para Banco" para salvar.');
            } catch (error) {
                notify.error('Erro ao gerar links sequenciais: ' + error.message);
            } finally {
                dom.hide('loading-indicator');
            }
        });

        // Event listener para exportação
        document.getElementById('export-data')?.addEventListener('click', async () => {
            try {
                if (!this.currentProducts.length) {
                    notify.warning('Não há produtos para exportar.');
                    return;
                }

                dom.show('loading-indicator');
                await this.saveToDatabase();
                notify.success('Dados exportados com sucesso!');
            } catch (error) {
                notify.error('Erro ao exportar dados: ' + error.message);
            } finally {
                dom.hide('loading-indicator');
            }
        });
    }

    async performSearch() {
        const keyword = document.getElementById('keyword').value;
        const sortType = document.getElementById('sortType').value;
        const limit = document.getElementById('limit').value;
        const sortTypeInt = parseInt(sortType);

        if (!keyword) {
            this.uiManager.showToast('Por favor, insira uma palavra-chave para buscar', 'warning');
            return;
        }

        // Mostrar indicador de carregamento com mensagem informativa
        dom.show('loading-indicator');
        const loadingText = document.querySelector('#loading-indicator .loading-text');
        if (loadingText) {
            loadingText.textContent = 'Buscando produtos...';
        }
        
        dom.hide('products-container');
        dom.hide('no-results');

        try {
            const searchParams = {
                keyword,
                sortType: sortTypeInt,
                limit: parseInt(limit),
                minPrice: this.filters.minPrice,
                maxPrice: this.filters.maxPrice,
                minCommission: this.filters.minCommission,
                includeRecommendations: true // Enable recommendations
            };

            const response = await api.post('/api/search', {
                keyword: searchParams.keyword,
                sortType: searchParams.sortType,
                limit: searchParams.limit,
                minPrice: searchParams.minPrice,
                maxPrice: searchParams.maxPrice,
                minCommission: searchParams.minCommission,
                includeRecommendations: searchParams.includeRecommendations
            });

            this.currentProducts = response.products || [];
            this.recommendations = response.recommendations || [];

            // Aplicar pontuação personalizada se for o método de ordenação escolhido
            if (sortTypeInt === 7) { // 7 é o valor para "Melhor pontuação"
                this.currentProducts = this.applyProductScore(this.currentProducts);
            } else if (sortTypeInt === 6) { // 6 é o valor para "Melhor avaliação"
                this.currentProducts.sort((a, b) => {
                    const ratingA = parseFloat(a.ratingStar) || 0;
                    const ratingB = parseFloat(b.ratingStar) || 0;
                    return ratingB - ratingA;
                });
            }

            this.renderResults();

            if (this.recommendations.length > 0) {
                this.renderRecommendations();
            }

            this.addSelectionCheckboxes();
            this.toggleBulkActions(this.currentProducts.length > 0);
        } catch (error) {
            this.uiManager.showToast('Erro ao buscar produtos: ' + error.message, 'danger');
            this.currentProducts = [];
            this.renderResults();
        } finally {
            dom.hide('loading-indicator');
        }
    }

    /**
     * Aplica um sistema de pontuação aos produtos com base em múltiplos fatores
     * @param {Array} products Lista de produtos a serem pontuados
     * @returns {Array} Lista de produtos ordenada por pontuação
     */
    applyProductScore(products) {
        if (!products || products.length === 0) return [];

        // Encontrar valores máximos para normalização
        const maxSales = Math.max(...products.map(p => parseInt(p.sales) || 0));
        const maxCommission = Math.max(...products.map(p => parseFloat(p.commissionRate) || 0));
        const maxRating = Math.max(...products.map(p => parseFloat(p.ratingStar) || 0));
        const minPrice = Math.min(...products.map(p => parseFloat(p.priceMin) || Infinity));
        const maxPrice = Math.max(...products.map(p => parseFloat(p.priceMin) || 0));
        
        // Pesos para cada fator
        const weights = {
            sales: 0.35,
            commission: 0.30,
            rating: 0.20,
            price: 0.15
        };

        // Adicionar pontuação a cada produto
        const scoredProducts = products.map(product => {
            // Normalizar métricas
            const salesNormalized = maxSales > 0 ? (parseInt(product.sales) || 0) / maxSales : 0;
            const commissionNormalized = maxCommission > 0 ? (parseFloat(product.commissionRate) || 0) / maxCommission : 0;
            const ratingNormalized = maxRating > 0 ? (parseFloat(product.ratingStar) || 0) / maxRating : 0;
            const priceRange = maxPrice - minPrice;
            const priceNormalized = priceRange > 0 ? 
                1 - ((parseFloat(product.priceMin) || maxPrice) - minPrice) / priceRange : 0;

            // Calcular pontuação final
            const score = (
                (salesNormalized * weights.sales) + 
                (commissionNormalized * weights.commission) + 
                (ratingNormalized * weights.rating) + 
                (priceNormalized * weights.price)
            ) * 100;

            return {
                ...product,
                score: score.toFixed(1) // Arredonda para 1 casa decimal
            };
        });

        return scoredProducts.sort((a, b) => b.score - a.score);
    }

    renderRecommendations() {
        const container = document.getElementById('recommendations-container');
        if (!container || !this.recommendations.length) return;

        container.innerHTML = `
            <div class="recommendations-section mt-4">
                <h4>Recomendações Relacionadas</h4>
                <div class="row">
                    ${this.recommendations.map(product => this.createProductCard(product)).join('')}
                </div>
            </div>
        `;

        this.attachProductEventListeners();
    }

    applyFilters() {
        const filteredProducts = this.currentProducts.filter(product => {
            const price = parseFloat(product.priceMin);
            // Converter comissão para número e normalizar formato (decimal ou porcentagem)
            const commission = typeof product.commissionRate === 'string' && product.commissionRate.includes('%') 
                ? parseFloat(product.commissionRate) / 100 
                : parseFloat(product.commissionRate);

            const meetsMinPrice = !this.filters.minPrice || price >= this.filters.minPrice;
            const meetsMaxPrice = !this.filters.maxPrice || price <= this.filters.maxPrice;
            const meetsCommission = !this.filters.minCommission || commission >= this.filters.minCommission;

            return meetsMinPrice && meetsMaxPrice && meetsCommission;
        });

        this.renderProducts(filteredProducts);
    }

    renderResults() {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (!this.currentProducts.length) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Nenhum produto encontrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentProducts.map(product => `
            <div class="col-md-3 mb-4">
                <div class="card product-card">
                    <img src="${product.imageUrl}" 
                         class="card-img-top" 
                         alt="${product.name}"
                         onerror="window.handleImageError(this)">
                    <div class="card-body">
                        <h5 class="card-title">${product.productName}</h5>
                        <p class="card-text">${this.formatCurrency(product.priceMin)}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderProducts(products) {
        const container = document.getElementById('products-container');
        if (!container) return;

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        // Primeiro verificar se o produto já tem uma categoria definida antes de buscar uma nova
        const categoryInfo = product.categoryId && product.categoryName ?
            { id: product.categoryId, name: product.categoryName } :
            this.categoryManager.getCategoryInfo(product);

        const badges = this.generateProductBadges(product);
        
        // Adicionar badge de pontuação se disponível
        if (product.score) {
            badges.push(`<span class="badge bg-info">Score: ${product.score}</span>`);
        }
        
        // Adicionar badge para indicar se o produto já existe no banco de dados
        if (product.existsInDatabase) {
            badges.push(`<span class="badge bg-secondary">Já cadastrado</span>`);
        }

        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card product-card h-100 ${product.existsInDatabase ? 'border-secondary' : ''}" data-category-id="${categoryInfo.id}" data-product-id="${product.itemId}">
                    <div class="category-badge">${categoryInfo.name}</div>
                    <img src="${product.imageUrl}" class="card-img-top product-image" alt="${product.productName}" onerror="window.handleImageError(this)">
                    <div class="card-body">
                        <div class="mb-2">${badges.join(' ')}</div>
                        <h5 class="card-title">${product.productName}</h5>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <p class="card-text mb-0">
                                    <strong>${this.formatCurrency(product.priceMin)}</strong>
                                </p>
                            </div>
                            <div class="text-end">
                                <p class="card-text mb-0 text-success">
                                    <strong>Comissão: ${this.formatPercent(product.commissionRate)}</strong>
                                </p>
                            </div>
                        </div>
                        <p class="card-text mb-1">
                            <i class="bi bi-shop"></i> ${product.shopName}
                        </p>
                        <p class="card-text mb-1">
                            <i class="bi bi-star-fill text-warning"></i> ${product.ratingStar || 'N/A'} 
                            | Vendas: ${product.sales || 'N/A'}
                        </p>
                        <div class="d-flex mt-3">
                            <button class="btn btn-sm btn-outline-success flex-grow-1 me-2 generate-link-btn" 
                                    data-product-id="${product.itemId}">
                                <i class="bi bi-link-45deg"></i> Gerar Link
                            </button>
                            <button class="btn btn-sm btn-outline-primary save-product-btn" 
                                    data-product-id="${product.itemId}"
                                    ${product.existsInDatabase ? 'disabled title="Produto já cadastrado"' : ''}>
                                <i class="bi bi-bookmark${product.existsInDatabase ? '-check-fill' : ''}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateProductBadges(product) {
        const badges = [];
        const commissionRate = parseFloat(product.commissionRate);

        if (commissionRate >= 0.2) {
            badges.push('<span class="badge bg-success">Alta Comissão</span>');
        }
        if (product.sales > 100) {
            badges.push('<span class="badge bg-primary">Mais Vendido</span>');
        }
        if (parseFloat(product.priceDiscountRate) > 0) {
            badges.push(`<span class="badge bg-danger">-${product.priceDiscountRate}%</span>`);
        }

        return badges;
    }

    attachProductEventListeners() {
        // Link generation buttons
        document.querySelectorAll('.generate-link-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.currentTarget.dataset.productId;
                const product = this.findProduct(productId);
                if (product) {
                    await this.showLinkGenerationModal(product);
                }
            });
        });

        // Save product buttons
        document.querySelectorAll('.save-product-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.currentTarget.dataset.productId;
                const product = this.findProduct(productId);
                if (product) {
                    await this.saveProductForAnalysis(product);
                }
            });
        });
    }

    findProduct(productId) {
        return this.currentProducts.find(p => p.itemId == productId);
    }

    async showLinkGenerationModal(product) {
        const categoryInfo = this.categoryManager.getCategoryInfo(product);
        const modalData = {
            product: {
                ...product,
                categoryName: categoryInfo.name,
                categoryId: categoryInfo.id
            }
        };

        this.uiManager.showModal('link-modal', modalData);
    }

    async saveProductForAnalysis(product) {
        try {
            await api.post('/cache/products', {
                product: product
            });
            this.uiManager.showToast('Produto salvo para análise!', 'success');
        } catch (error) {
            this.uiManager.showToast('Erro ao salvar produto: ' + error.message, 'danger');
        }
    }

    formatCurrency(value) {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(parseFloat(value));
    }

    formatPercent(value) {
        if (!value) return 'N/A';
        return (parseFloat(value) * 100).toFixed(2) + '%';
    }

    async updateCategories() {
        try {
            // Fetch categories from the JSON file
            const categories = await api.get('/categories');

            // Open the category selection modal
            const selectedCategory = await this.uiManager.showCategorySelectionModal(categories);

            if (!selectedCategory) {
                notify.warning('Nenhuma categoria selecionada.');
                return;
            }

            // Update all products with the selected category
            this.currentProducts = this.currentProducts.map(product => ({
                ...product,
                categoryName: selectedCategory.name,
                categoryId: selectedCategory.id
            }));

            this.renderResults();
            notify.success('Categorias atualizadas com sucesso!');
        } catch (error) {
            notify.error('Erro ao atualizar categorias: ' + error.message);
        }
    }

    async adjustTemplates() {
        try {
            // Open a modal to edit SubIDs for all products
            const updatedSubIDs = await this.uiManager.showSubIDEditorModal(this.currentProducts);

            if (!updatedSubIDs) {
                notify.warning('Nenhuma alteração nos SubIDs.');
                return;
            }

            // Apply updated SubIDs to all products
            this.currentProducts = this.currentProducts.map((product, index) => ({
                ...product,
                subIds: updatedSubIDs[index]
            }));

            notify.success('Templates ajustados com sucesso!');
        } catch (error) {
            notify.error('Erro ao ajustar templates: ' + error.message);
        }
    }

    async generateLinks() {
        try {
            // Generate affiliate links for all products
            const results = await this.linkGenerator.generateBulkLinks(this.currentProducts);
            this.currentProducts = this.currentProducts.map((product, index) => {
                const linkResult = results.find(r => r.productId === product.itemId);
                // Preservar a categoria atual do produto
                return {
                    ...product,
                    affiliateLink: linkResult?.link || '',
                    subIds: linkResult?.subIds || []
                };
            });

            // Atualizar a exibição para manter as categorias
            this.renderResults();
            notify.success('Links gerados com sucesso!');
        } catch (error) {
            notify.error('Erro ao gerar links: ' + error.message);
        }
    }

    async saveToDatabase() {
        try {
            // Primeiro, verificar se os links foram gerados
            const productsWithoutLinks = this.currentProducts.filter(p => !p.affiliateLink);

            if (productsWithoutLinks.length > 0) {
                // Se há produtos sem links, perguntar se deseja gerar antes de salvar
                if (confirm(`${productsWithoutLinks.length} produtos não possuem links de afiliados. Deseja gerar os links antes de salvar?`)) {
                    // Gerar links APENAS para os produtos sem links
                    try {
                        const results = await this.linkGenerator.generateBulkLinks(productsWithoutLinks);

                        // Atualizar apenas os produtos que não tinham link anteriormente
                        this.currentProducts = this.currentProducts.map(product => {
                            // Verificar se este é um dos produtos que não tinha link
                            if (!product.affiliateLink) {
                                const linkResult = results.find(r => r.productId === product.itemId);
                                if (linkResult?.success) {
                                    return {
                                        ...product,
                                        affiliateLink: linkResult.link || '',
                                        subIds: linkResult.subIds || []
                                    };
                                }
                            }
                            // Se já tinha link ou não foi possível gerar, manter o produto como está
                            return product;
                        });

                        notify.success(`Links gerados para ${results.filter(r => r.success).length} produtos.`);
                    } catch (error) {
                        notify.error('Erro ao gerar links: ' + error.message);
                    }
                }
            }

            // Filtrar produtos que já existem no banco de dados
            const productsToSave = this.currentProducts
                .filter(product => !product.existsInDatabase)
                .map(product => {
                    const categoryInfo = this.categoryManager.getCategoryInfo(product);

                    return {
                        ...product,
                        categoryName: categoryInfo.name,
                        categoryId: categoryInfo.id,
                        exportDate: new Date().toISOString()
                    };
                });

            // Se não houver produtos novos para salvar, informar e sair
            if (productsToSave.length === 0) {
                notify.info('Todos os produtos já estão cadastrados no banco de dados.');
                return { successCount: 0, errorCount: 0, total: 0, skippedCount: this.currentProducts.length };
            }

            let successCount = 0;
            let errorCount = 0;

            // Salvar cada produto no banco
            for (let product of productsToSave) {
                try {
                    const result = await api.post('/db/products', { product });
                    if (result.success) {
                        successCount++;
                        // Marcar o produto como salvo no banco de dados
                        product.existsInDatabase = true;
                    } else {
                        errorCount++;
                        console.error(`Erro ao salvar produto ${product.itemId}: ${result.message || 'Erro desconhecido'}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Erro ao salvar produto ${product.itemId}: ${error.message}`);
                }
            }

            // Calcular quantos produtos foram pulados por já existirem
            const skippedCount = this.currentProducts.length - productsToSave.length;

            // Exibir resultados
            if (successCount > 0 && errorCount === 0) {
                notify.success(`${successCount} produtos salvos com sucesso no banco de dados!${skippedCount > 0 ? ` (${skippedCount} já cadastrados)` : ''}`);
            } else if (successCount > 0 && errorCount > 0) {
                notify.warning(`${successCount} produtos salvos, mas ${errorCount} falhas.${skippedCount > 0 ? ` (${skippedCount} já cadastrados)` : ''} Verifique o console para detalhes.`);
            } else if (successCount === 0 && errorCount > 0) {
                notify.error(`Falha ao salvar produtos. Nenhum produto foi salvo.${skippedCount > 0 ? ` (${skippedCount} já cadastrados)` : ''}`);
            }

            // Atualizar a renderização para mostrar os produtos agora marcados como cadastrados
            this.renderResults();

            // Retornar os resultados
            return { successCount, errorCount, total: productsToSave.length, skippedCount };
        } catch (error) {
            notify.error('Erro ao salvar produtos no banco de dados: ' + error.message);
            throw error;
        }
    }

    // Método para verificar se todos os produtos têm links de afiliados
    hasAllAffiliateLinks() {
        if (!this.currentProducts || this.currentProducts.length === 0) {
            return false;
        }

        return this.currentProducts.every(product => {
            return product.affiliateLink && product.affiliateLink.trim() !== '';
        });
    }

    // Método para obter estatísticas sobre links de afiliados
    getAffiliateLinkStats() {
        if (!this.currentProducts || this.currentProducts.length === 0) {
            return { total: 0, withLinks: 0, withoutLinks: 0 };
        }

        const withLinks = this.currentProducts.filter(p => p.affiliateLink && p.affiliateLink.trim() !== '').length;
        const total = this.currentProducts.length;

        return {
            total,
            withLinks,
            withoutLinks: total - withLinks,
            percentage: Math.round((withLinks / total) * 100)
        };
    }

    initSelectionControls() {
        // Botão Selecionar Todos
        const selectAllBtn = document.getElementById('select-all');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.product-card .product-selector input').forEach(checkbox => {
                    checkbox.checked = true;
                    const productId = checkbox.value;
                    this.selectedItems.add(productId);
                });
                this.updateSelectedCount();
            });
        }
        
        // Botão Limpar Seleção
        const deselectAllBtn = document.getElementById('deselect-all');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.product-card .product-selector input').forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.selectedItems.clear();
                this.updateSelectedCount();
            });
        }
        
        // Botão Remover Selecionados
        const removeSelectedBtn = document.getElementById('remove-selected');
        if (removeSelectedBtn) {
            removeSelectedBtn.addEventListener('click', () => {
                if (this.selectedItems.size === 0) return;
                
                const confirmMessage = this.selectedItems.size === 1 
                    ? 'Tem certeza que deseja remover o item selecionado dos resultados?'
                    : `Tem certeza que deseja remover os ${this.selectedItems.size} itens selecionados dos resultados?`;
                    
                if (confirm(confirmMessage)) {
                    // Remover os itens selecionados do array currentProducts
                    this.currentProducts = this.currentProducts.filter(product => 
                        !this.selectedItems.has(product.itemId.toString()));
                    
                    // Limpar seleção
                    this.selectedItems.clear();
                    
                    // Renderizar novamente os resultados
                    this.renderResults();
                    
                    // Atualizar contador
                    this.updateSelectedCount();
                    
                    // Notificar o usuário
                    this.showToast('Itens removidos com sucesso dos resultados de pesquisa!', 'success');
                }
            });
        }
    }
    
    addSelectionCheckboxes() {
        document.querySelectorAll('.product-card').forEach(card => {
            // Verificar se o checkbox já existe
            if (!card.querySelector('.product-selector')) {
                const productId = card.getAttribute('data-product-id');
                const checkbox = document.createElement('div');
                checkbox.className = 'product-selector form-check position-absolute top-0 start-0 m-2';
                checkbox.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${productId}" id="selector-${productId}">
                    <label class="form-check-label visually-hidden" for="selector-${productId}">
                        Selecionar produto
                    </label>
                `;
                card.style.position = 'relative';
                card.appendChild(checkbox);
                
                // Adicionar evento de mudança ao checkbox
                const input = checkbox.querySelector('input');
                input.addEventListener('change', () => {
                    if (input.checked) {
                        this.selectedItems.add(productId);
                    } else {
                        this.selectedItems.delete(productId);
                    }
                    this.updateSelectedCount();
                });
            }
        });
    }
    
    updateSelectedCount() {
        const countElement = document.getElementById('selected-count');
        if (!countElement) return;
        
        const count = this.selectedItems.size;
        countElement.textContent = `${count} ${count === 1 ? 'item selecionado' : 'itens selecionados'}`;
        
        const removeBtn = document.getElementById('remove-selected');
        if (removeBtn) {
            removeBtn.disabled = count === 0;
        }
    }
    
    toggleBulkActions(show) {
        const bulkActions = document.getElementById('bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = show ? 'block' : 'none';
        }
    }
    
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1050';
        document.body.appendChild(container);
        return container;
    }
}
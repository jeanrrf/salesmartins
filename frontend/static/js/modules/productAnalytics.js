// ###################################################################################################
// Arquivo: productAnalytics.js                                                                    #
// Descrição: Este script implementa a lógica para análise de produtos.                            #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

import { api, formatters, dom, notify } from './utils.js';
import { CategoryManager } from './categoryManager.js';
import { TemplateManager } from './templateManager.js';
import { LinkGenerator } from './linkGenerator.js';
import { UIManager } from './uiManager.js';

export class ProductAnalytics {
    constructor() {
        this.categoryManager = new CategoryManager();
        this.templateManager = new TemplateManager();
        this.linkGenerator = new LinkGenerator(this.templateManager, this.categoryManager);
        this.uiManager = new UIManager();
        
        this.products = [];
        this.selectedProducts = new Set();
        this.massSelectionMode = false;
        
        this.initializeEventListeners();
    }

    async initialize() {
        await this.loadProducts();
        this.updateUIState();
    }

    async loadProducts() {
        try {
            const response = await api.get('/cached/products');
            this.products = response.products || [];
            this.renderProducts();
        } catch (error) {
            notify.error('Erro ao carregar produtos');
            this.products = [];
            this.renderProducts();
        }
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (this.products.length === 0) {
            dom.show('no-products-message');
            dom.hide('products-container');
            return;
        }

        dom.hide('no-products-message');
        dom.show('products-container');

        container.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        const categoryInfo = this.categoryManager.getCategoryInfo(product);
        const isSelected = this.selectedProducts.has(product.itemId);
        const badges = this.generateProductBadges(product);

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card product-card ${isSelected ? 'selected-product' : ''}" data-product-id="${product.itemId}">
                    <div class="category-badge">${categoryInfo.name}</div>
                    <img src="${product.imageUrl}" class="card-img-top product-image" alt="${product.productName}">
                    <div class="card-body">
                        <div class="mb-2">${badges.join(' ')}</div>
                        <h5 class="card-title">${product.productName}</h5>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <p class="card-text mb-0"><strong>${formatters.currency(product.priceMin)}</strong></p>
                            </div>
                            <div class="text-end">
                                <p class="card-text mb-0 text-success">
                                    <strong>Comissão: ${formatters.percent(product.commissionRate)}</strong>
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
                            <button class="btn btn-sm btn-primary flex-grow-1 me-2 select-product-btn" 
                                    data-product-id="${product.itemId}">
                                ${isSelected ? 
                                    '<i class="bi bi-check-circle-fill"></i> Selecionado' : 
                                    '<i class="bi bi-plus-circle"></i> Selecionar'}
                            </button>
                            <button class="btn btn-sm btn-outline-success flex-grow-1 me-2 generate-link-btn" 
                                    data-product-id="${product.itemId}">
                                <i class="bi bi-link-45deg"></i> Gerar Link
                            </button>
                            <button class="btn btn-sm btn-outline-warning adjust-category-btn" 
                                    data-product-id="${product.itemId}">
                                <i class="bi bi-pencil"></i>
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
        document.querySelectorAll('.select-product-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                this.toggleProductSelection(productId);
            });
        });

        document.querySelectorAll('.generate-link-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.currentTarget.dataset.productId;
                const product = this.findProduct(productId);
                if (product) {
                    await this.showLinkGenerationModal(product);
                }
            });
        });

        document.querySelectorAll('.adjust-category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                const product = this.findProduct(productId);
                if (product) {
                    this.showCategoryAdjustModal(product);
                }
            });
        });

        if (this.massSelectionMode) {
            document.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        const productId = card.dataset.productId;
                        this.toggleProductSelection(productId);
                    }
                });
            });
        }

        // Add event listeners for link generation
        document.getElementById('generate-link-btn')?.addEventListener('click', () => {
            this.generateCurrentLink();
        });

        document.getElementById('copy-link')?.addEventListener('click', () => {
            const link = document.getElementById('generated-link')?.value;
            if (link) {
                this.uiManager.copyToClipboard(link);
            }
        });
    }

    findProduct(productId) {
        return this.products.find(p => p.itemId == productId);
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

    async generateCurrentLink() {
        const url = document.getElementById('product-url').value;
        if (!url) {
            this.uiManager.showError('link-modal', 'URL do produto não encontrada');
            return;
        }

        this.uiManager.showLoading('link-modal');
        dom.hide('generated-link-area');
        dom.hide('link-error');

        const link = await this.linkGenerator.generateLink({
            offerLink: url,
            categoryName: document.getElementById('product-category').value,
            categoryId: document.getElementById('product-category-id').value
        });

        this.uiManager.hideLoading('link-modal');

        if (link) {
            document.getElementById('generated-link').value = link;
            dom.show('generated-link-area');
        }
    }

    showCategoryAdjustModal(product) {
        const categoryInfo = this.categoryManager.getCategoryInfo(product);
        const modalData = {
            product: {
                ...product,
                categoryName: categoryInfo.name,
                categoryId: categoryInfo.id
            },
            categories: this.categoryManager.getAllCategories()
        };

        this.uiManager.showModal('category-adjust-modal', modalData);
    }

    toggleProductSelection(productId) {
        if (this.selectedProducts.has(productId)) {
            this.selectedProducts.delete(productId);
        } else {
            this.selectedProducts.add(productId);
        }
        this.updateUIState();
    }

    toggleMassSelection() {
        this.massSelectionMode = !this.massSelectionMode;
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.toggle('mass-selection-mode', this.massSelectionMode);
        });
        this.updateUIState();
    }

    async generateMassLinks() {
        const selectedProducts = this.products.filter(p => this.selectedProducts.has(p.itemId));
        const results = await this.linkGenerator.generateBulkLinks(selectedProducts);
        
        // Show results in a modal or toast notifications
        const successCount = results.filter(r => r.success).length;
        this.uiManager.showToast(
            `${successCount} de ${results.length} links gerados com sucesso!`,
            successCount === results.length ? 'success' : 'warning'
        );
    }

    updateUIState() {
        const hasSelected = this.selectedProducts.size > 0;
        dom.toggle('#mass-generate-link', hasSelected);
        dom.toggle('#mass-category-change', hasSelected);
        dom.toggle('#compare-products', this.selectedProducts.size >= 2);
        
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            card.classList.toggle('selected-product', this.selectedProducts.has(productId));
            
            const selectButton = card.querySelector('.select-product-btn');
            if (selectButton) {
                selectButton.innerHTML = this.selectedProducts.has(productId) 
                    ? '<i class="bi bi-check-circle-fill"></i> Selecionado'
                    : '<i class="bi bi-plus-circle"></i> Selecionar';
            }
        });
    }

    initializeEventListeners() {
        document.getElementById('reload-products')?.addEventListener('click', () => this.loadProducts());
        document.getElementById('mass-select')?.addEventListener('click', () => this.toggleMassSelection());
        document.getElementById('mass-generate-link')?.addEventListener('click', () => this.generateMassLinks());
        document.getElementById('mass-category-change')?.addEventListener('click', () => this.showBulkCategoryAdjustment());
        
        // Modal event listeners
        document.getElementById('save-category-adjustment')?.addEventListener('click', () => {
            const productId = document.getElementById('adjust-product-id').value;
            const newCategoryId = document.getElementById('new-category').value;
            const reason = document.getElementById('adjustment-reason').value;

            if (this.categoryManager.adjustCategory(productId, newCategoryId, reason)) {
                this.uiManager.hideModal('category-adjust-modal');
                this.renderProducts(); // Refresh to show updated categories
                this.uiManager.showToast('Categoria atualizada com sucesso!', 'success');
            }
        });
    }

    showBulkCategoryAdjustment() {
        const adjustments = this.categoryManager.getAdjustments();
        if (adjustments.length === 0) {
            this.uiManager.showToast('Nenhum ajuste de categoria pendente', 'warning');
            return;
        }

        if (confirm('Deseja aplicar todos os ajustes de categoria pendentes?')) {
            this.categoryManager.clearAdjustments();
            this.renderProducts();
            this.uiManager.showToast('Ajustes de categoria aplicados com sucesso!', 'success');
        }
    }
}
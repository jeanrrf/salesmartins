//###################################################################################################
//# Arquivo: categoryRepair.js                                                                     #
//# Descrição: Este módulo gerencia o reparo de categorias de produtos                             #
//# Autor: Jean Rosso                                                                              #
//# Data: 28 de março de 2025                                                                      #
//###################################################################################################

import { api, notify } from './utils.js';
import { CategoryLoader } from './categoryLoader.js';

export class CategoryRepair {
    constructor() {
        this.products = [];
        this.uncategorizedProducts = [];
        this.categoryLoader = new CategoryLoader();
        this.isRepairing = false;
    }

    async initialize() {
        try {
            // Inicializar o carregador de categorias
            await this.categoryLoader.initialize();
            
            // Carregar produtos que precisam de reparo
            await this.loadProductsNeedingRepair();
            
            // Configurar eventos dos botões
            this._setupEventListeners();
            
            // Preencher categorias disponíveis
            this.populateCategorySelects();
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar o módulo de reparo:', error);
            notify.error('Falha ao inicializar o reparo de categorias.');
            return false;
        }
    }

    async loadProductsNeedingRepair() {
        try {
            const response = await fetch('http://localhost:8001/db/products');
            if (!response.ok) {
                throw new Error(`Erro ao carregar produtos: ${response.status}`);
            }
            
            this.products = await response.json();
            
            // Filtrar produtos sem categoria
            this.uncategorizedProducts = this.products.filter(product => 
                !product.category_id || 
                !this.categoryLoader.getCategoryById(product.category_id)
            );
            
            this._renderUncategorizedProducts();
            this._updateStatsDisplay();
            
        } catch (error) {
            console.error('Erro ao carregar produtos para reparo:', error);
            notify.error('Falha ao carregar produtos para reparo de categorias.');
        }
    }

    /**
     * Preenche os selects de categorias
     */
    populateCategorySelects() {
        const options = this.categoryLoader.getCategorySelectOptions();
        
        // Atualizar todos os selects de categorias existentes
        document.querySelectorAll('.category-select').forEach(select => {
            select.innerHTML = options;
        });
    }

    /**
     * Inicia o processo de reparo automático
     */
    async startAutoRepair() {
        if (this.isRepairing) return;
        
        this.isRepairing = true;
        this._showRepairing();
        
        try {
            const productsToRepair = [...this.uncategorizedProducts];
            const totalToRepair = productsToRepair.length;
            
            if (totalToRepair === 0) {
                notify.info('Não há produtos para reparar.');
                return;
            }
            
            notify.info(`Iniciando reparo automático para ${totalToRepair} produtos...`);
            
            const { updatedProducts, failedProducts } = await this.categoryLoader.repairProductCategories(productsToRepair);
            
            // Atualizar a lista de produtos não categorizados
            this.uncategorizedProducts = failedProducts;
            this._renderUncategorizedProducts();
            
            // Exibir resultados
            if (updatedProducts.length > 0) {
                notify.success(`${updatedProducts.length} produtos reparados com sucesso!`);
            }
            
            if (failedProducts.length > 0) {
                notify.warning(`${failedProducts.length} produtos não puderam ser reparados automaticamente e precisam de categorização manual.`);
            }
            
            this._updateStatsDisplay();
            
        } catch (error) {
            console.error('Erro durante o reparo automático:', error);
            notify.error('Ocorreu um erro durante o reparo automático de categorias.');
        } finally {
            this.isRepairing = false;
            this._hideRepairing();
        }
    }

    /**
     * Repara manualmente um produto
     */
    async repairProduct(productId, categoryId) {
        if (!productId || !categoryId) {
            notify.error('ID do produto ou categoria inválido.');
            return false;
        }
        
        try {
            const product = this.uncategorizedProducts.find(p => p.id === productId);
            if (!product) {
                notify.error(`Produto ID ${productId} não encontrado.`);
                return false;
            }
            
            const category = this.categoryLoader.getCategoryById(categoryId);
            if (!category) {
                notify.error(`Categoria ID ${categoryId} não encontrada.`);
                return false;
            }
            
            // Atualizar o produto com a nova categoria
            const updatedProduct = await api.put(`/db/products/${productId}`, {
                ...product,
                category_id: category.id,
                category_name: category.name,
                category_sigla: category.sigla
            });
            
            // Remover o produto da lista de não categorizados
            this.uncategorizedProducts = this.uncategorizedProducts.filter(p => p.id !== productId);
            
            // Atualizar a visualização
            this._renderUncategorizedProducts();
            this._updateStatsDisplay();
            
            notify.success(`Produto "${product.name}" categorizado com sucesso como "${category.name}".`);
            return true;
        } catch (error) {
            console.error(`Erro ao reparar produto ${productId}:`, error);
            notify.error('Falha ao categorizar o produto. Por favor, tente novamente.');
            return false;
        }
    }

    _setupEventListeners() {
        // Botão de reparo automático
        const autoRepairBtn = document.getElementById('auto-repair-btn');
        if (autoRepairBtn) {
            autoRepairBtn.addEventListener('click', () => this.startAutoRepair());
        }
        
        // Delegação de eventos para botões de reparo manual
        document.addEventListener('click', async (e) => {
            // Botões de reparo manual
            if (e.target.closest('.manual-repair-btn')) {
                const btn = e.target.closest('.manual-repair-btn');
                const productId = btn.dataset.productId;
                const select = document.querySelector(`#category-select-${productId}`);
                
                if (select && select.value) {
                    await this.repairProduct(productId, select.value);
                } else {
                    notify.warning('Selecione uma categoria antes de reparar.');
                }
            }
        });
    }

    _renderUncategorizedProducts() {
        const container = document.getElementById('uncategorized-products');
        if (!container) return;
        
        if (this.uncategorizedProducts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle-fill"></i> Todos os produtos estão categorizados corretamente!
                </div>
            `;
            return;
        }
        
        // Criar tabela de produtos sem categoria
        let tableHTML = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Informações</th>
                        <th>Categoria Sugerida</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.uncategorizedProducts.forEach(product => {
            // Encontrar categoria sugerida
            const suggestedCategory = this.categoryLoader.findCategoryByKeywords(product.name + ' ' + (product.description || ''));
            
            tableHTML += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${product.image_url || 'static/images/no-image.png'}" 
                                alt="${product.name}" 
                                class="img-thumbnail mr-2" 
                                style="width: 60px; height: 60px; object-fit: contain;">
                            <div class="ms-2">
                                <strong>${product.name}</strong>
                            </div>
                        </div>
                    </td>
                    <td>
                        <small class="text-muted">ID: ${product.id}</small><br>
                        <small>${this._formatPrice(product.price)} | ${product.sales || 0} vendas</small>
                    </td>
                    <td>
                        <select class="form-select form-select-sm category-select" id="category-select-${product.id}">
                            <option value="">Selecione uma categoria</option>
                            ${this.categoryLoader.getCategorySelectOptions()}
                        </select>
                        ${suggestedCategory ? 
                            `<div class="mt-1">
                                <button class="btn btn-sm btn-outline-success use-suggestion-btn" 
                                    data-category-id="${suggestedCategory.id}" 
                                    data-select-id="category-select-${product.id}">
                                    <i class="bi bi-magic"></i> Usar Sugestão: ${suggestedCategory.name}
                                </button>
                            </div>` : ''
                        }
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary manual-repair-btn" data-product-id="${product.id}">
                            <i class="bi bi-check-lg"></i> Aplicar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
        
        // Adicionar eventos para botões de sugestão
        document.querySelectorAll('.use-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.dataset.categoryId;
                const selectId = btn.dataset.selectId;
                const select = document.getElementById(selectId);
                
                if (select) {
                    select.value = categoryId;
                }
            });
        });
    }

    _updateStatsDisplay() {
        const statsElement = document.getElementById('category-repair-stats');
        if (!statsElement) return;
        
        const totalProducts = this.products.length;
        const uncategorizedCount = this.uncategorizedProducts.length;
        const categorizedCount = totalProducts - uncategorizedCount;
        const categorizedPercent = totalProducts > 0 ? Math.round((categorizedCount / totalProducts) * 100) : 100;
        
        statsElement.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Status da Categorização</h5>
                    <p class="mb-1">Total de Produtos: ${totalProducts}</p>
                    <p class="mb-1">Produtos Categorizados: ${categorizedCount} (${categorizedPercent}%)</p>
                    <p class="mb-3">Produtos Aguardando Categorização: ${uncategorizedCount}</p>
                    
                    <div class="progress" style="height: 15px;">
                        <div class="progress-bar ${categorizedPercent < 90 ? 'bg-warning' : 'bg-success'}" 
                            role="progressbar" 
                            style="width: ${categorizedPercent}%" 
                            aria-valuenow="${categorizedPercent}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                            ${categorizedPercent}%
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    _showRepairing() {
        const repairIndicator = document.getElementById('repair-indicator');
        if (repairIndicator) {
            repairIndicator.style.display = 'block';
        }
        
        // Desabilitar botão de reparo
        const autoRepairBtn = document.getElementById('auto-repair-btn');
        if (autoRepairBtn) {
            autoRepairBtn.disabled = true;
            autoRepairBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Reparando...';
        }
    }
    
    _hideRepairing() {
        const repairIndicator = document.getElementById('repair-indicator');
        if (repairIndicator) {
            repairIndicator.style.display = 'none';
        }
        
        // Habilitar botão de reparo
        const autoRepairBtn = document.getElementById('auto-repair-btn');
        if (autoRepairBtn) {
            autoRepairBtn.disabled = false;
            autoRepairBtn.innerHTML = '<i class="bi bi-magic"></i> Reparo Automático';
        }
    }

    _formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price || 0);
    }
}

import { storage, notify, api } from './utils.js';

export const CATEGORIAS_SHOPEE = {
    "100001": { nome: "Eletrônicos", sigla: "ELE" },
    "100006": { nome: "Celulares e Acessórios", sigla: "CEL" },
    "100018": { nome: "Moda Feminina", sigla: "MFE" },
    "100019": { nome: "Moda Masculina", sigla: "MMA" },
    "100039": { nome: "Casa e Decoração", sigla: "CAS" },
    "100040": { nome: "Bebês e Crianças", sigla: "BCR" },
    "100041": { nome: "Beleza e Cuidado Pessoal", sigla: "BEL" },
    "100042": { nome: "Esporte e Lazer", sigla: "ESP" },
    "100048": { nome: "Jogos e Hobbies", sigla: "JOG" },
    "100049": { nome: "Automotivo", sigla: "AUT" },
    "100050": { nome: "Ferramentas e Construção", sigla: "FER" }
};

export class CategoryManager {
    constructor() {
        this.counters = this.loadCounters();
        this.adjustments = new Map();
        this.categories = [];
        this.categoryMap = {};
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Carregar categorias do arquivo CATEGORIA.json através da API
            this.categories = await api.get('/categories');
            
            // Criar um mapa para acesso rápido por ID
            this.categoryMap = this.categories.reduce((map, category) => {
                map[category.id] = category;
                return map;
            }, {});
            
            this.initialized = true;
            console.log('Categorias carregadas:', this.categories.length);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            this.categories = [];
            this.categoryMap = {};
        }
    }

    loadCounters() {
        const savedCounters = storage.get('shopee_counters');
        if (savedCounters) {
            return savedCounters;
        }

        const defaultCounters = {
            general: 1,
            categories: {}
        };

        Object.values(CATEGORIAS_SHOPEE).forEach(({ sigla }) => {
            defaultCounters.categories[sigla] = 1;
        });

        storage.set('shopee_counters', defaultCounters);
        return defaultCounters;
    }

    saveCounters() {
        storage.set('shopee_counters', this.counters);
    }

    getNextCounter(type, categorySigla = null) {
        if (type === 'general') {
            const value = this.counters.general++;
            this.saveCounters();
            return value;
        } else if (type === 'category' && categorySigla) {
            if (!this.counters.categories[categorySigla]) {
                this.counters.categories[categorySigla] = 1;
            }
            const value = this.counters.categories[categorySigla]++;
            this.saveCounters();
            return value;
        }
        return null;
    }

    resetCounter(type, categorySigla = null) {
        if (type === 'general') {
            this.counters.general = 1;
        } else if (type === 'category' && categorySigla) {
            this.counters.categories[categorySigla] = 1;
        }
        this.saveCounters();
    }

    resetAllCounters() {
        this.counters.general = 1;
        Object.keys(this.counters.categories).forEach(sigla => {
            this.counters.categories[sigla] = 1;
        });
        this.saveCounters();
    }

    getCategoryInfo(product) {
        if (!this.initialized) {
            console.warn('CategoryManager não inicializado. Inicializando agora...');
            this.initialize();
        }

        // Se o produto já tem uma categoria definida, usar ela
        if (product.categoryId && product.categoryName) {
            return {
                id: product.categoryId,
                name: product.categoryName,
                sigla: CATEGORIAS_SHOPEE[product.categoryId]?.sigla || "GEN"
            };
        }

        let categoryId = null;

        if (product.productCatIds && Array.isArray(product.productCatIds) && product.productCatIds.length > 0) {
            categoryId = product.productCatIds[0].toString();
        } else if (product.catid) {
            categoryId = product.catid.toString();
        } else if (product.productCatId) {
            categoryId = product.productCatId.toString();
        }

        // Check for category adjustment
        const adjustment = this.adjustments.get(product.itemId);
        if (adjustment) {
            categoryId = adjustment.newCategoryId.toString();
        }

        if (categoryId && CATEGORIAS_SHOPEE[categoryId]) {
            return {
                id: categoryId,
                name: CATEGORIAS_SHOPEE[categoryId].nome,
                sigla: CATEGORIAS_SHOPEE[categoryId].sigla
            };
        }

        if (categoryId) {
            return { id: categoryId, name: `Categoria ${categoryId}`, sigla: "OUT" };
        }

        return { id: "0", name: "Não categorizado", sigla: "GEN" };
    }

    adjustCategory(productId, newCategoryId, reason) {
        if (!CATEGORIAS_SHOPEE[newCategoryId]) {
            notify.error('Categoria inválida');
            return false;
        }

        this.adjustments.set(productId, {
            newCategoryId: parseInt(newCategoryId),
            reason,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    getAdjustments() {
        return Array.from(this.adjustments.entries());
    }

    clearAdjustments() {
        this.adjustments.clear();
    }

    getAllCategories() {
        return Object.entries(CATEGORIAS_SHOPEE).map(([id, info]) => ({
            id,
            ...info
        }));
    }

    /**
     * Renderiza todas as categorias na página da vitrine, incluindo categorias vazias
     * @param {string} containerId - ID do elemento HTML que conterá as categorias
     * @param {Array} products - Lista de produtos disponíveis
     * @returns {void}
     */
    renderCategoriesInStorefront(containerId, products = []) {
        if (!this.initialized) {
            console.warn('CategoryManager não inicializado. Inicializando agora...');
            this.initialize().then(() => this.renderCategoriesInStorefront(containerId, products));
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Elemento com ID ${containerId} não encontrado`);
            return;
        }

        // Contar produtos por categoria
        const productsByCategory = {};
        products.forEach(product => {
            const categoryId = product.categoryId || "100001";
            if (!productsByCategory[categoryId]) {
                productsByCategory[categoryId] = [];
            }
            productsByCategory[categoryId].push(product);
        });

        // Criar HTML para cada categoria
        let html = '<div class="categories-container">';
        
        this.categories.forEach(category => {
            const categoryProducts = productsByCategory[category.id] || [];
            const hasProducts = categoryProducts.length > 0;
            
            html += `
                <div class="category-section mb-5" id="category-${category.id}">
                    <h2 class="category-title">${category.name}</h2>
                    <div class="row">
            `;
            
            if (hasProducts) {
                // Exibir até 4 produtos nesta categoria
                const displayProducts = categoryProducts.slice(0, 4);
                displayProducts.forEach(product => {
                    html += this.createProductCard(product);
                });
                
                // Adicionar link "ver mais" se houver mais produtos
                if (categoryProducts.length > 4) {
                    html += `
                        <div class="col-md-3 mb-4">
                            <div class="card see-more-card h-100">
                                <div class="card-body d-flex flex-column justify-content-center align-items-center">
                                    <h5 class="text-center mb-3">Ver mais ${categoryProducts.length - 4} produtos</h5>
                                    <a href="/category.html?id=${category.id}" class="btn btn-primary">
                                        <i class="bi bi-arrow-right-circle"></i> Ver todos
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                // Categoria vazia - mostrar card informativo
                html += `
                    <div class="col-md-6 offset-md-3 mb-4">
                        <div class="card empty-category-card h-100 text-center">
                            <div class="card-body d-flex flex-column justify-content-center">
                                <i class="bi bi-inbox fs-1 mb-3 text-muted"></i>
                                <h5 class="mb-3">Nenhum produto disponível nesta categoria</h5>
                                <p class="text-muted mb-4">Em breve novos produtos estarão disponíveis aqui.</p>
                                <button class="btn btn-outline-primary request-product-btn" data-category-id="${category.id}">
                                    <i class="bi bi-send"></i> Solicitar produtos nesta categoria
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Adicionar listeners para botões de solicitação
        document.querySelectorAll('.request-product-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryId = e.target.dataset.categoryId;
                const categoryName = this.categoryMap[categoryId]?.name || "esta categoria";
                alert(`Sua solicitação para produtos em ${categoryName} foi registrada. Entraremos em contato em breve.`);
            });
        });
    }

    createProductCard(product) {
        return `
            <div class="col-md-3 mb-4">
                <div class="card product-card h-100">
                    <img src="${product.imageUrl}" class="card-img-top product-image" alt="${product.productName}">
                    <div class="card-body">
                        <h5 class="card-title product-title">${product.productName.substring(0, 60)}${product.productName.length > 60 ? '...' : ''}</h5>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <p class="card-text mb-0"><strong>${this.formatCurrency(product.priceMin)}</strong></p>
                            <span class="badge bg-success">${this.formatPercent(product.commissionRate)}</span>
                        </div>
                        <a href="/product.html?id=${product.itemId}" class="btn btn-primary w-100">Ver detalhes</a>
                    </div>
                </div>
            </div>
        `;
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

    // Método para atualizar as categorias dos produtos no banco de dados
    async updateCategoriesInDatabase(products) {
        try {
            const updatedProducts = products.map(product => {
                const categoryInfo = this.getCategoryInfo(product);
                return {
                    ...product,
                    categoryId: categoryInfo.id,
                    categoryName: categoryInfo.name
                };
            });
            
            const result = await api.post('/update-categories', {products: updatedProducts});
            console.log('Categorias atualizadas no banco de dados:', result);
            return result;
        } catch (error) {
            console.error('Erro ao atualizar categorias:', error);
            throw error;
        }
    }
}
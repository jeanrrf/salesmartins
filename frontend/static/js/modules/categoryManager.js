import { storage, notify, api } from './utils.js';

export class CategoryManager {
    constructor() {
        this.counters = this.loadCounters();
        this.adjustments = new Map();
        this.categories = []; // Categorias de nível 1
        this.categoriesLevel2 = []; // Categorias de nível 2
        this.categoriesLevel3 = []; // Categorias de nível 3
        this.categoryMap = {}; // Mapa de categorias nível 1
        this.categoryMapLevel2 = {}; // Mapa de categorias nível 2
        this.categoryMapLevel3 = {}; // Mapa de categorias nível 3
        this.processedItems = new Set(); // Conjunto para rastrear itens já processados
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Carregar categorias de nível 1
            const responseNivel1 = await api.get('/categories');
            
            // Verificar se a resposta contém categorias e se é um array
            if (responseNivel1 && Array.isArray(responseNivel1)) {
                this.categories = responseNivel1;
            } else if (responseNivel1 && responseNivel1.categories && Array.isArray(responseNivel1.categories)) {
                this.categories = responseNivel1.categories;
            } else {
                console.warn('Resposta da API não contém categorias nível 1 no formato esperado:', responseNivel1);
                this.categories = [];
            }
            
            // Carregar categorias de nível 2 (opcional)
            try {
                const responseNivel2 = await api.get('/categories/nivel2');
                if (responseNivel2 && Array.isArray(responseNivel2)) {
                    this.categoriesLevel2 = responseNivel2;
                }
            } catch (error) {
                console.info('Categorias nível 2 não disponíveis ou erro ao carregar:', error);
                this.categoriesLevel2 = [];
            }
            
            // Carregar categorias de nível 3 (opcional)
            try {
                const responseNivel3 = await api.get('/categories/nivel3');
                if (responseNivel3 && Array.isArray(responseNivel3)) {
                    this.categoriesLevel3 = responseNivel3;
                }
            } catch (error) {
                console.info('Categorias nível 3 não disponíveis ou erro ao carregar:', error);
                this.categoriesLevel3 = [];
            }
            
            // Criar mapas para acesso rápido
            if (this.categories.length > 0) {
                this.categoryMap = this.categories.reduce((map, category) => {
                    map[category.id] = category;
                    return map;
                }, {});
            }
            
            if (this.categoriesLevel2.length > 0) {
                this.categoryMapLevel2 = this.categoriesLevel2.reduce((map, category) => {
                    map[category.id] = category;
                    return map;
                }, {});
            }
            
            if (this.categoriesLevel3.length > 0) {
                this.categoryMapLevel3 = this.categoriesLevel3.reduce((map, category) => {
                    map[category.id] = category;
                    return map;
                }, {});
            }
            
            // Carregar itens já processados do armazenamento local
            this.loadProcessedItems();
            
            this.initialized = true;
            console.log('Categorias carregadas:', {
                nivel1: this.categories.length,
                nivel2: this.categoriesLevel2.length,
                nivel3: this.categoriesLevel3.length
            });
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            notify.error('Erro ao carregar categorias. Por favor, recarregue a página.');
            this.initialized = true;
            this.categories = [];
            this.categoriesLevel2 = [];
            this.categoriesLevel3 = [];
            this.categoryMap = {};
            this.categoryMapLevel2 = {};
            this.categoryMapLevel3 = {};
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

        // Se já temos categorias inicializadas
        if (this.categories && this.categories.length > 0) {
            this.categories.forEach(({ id }) => {
                defaultCounters.categories[id] = 1;
            });
        }

        storage.set('shopee_counters', defaultCounters);
        return defaultCounters;
    }

    saveCounters() {
        storage.set('shopee_counters', this.counters);
    }
    
    loadProcessedItems() {
        const processedItems = storage.get('processed_items');
        if (processedItems && Array.isArray(processedItems)) {
            this.processedItems = new Set(processedItems);
        }
    }
    
    saveProcessedItems() {
        storage.set('processed_items', Array.from(this.processedItems));
    }
    
    isItemProcessed(itemId) {
        return this.processedItems.has(itemId.toString());
    }
    
    markItemAsProcessed(itemId) {
        this.processedItems.add(itemId.toString());
        this.saveProcessedItems();
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
            console.warn('CategoryManager não inicializado');
            this.initialize();
            return { id: "0", name: "Carregando...", sigla: "...", level: 1 };
        }

        // Priorizar categoria de nível 3 se disponível
        if (product.categoryIdLevel3 && this.categoryMapLevel3[product.categoryIdLevel3]) {
            return {
                ...this.categoryMapLevel3[product.categoryIdLevel3],
                parentId: product.categoryIdLevel2 || null,
                parentIdL1: product.categoryId || null
            };
        }
        
        // Em seguida, verificar nível 2
        if (product.categoryIdLevel2 && this.categoryMapLevel2[product.categoryIdLevel2]) {
            return {
                ...this.categoryMapLevel2[product.categoryIdLevel2],
                parentId: product.categoryId || null
            };
        }
        
        // Se o produto já tem uma categoria de nível 1 definida
        if (product.categoryId && this.categoryMap[product.categoryId]) {
            return this.categoryMap[product.categoryId];
        }

        return { id: "0", name: "Não categorizado", sigla: "GEN", level: 1 };
    }

    adjustCategory(productId, newCategoryId, reason, level = 1) {
        // Verificar qual mapa de categoria usar baseado no nível
        let categoryMap;
        if (level === 3) {
            categoryMap = this.categoryMapLevel3;
        } else if (level === 2) {
            categoryMap = this.categoryMapLevel2;
        } else {
            categoryMap = this.categoryMap;
        }
        
        if (!categoryMap[newCategoryId]) {
            notify.error(`Categoria de nível ${level} inválida`);
            return false;
        }

        this.adjustments.set(productId, {
            newCategoryId: newCategoryId,
            level,
            reason,
            timestamp: new Date().toISOString()
        });

        // Marcar item como processado
        this.markItemAsProcessed(productId);
        
        return true;
    }

    getAdjustments() {
        return Array.from(this.adjustments.entries());
    }

    clearAdjustments() {
        this.adjustments.clear();
    }

    getAllCategories(level = 1) {
        if (level === 3) {
            return this.categoriesLevel3.map(category => ({
                ...category,
            }));
        } else if (level === 2) {
            return this.categoriesLevel2.map(category => ({
                ...category,
            }));
        }
        
        return this.categories.map(category => ({
            ...category,
        }));
    }

    getCategoriesByParent(parentId) {
        if (!parentId) return [];
        
        // Para nível 2, retornar categorias que têm o parent_id correspondente
        if (parentId.toString().length === 6) { // Ids de nível 1 têm 6 caracteres (100001)
            return this.categoriesLevel2.filter(cat => cat.parent_id === parentId);
        }
        
        // Para nível 3, retornar categorias que têm o parent_id correspondente
        if (parentId.toString().includes('-')) { // IDs de nível 2 contêm hífen (100001-01)
            return this.categoriesLevel3.filter(cat => cat.parent_id === parentId);
        }
        
        return [];
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

        // Contar produtos por categoria (nível 1)
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

    /**
     * Formata valores monetários para exibição
     * @param {number} value - Valor a ser formatado
     * @returns {string} - Valor formatado como moeda brasileira
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(value || 0);
    }

    /**
     * Formata valores percentuais para exibição
     * @param {number} value - Valor decimal a ser formatado (ex: 0.25)
     * @returns {string} - Valor formatado como porcentagem (ex: 25.00%)
     */
    formatPercent(value) {
        if (!value && value !== 0) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    // Método para atualizar as categorias dos produtos no banco de dados
    async updateCategoriesInDatabase(products) {
        try {
            const updatedProducts = products.map(product => {
                const categoryInfo = this.getCategoryInfo(product);
                return {
                    itemId: product.itemId, // shopee_id no banco
                    name: product.name || product.productName,
                    price: product.price || product.priceMin,
                    originalPrice: product.original_price || product.priceMax,
                    categoryId: categoryInfo.level === 1 ? categoryInfo.id : categoryInfo.parentIdL1 || categoryInfo.parentId,
                    categoryIdLevel2: categoryInfo.level >= 2 ? (categoryInfo.level === 2 ? categoryInfo.id : categoryInfo.parentId) : null,
                    categoryIdLevel3: categoryInfo.level === 3 ? categoryInfo.id : null,
                    categoryName: categoryInfo.name,
                    shopId: product.shopId,
                    stock: product.stock,
                    commissionRate: product.commissionRate,
                    sales: product.sales,
                    imageUrl: product.imageUrl,
                    shopName: product.shopName,
                    offerLink: product.offerLink,
                    shortLink: product.shortLink,
                    ratingStar: product.ratingStar,
                    priceDiscountRate: product.priceDiscountRate,
                    subIds: JSON.stringify(product.subIds),
                    productLink: product.productLink || '',
                    shopType: product.shopType || '',
                    affiliateLink: product.affiliateLink,
                    productMetadata: JSON.stringify(product.metadata || {}),
                    discount: product.discount || '',
                    processed: true // Marcar como processado
                };
            });
            
            const result = await api.post('/update-categories', {products: updatedProducts});
            console.log('Categorias atualizadas no banco de dados:', result);
            
            // Marcar produtos como processados
            updatedProducts.forEach(product => {
                this.markItemAsProcessed(product.itemId);
            });
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar categorias:', error);
            throw error;
        }
    }
    
    // Verifica e atribui categoria automática baseada nas palavras-chave
    autoCategorize(product) {
        if (!product || !product.productName) return null;
        
        const productName = product.productName.toLowerCase();
        
        // Tentar encontrar uma categoria de nível 3 primeiro
        for (const category of this.categoriesLevel3) {
            if (category.keywords && Array.isArray(category.keywords)) {
                for (const keyword of category.keywords) {
                    if (productName.includes(keyword.toLowerCase())) {
                        // Encontrar a categoria pai de nível 2
                        const parentL2 = this.categoriesLevel2.find(cat => cat.id === category.parent_id);
                        // E a categoria pai de nível 1 (avô)
                        const parentL1 = parentL2 ? this.categories.find(cat => cat.id === parentL2.parent_id) : null;
                        
                        return {
                            categoryId: parentL1 ? parentL1.id : null,
                            categoryIdLevel2: parentL2 ? parentL2.id : null,
                            categoryIdLevel3: category.id,
                            matchedKeyword: keyword,
                            confidence: "high",
                            level: 3
                        };
                    }
                }
            }
        }
        
        // Se não encontrou nível 3, tentar nível 2
        for (const category of this.categoriesLevel2) {
            if (category.keywords && Array.isArray(category.keywords)) {
                for (const keyword of category.keywords) {
                    if (productName.includes(keyword.toLowerCase())) {
                        // Encontrar a categoria pai de nível 1
                        const parentL1 = this.categories.find(cat => cat.id === category.parent_id);
                        
                        return {
                            categoryId: parentL1 ? parentL1.id : null,
                            categoryIdLevel2: category.id,
                            categoryIdLevel3: null,
                            matchedKeyword: keyword,
                            confidence: "medium",
                            level: 2
                        };
                    }
                }
            }
        }
        
        // Por fim, tentar nível 1
        for (const category of this.categories) {
            if (category.keywords && Array.isArray(category.keywords)) {
                for (const keyword of category.keywords) {
                    if (productName.includes(keyword.toLowerCase())) {
                        return {
                            categoryId: category.id,
                            categoryIdLevel2: null,
                            categoryIdLevel3: null,
                            matchedKeyword: keyword,
                            confidence: "low",
                            level: 1
                        };
                    }
                }
            }
        }
        
        return null;
    }
}
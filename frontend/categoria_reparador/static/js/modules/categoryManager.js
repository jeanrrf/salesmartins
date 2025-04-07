/**
 * Módulo para gerenciar categorias de produtos
 * Somente utilizado no módulo de reparo de categorias
 * 
 * FONTE DE DADOS: Arquivos JSON do backend:
 * - backend/CATEGORIA.json (categorias L1)
 * - backend/subCategorias/NVL2/nivel2.json (categorias L2)
 * - backend/subCategorias/NVL3/nivel3.json (categorias L3)
 */
export class CategoryManager {
    constructor() {
        this.categories = [];
        this.categoryMap = {};
        this.hierarchyMap = {
            L1: [],
            L2: {},
            L3: {}
        };
        this.initialized = false;
        
        // Fontes de dados JSON diretas (não do banco de dados)
        this.dataSources = {
            L1: 'http://localhost:8001/api/categories',
            L2: 'http://localhost:8001/api/categories/nivel2',
            L3: 'http://localhost:8001/api/categories/nivel3'
        };
    }

    /**
     * Inicializa o gerenciador de categorias carregando todas as categorias disponíveis
     * diretamente dos arquivos JSON
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Carregando categorias diretamente dos arquivos JSON...');
            
            // Carregar categorias de todos os níveis separadamente
            const [categoriesL1, categoriesL2, categoriesL3] = await Promise.all([
                this._fetchCategories(this.dataSources.L1),
                this._fetchCategories(this.dataSources.L2),
                this._fetchCategories(this.dataSources.L3)
            ]);
            
            // Combinar todas as categorias em uma lista única
            this.categories = [...categoriesL1, ...categoriesL2, ...categoriesL3];
            console.log(`Categorias carregadas com sucesso: ${this.categories.length} categorias encontradas`);
            
            // Criar um mapeamento de ID -> categoria para acesso rápido
            this.categoryMap = {};
            this.hierarchyMap = {
                L1: [],
                L2: {},
                L3: {}
            };
            
            // Processar categorias e construir hierarquia
            this.categories.forEach(category => {
                // Mapear por ID para acesso rápido
                this.categoryMap[category.id] = category;
                
                // Construir hierarquia
                if (!category.parent_id) {
                    // É uma categoria L1 (nível principal)
                    this.hierarchyMap.L1.push(category);
                } else {
                    const parent = this.categoryMap[category.parent_id];
                    
                    if (parent && !parent.parent_id) {
                        // É uma categoria L2 (segundo nível)
                        if (!this.hierarchyMap.L2[category.parent_id]) {
                            this.hierarchyMap.L2[category.parent_id] = [];
                        }
                        this.hierarchyMap.L2[category.parent_id].push(category);
                    } else if (parent) {
                        // É uma categoria L3 (terceiro nível)
                        if (!this.hierarchyMap.L3[category.parent_id]) {
                            this.hierarchyMap.L3[category.parent_id] = [];
                        }
                        this.hierarchyMap.L3[category.parent_id].push(category);
                    }
                }
            });
            
            this.initialized = true;
            console.log('CategoryManager inicializado com sucesso:', {
                totalCategories: this.categories.length,
                L1Count: this.hierarchyMap.L1.length,
                L2Count: Object.keys(this.hierarchyMap.L2).length,
                L3Count: Object.keys(this.hierarchyMap.L3).length
            });
            return this.categories;
        } catch (error) {
            console.error('Erro ao inicializar o CategoryManager:', error);
            throw error;
        }
    }
    
    /**
     * Busca categorias de uma fonte específica
     * @private
     */
    async _fetchCategories(source) {
        try {
            const response = await fetch(source);
            if (!response.ok) {
                throw new Error(`Erro ao carregar categorias: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Erro ao carregar categorias de ${source}:`, error);
            return [];
        }
    }

    /**
     * Obtém uma categoria pelo ID
     * @param {string} id ID da categoria
     * @returns {object|null} Objeto da categoria ou null se não encontrado
     */
    getCategoryById(id) {
        return this.categoryMap[id] || null;
    }
    
    /**
     * Busca uma categoria baseada em palavras-chave de texto
     * @param {string} text Texto a ser usado para buscar categorias por palavras-chave
     * @returns {object|null} Categoria mais relevante encontrada ou null
     */
    findCategoryByKeywords(text) {
        if (!text) return null;
        
        text = text.toLowerCase();
        
        // Sistema de pontuação para determinar a melhor categoria
        const categoryScores = {};
        
        // Analisar cada categoria
        this.categories.forEach(category => {
            let score = 0;
            
            // Verificar se o nome da categoria está no texto
            if (category.name && text.includes(category.name.toLowerCase())) {
                score += 10;
            }
            
            // Verificar palavras-chave (se existirem)
            if (category.keywords && Array.isArray(category.keywords)) {
                category.keywords.forEach(keyword => {
                    if (text.includes(keyword.toLowerCase())) {
                        score += 5;
                    }
                });
            }
            
            // Armazenar pontuação se for maior que zero
            if (score > 0) {
                categoryScores[category.id] = score;
            }
        });
        
        // Encontrar categoria com maior pontuação
        let bestCategoryId = null;
        let highestScore = 0;
        
        Object.entries(categoryScores).forEach(([categoryId, score]) => {
            if (score > highestScore) {
                highestScore = score;
                bestCategoryId = categoryId;
            }
        });
        
        return bestCategoryId ? this.getCategoryById(bestCategoryId) : null;
    }

    /**
     * Obtém o nome de uma categoria pelo ID
     * @param {string} id ID da categoria
     * @returns {string} Nome da categoria ou string vazia se não encontrado
     */
    getCategoryName(id) {
        const category = this.getCategoryById(id);
        return category ? category.name : '';
    }

    /**
     * Obtém o caminho completo de uma categoria (L1 > L2 > L3)
     * @param {string} id ID da categoria
     * @returns {string[]} Array com os nomes do caminho da categoria
     */
    getCategoryPath(id) {
        const category = this.getCategoryById(id);
        if (!category) return [];
        
        const path = [category.name];
        
        // Se tem parent, buscar recursivamente
        if (category.parent_id) {
            const parentPath = this.getCategoryPath(category.parent_id);
            return [...parentPath, ...path];
        }
        
        return path;
    }

    /**
     * Gera opções de HTML para selects de categorias
     * @returns {string} HTML das opções de categorias
     */
    getCategorySelectOptions() {
        let options = '<option value="">Selecione uma categoria</option>';
        
        // Adicionar categorias principais
        this.hierarchyMap.L1.forEach(category => {
            options += `<option value="${category.id}">${category.name}</option>`;
            
            // Adicionar subcategorias (nível 2) se existirem
            const subcategories = this.hierarchyMap.L2[category.id];
            if (subcategories) {
                subcategories.forEach(subCat => {
                    options += `<option value="${subCat.id}">-- ${subCat.name}</option>`;
                    
                    // Adicionar subcategorias nível 3 se existirem
                    const level3Categories = this.hierarchyMap.L3[subCat.id];
                    if (level3Categories) {
                        level3Categories.forEach(level3Cat => {
                            options += `<option value="${level3Cat.id}">---- ${level3Cat.name}</option>`;
                        });
                    }
                });
            }
        });
        
        return options;
    }

    /**
     * Recarrega as categorias do JSON
     * Útil quando há alterações nas categorias e o cache precisa ser atualizado
     */
    async refreshCategories() {
        this.initialized = false;
        return this.initialize();
    }

    /**
     * Obtém todas as categorias como uma lista plana
     * @returns {Array} Lista de todas as categorias
     */
    getAllCategories() {
        return this.categories;
    }
}
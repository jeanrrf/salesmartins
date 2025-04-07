/**
 * Módulo para gerenciar categorias de produtos
 * Somente utilizado no módulo de reparo de categorias
 * 
 * FONTE DE DADOS: Backend local em http://localhost:8001/db/categories
 * Esta fonte obtém dados dos arquivos JSON do backend:
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
        this.dataSource = 'http://localhost:8001/db/categories'; // Fonte de dados oficial
    }

    /**
     * Inicializa o gerenciador de categorias carregando todas as categorias disponíveis
     * do backend local que lê os arquivos JSON
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log(`Carregando categorias do backend: ${this.dataSource}`);
            const response = await fetch(this.dataSource);
            if (!response.ok) {
                throw new Error(`Erro ao carregar categorias: ${response.status}`);
            }
            
            this.categories = await response.json();
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
     * Obtém uma categoria pelo ID
     * @param {string} id ID da categoria
     * @returns {object|null} Objeto da categoria ou null se não encontrado
     */
    getCategoryById(id) {
        return this.categoryMap[id] || null;
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
     * Obtém categorias de primeiro nível
     * @returns {Array} Lista de categorias L1
     */
    getL1Categories() {
        return this.hierarchyMap.L1 || [];
    }

    /**
     * Obtém categorias de segundo nível para uma categoria pai
     * @param {string} parentId ID da categoria pai (L1)
     * @returns {Array} Lista de categorias L2 filhas da categoria pai especificada
     */
    getL2Categories(parentId) {
        return this.hierarchyMap.L2[parentId] || [];
    }

    /**
     * Obtém categorias de terceiro nível para uma categoria pai
     * @param {string} parentId ID da categoria pai (L2)
     * @returns {Array} Lista de categorias L3 filhas da categoria pai especificada
     */
    getL3Categories(parentId) {
        return this.hierarchyMap.L3[parentId] || [];
    }

    /**
     * Determina o nível de uma categoria (L1, L2, L3)
     * @param {string} id ID da categoria
     * @returns {number} Nível da categoria (1, 2, 3) ou 0 se não encontrada
     */
    getCategoryLevel(id) {
        const category = this.getCategoryById(id);
        if (!category) return 0;
        
        // Se não tem parent, é L1
        if (!category.parent_id) return 1;
        
        // Verificar se o parent é L1
        const parent = this.getCategoryById(category.parent_id);
        if (!parent) return 0;
        
        if (!parent.parent_id) return 2;
        
        // Caso contrário é L3
        return 3;
    }

    /**
     * Recarrega as categorias do backend
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
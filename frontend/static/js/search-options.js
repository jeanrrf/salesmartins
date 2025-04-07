// ###################################################################################################
// Arquivo: search-options.js                                                                      #
// Descrição: Este script implementa as opções avançadas de busca de produtos.                     #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

/**
 * search-options.js
 * Script responsável por implementar as opções avançadas de busca de produtos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Adicionar as opções de filtro ao formulário de busca
    setupSearchOptions();
    
    // Configurar o endpoint de produtos em alta
    setupTrendingProducts();
});

/**
 * Adiciona as opções de busca avançada ao formulário
 */
function setupSearchOptions() {
    // Verificar se o elemento de formulário de busca existe
    const searchForm = document.getElementById('search-form') || document.querySelector('form[action*="search"]');
    
    if (!searchForm) {
        console.warn('Formulário de busca não encontrado na página');
        return;
    }
    
    // Criar o container para as opções avançadas
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'search-options';
    optionsContainer.innerHTML = `
        <div class="search-options-header">
            <button type="button" class="btn-toggle-options">Opções avançadas</button>
        </div>
        <div class="search-options-content" style="display:none;">
            <div class="form-check">
                <input type="checkbox" class="form-check-input" id="excludeExisting" name="excludeExisting">
                <label class="form-check-label" for="excludeExisting">Excluir produtos já existentes no banco</label>
            </div>
            <div class="form-check">
                <input type="checkbox" class="form-check-input" id="hotProductsOnly" name="hotProductsOnly">
                <label class="form-check-label" for="hotProductsOnly">Mostrar apenas produtos em alta</label>
            </div>
            <div class="form-group mt-2">
                <label for="minPrice">Preço Mínimo:</label>
                <input type="number" class="form-control form-control-sm" id="minPrice" name="minPrice" min="0" step="0.01">
            </div>
            <div class="form-group mt-2">
                <label for="maxPrice">Preço Máximo:</label>
                <input type="number" class="form-control form-control-sm" id="maxPrice" name="maxPrice" min="0" step="0.01">
            </div>
            <div class="form-group mt-2">
                <label for="minCommission">Comissão Mínima (%):</label>
                <input type="number" class="form-control form-control-sm" id="minCommission" name="minCommission" min="0" max="100" step="0.01">
            </div>
        </div>
    `;
    
    // Inserir as opções após o campo de busca
    const searchInput = searchForm.querySelector('input[type="search"], input[type="text"]');
    if (searchInput) {
        searchInput.parentNode.insertBefore(optionsContainer, searchInput.nextSibling);
    } else {
        searchForm.appendChild(optionsContainer);
    }
    
    // Configurar o botão para exibir/ocultar opções avançadas
    const toggleButton = optionsContainer.querySelector('.btn-toggle-options');
    const optionsContent = optionsContainer.querySelector('.search-options-content');
    
    toggleButton.addEventListener('click', function() {
        if (optionsContent.style.display === 'none') {
            optionsContent.style.display = 'block';
            toggleButton.textContent = 'Ocultar opções avançadas';
        } else {
            optionsContent.style.display = 'none';
            toggleButton.textContent = 'Opções avançadas';
        }
    });
    
    // Modificar a função de submissão do formulário para incluir as opções avançadas
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const keyword = searchForm.querySelector('input[name="keyword"]').value;
        const sortType = searchForm.querySelector('select[name="sortType"]') ? 
                        searchForm.querySelector('select[name="sortType"]').value : 3; // Default: mais vendidos
        
        // Obter valores das opções avançadas
        const excludeExisting = document.getElementById('excludeExisting').checked;
        const hotProductsOnly = document.getElementById('hotProductsOnly').checked;
        const minPrice = document.getElementById('minPrice').value || null;
        const maxPrice = document.getElementById('maxPrice').value || null;
        const minCommission = document.getElementById('minCommission').value || null;
        
        // Criar o objeto de dados para a requisição
        const searchData = {
            keyword: keyword,
            sortType: parseInt(sortType),
            limit: 20,
            excludeExisting: excludeExisting,
            hotProductsOnly: hotProductsOnly
        };
        
        // Adicionar filtros de preço e comissão se fornecidos
        if (minPrice) searchData.minPrice = parseFloat(minPrice);
        if (maxPrice) searchData.maxPrice = parseFloat(maxPrice);
        if (minCommission) searchData.minCommission = parseFloat(minCommission) / 100; // Converter percentual para decimal
        
        console.log('Buscando produtos com opções:', searchData);
        
        // Executar a busca com as opções avançadas
        searchProducts(searchData);
    });
}

/**
 * Executa a busca de produtos com as opções avançadas
 */
function searchProducts(searchData) {
    // Mostrar indicador de carregamento
    const resultsContainer = document.getElementById('search-results') || document.getElementById('products-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    }
    
    // Fazer a requisição à API
    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        displaySearchResults(data, resultsContainer, searchData);
    })
    .catch(error => {
        console.error('Erro ao buscar produtos:', error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="alert alert-danger">Erro ao buscar produtos: ${error.message}</div>`;
        }
    });
}

/**
 * Exibe os resultados da busca na interface
 */
function displaySearchResults(data, container, searchOptions) {
    if (!container) return;
    
    // Limpar o container
    container.innerHTML = '';
    
    const products = data.products || [];
    const recommendations = data.recommendations || [];
    
    // Se não houver produtos, mostrar mensagem
    if (products.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhum produto encontrado com os filtros selecionados.</div>';
        return;
    }
    
    // Adicionar contador de resultados e opções aplicadas
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'results-header mb-3';
    
    let appliedFilters = [];
    if (searchOptions.excludeExisting) appliedFilters.push('Excluindo produtos existentes');
    if (searchOptions.hotProductsOnly) appliedFilters.push('Apenas produtos em alta');
    if (searchOptions.minPrice) appliedFilters.push(`Preço mín: R$ ${searchOptions.minPrice}`);
    if (searchOptions.maxPrice) appliedFilters.push(`Preço máx: R$ ${searchOptions.maxPrice}`);
    if (searchOptions.minCommission) appliedFilters.push(`Comissão mín: ${(searchOptions.minCommission * 100).toFixed(2)}%`);
    
    resultsHeader.innerHTML = `
        <h4>Resultados da busca (${products.length} produtos)</h4>
        ${appliedFilters.length > 0 ? `<p class="text-muted">Filtros aplicados: ${appliedFilters.join(', ')}</p>` : ''}
    `;
    container.appendChild(resultsHeader);
    
    // Criar grade de produtos
    const productsGrid = document.createElement('div');
    productsGrid.className = 'row row-cols-1 row-cols-md-3 g-4';
    
    // Adicionar cada produto à grade
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    container.appendChild(productsGrid);
    
    // Adicionar recomendações se disponíveis
    if (recommendations.length > 0) {
        const recsContainer = document.createElement('div');
        recsContainer.className = 'recommendations-container mt-4';
        recsContainer.innerHTML = `
            <h5>Produtos recomendados</h5>
            <div class="row row-cols-1 row-cols-md-4 g-3">
                ${recommendations.map(rec => createProductCard(rec).outerHTML).join('')}
            </div>
        `;
        container.appendChild(recsContainer);
    }
}

/**
 * Cria um card para exibir um produto
 */
function createProductCard(product) {
    const price = parseFloat(product.priceMin).toFixed(2);
    const discount = product.priceDiscountRate ? `<span class="badge bg-danger ms-2">-${product.priceDiscountRate}%</span>` : '';
    const hotBadge = product.hotScore ? `<span class="badge bg-warning text-dark">Em alta ${product.hotScore}%</span>` : '';
    const existsInDb = product.existsInDatabase ? '<span class="badge bg-secondary">Já cadastrado</span>' : '';
    
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
        <div class="card h-100 product-card">
            <img src="${product.imageUrl}" class="card-img-top" alt="${product.productName}" loading="lazy">
            <div class="card-body">
                <h5 class="card-title product-title">${product.productName}</h5>
                <div class="d-flex justify-content-between align-items-center">
                    <p class="card-text product-price">R$ ${price} ${discount}</p>
                    <div>${hotBadge} ${existsInDb}</div>
                </div>
                <p class="card-text"><small class="text-muted">Vendas: ${product.sales || 0} | Comissão: ${(product.commissionRate * 100).toFixed(2)}%</small></p>
            </div>
            <div class="card-footer">
                <div class="d-grid gap-2">
                    <button class="btn btn-primary btn-sm add-product" data-product-id="${product.itemId}">Adicionar Produto</button>
                    <a href="${product.offerLink}" target="_blank" class="btn btn-outline-secondary btn-sm">Ver na Shopee</a>
                </div>
            </div>
        </div>
    `;
    
    // Configurar o botão de adicionar produto
    const addButton = col.querySelector('.add-product');
    addButton.addEventListener('click', function() {
        saveProduct(product);
    });
    
    return col;
}

/**
 * Salva um produto no banco de dados
 */
function saveProduct(product) {
    // Mostrar indicador de carregamento no botão
    const button = document.querySelector(`.add-product[data-product-id="${product.itemId}"]`);
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Requisição para salvar o produto
    fetch('/db/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao salvar produto: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Produto salvo com sucesso:', data);
        button.className = 'btn btn-success btn-sm';
        button.innerHTML = 'Produto Adicionado ✓';
        
        // Marcar o produto como existente na interface
        const productCard = button.closest('.product-card');
        const badgesContainer = productCard.querySelector('.d-flex.justify-content-between div');
        
        // Adicionar badge de "Já cadastrado"
        const existsBadge = document.createElement('span');
        existsBadge.className = 'badge bg-secondary ms-1';
        existsBadge.textContent = 'Já cadastrado';
        badgesContainer.appendChild(existsBadge);
        
        // Atualizar o status do produto nos dados
        product.existsInDatabase = true;
    })
    .catch(error => {
        console.error('Erro ao salvar produto:', error);
        button.className = 'btn btn-danger btn-sm';
        button.textContent = 'Erro ao salvar';
        
        // Restaurar o botão após alguns segundos
        setTimeout(() => {
            button.className = 'btn btn-primary btn-sm';
            button.textContent = originalText;
            button.disabled = false;
        }, 3000);
    });
}

/**
 * Configura a funcionalidade de busca de produtos em alta
 */
function setupTrendingProducts() {
    // Verificar se existe um botão ou elemento para produtos em alta
    const trendingButton = document.getElementById('trending-products-btn');
    if (!trendingButton) {
        // Se não existir, criar o botão
        createTrendingProductsButton();
    } else {
        // Se existir, configurar o evento de clique
        trendingButton.addEventListener('click', showTrendingProductsModal);
    }
}

/**
 * Cria um botão para acessar produtos em alta
 */
function createTrendingProductsButton() {
    // Encontrar um local adequado para o botão
    const sidebar = document.querySelector('.sidebar') || document.querySelector('.nav');
    
    if (!sidebar) return;
    
    // Criar o botão
    const trendingButton = document.createElement('a');
    trendingButton.id = 'trending-products-btn';
    trendingButton.href = '#';
    trendingButton.className = 'nav-link';
    trendingButton.innerHTML = '<i class="fas fa-fire"></i> Produtos em Alta';
    
    // Adicionar o botão ao sidebar
    sidebar.appendChild(trendingButton);
    
    // Configurar o evento de clique
    trendingButton.addEventListener('click', showTrendingProductsModal);
}

/**
 * Exibe o modal para busca de produtos em alta
 */
function showTrendingProductsModal(e) {
    if (e) e.preventDefault();
    
    // Verificar se o modal já existe
    let trendingModal = document.getElementById('trending-products-modal');
    
    if (!trendingModal) {
        // Criar o modal
        trendingModal = document.createElement('div');
        trendingModal.id = 'trending-products-modal';
        trendingModal.className = 'modal fade';
        trendingModal.tabIndex = '-1';
        trendingModal.setAttribute('aria-labelledby', 'trendingProductsModalLabel');
        trendingModal.setAttribute('aria-hidden', 'true');
        
        trendingModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="trendingProductsModalLabel">Produtos em Alta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="trending-search-form">
                            <div class="mb-3">
                                <label for="trending-keywords" class="form-label">Palavras-chave (separadas por vírgula)</label>
                                <input type="text" class="form-control" id="trending-keywords" placeholder="smartphone, fone de ouvido, smartwatch">
                            </div>
                            <div class="mb-3">
                                <label for="trending-categories" class="form-label">Categorias</label>
                                <select class="form-select" id="trending-categories" multiple>
                                    <!-- As categorias serão carregadas dinamicamente -->
                                </select>
                                <small class="form-text text-muted">Pressione Ctrl para selecionar múltiplas categorias</small>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="trending-exclude-existing" checked>
                                    <label class="form-check-label" for="trending-exclude-existing">Excluir produtos já existentes</label>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="trending-min-sales" class="form-label">Vendas Mínimas</label>
                                        <input type="number" class="form-control" id="trending-min-sales" value="50">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="trending-limit" class="form-label">Limite de Produtos</label>
                                        <input type="number" class="form-control" id="trending-limit" value="20">
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary">Buscar Produtos em Alta</button>
                        </form>
                        <div class="mt-4" id="trending-results-container"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar o modal ao body
        document.body.appendChild(trendingModal);
        
        // Carregar as categorias
        loadCategories();
        
        // Configurar o formulário
        const trendingForm = document.getElementById('trending-search-form');
        trendingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchTrendingProducts();
        });
    }
    
    // Mostrar o modal usando Bootstrap
    const modalInstance = new bootstrap.Modal(trendingModal);
    modalInstance.show();
}

/**
 * Carrega as categorias para o select
 */
function loadCategories() {
    const categoriesSelect = document.getElementById('trending-categories');
    
    fetch('/api/categories')
        .then(response => response.json())
        .then(categories => {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoriesSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar categorias:', error);
            categoriesSelect.innerHTML = '<option value="">Erro ao carregar categorias</option>';
        });
}

/**
 * Executa a busca de produtos em alta
 */
function searchTrendingProducts() {
    const keywords = document.getElementById('trending-keywords').value.split(',').map(k => k.trim()).filter(k => k);
    const categoriesSelect = document.getElementById('trending-categories');
    const selectedCategories = Array.from(categoriesSelect.selectedOptions).map(opt => opt.value);
    const excludeExisting = document.getElementById('trending-exclude-existing').checked;
    const minSales = parseInt(document.getElementById('trending-min-sales').value) || 50;
    const limit = parseInt(document.getElementById('trending-limit').value) || 20;
    
    const resultsContainer = document.getElementById('trending-results-container');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Dados para a requisição
    const searchData = {
        keywords: keywords,
        categoryIds: selectedCategories,
        minSales: minSales,
        limit: limit,
        excludeExisting: excludeExisting
    };
    
    // Fazer a requisição
    fetch('/api/trending', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        displayTrendingResults(data, resultsContainer);
    })
    .catch(error => {
        console.error('Erro ao buscar produtos em alta:', error);
        resultsContainer.innerHTML = `<div class="alert alert-danger">Erro ao buscar produtos: ${error.message}</div>`;
    });
}

/**
 * Exibe os resultados da busca de produtos em alta
 */
function displayTrendingResults(data, container) {
    // Limpar o container
    container.innerHTML = '';
    
    const products = data.products || [];
    const metadata = data.metadata || {};
    
    // Se não houver produtos, mostrar mensagem
    if (products.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhum produto em alta encontrado com os filtros selecionados.</div>';
        return;
    }
    
    // Adicionar metadados da busca
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'metadata-container mb-3';
    metadataContainer.innerHTML = `
        <p>
            <strong>Produtos em alta encontrados:</strong> ${metadata.trendingCount} de ${metadata.uniqueProducts} produtos analisados<br>
            <small class="text-muted">Busca realizada em ${new Date(metadata.timestamp).toLocaleString()}</small>
        </p>
    `;
    container.appendChild(metadataContainer);
    
    // Criar grade de produtos
    const productsGrid = document.createElement('div');
    productsGrid.className = 'row row-cols-1 row-cols-md-3 g-4';
    
    // Adicionar cada produto à grade
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    container.appendChild(productsGrid);
}
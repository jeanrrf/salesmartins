// ###################################################################################################
// Arquivo: search-options.js                                                                      #
// Descrição: Este script implementa as opções avançadas de busca de produtos.                     #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

/**
 * Configurar as opções avançadas de busca
 */
export function setupSearchOptions() {
    // Verificar se o elemento de formulário de busca existe
    const searchForm = document.getElementById('search-form');
    
    if (!searchForm) {
        console.warn('Formulário de busca não encontrado na página');
        return;
    }
    
    // Criar o container para as opções avançadas
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'search-options mt-3';
    optionsContainer.innerHTML = `
        <div class="search-options-header">
            <button type="button" class="btn btn-sm btn-outline-secondary btn-toggle-options">Opções avançadas</button>
        </div>
        <div class="search-options-content" style="display:none; transition: all 0.3s ease;">
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="form-check mb-2">
                        <input type="checkbox" class="form-check-input" id="excludeExisting" name="excludeExisting">
                        <label class="form-check-label" for="excludeExisting">Excluir produtos já existentes</label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="hotProductsOnly" name="hotProductsOnly">
                        <label class="form-check-label" for="hotProductsOnly">Mostrar apenas produtos em alta</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-2">
                        <label for="minPrice" class="form-label">Preço Mínimo:</label>
                        <input type="number" class="form-control form-control-sm" id="minPrice" name="minPrice" min="0" step="0.01">
                    </div>
                    <div class="mb-2">
                        <label for="maxPrice" class="form-label">Preço Máximo:</label>
                        <input type="number" class="form-control form-control-sm" id="maxPrice" name="maxPrice" min="0" step="0.01">
                    </div>
                    <div class="mb-2">
                        <label for="minCommission" class="form-label">Comissão Mínima (%):</label>
                        <input type="number" class="form-control form-control-sm" id="minCommission" name="minCommission" min="0" max="100" step="0.01">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Inserir as opções após o formulário
    searchForm.appendChild(optionsContainer);
    
    // Configurar o botão para exibir/ocultar opções avançadas
    const toggleButton = optionsContainer.querySelector('.btn-toggle-options');
    const optionsContent = optionsContainer.querySelector('.search-options-content');
    
    toggleButton.addEventListener('click', function() {
        const isHidden = optionsContent.style.display === 'none';
        
        // Aplicar transição suave
        if (isHidden) {
            optionsContent.style.display = 'block';
            // Pequeno delay para permitir a transição CSS
            setTimeout(() => {
                optionsContent.style.maxHeight = '300px';
                optionsContent.style.opacity = '1';
            }, 10);
            toggleButton.textContent = 'Ocultar opções avançadas';
        } else {
            optionsContent.style.maxHeight = '0';
            optionsContent.style.opacity = '0';
            // Esperar a transição terminar antes de ocultar
            setTimeout(() => {
                optionsContent.style.display = 'none';
            }, 300);
            toggleButton.textContent = 'Opções avançadas';
        }
    });
    
    // Adicionar os campos avançados ao envio do formulário
    const originalSubmit = searchForm.onsubmit;
    searchForm.onsubmit = function(e) {
        if (originalSubmit) {
            originalSubmit.call(this, e);
        }
        
        const excludeExisting = document.getElementById('excludeExisting').checked;
        const hotProductsOnly = document.getElementById('hotProductsOnly').checked;
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        const minCommission = document.getElementById('minCommission').value;
        
        // Adicionar os parâmetros avançados à busca
        console.log('Incluindo parâmetros avançados:', { 
            excludeExisting, 
            hotProductsOnly, 
            minPrice, 
            maxPrice, 
            minCommission 
        });
        
        // A busca real será gerenciada pelo manipulador de eventos do formulário
    };
}

/**
 * Configurar a funcionalidade de produtos em alta
 */
export function setupTrendingProducts() {
    // Verificar se existe um botão para produtos em alta
    const trendingButton = document.getElementById('trending-products-btn');
    
    // Se não existir, criar o botão
    if (!trendingButton) {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        const trendingButtonDiv = document.createElement('div');
        trendingButtonDiv.className = 'text-end mt-3';
        trendingButtonDiv.innerHTML = `
            <button id="trending-products-btn" class="btn btn-warning">
                <i class="bi bi-fire"></i> Produtos em Alta
            </button>
        `;
        
        searchContainer.appendChild(trendingButtonDiv);
        
        // Adicionar evento ao botão recém-criado
        document.getElementById('trending-products-btn').addEventListener('click', showTrendingProductsModal);
    } else {
        // Se existir, configurar o evento de clique
        trendingButton.addEventListener('click', showTrendingProductsModal);
    }
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
                                    <!-- As categorias serão carregadas via API -->
                                    <option value="">Carregando categorias...</option>
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
 * Carrega as categorias do backend
 */
function loadCategories() {
    const categoriesSelect = document.getElementById('trending-categories');
    if (!categoriesSelect) return;
    
    fetch('/api/categories')
        .then(response => response.json())
        .then(categories => {
            categoriesSelect.innerHTML = '';
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
    // Implementação simplificada para exibir produtos em alta
    container.innerHTML = '';
    
    const products = data.products || [];
    const metadata = data.metadata || {};
    
    // Se não houver produtos, mostrar mensagem
    if (products.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhum produto em alta encontrado com os filtros selecionados.</div>';
        return;
    }
    
    // Adicionar metadados da busca
    container.innerHTML += `
        <div class="mb-3">
            <p><strong>Produtos em alta encontrados:</strong> ${metadata.trendingCount || products.length} de ${metadata.uniqueProducts || 'N/A'} produtos analisados</p>
        </div>
    `;
    
    // Criar grade de produtos
    const productsGrid = document.createElement('div');
    productsGrid.className = 'row row-cols-1 row-cols-md-3 g-4';
    
    products.forEach(product => {
        const price = parseFloat(product.priceMin).toFixed(2);
        const discount = product.priceDiscountRate ? `<span class="badge bg-danger ms-2">-${product.priceDiscountRate}%</span>` : '';
        
        productsGrid.innerHTML += `
            <div class="col">
                <div class="card h-100 product-card">
                    <img src="${product.imageUrl}" class="card-img-top" style="height: 180px; object-fit: contain;" loading="lazy">
                    <div class="card-body">
                        <h6 class="card-title">${product.productName}</h6>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>R$ ${price} ${discount}</div>
                            <div><small>Vendas: ${product.sales || 0}</small></div>
                        </div>
                        <p class="card-text"><small class="text-muted">Comissão: ${(product.commissionRate * 100).toFixed(2)}%</small></p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-sm add-trending-product" data-product-id="${product.itemId}">
                            <i class="bi bi-plus-circle"></i> Adicionar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.appendChild(productsGrid);
    
    // Adicionar evento aos botões de adicionar
    document.querySelectorAll('.add-trending-product').forEach(button => {
        button.addEventListener('click', function(e) {
            const productId = e.currentTarget.dataset.productId;
            const product = products.find(p => p.itemId == productId);
            
            if (product) {
                addTrendingProduct(product);
                
                // Atualizar interface
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-check-circle"></i> Adicionado';
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
            }
        });
    });
}

/**
 * Adiciona um produto em alta aos produtos salvos
 */
function addTrendingProduct(product) {
    // Implementação simplificada
    console.log('Adicionando produto em alta:', product);
    
    fetch('/db/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Produto adicionado com sucesso:', data);
    })
    .catch(error => {
        console.error('Erro ao adicionar produto:', error);
    });
}
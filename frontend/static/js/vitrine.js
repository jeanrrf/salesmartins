/**
 * SENTINNELL Vitrine de Produtos
 * Script principal para gerenciar a exibição de produtos e categorias na vitrine
 */

// URL da API atualizada para os endpoints corretos
const DB_API_URL = 'http://localhost:8001';
const API_URL = 'http://localhost:5000';

// Cache para armazenar dados de categorias e evitar requisições repetidas
const cache = {
    categories: null,
    products: null,
    lastFetch: 0
};

// Configurações
const CONFIG = {
    cacheTimeInMinutes: 15,
    productsPerPage: 8,
    specialOffersCount: 6,
    featuredProductsCount: 8,
    categoryProductsCount: 4
};

// Função para criar URLs de imagem placeholder seguras
function getPlaceholderImage(text) {
    return `https://placehold.co/300x300/2A3990/FFFFFF/png?text=${encodeURIComponent(text)}`;
}

/**
 * Formata o preço para exibição em formato brasileiro (R$)
 */
function formatPrice(price) {
    if (!price) return 'Preço indisponível';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}

/**
 * Calcula e retorna a porcentagem de desconto
 */
function calculateDiscount(originalPrice, currentPrice) {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Busca os produtos da API
 */
async function fetchProducts(forceRefresh = false) {
    try {
        // Verificar se o cache ainda é válido (15 minutos)
        const now = new Date().getTime();
        const cacheExpired = (now - cache.lastFetch) > (CONFIG.cacheTimeInMinutes * 60 * 1000);
        
        if (cache.products && !cacheExpired && !forceRefresh) {
            console.log('Usando produtos do cache');
            return cache.products;
        }

        console.log('Buscando produtos da API...');
        const response = await axios.get(`${API_URL}/api/products`);
        const products = response.data || [];
        
        if (products.length === 0) {
            console.warn('Nenhum produto encontrado na API');
            return [];
        }

        // Formatar as datas e garantir que todos os campos necessários existam
        // E REMOVER produtos sem link de afiliado
        const formattedProducts = products
            .filter(product => product.short_link || product.affiliateLink) // Filtrar apenas produtos com link de afiliado
            .map(product => ({
                ...product,
                imageUrl: product.image_url || product.imageUrl || getPlaceholderImage('Produto'),
                name: product.name || product.productName,
                price: parseFloat(product.price || product.priceMin || 0),
                originalPrice: parseFloat(product.original_price || product.price * 1.2 || 0),
                rating: parseFloat(product.rating_star || product.ratingStar || 0),
                sales: parseInt(product.sales || 0),
                categoryId: product.category_id || product.categoryId || "100001",
                categoryName: product.category_name || product.categoryName || "Eletrônicos",
                shopId: product.shop_id || 0,
                shopName: product.shop_name || "Desconhecida",
                itemId: product.item_id || product.itemId,
                commissionRate: parseFloat(product.commission_rate || product.commissionRate || 0),
                affiliateLink: product.short_link || product.affiliateLink // Não criar links normais, apenas usar links de afiliado
            }));
        
        // Armazenar no cache
        cache.products = formattedProducts;
        cache.lastFetch = now;
        return formattedProducts;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Não foi possível obter produtos. Por favor, tente novamente mais tarde.');
    }
}

/**
 * Cria o HTML para um card de produto
 */
function createProductCard(product) {
    if (!product || !product.affiliateLink) return ''; // Não mostrar produtos sem link de afiliado

    const discount = calculateDiscount(product.originalPrice, product.price);
    const imageUrl = product.imageUrl || getPlaceholderImage('Sem Imagem');
    const affiliateLink = product.affiliateLink; // Usar apenas o link de afiliado existente

    let ratingStars = '';
    if (product.rating) {
        const fullStars = Math.floor(product.rating);
        const hasHalfStar = product.rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                ratingStars += '<i class="fas fa-star text-yellow-400"></i>';
            } else if (i === fullStars && hasHalfStar) {
                ratingStars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
            } else {
                ratingStars += '<i class="far fa-star text-yellow-400"></i>';
            }
        }
    }

    return `
    <div class="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 animate-hover">
        <div class="relative">
            <img src="${imageUrl}" alt="${product.name}" class="w-full h-48 object-contain object-center">
            ${discount > 0 ? `
            <div class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-full shadow-md transform group-hover:scale-110 transition-transform">
                -${discount}%
            </div>` : ''}
            <div class="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <a href="${affiliateLink}" target="_blank" class="bg-accent hover:bg-opacity-90 text-white px-4 py-2 rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    Ver Produto
                </a>
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-medium text-lg line-clamp-2 h-14 mb-2">${product.name}</h3>
            <div class="flex justify-between items-center mb-2">
                <div>
                    <span class="text-accent font-bold">${formatPrice(product.price)}</span>
                    ${product.originalPrice && product.originalPrice > product.price ? 
                        `<div class="text-gray-400 text-sm line-through mt-1">${formatPrice(product.originalPrice)}</div>` : ''}
                </div>
                ${product.sales ? `<span class="text-xs text-gray-500">${product.sales} vendidos</span>` : ''}
            </div>
            ${ratingStars ? `
            <div class="flex items-center mt-2">
                ${ratingStars}
                <span class="text-gray-500 text-sm ml-2">${product.rating.toFixed(1)}</span>
            </div>` : ''}
            <div class="text-sm text-gray-600 mt-2">Loja: ${product.shopName || 'Desconhecida'}</div>
            <a href="${affiliateLink}" target="_blank" class="block mt-4 text-center bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md transition-colors">
                Comprar Agora
            </a>
        </div>
    </div>`;
}

/**
 * Busca as categorias da API
 */
async function fetchCategories() {
    try {
        if (cache.categories) return cache.categories;

        console.log('Buscando categorias da API...');
        const response = await axios.get(`${API_URL}/api/categories`);
        const categories = response.data || [];

        if (!categories.length) {
            console.warn('Nenhuma categoria encontrada, usando categorias padrão');
            cache.categories = defaultCategories();
            return cache.categories;
        }

        cache.categories = categories;
        return categories;
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        // Retornar categorias padrão em caso de erro
        cache.categories = defaultCategories();
        return cache.categories;
    }
}

/**
 * Retorna categorias padrão caso a API falhe
 */
function defaultCategories() {
    return [
        { id: "100001", name: "Eletrônicos", level: 1 },
        { id: "100006", name: "Celulares", level: 1 },
        { id: "100018", name: "Moda Feminina", level: 1 },
        { id: "100019", name: "Moda Masculina", level: 1 },
        { id: "100039", name: "Casa e Decoração", level: 1 },
        { id: "100041", name: "Beleza", level: 1 },
    ];
}

/**
 * Obtém o nome da categoria pelo ID
 */
function getCategoryName(categoryId) {
    if (!cache.categories) return 'Categoria';
    const category = cache.categories.find(cat => cat.id === String(categoryId));
    return category ? category.name : 'Categoria';
}

/**
 * Renderiza a lista de categorias na interface
 */
async function renderCategories() {
    const categories = await fetchCategories();
    const products = await fetchProducts();
    const categoriesListContainer = document.getElementById('categories-list');
    const footerCategoriesContainer = document.getElementById('footer-categories');

    if (!categoriesListContainer) return;

    // Count products per category
    const categoryCount = categories.reduce((acc, cat) => {
        acc[cat.id] = products.filter(p => String(p.categoryId) === String(cat.id)).length;
        return acc;
    }, {});

    // Limpar os placeholders e adicionar as categorias
    categoriesListContainer.innerHTML = categories.map(category => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-2">
            <a href="javascript:void(0)" class="block p-4 text-center h-full flex flex-col items-center justify-center category-item" data-category-id="${category.id}">
                <div class="w-16 h-16 flex items-center justify-center bg-primary bg-opacity-10 rounded-full mb-3">
                    <i class="fas ${getCategoryIcon(category.id)} text-2xl text-primary"></i>
                </div>
                <h3 class="font-medium mb-2">${category.name}</h3>
                <span class="text-sm text-gray-500">${categoryCount[category.id] || 0} produtos</span>
            </a>
        </div>
    `).join('');

    // Atualizar categorias no rodapé
    if (footerCategoriesContainer) {
        footerCategoriesContainer.innerHTML = categories.slice(0, 4).map(category => `
            <li><a href="javascript:void(0)" class="text-gray-400 hover:text-white transition-colors category-footer-item" data-category-id="${category.id}">${category.name}</a></li>
        `).join('');
    }

    // Adicionar listeners para filtro por categoria
    document.querySelectorAll('.category-item, .category-footer-item').forEach(item => {
        item.addEventListener('click', () => {
            const categoryId = item.dataset.categoryId;
            filterProductsByCategory(categoryId);

            // Scroll para a seção de produtos filtrados
            const productsContainer = document.getElementById('products-container');
            if (productsContainer) {
                productsContainer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Retorna um ícone apropriado com base no ID da categoria
 */
function getCategoryIcon(categoryId) {
    const iconMap = {
        "100001": "fa-laptop",
        "100006": "fa-mobile-alt",
        "100018": "fa-female",
        "100019": "fa-male",
        "100039": "fa-home",
        "100040": "fa-baby",
        "100041": "fa-spa",
        "100042": "fa-futbol",
        "100048": "fa-gamepad",
        "100049": "fa-car",
        "100050": "fa-tools",
    };
    return iconMap[categoryId] || "fa-tag";
}

/**
 * Carrega e exibe as ofertas especiais (produtos com desconto)
 */
async function loadSpecialOffers() {
    const specialOffersContainer = document.getElementById('special-offers');
    if (!specialOffersContainer) return;
    
    try {
        const products = await fetchProducts();
        
        // Filtrar produtos com desconto
        const productsWithDiscount = products.filter(p => 
            p.originalPrice && p.price && p.originalPrice > p.price && p.affiliateLink
        );
        
        if (!productsWithDiscount || productsWithDiscount.length === 0) {
            specialOffersContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">Nenhuma oferta especial disponível no momento.</p></div>';
            return;
        }
        
        // Ordenar por maior desconto
        productsWithDiscount.sort((a, b) => {
            const discountA = calculateDiscount(a.originalPrice, a.price);
            const discountB = calculateDiscount(b.originalPrice, b.price);
            return discountB - discountA;
        });
        
        // Selecionar até N produtos com maior desconto
        const specialOffers = productsWithDiscount.slice(0, CONFIG.specialOffersCount);
        
        // Limpar os placeholders e adicionar os produtos
        specialOffersContainer.innerHTML = specialOffers.map(createProductCard).join('');
        
    } catch (error) {
        console.error('Erro ao carregar ofertas especiais:', error);
        specialOffersContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-500">Erro ao carregar ofertas. Por favor, tente novamente mais tarde.</p></div>';
    }
}

/**
 * Filtra produtos por categoria
 */
async function filterProductsByCategory(categoryId) {
    const filteredProductsContainer = document.getElementById('filtered-products');
    const productsSectionTitle = document.getElementById('products-section-title');
    const productsContainer = document.getElementById('products-container');

    if (!filteredProductsContainer || !productsContainer) return;

    try {
        const products = await fetchProducts();
        const filteredProducts = products.filter(p => String(p.categoryId) === String(categoryId));

        // Mostrar a seção de produtos
        productsContainer.style.display = 'block';
        
        if (!filteredProducts || filteredProducts.length === 0) {
            filteredProductsContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Nenhum produto encontrado na categoria ${getCategoryName(categoryId)}.</p>
                    <button id="reset-category-filter" class="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md mt-4 transition-colors">
                        Ver Todos os Produtos
                    </button>
                </div>`;
            document.getElementById('reset-category-filter').addEventListener('click', resetCategoryFilter);
            return;
        }

        const sortedProducts = filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        const limitedProducts = sortedProducts.slice(0, 100);

        // Atualizar título da seção
        if (productsSectionTitle) {
            productsSectionTitle.textContent = `Produtos em ${getCategoryName(categoryId)}`;
        }

        // Atualizar produtos
        filteredProductsContainer.innerHTML = limitedProducts.map(createProductCard).join('');

    } catch (error) {
        console.error('Erro ao filtrar produtos por categoria:', error);
        filteredProductsContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-500">Erro ao carregar produtos. Por favor, tente novamente mais tarde.</p></div>';
    }
}

/**
 * Reseta o filtro de categoria e mostra todos os produtos
 */
async function resetCategoryFilter() {
    const productsContainer = document.getElementById('products-container');
    const productsSectionTitle = document.getElementById('products-section-title');
    const filteredProductsContainer = document.getElementById('filtered-products');

    if (productsContainer) {
        productsContainer.style.display = 'none';
    }

    if (productsSectionTitle) {
        productsSectionTitle.textContent = 'Produtos da Categoria';
    }

    if (filteredProductsContainer) {
        filteredProductsContainer.innerHTML = '';
    }
}

/**
 * Busca produtos pelo termo de pesquisa
 */
async function searchProducts(searchTerm) {
    const featuredProductsContainer = document.getElementById('featured-products');
    if (!featuredProductsContainer) return;
    
    try {
        const allProducts = await fetchProducts();
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        // Filtrar produtos que correspondem ao termo de pesquisa e TÊM link de afiliado
        const filteredProducts = allProducts.filter(product => {
            const matchesSearch = (
                (product.name && product.name.toLowerCase().includes(normalizedSearch)) || 
                (product.categoryName && product.categoryName.toLowerCase().includes(normalizedSearch))
            );
            
            // Garantir que o produto tem link de afiliado
            const hasAffiliateLink = !!product.affiliateLink;
            
            return matchesSearch && hasAffiliateLink;
        });
        
        // Remover duplicatas baseado no itemId
        const uniqueProducts = Array.from(
            new Map(filteredProducts.map(item => [item.itemId, item])).values()
        );
        
        // Ordenar por mais vendidos (maior número de vendas primeiro)
        const sortedProducts = uniqueProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        
        // Atualizar o título da seção
        const sectionTitle = document.querySelector('#produtos-destaque h2 span');
        if (sectionTitle) sectionTitle.innerText = `Resultados para "${searchTerm}"`;
        
        // Se não houver resultados, exibir mensagem
        if (!sortedProducts || sortedProducts.length === 0) {
            featuredProductsContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Nenhum produto encontrado para "${searchTerm}".</p>
                    <button id="reset-search-filter" class="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md mt-4 transition-colors">
                        Limpar Pesquisa
                    </button>
                </div>`;
                
            document.getElementById('reset-search-filter').addEventListener('click', resetCategoryFilter);
            return;
        }
        
        // Limitar a 100 resultados mais vendidos
        const limitedProducts = sortedProducts.slice(0, 100);
        
        // Limpar os placeholders e adicionar os produtos encontrados
        featuredProductsContainer.innerHTML = limitedProducts.map(createProductCard).join('');
        
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        featuredProductsContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-500">Erro ao buscar produtos. Por favor, tente novamente mais tarde.</p></div>';
    }
}

/**
 * Carrega produtos recentes (últimos adicionados)
 */
async function loadRecentProducts() {
    const recentProductsContainer = document.getElementById('recent-products');
    if (!recentProductsContainer) return;
    
    try {
        const products = await fetchProducts();
        
        // Produtos já foram filtrados no fetchProducts para ter apenas os com link de afiliado
        // Filtrar e ordenar por data de adição (se disponível) ou usar o array normal
        const recentProducts = products.slice(0, CONFIG.specialOffersCount);
        
        if (recentProducts.length === 0) {
            recentProductsContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-500">Nenhum produto recente disponível no momento.</p></div>';
            return;
        }
        
        // Limpar os placeholders e adicionar os produtos
        recentProductsContainer.innerHTML = recentProducts.map(createProductCard).join('');
        
    } catch (error) {
        console.error('Erro ao carregar produtos recentes:', error);
        recentProductsContainer.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-500">Erro ao carregar produtos. Por favor, tente novamente mais tarde.</p></div>';
    }
}

/**
 * Atualiza os contadores com dados reais
 */
async function updateStatCounters() {
    try {
        const products = await fetchProducts();
        const categories = await fetchCategories();

        // Total de produtos
        const totalProducts = document.getElementById('total-products');
        if (totalProducts) {
            totalProducts.textContent = products.length.toLocaleString();
        }

        // Total de categorias
        const totalCategories = document.getElementById('total-categories');
        if (totalCategories) {
            totalCategories.textContent = categories.length.toLocaleString();
        }

        // Maior desconto
        const maxDiscount = document.getElementById('max-discount');
        if (maxDiscount) {
            const highestDiscount = products.reduce((max, product) => {
                const discount = calculateDiscount(product.originalPrice, product.price);
                return Math.max(max, discount);
            }, 0);
            maxDiscount.textContent = `${highestDiscount}%`;
        }
    } catch (error) {
        console.error('Erro ao atualizar contadores:', error);
    }
}

/**
 * Inicializa a página quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Update stats first
        await updateStatCounters();

        // Carregar categorias primeiro
        await renderCategories();
        
        // Inicialmente esconder a seção de produtos
        const productsContainer = document.getElementById('products-container');
        if (productsContainer) {
            productsContainer.style.display = 'none';
        }

        // Remove featured products loading, keep others
        const loadingTasks = [
            loadSpecialOffers(),
            loadRecentProducts()
        ];
        await Promise.all(loadingTasks);

        // Configurar eventos de busca
        const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Buscar"]');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = e.target.value.trim();
                    if (searchTerm) {
                        searchProducts(searchTerm);
                        // Scroll para a seção de resultados
                        document.getElementById('produtos-destaque').scrollIntoView({ 
                            behavior: 'smooth' 
                        });
                    }
                }
            });
        });

        // Adicionar listener para o botão de busca
        const searchButtons = document.querySelectorAll('.search-button');
        searchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Encontrar o campo de busca mais próximo
                const input = e.target.closest('.search-container').querySelector('input[type="text"]');
                const searchTerm = input?.value.trim();
                if (searchTerm) {
                    searchProducts(searchTerm);
                    // Scroll para a seção de resultados
                    document.getElementById('produtos-destaque').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            });
        });

        // Ocultar o indicador de carregamento da página
        const loadingOverlay = document.getElementById('page-loading');
        if (loadingOverlay) {
            loadingOverlay.classList.add('opacity-0');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }

        // Ensure video autoplay works
        const video = document.querySelector('video');
        if (video) {
            video.play().catch(function(error) {
                console.log("Video autoplay failed:", error);
            });
        }

        // Ensure banner image loads properly
        const bannerImg = document.querySelector('.banner-image');
        if (bannerImg) {
            bannerImg.addEventListener('load', () => {
                bannerImg.classList.add('loaded');
            });
        }
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
    }
});
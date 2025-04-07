/**
 * config.js
 * Configurações centralizadas para o SENTINNELL_GERADOR
 */

const config = {
    // URLs de API
    api: {
        baseUrl: '/api',
        searchEndpoint: '/search',
        productsEndpoint: '/db/products',
        categoriesEndpoint: '/categories',
        linksEndpoint: '/generate-links',
        healthEndpoint: '/health',
        trendingEndpoint: '/trending'
    },
    
    // Configurações de paginação
    pagination: {
        defaultLimit: 20,
        maxLimit: 100,
        pageSizes: [10, 20, 50, 100]
    },
    
    // Configurações de filtros
    filters: {
        minCommissionDefault: 0.05, // 5%
        commissionSteps: [0, 0.05, 0.10, 0.15, 0.20], // 0%, 5%, 10%, 15%, 20%
        priceRanges: [
            { label: 'Até R$50', min: 0, max: 50 },
            { label: 'R$50 a R$100', min: 50, max: 100 },
            { label: 'R$100 a R$200', min: 100, max: 200 },
            { label: 'R$200 a R$500', min: 200, max: 500 },
            { label: 'Acima de R$500', min: 500, max: null }
        ]
    },
    
    // Configurações de notificações
    notifications: {
        defaultDuration: 3000,
        errorDuration: 5000,
        successDuration: 2000
    },
    
    // SubIDs padrão para links de afiliados
    affiliate: {
        defaultSubIds: {
            subId1: 'salesmartins',
            subId2: 'sentinnellanalytics'
        }
    }
};

export default config;

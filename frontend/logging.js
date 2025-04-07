// ###################################################################################################
// Arquivo: logging.js                                                                           #
// Descrição: Este script adiciona logging para requisições e respostas da API.                   #
// Autor: Jean Rosso                                                                              #
// Data: 28 de março de 2025                                                                      #
// ###################################################################################################

// Add API request logging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const [resource, config] = args;
    
    // Só fazer log em ambiente de desenvolvimento
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
        console.group('API Request');
        console.log('URL:', resource);
        console.log('Method:', config?.method || 'GET');
        console.log('Headers:', config?.headers);
        console.log('Body:', config?.body);
        console.groupEnd();
    }

    try {
        const response = await originalFetch(...args);
        const clone = response.clone();
        
        if (isDev) {
            console.group('API Response');
            console.log('Status:', response.status);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            try {
                const data = await clone.json();
                console.log('Body:', data);
            } catch (e) {
                console.log('Body: [Não é JSON]');
            }
            console.groupEnd();
        }
        
        return response;
    } catch (error) {
        if (isDev) {
            console.error('API Error:', error);
        }
        throw error;
    }
};

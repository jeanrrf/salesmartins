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
    
    // Log request
    console.group('API Request');
    console.log('URL:', resource);
    console.log('Method:', config?.method || 'GET');
    console.log('Headers:', config?.headers);
    console.log('Body:', config?.body);
    console.groupEnd();

    try {
        const response = await originalFetch(...args);
        const clone = response.clone();
        
        // Log response
        console.group('API Response');
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        try {
            const data = await clone.json();
            console.log('Data:', data);
        } catch (e) {
            console.log('Response is not JSON');
        }
        console.groupEnd();
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

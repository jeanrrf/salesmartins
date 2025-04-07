/**
 * Módulo para formatação de valores
 * Centraliza todas as funções de formatação usadas no projeto
 */

/**
 * Formata valores monetários para exibição
 * @param {number} value - Valor a ser formatado
 * @returns {string} - Valor formatado como moeda brasileira
 */
export function formatCurrency(value) {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(parseFloat(value));
}

/**
 * Formata valores percentuais para exibição
 * @param {number} value - Valor decimal a ser formatado (ex: 0.25)
 * @returns {string} - Valor formatado como porcentagem (ex: 25.00%)
 */
export function formatPercent(value) {
    if (!value) return 'N/A';
    return (parseFloat(value) * 100).toFixed(2) + '%';
}

/**
 * Formata datas para o padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} - Data formatada no padrão brasileiro
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
}

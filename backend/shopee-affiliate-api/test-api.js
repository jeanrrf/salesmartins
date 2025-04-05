#!/usr/bin/env node

const ApiDiagnostic = require('./utils/apiDiagnostic');
require('dotenv').config();

// Função para obter a API key de várias variáveis de ambiente possíveis
function getApiKey() {
  // Tenta encontrar a chave de API em várias variáveis possíveis
  const possibleEnvVars = [
    'SHOPEE_AFFILIATE_API_KEY', 
    'SHOPEE_API_KEY', 
    'SHOPEE_API_TOKEN', 
    'SHOPEE_ACCESS_TOKEN'
  ];
  
  for (const envVar of possibleEnvVars) {
    if (process.env[envVar]) {
      console.log(`Usando API key da variável de ambiente: ${envVar}`);
      return process.env[envVar];
    }
  }
  
  return null;
}

// Configurações da API
const config = {
  baseUrl: process.env.SHOPEE_API_BASE_URL || 'https://api.shopee.com/v2',
  apiKey: getApiKey()
};

// Função principal
async function main() {
  console.log('Iniciando diagnóstico da API da Shopee Affiliate...');
  
  if (!config.apiKey) {
    console.error('Erro: API key não encontrada nas variáveis de ambiente.');
    console.log('Por favor, defina uma das seguintes variáveis no arquivo .env:');
    console.log('- SHOPEE_AFFILIATE_API_KEY');
    console.log('- SHOPEE_API_KEY');
    console.log('- SHOPEE_API_TOKEN');
    console.log('- SHOPEE_ACCESS_TOKEN');
    process.exit(1);
  }

  const diagnostic = new ApiDiagnostic(config.baseUrl, config.apiKey);
  
  console.log(`Verificando conectividade com ${config.baseUrl}...`);
  const results = await diagnostic.runDiagnostics();
  
  console.log('\n=== Resultados do Diagnóstico ===');
  results.forEach(result => {
    const statusIcon = result.isSuccess ? '✅' : '❌';
    console.log(`${statusIcon} ${result.url} - ${result.statusCode || 'ERRO'}`);
    if (!result.isSuccess) {
      console.log(`   Razão: ${result.statusText || result.error}`);
      if (result.statusCode === 404) {
        console.log('   Possíveis causas do erro 404:');
        console.log('   - URL incorreta ou recurso inexistente');
        console.log('   - Permissões inadequadas para acessar o recurso');
        console.log('   - API pode ter sido atualizada ou o endpoint removido');
      }
    }
  });

  const successCount = results.filter(r => r.isSuccess).length;
  console.log(`\nResultados: ${successCount}/${results.length} endpoints acessíveis.`);
  
  if (successCount === 0) {
    console.log('\nRecomendações:');
    console.log('1. Verifique sua conexão com a internet');
    console.log('2. Confirme se sua API key está correta');
    console.log('3. Verifique se o servidor da API está operacional');
    console.log('4. Certifique-se de que você tem permissão para acessar a API');
  }
}

main().catch(err => {
  console.error('Erro durante o diagnóstico:', err);
  process.exit(1);
});

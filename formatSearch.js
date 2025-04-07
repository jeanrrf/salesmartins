/**
 * Função para formatar a string de pesquisa substituindo espaços por sinais de mais
 * @param {string} searchValue - O valor de pesquisa a ser formatado
 * @return {string} - O valor formatado (ex: "mangueira para jardim" -> "mangueira+para+jardim")
 */
function formatSearchQuery(searchValue) {
  return searchValue.trim().replace(/\s+/g, '+');
}

/**
 * Função para ser usada em formulários de pesquisa
 * @param {HTMLFormElement} form - O formulário que contém o campo de pesquisa
 * @param {string} inputName - O nome do input de pesquisa (por padrão 'q')
 * @return {boolean} - Retorna true para permitir o envio do form
 */
function handleSearchSubmit(form, inputName = 'q') {
  const searchInput = form.querySelector(`input[name="${inputName}"]`);
  if (searchInput) {
    searchInput.value = formatSearchQuery(searchInput.value);
  }
  return true;
}

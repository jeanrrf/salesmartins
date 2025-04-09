# Shopee Analytics

Sistema de análise e gerenciamento de produtos da Shopee para afiliados.

## Recursos principais

- Busca e análise de produtos com potencial de vendas
- Gerenciamento de categorias de produtos
- Geração automatizada de links de afiliados
- Interface de vitrine para exibição de produtos
- Painel administrativo para controle de dados

## Requisitos

- Python 3.9+
- Node.js 14+
- Conta de desenvolvedor na Shopee Affiliate

## Instalação

1. Clone este repositório:
```bash
git clone <url-do-seu-repositorio>
cd salesmartins
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

3. Instale as dependências:
```bash
# Backend (Python)
pip install -r requirements.txt

# Frontend (opcional, se usar Node.js)
npm install
```

## Executar localmente

Para iniciar o servidor de desenvolvimento:

```bash
# Backend API
python backend/api.py

# Frontend (opcional)
cd frontend
python -m http.server 8000
```

## Deploy para Vercel

Execute o script de publicação:

```bash
python publish-to-vercel.py
```

Siga as instruções na tela para completar o deploy.

## Estrutura do projeto

- `/frontend`: Arquivos estáticos da interface do usuário
- `/backend`: Código Python para API e integração com Shopee
- `/api`: Função serverless para integração com Vercel

## Licença

Uso privado - Todos os direitos reservados.

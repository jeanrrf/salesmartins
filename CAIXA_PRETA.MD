# CAIXA PRETA

Este arquivo serve como um registro centralizado de todas as alterações e informações relevantes realizadas no projeto. Ele será atualizado com cada análise e modificação.

## Alterações Recentes

### Problema
O módulo `backend` não foi encontrado ao executar o script `run_server.py`, resultando no erro `ModuleNotFoundError`.

### Solução
Refatoramos a lógica no script `run_server.py` para garantir que o diretório raiz do projeto seja adicionado dinamicamente ao `sys.path`. Além disso, corrigimos o caminho para o módulo `Backend.main` ao iniciar o servidor.

### Arquivos Modificados
- **`run_server.py`**: Refatorada a lógica para corrigir o problema de importação do módulo `backend`.

```python
# Adicionado dinamicamente o diretório raiz ao sys.path
project_root = os.path.abspath(os.path.dirname(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Corrigido o caminho do módulo ao iniciar o servidor
subprocess.run([sys.executable, "-m", "uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"], check=True)
```

### Problema
Necessidade de monitorar portas abertas e tráfego de API em tempo real.

### Solução
Adicionamos um monitoramento em tempo real para registrar detalhes sobre portas abertas e tráfego de API.

### Arquivos Modificados
- **`run_server.py`**: Adicionado monitoramento de tráfego em tempo real.
- **`backend/utils/logs.py`**: Criado um logger dedicado para monitoramento de tráfego de API.

### Exemplo de Log
```plaintext
2025-03-28 12:00:00 | INFO | Monitoring traffic on port 3000...
2025-03-28 12:00:01 | INFO | Port 3000 traffic: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
```

### Problema
Monitoramento de tráfego em tempo real não funcionava corretamente.

### Solução
Corrigimos a função `monitor_traffic` para rodar em uma thread separada e registrar o tráfego continuamente.

### Arquivos Modificados
- **`run_server.py`**: Corrigido o monitoramento de tráfego em tempo real.
- **`backend/utils/logs.py`**: Garantido que o logger de tráfego de API está configurado corretamente.

### Exemplo de Log
```plaintext
2025-03-28 12:00:00 | INFO | Port 3000 traffic: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
2025-03-28 12:00:05 | INFO | Port 3000 traffic: TCP    0.0.0.0:3000           0.0.0.0:0              ESTABLISHED     12345
```

### 2025-04-07
- Removido completamente todo o uso de mock data no backend
- Criado sistema de cache para respostas da API
- Configuração atualizada para conectar apenas com API real
- Removido suporte para fallback para dados mockados
- Atualizado frontend para usar apenas dados reais da API
- Implementado tratamento de erros mais robusto para falhas de API

### 2025-04-08
- Implementada integração completa com a Shopee Affiliate API usando GraphQL
- Criado cliente dedicado para autenticação SHA256 conforme documentação
- Adicionado suporte para rate limiting (2000 requests/hora)
- Implementado mecanismo de paginação com scrollId
- Adicionados endpoints para produtos, links curtos e relatórios de conversão

### 2025-04-09
- Simplificado o sistema de filtros para focar em ordenação
- Substituídos os filtros complexos por apenas duas opções: "Mais Vendidos" e "Maiores Descontos"
- Mantido o campo de busca textual para encontrar produtos específicos
- Adicionada funcionalidade para ocultar produtos que já existem no estoque
- Implementada verificação de estoque via banco de dados SQLite e arquivo JSON

## Observações
- Os endpoints da API agora apontam para https://api.sentinnell.com/api
- Sistema de cache implementado para melhorar a performance e reduzir chamadas à API
- Todos os JSONs locais foram removidos, toda informação vem da API real
- Certifique-se de que o diretório `Backend` contém o arquivo `__init__.py` para ser reconhecido como um pacote Python.
- Execute o script novamente para verificar se o problema foi resolvido.
- Certifique-se de que o diretório `logs` contém permissões de escrita para armazenar os arquivos de log.
- Verifique o arquivo `api_traffic.log` para monitorar as atividades em tempo real.
- Este arquivo será atualizado com cada nova análise ou alteração.
- Os endpoints da API agora apontam para https://open-api.affiliate.shopee.com.br/graphql
- Autenticação Shopee implementada usando signature SHA256 (AppId+Timestamp+Payload+Secret)
- Atenção ao rate limit de 2000 requests/hora imposto pela API Shopee
- O scrollId é válido por apenas 30 segundos, necessário implementar requisições rápidas para paginação
- A nova interface simplificada prioriza os produtos mais vendidos e com maiores descontos
- Adicionado sistema para evitar duplicidade com produtos já existentes no estoque

import os
import subprocess
import time
import webbrowser
import http.server
import socketserver
import threading
import argparse
import sys
import importlib.util
import platform
import requests
import re

# Importar a camada de compatibilidade primeiro para corrigir importações do Flask
print("Carregando camada de compatibilidade...")


def get_venv_python():
    """Encontra o executável Python no ambiente virtual"""
    venv_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv")
    
    if not os.path.exists(venv_dir):
        print("[AVISO] Ambiente virtual não encontrado. Use 'python setup.py' primeiro.")
        return sys.executable
        
    if platform.system() == "Windows":
        python_path = os.path.join(venv_dir, "Scripts", "python.exe")
    else:
        python_path = os.path.join(venv_dir, "bin", "python")
        
    if not os.path.exists(python_path):
        print(f"[AVISO] Python não encontrado em {python_path}. Usando Python padrão.")
        return sys.executable
        
    return python_path

# Use o Python do ambiente virtual para todos os subprocessos
PYTHON_EXECUTABLE = get_venv_python()
print(f"Usando Python: {PYTHON_EXECUTABLE}")

def serve_frontend():
    # Configurar o servidor HTTP
    PORT = 8000
    DIRECTORY = os.path.join(os.getcwd(), "frontend")  # Garantir caminho absoluto

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=DIRECTORY, **kwargs)

        def log_message(self, format, *args):
            # Adicionar logs mais claros para depuração
            print("[Servidor Frontend]", format % args)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor frontend rodando em http://localhost:{PORT}")
        httpd.serve_forever()

def serve_api():
    """Inicia o servidor da API principal"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    api_script = os.path.join(current_dir, "backend", "api.py")
    
    # Iniciar o servidor de API principal em um processo separado
    # Usamos a flag -u para garantir saída não-bufferizada
    print("Iniciando o servidor da API principal...")
    subprocess.Popen([
        PYTHON_EXECUTABLE, "-u", api_script
    ])
    
    print(f"Servidor da API principal rodando em http://localhost:5000")

def wait_for_backend(port, timeout=30):
    """Wait for the backend server to be ready."""
    import socket
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=2):
                print(f"Backend server is ready on port {port}")
                return True
        except (ConnectionRefusedError, socket.timeout):
            time.sleep(1)
    print(f"Backend server did not start within {timeout} seconds")
    return False

def wait_for_server(port, server_name="servidor", timeout=15):
    """Espera pela inicialização de um servidor em uma porta específica."""
    import socket
    print(f"Aguardando {server_name} na porta {port}...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=1):
                print(f"[OK] {server_name.capitalize()} está pronto na porta {port}")
                return True
        except (ConnectionRefusedError, socket.timeout):
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(0.5)
    print(f"\n[AVISO] {server_name.capitalize()} não respondeu dentro de {timeout} segundos")
    return False

def check_affiliate_links():
    """Verifica se os cartões de produtos na vitrine estão usando links de afiliado"""
    print("Verificando links de afiliado na vitrine de produtos...")
    try:
        # Aguarde um tempo para garantir que o servidor frontend está rodando
        time.sleep(2)
        
        # Tenta acessar a página da vitrine - verificar múltiplos nomes possíveis
        vitrine_urls = [
            "http://localhost:8000/vitrine.html",
            "http://localhost:8000/Vitrini.html",
            "http://localhost:8000/storefront.html"
        ]
        
        response = None
        found_url = None
        
        for url in vitrine_urls:
            try:
                resp = requests.get(url)
                if resp.status_code == 200:
                    response = resp
                    found_url = url
                    print(f"[INFO] Vitrine encontrada em: {url}")
                    break
            except Exception:
                continue
                
        if not response:
            print("[ERRO] Não foi possível acessar a vitrine de produtos. Verifique se o arquivo vitrine.html, Vitrini.html ou storefront.html existe.")
            return False
            
        # Verifica se há referências a links de afiliado no conteúdo da página
        content = response.text
        
        # Padrões comuns para links de afiliado da Shopee
        affiliate_patterns = [
            r'affiliate_id=',
            r'af_id=',
            r'shopee\.[\w\.]+\/affiliate\/',
            r'shp\.ee',
            r'data-affiliate-link',
            r'class=["\']affiliate-link["\']',
            r'affiliateLink'  # Adicionado com base no código da vitrine.js
        ]
        
        found_patterns = []
        for pattern in affiliate_patterns:
            if re.search(pattern, content):
                found_patterns.append(pattern)
        
        if found_patterns:
            print("[OK] Links de afiliado encontrados na vitrine de produtos:")
            for pattern in found_patterns:
                print(f"  - Padrão detectado: {pattern}")
            return True
        else:
            print("[AVISO] Não foram encontrados links de afiliado na vitrine de produtos.")
            print("Certifique-se de que os cartões de produtos estão usando links de afiliado para rastrear vendas.")
            return False
            
    except Exception as e:
        print(f"[ERRO] Falha ao verificar links de afiliado: {str(e)}")
        return False

def start_shopee_analytics():
    print("Iniciando SENTINNELL Analytics...")

    # Iniciar o servidor de API principal
    serve_api()
    wait_for_server(5000, "API principal")

    # Iniciar o servidor frontend em uma thread separada
    frontend_thread = threading.Thread(target=serve_frontend, daemon=True)
    frontend_thread.start()

    # Aguardar os servidores iniciarem
    print("Aguardando os servidores iniciarem (3 segundos)...")
    time.sleep(3)

    # Abrir a vitrine no navegador padrão
    print("Abrindo a vitrine no navegador padrão...")
    webbrowser.open("http://localhost:8000/vitrine.html")

    # Exibir informações sobre todos os servidores disponíveis
    print("\n=== SENTINNELL Analytics - Serviços Disponíveis ===")
    print("Servidor backend API: http://localhost:8001")
    print("Servidor API principal: http://localhost:5000")
    print("Painel administrativo: http://localhost:8000/admin")
    print("Vitrine de produtos: http://localhost:8000/vitrine.html")
    print("=============================================\n")
    print("Pressione Ctrl+C para encerrar todos os servidores")

    # Manter o script em execução para permitir Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nEncerrando o SENTINNELL Analytics...")

def start_dev_control_panel():
    """Inicia o painel de controle de desenvolvimento"""
    print("Iniciando o Painel de Controle de Desenvolvimento...")
    
    # Executar o script do painel de controle em um processo separado
    import dev_control_panel
    dev_control_panel.main()

def check_setup():
    """Verifica se o ambiente está configurado corretamente"""
    setup_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "setup.py")
    
    if not os.path.exists(setup_script):
        print("Arquivo setup.py não encontrado. Ignorando verificação de ambiente.")
        return True
        
    print("Verificando ambiente...")
    try:
        # Executar setup.py com o comando 'install' para verificar e instalar dependências
        result = subprocess.run([sys.executable, setup_script, 'install'], capture_output=True, text=True)
        if result.returncode != 0:
            print("Aviso: Configuração de ambiente pode estar incompleta.")
            print(result.stderr)
            
            # Perguntar ao usuário se deseja continuar mesmo assim
            response = input("Continuar mesmo assim? (s/N): ").lower()
            if response != 's':
                return False
        return True
    except Exception as e:
        print(f"Erro ao verificar ambiente: {e}")
        return False

def check_js_dependencies():
    """Verifica se há dependências JavaScript que devem ser baixadas"""
    frontend_js_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "static", "js", "libs")
    
    # Criar diretórios para bibliotecas JS se não existirem
    os.makedirs(frontend_js_dir, exist_ok=True)
    
    # Lista de bibliotecas JS que precisam ser baixadas
    js_libs = [
        {
            "name": "chart.js",
            "url": "https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js",
            "path": os.path.join(frontend_js_dir, "chart.min.js")
        },
        {
            "name": "axios",
            "url": "https://cdn.jsdelivr.net/npm/axios@1.3.5/dist/axios.min.js",
            "path": os.path.join(frontend_js_dir, "axios.min.js")
        }
    ]
    
    # Baixar as bibliotecas JS se ainda não existirem
    missing_libs = [lib for lib in js_libs if not os.path.exists(lib["path"])]
    if missing_libs:
        print("Baixando bibliotecas JavaScript necessárias...")
        import requests
        for lib in missing_libs:
            try:
                print(f"Baixando {lib['name']}...")
                response = requests.get(lib['url'])
                if response.status_code == 200:
                    with open(lib['path'], 'wb') as f:
                        f.write(response.content)
                    print(f"[OK] {lib['name']} baixado com sucesso.")
                else:
                    print(f"[ERRO] Não foi possível baixar {lib['name']}. Status: {response.status_code}")
            except Exception as e:
                print(f"[ERRO] Falha ao baixar {lib['name']}: {str(e)}")
    else:
        print("[OK] Todas as bibliotecas JavaScript já estão disponíveis.")
    
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='SENTINNELL Analytics Runner')
    parser.add_argument('--mode', choices=['app', 'dev', 'setup'], default='app',
                      help='Modo de execução: app para a aplicação normal, dev para o painel de controle, setup para configuração')
    parser.add_argument('--skip-setup', action='store_true', 
                      help='Pular verificação de ambiente e configuração')
    
    args = parser.parse_args()
    
    if args.mode == 'setup':
        # Executar apenas o setup
        setup_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "setup.py")
        subprocess.run([sys.executable, setup_script])
        # Verificar também as dependências JavaScript
        check_js_dependencies()
        sys.exit(0)
    
    # Verificar ambiente a menos que seja explicitamente pulado
    if not args.skip_setup and not check_setup():
        print("Configuração de ambiente incompleta. Execute 'python run.py --mode setup' para configurar.")
        sys.exit(1)
    
    # Verificar dependências JavaScript
    check_js_dependencies()
    
    if args.mode == 'dev':
        start_dev_control_panel()
    else:
        start_shopee_analytics()
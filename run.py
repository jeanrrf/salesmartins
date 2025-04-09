import os
import sys
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import psutil
import requests
from datetime import datetime

# Configuração do Flask
app = Flask(__name__, 
            static_folder='frontend/static',
            template_folder='frontend')
CORS(app)

# Importações dos outros módulos (se necessário)
# Adicionar importações aqui conforme necessidade

# Configurações de ambiente
def load_environment():
    """Carrega variáveis de ambiente a partir de .env se disponível"""
    from dotenv import load_dotenv
    load_dotenv()
    
    # Configurar modo de debug
    app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Outras configurações podem ser adicionadas aqui
    return True

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

# Rotas para servir a aplicação frontend
@app.route('/')
def index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.template_folder, path)):
        return send_from_directory(app.template_folder, path)
    return send_from_directory(app.template_folder, 'index.html')

# Rotas da API
@app.route('/api/system/info', methods=['GET'])
def get_system_info():
    cpu_percent = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return jsonify({
        'success': True,
        'info': {
            'cpu_percent': cpu_percent,
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            },
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    })

# Aqui você pode adicionar outras rotas de API conforme necessário

# Ponto de entrada para execução da aplicação
if __name__ == "__main__":
    # Carregar ambiente
    load_environment()
    
    # Verificar dependências JavaScript
    check_js_dependencies()
    
    # Iniciar o servidor Flask
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8001))
    
    print(f"Servidor iniciando em http://{host}:{port}")
    app.run(host=host, port=port)
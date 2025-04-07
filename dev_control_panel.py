# ###################################################################################################
# Arquivo: dev_control_panel.py                                                                  #
# Descrição: Este script implementa um painel de controle para desenvolvedores usando Flask e SocketIO. #
# Autor: Jean Rosso                                                                              #
# Data: 28 de março de 2025                                                                      #
# ###################################################################################################

import os
import sys
import json
import time
import signal
import subprocess
import threading
import webbrowser
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import psutil
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("DevControlPanel")

# Configuração do Flask
app = Flask(__name__, 
           static_folder='control_panel/static',
           template_folder='control_panel/templates')
app.config['SECRET_KEY'] = 'sentinnell-dev-control'
socketio = SocketIO(app, cors_allowed_origins="*")

# Diretórios do projeto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHOPEE_ANALYTICS_DIR = BASE_DIR
VENDA_SHOPE_DIR = os.path.join(BASE_DIR, 'VENDA_SHOPE_OFC')

# Variáveis globais para os processos
processes = {
    'shopee_backend': None,
    'shopee_frontend': None,
    'venda_shopee': None
}

# Armazenamento de logs
process_logs = {
    'shopee_backend': [],
    'shopee_frontend': [],
    'venda_shopee': []
}

# Status dos serviços
service_status = {
    'shopee_backend': 'stopped',
    'shopee_frontend': 'stopped',
    'venda_shopee': 'stopped'
}

# Função para adicionar logs e emitir para o cliente
def add_log(service, message, level='info'):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        'timestamp': timestamp,
        'service': service,
        'message': message,
        'level': level
    }
    process_logs[service].append(log_entry)
    # Limitar o número de logs armazenados (manter os últimos 1000)
    if len(process_logs[service]) > 1000:
        process_logs[service] = process_logs[service][-1000:]
    
    # Emitir para WebSocket
    socketio.emit('new_log', log_entry)

# Classe para capturar e processar a saída de processos
class ProcessOutputReader:
    def __init__(self, service_name):
        self.service = service_name
    
    def read_output(self, process):
        for line in iter(process.stdout.readline, b''):
            try:
                line_str = line.decode('utf-8').rstrip()
                if line_str:
                    add_log(self.service, line_str)
            except Exception as e:
                add_log(self.service, f"Erro ao ler saída: {str(e)}", 'error')
        
        # Quando o processo terminar, atualizar o status
        if processes[self.service] == process:
            service_status[self.service] = 'stopped'
            socketio.emit('service_status', {'service': self.service, 'status': 'stopped'})
            add_log(self.service, "Processo finalizado", 'warning')

# Função para verificar se uma porta está em uso
def is_port_in_use(port):
    try:
        for conn in psutil.net_connections():
            if conn.laddr.port == port and conn.status == 'LISTEN':
                return True, conn.pid
        return False, None
    except (psutil.AccessDenied, AttributeError):
        # Método alternativo se net_connections() falhar
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result == 0, None
        except:
            return False, None

# Função para iniciar o backend do Shopee Analytics
def start_shopee_backend():
    if processes['shopee_backend'] is not None and processes['shopee_backend'].poll() is None:
        return False, "Servidor backend já está em execução"
    
    try:
        # Verificar se a porta 8001 já está em uso
        port_in_use, pid = is_port_in_use(8001)
        if port_in_use:
            add_log('shopee_backend', f"Porta 8001 já está em uso pelo processo {pid}", 'error')
            return False, "Porta 8001 já está em uso por outro processo"
        
        # Get full path to the backend script
        backend_script = os.path.join(SHOPEE_ANALYTICS_DIR, "backend", "shopee_affiliate_auth.py")
        
        # Iniciar o processo
        process = subprocess.Popen(
            [sys.executable, backend_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=False,
            bufsize=1,
            cwd=SHOPEE_ANALYTICS_DIR
        )
        
        processes['shopee_backend'] = process
        service_status['shopee_backend'] = 'running'
        add_log('shopee_backend', "Servidor backend iniciado na porta 8001", 'success')
        socketio.emit('service_status', {'service': 'shopee_backend', 'status': 'running'})
        
        # Iniciar thread para ler a saída do processo
        reader = ProcessOutputReader('shopee_backend')
        thread = threading.Thread(target=reader.read_output, args=(process,))
        thread.daemon = True
        thread.start()
        
        return True, "Servidor backend iniciado com sucesso"
    except Exception as e:
        add_log('shopee_backend', f"Erro ao iniciar backend: {str(e)}", 'error')
        return False, f"Erro ao iniciar servidor backend: {str(e)}"

# Função para iniciar o frontend do Shopee Analytics
def start_shopee_frontend():
    if processes['shopee_frontend'] is not None and processes['shopee_frontend'].poll() is None:
        return False, "Servidor frontend já está em execução"
    
    try:
        # Verificar se a porta 8000 já está em uso
        port_in_use, pid = is_port_in_use(8000)
        if port_in_use:
            add_log('shopee_frontend', f"Porta 8000 já está em uso pelo processo {pid}", 'error')
            return False, "Porta 8000 já está em uso por outro processo"
        
        # Criar um servidor HTTP simples para servir o frontend
        cmd = [sys.executable, "-m", "http.server", "8000"]
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=False,
            bufsize=1,
            cwd=os.path.join(SHOPEE_ANALYTICS_DIR, "frontend")
        )
        
        processes['shopee_frontend'] = process
        service_status['shopee_frontend'] = 'running'
        add_log('shopee_frontend', "Servidor frontend iniciado na porta 8000", 'success')
        socketio.emit('service_status', {'service': 'shopee_frontend', 'status': 'running'})
        
        # Iniciar thread para ler a saída do processo
        reader = ProcessOutputReader('shopee_frontend')
        thread = threading.Thread(target=reader.read_output, args=(process,))
        thread.daemon = True
        thread.start()
        
        return True, "Servidor frontend iniciado com sucesso"
    except Exception as e:
        add_log('shopee_frontend', f"Erro ao iniciar frontend: {str(e)}", 'error')
        return False, f"Erro ao iniciar servidor frontend: {str(e)}"

# Função para iniciar o Venda Shopee (React/Vite)
def start_venda_shopee():
    if processes['venda_shopee'] is not None and processes['venda_shopee'].poll() is None:
        return False, "Servidor Venda Shopee já está em execução"
    
    if not os.path.exists(VENDA_SHOPE_DIR):
        return False, f"Diretório do projeto Venda Shopee não encontrado: {VENDA_SHOPE_DIR}"
    
    try:
        # Primeiro tentar usar npm start
        cmd = ["npm", "run", "dev"]
        
        # Verificar se o script 'dev' existe no package.json
        try:
            with open(os.path.join(VENDA_SHOPE_DIR, 'package.json'), 'r') as f:
                package_data = json.load(f)
                if 'scripts' in package_data and 'dev' not in package_data['scripts']:
                    cmd = ["npm", "start"]
        except Exception:
            pass
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=False,
            bufsize=1,
            cwd=VENDA_SHOPE_DIR,
            shell=True
        )
        
        processes['venda_shopee'] = process
        service_status['venda_shopee'] = 'running'
        add_log('venda_shopee', "Servidor Venda Shopee iniciado", 'success')
        socketio.emit('service_status', {'service': 'venda_shopee', 'status': 'running'})
        
        # Iniciar thread para ler a saída do processo
        reader = ProcessOutputReader('venda_shopee')
        thread = threading.Thread(target=reader.read_output, args=(process,))
        thread.daemon = True
        thread.start()
        
        return True, "Servidor Venda Shopee iniciado com sucesso"
    except Exception as e:
        add_log('venda_shopee', f"Erro ao iniciar Venda Shopee: {str(e)}", 'error')
        return False, f"Erro ao iniciar servidor Venda Shopee: {str(e)}"

# Função para parar um processo
def stop_process(service_name):
    process = processes[service_name]
    if process is None or process.poll() is not None:
        return False, f"Servidor {service_name} não está em execução"
    
    try:
        # Tenta terminar graciosamente
        if os.name == 'nt':  # Windows
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)], check=True)
        else:  # Unix/Linux
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        
        processes[service_name] = None
        service_status[service_name] = 'stopped'
        add_log(service_name, f"Servidor {service_name} parado", 'warning')
        socketio.emit('service_status', {'service': service_name, 'status': 'stopped'})
        
        return True, f"Servidor {service_name} parado com sucesso"
    except Exception as e:
        add_log(service_name, f"Erro ao parar servidor: {str(e)}", 'error')
        return False, f"Erro ao parar servidor {service_name}: {str(e)}"

# Rotas do Flask
@app.route('/')
def index():
    # Verificar status de todos os processos
    for service, process in processes.items():
        if process is not None and process.poll() is None:
            service_status[service] = 'running'
        else:
            service_status[service] = 'stopped'
            processes[service] = None
    
    return render_template('index.html', service_status=service_status)

@app.route('/api/service/<service>/start', methods=['POST'])
def start_service(service):
    if service == 'shopee_backend':
        success, message = start_shopee_backend()
    elif service == 'shopee_frontend':
        success, message = start_shopee_frontend()
    elif service == 'venda_shopee':
        success, message = start_venda_shopee()
    else:
        return jsonify({'success': False, 'message': 'Serviço desconhecido'}), 400
    
    return jsonify({'success': success, 'message': message})

@app.route('/api/service/<service>/stop', methods=['POST'])
def stop_service(service):
    if service not in processes:
        return jsonify({'success': False, 'message': 'Serviço desconhecido'}), 400
    
    success, message = stop_process(service)
    return jsonify({'success': success, 'message': message})

@app.route('/api/service/<service>/status', methods=['GET'])
def get_service_status(service):
    if service not in service_status:
        return jsonify({'success': False, 'message': 'Serviço desconhecido'}), 400
    
    return jsonify({
        'success': True,
        'service': service,
        'status': service_status[service]
    })

@app.route('/api/service/<service>/logs', methods=['GET'])
def get_service_logs(service):
    if service not in process_logs:
        return jsonify({'success': False, 'message': 'Serviço desconhecido'}), 400
    
    # Obter os logs, com opção de limite
    limit = request.args.get('limit', 100, type=int)
    logs = process_logs[service][-limit:] if limit > 0 else process_logs[service]
    
    return jsonify({
        'success': True,
        'service': service,
        'logs': logs
    })

@app.route('/api/services/status', methods=['GET'])
def get_all_statuses():
    # Atualizar status de todos os processos
    for service, process in processes.items():
        if process is not None and process.poll() is None:
            service_status[service] = 'running'
        else:
            service_status[service] = 'stopped'
            processes[service] = None
    
    return jsonify({
        'success': True,
        'services': service_status
    })

@app.route('/api/start/all', methods=['POST'])
def start_all_services():
    results = {}
    
    success, message = start_shopee_backend()
    results['shopee_backend'] = {'success': success, 'message': message}
    
    time.sleep(1)  # Pequeno delay para o backend iniciar antes
    
    success, message = start_shopee_frontend()
    results['shopee_frontend'] = {'success': success, 'message': message}
    
    success, message = start_venda_shopee()
    results['venda_shopee'] = {'success': success, 'message': message}
    
    return jsonify({
        'success': True,
        'results': results
    })

@app.route('/api/stop/all', methods=['POST'])
def stop_all_services():
    results = {}
    
    for service in processes:
        if processes[service] is not None and processes[service].poll() is None:
            success, message = stop_process(service)
            results[service] = {'success': success, 'message': message}
        else:
            results[service] = {'success': True, 'message': f'Serviço {service} já está parado'}
    
    return jsonify({
        'success': True,
        'results': results
    })

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

# Limpar processos na saída
def cleanup():
    for service, process in processes.items():
        if process is not None and process.poll() is None:
            try:
                if os.name == 'nt':  # Windows
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)])
                else:
                    process.terminate()
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        process.kill()
            except:
                pass

# WebSocket para transmissão de logs em tempo real
@socketio.on('connect')
def handle_connect():
    print('Cliente conectado')

@socketio.on('disconnect')
def handle_disconnect():
    print('Cliente desconectado')

@socketio.on('request_logs')
def handle_request_logs(data):
    service = data.get('service')
    if service in process_logs:
        # Enviar logs existentes
        limit = data.get('limit', 100)
        logs = process_logs[service][-limit:] if limit > 0 else process_logs[service]
        emit('initial_logs', {'service': service, 'logs': logs})

# Função principal
def main():
    try:
        # Importar socket apenas quando necessário para verificar portas
        import socket
        
        # Registrar handlers para limpeza de processos
        signal.signal(signal.SIGINT, lambda sig, frame: cleanup())
        signal.signal(signal.SIGTERM, lambda sig, frame: cleanup())
        
        # Registrar atexit para limpeza
        import atexit
        atexit.register(cleanup)
        
        # Verificar se os diretórios de templates existem
        template_dir = os.path.join(BASE_DIR, 'control_panel', 'templates')
        static_dir = os.path.join(BASE_DIR, 'control_panel', 'static')
        
        if not os.path.exists(template_dir):
            os.makedirs(template_dir)
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
            os.makedirs(os.path.join(static_dir, 'css'))
            os.makedirs(os.path.join(static_dir, 'js'))
        
        # Iniciar o servidor Flask com WebSocket
        host = '0.0.0.0'
        port = 8080
        
        print(f"Iniciando Painel de Controle em http://localhost:{port}")
        webbrowser.open(f"http://localhost:{port}")
        
        socketio.run(app, host=host, port=port, debug=False)
        
    except KeyboardInterrupt:
        cleanup()
        print("Painel de controle encerrado")

if __name__ == '__main__':
    main()
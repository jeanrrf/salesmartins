import os
import subprocess
import threading
import time
import webbrowser
from os import environ
import http.server
import socketserver
import logging
import sys
import venv
import psutil  # Add this import at the top

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SENTINNELL")

# Configurações do servidor
FRONTEND_PORT = int(environ.get('FRONTEND_PORT', 8000))
BACKEND_PORT = int(environ.get('BACKEND_PORT', 5000))
LOCALHOST = "127.0.0.1"
HOST = environ.get('HOST', LOCALHOST)

def get_script_dir():
    """Retorna o diretório do script independente do sistema operacional."""
    return os.path.dirname(os.path.abspath(__file__))

def convert_windows_path(path):
    """Converte caminhos Windows para formato Git Bash."""
    if os.name == "nt" and os.environ.get("MSYSTEM"):  # Detecta Git Bash
        return path.replace("\\", "/").replace("C:", "/c").replace("D:", "/d")
    return path

def ensure_venv():
    """Verifica e ativa o ambiente virtual se necessário."""
    venv_path = os.path.join(get_script_dir(), ".venv")
    
    if not os.path.exists(venv_path):
        logger.info("Criando ambiente virtual...")
        venv.create(venv_path, with_pip=True)
    
    # Determina o Python executável correto para o ambiente
    if os.name == "nt":
        python_exe = os.path.join(venv_path, "Scripts", "python.exe")
        if os.environ.get("MSYSTEM"):  # Git Bash
            python_exe = convert_windows_path(python_exe)
    else:
        python_exe = os.path.join(venv_path, "bin", "python")
    
    if not os.path.exists(python_exe.replace("/", os.sep)):
        logger.error(f"Python executável não encontrado em: {python_exe}")
        raise FileNotFoundError(f"Python executável não encontrado")
    
    # Atualiza sys.executable
    sys.executable = python_exe
    
    # Ativa o ambiente virtual
    activate_this = os.path.join(
        venv_path,
        "Scripts" if os.name == "nt" else "bin",
        "activate_this.py"
    )
    
    if os.path.exists(activate_this):
        try:
            with open(activate_this) as f:
                exec(f.read(), {'__file__': activate_this})
            logger.info("Ambiente virtual ativado.")
            
            # Set environment variables for category loading
            os.environ['PYTHONPATH'] = os.path.dirname(get_script_dir())
            os.environ['CATEGORIA_PATH'] = os.path.join(get_script_dir(), 'backend', 'CATEGORIA.json')
            
        except Exception as e:
            logger.error(f"Erro ao ativar ambiente virtual: {e}")
            logger.warning("Continuando sem ambiente virtual...")
    else:
        logger.warning("Arquivo de ativação não encontrado. Continuando sem venv...")

def install_dependencies():
    """Instala as dependências do arquivo requirements.txt."""
    ensure_venv()
    logger.info("Instalando dependências...")
    try:
        subprocess.check_call([
            sys.executable,
            "-m", "pip",
            "install",
            "-r",
            "requirements.txt"
        ])
        logger.info("Dependências instaladas com sucesso.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Erro ao instalar dependências: {e}")
        raise

def check_server_available(port, timeout=5):
    """Verifica se um servidor está disponível na porta especificada."""
    import socket
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection((LOCALHOST, port), timeout=1):
                return True
        except (ConnectionRefusedError, socket.timeout):
            time.sleep(0.1)
    return False

def ensure_data_dir():
    """Ensure data directory exists and is writable."""
    data_dir = os.path.join(get_script_dir(), "data")
    db_path = os.path.join(data_dir, "shopee-analytics.db")
    
    if not os.path.exists(data_dir):
        logger.info("Criando diretório de dados...")
        os.makedirs(data_dir)
    
    if os.path.exists(db_path):
        logger.info("Banco de dados existente encontrado em: %s", db_path)
    else:
        logger.info("Novo banco de dados será criado em: %s", db_path)
        
    return data_dir

def open_terminal(command, title, cwd=None):
    """Abre um novo terminal com o comando especificado."""
    if os.name == "nt":  # Windows
        if os.environ.get("MSYSTEM"):  # Git Bash
            terminal_cmd = f'start bash -c "{command}"'
        else:
            # Escape quotes for cmd
            escaped_command = command.replace('"', '\\"')
            terminal_cmd = f'start cmd /k "title {title} && {escaped_command}"'
    else:  # Linux/Mac
        terminal_cmd = f'gnome-terminal --title="{title}" -- bash -c "{command}"'
    
    subprocess.Popen(terminal_cmd, shell=True, cwd=cwd)

def kill_process_on_port(port):
    """Kill any process running on the specified port."""
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.connections():
                if conn.laddr.port == port:
                    logger.info(f"Killing process {proc.info['pid']} on port {port}")
                    if os.name == 'nt':
                        subprocess.run(['taskkill', '/F', '/PID', str(proc.info['pid'])], capture_output=True)
                    else:
                        proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

def serve_frontend():
    """Inicia o servidor frontend em um terminal separado."""
    kill_process_on_port(FRONTEND_PORT)
    directory = os.path.join(os.getcwd(), "frontend")
    command = f'python -m http.server {FRONTEND_PORT}'
    
    open_terminal(command, "Frontend Server", directory)
    logger.info(f"Servidor frontend iniciado em http://{LOCALHOST}:{FRONTEND_PORT}")

def serve_backend():
    """Inicia o servidor backend em um terminal separado."""
    kill_process_on_port(BACKEND_PORT)
    backend_dir = os.path.join(os.getcwd(), "backend")
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir
    
    # Set database directory
    data_dir = ensure_data_dir()
    db_path = os.path.join(data_dir, "shopee-analytics.db")
    
    # Configure log file for backend
    log_dir = os.path.join(get_script_dir(), "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Adiciona flag para não recriar o banco se já existe e configura logging
    if os.environ.get("MSYSTEM"):  # Git Bash
        command = f'DB_PATH="{db_path}" PRESERVE_DB=1 LOG_LEVEL=debug uvicorn api:app --host {LOCALHOST} --port {BACKEND_PORT} --reload --log-level debug'
    else:
        command = f'set DB_PATH={db_path}&& set PRESERVE_DB=1&& set LOG_LEVEL=debug&& uvicorn api:app --host {LOCALHOST} --port {BACKEND_PORT} --reload --log-level debug' if os.name == "nt" else f'DB_PATH="{db_path}" PRESERVE_DB=1 LOG_LEVEL=debug uvicorn api:app --host {LOCALHOST} --port {BACKEND_PORT} --reload --log-level debug'
    
    open_terminal(command, "Backend Server", backend_dir)
    logger.info(f"Servidor backend iniciado em http://{LOCALHOST}:{BACKEND_PORT}")

if __name__ == "__main__":
    try:
        # Add psutil to requirements if not present
        with open("requirements.txt", "a+") as f:
            f.seek(0)
            requirements = f.read()
            if "psutil" not in requirements:
                f.write("\npsutil>=5.9.0\n")
        
        # Instalar dependências
        install_dependencies()

        # Iniciar servidores em terminais separados
        serve_backend()
        time.sleep(2)  # Aguarda um pouco para o backend inicializar
        serve_frontend()

        # Abrir o frontend no navegador
        webbrowser.open(f"http://{LOCALHOST}:{FRONTEND_PORT}")

        # Aguardar input do usuário para encerrar
        print("\nPressione Ctrl+C para encerrar os servidores...")
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        logger.info("\nEncerrando o script...")
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
    finally:
        logger.info("Script encerrado. Feche os terminais manualmente.")
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
        with open(activate_this) as f:
            exec(f.read(), {'__file__': activate_this})
            logger.info("Ambiente virtual ativado.")
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
    if not os.path.exists(data_dir):
        logger.info("Criando diretório de dados...")
        os.makedirs(data_dir)
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

def serve_frontend():
    """Inicia o servidor frontend em um terminal separado."""
    directory = os.path.join(os.getcwd(), "frontend")
    command = f'python -m http.server {FRONTEND_PORT}'
    
    open_terminal(command, "Frontend Server", directory)
    logger.info(f"Servidor frontend iniciado em http://{LOCALHOST}:{FRONTEND_PORT}")

def serve_backend():
    """Inicia o servidor backend em um terminal separado."""
    backend_dir = os.path.join(os.getcwd(), "backend")
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir
    
    # Set database directory
    data_dir = ensure_data_dir()
    db_path = os.path.join(data_dir, "shopee-analytics.db")
    
    command = f'uvicorn api:app --host {LOCALHOST} --port {BACKEND_PORT} --reload'
    if os.environ.get("MSYSTEM"):  # Git Bash
        command = f'DB_PATH="{db_path}" {command}'
    else:
        command = f'set DB_PATH={db_path} && {command}' if os.name == "nt" else f'DB_PATH="{db_path}" {command}'
    
    open_terminal(command, "Backend Server", backend_dir)
    logger.info(f"Servidor backend iniciado em http://{LOCALHOST}:{BACKEND_PORT}")

if __name__ == "__main__":
    try:
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
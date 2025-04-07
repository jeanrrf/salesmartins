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
BACKEND_PORT = int(environ.get('BACKEND_PORT', 8001))
LOCALHOST = "127.0.0.1"
HOST = environ.get('HOST', LOCALHOST)

# CORS configuration
ALLOWED_ORIGINS = [
    f"http://{LOCALHOST}:{FRONTEND_PORT}",
    f"http://{LOCALHOST}:{BACKEND_PORT}",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
]

# Add these variables at the top with other global variables
FRONTEND_PROCESS = None
BACKEND_PROCESS = None

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
            
            # Update environment variables with absolute paths
            base_dir = get_script_dir()
            os.environ['PYTHONPATH'] = base_dir
            os.environ['CATEGORIA_PATH'] = os.path.join(base_dir, 'backend', 'CATEGORIA.json')
            
            # Validate categoria.json exists and is valid
            categoria_path = os.environ['CATEGORIA_PATH']
            if os.path.exists(categoria_path):
                try:
                    with open(categoria_path, 'r', encoding='utf-8') as f:
                        import json
                        categories = json.load(f)
                        if not isinstance(categories, list):
                            logger.error("CATEGORIA.json deve conter uma lista de categorias")
                            raise ValueError("Invalid category file format")
                        logger.info(f"Arquivo de categorias validado: {len(categories)} categorias carregadas")
                except Exception as e:
                    logger.error(f"Erro ao validar arquivo de categorias: {e}")
                    raise
            else:
                logger.error(f"Arquivo de categorias não encontrado: {categoria_path}")
                raise FileNotFoundError(f"Category file not found: {categoria_path}")
                
        except Exception as e:
            logger.error(f"Erro ao ativar ambiente virtual: {e}")
            logger.warning("Continuando sem ambiente virtual...")
    else:
        logger.warning("Arquivo de ativação não encontrado. Continuando sem venv...")

def ensure_pip():
    """Verifica e instala/atualiza o pip se necessário."""
    logger.info("Verificando instalação do pip...")
    try:
        # Verifica se pip está instalado
        subprocess.check_call([sys.executable, "-m", "pip", "--version"])
        
        # Atualiza pip para a última versão
        logger.info("Atualizando pip para a última versão...")
        subprocess.check_call([
            sys.executable, 
            "-m", 
            "pip", 
            "install",
            "--upgrade",
            "pip"
        ])
        logger.info("Pip atualizado com sucesso.")
    except subprocess.CalledProcessError as e:
        logger.error("Erro ao verificar/atualizar pip. Tentando instalar...")
        try:
            # Tenta instalar pip
            subprocess.check_call([
                sys.executable,
                "-m",
                "ensurepip",
                "--upgrade"
            ])
            logger.info("Pip instalado com sucesso.")
        except subprocess.CalledProcessError as e:
            logger.error(f"Falha ao instalar pip: {e}")
            raise

def install_dependencies():
    """Instala as dependências do arquivo requirements.txt."""
    ensure_venv()
    ensure_pip()  # Add this line to ensure pip is installed
    logger.info("Instalando dependências...")
    try:
        # First fix the CORS package name
        with open("requirements.txt", "r") as f:
            requirements = f.readlines()
        
        with open("requirements.txt", "w") as f:
            for req in requirements:
                # Replace incorrect CORS package with flask-cors
                if req.startswith("cors=="):
                    f.write("flask-cors>=3.0.10\n")
                else:
                    f.write(req)

        # Try installing dependencies
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
            # If installation fails, try installing core dependencies
            core_deps = [
                "fastapi",
                "uvicorn",
                "flask-cors",
                "psutil",
                "python-dotenv"
            ]
            logger.warning("Instalação completa falhou. Tentando instalar dependências core...")
            subprocess.check_call([
                sys.executable,
                "-m", "pip",
                "install"
            ] + core_deps)
            logger.info("Dependências core instaladas com sucesso.")

    except Exception as e:
        logger.error(f"Erro ao instalar dependências: {e}")
        logger.error("Tente instalar manualmente usando: pip install -r requirements.txt")
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

def kill_process_on_port(port):
    """Kill any process running on the specified port."""
    global FRONTEND_PROCESS, BACKEND_PROCESS
    
    # First try to terminate our own managed processes
    if port == FRONTEND_PORT and FRONTEND_PROCESS:
        FRONTEND_PROCESS.terminate()
        FRONTEND_PROCESS = None
    elif port == BACKEND_PORT and BACKEND_PROCESS:
        BACKEND_PROCESS.terminate()
        BACKEND_PROCESS = None
    
    # Then check for other processes on the port
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

class RequestLogHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        logger.info(f"🌐 Frontend Request: {args[0]} {args[1]} - Status: {args[2]}")

def launch_in_new_console(command, cwd, env=None, title=None):
    """Launch a process in a new console window."""
    if os.name == 'nt':  # Windows
        if title:
            command = ['cmd', '/k', f'title {title} && '] + command
        else:
            command = ['cmd', '/k'] + command
        # CREATE_NEW_CONSOLE flag for Windows
        creationflags = subprocess.CREATE_NEW_CONSOLE
    else:  # Linux/Mac
        if title:
            command = ['gnome-terminal', '--title', title, '--', 'bash', '-c', ' '.join(command)]
        else:
            command = ['gnome-terminal', '--', 'bash', '-c', ' '.join(command)]
        creationflags = 0

    return subprocess.Popen(
        command,
        cwd=cwd,
        env=env,
        creationflags=creationflags if os.name == 'nt' else 0
    )

def serve_frontend():
    """Inicia o servidor frontend em nova janela."""
    global FRONTEND_PROCESS
    
    kill_process_on_port(FRONTEND_PORT)
    directory = os.path.join(os.getcwd(), "frontend")
    
    command = [sys.executable, "-m", "http.server", str(FRONTEND_PORT), "--bind", LOCALHOST]
    
    try:
        FRONTEND_PROCESS = launch_in_new_console(
            command,
            directory,
            title="Sentinnell Frontend Server"
        )
        logger.info(f"🌐 Frontend: http://{LOCALHOST}:{FRONTEND_PORT}")
        return True
    except Exception as e:
        logger.error(f"Erro ao iniciar frontend: {e}")
        return False

def serve_backend():
    """Inicia o servidor backend em nova janela."""
    global BACKEND_PROCESS
    
    kill_process_on_port(BACKEND_PORT)
    project_dir = os.getcwd()
    backend_dir = os.path.join(project_dir, "backend")
    env = os.environ.copy()
    
    # Set proper PYTHONPATH to include both project root and backend directory
    env['PYTHONPATH'] = os.pathsep.join([
        project_dir,
        backend_dir,
        env.get('PYTHONPATH', '')
    ])
    
    # Add backend directory to ensure relative imports work
    os.chdir(project_dir)
    sys.path.insert(0, project_dir)
    sys.path.insert(0, backend_dir)
    
    env["CORS_ALLOW_ORIGINS"] = ",".join(ALLOWED_ORIGINS)
    ensure_data_dir()
    
    command = [
        sys.executable,
        "-m", "uvicorn",
        "backend.api:app",
        "--host", LOCALHOST,
        "--port", str(BACKEND_PORT),
        "--reload",
        "--log-level", "info",
        "--reload-dir", backend_dir
    ]
    
    try:
        BACKEND_PROCESS = launch_in_new_console(
            command,
            project_dir,
            env=env,
            title="Sentinnell Backend Server"
        )
        logger.info(f"🚀 Backend API: http://{LOCALHOST}:{BACKEND_PORT}")
        return True
    except Exception as e:
        logger.error(f"Erro ao iniciar backend: {e}")
        return False

def monitor_servers():
    """Monitor server status without output monitoring."""
    try:
        while FRONTEND_PROCESS or BACKEND_PROCESS:
            if FRONTEND_PROCESS and FRONTEND_PROCESS.poll() is not None:
                logger.error("Frontend server stopped unexpectedly")
                return False
            if BACKEND_PROCESS and BACKEND_PROCESS.poll() is not None:
                logger.error("Backend server stopped unexpectedly")
                return False
            time.sleep(1)
    except KeyboardInterrupt:
        return False
    return True

if __name__ == "__main__":
    try:
        install_dependencies()
        if serve_backend() and serve_frontend():
            time.sleep(1)
            webbrowser.open(f"http://{LOCALHOST}:{FRONTEND_PORT}")
            print("\nServers running in separate windows. Press Ctrl+C to stop...\n")
            monitor_servers()
    except KeyboardInterrupt:
        logger.info("\nEncerrando os servidores...")
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
    finally:
        kill_process_on_port(FRONTEND_PORT)
        kill_process_on_port(BACKEND_PORT)
        logger.info("Servidores encerrados.")
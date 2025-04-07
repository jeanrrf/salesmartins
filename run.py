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

def serve_frontend():
    """Inicia o servidor frontend."""
    global FRONTEND_PROCESS
    
    kill_process_on_port(FRONTEND_PORT)
    directory = os.path.join(os.getcwd(), "frontend")
    
    command = [sys.executable, "-m", "http.server", str(FRONTEND_PORT), "--bind", LOCALHOST]
    
    try:
        FRONTEND_PROCESS = subprocess.Popen(
            command,
            cwd=directory,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        logger.info(f"🌐 Frontend: http://{LOCALHOST}:{FRONTEND_PORT}")
        return True
    except Exception as e:
        logger.error(f"Erro ao iniciar frontend: {e}")
        return False

def serve_backend():
    """Inicia o servidor backend."""
    global BACKEND_PROCESS
    
    kill_process_on_port(BACKEND_PORT)
    backend_dir = os.path.join(os.getcwd(), "backend")
    env = os.environ.copy()
    
    # Add backend directory to Python path
    if 'PYTHONPATH' in env:
        env['PYTHONPATH'] = f"{backend_dir}{os.pathsep}{env['PYTHONPATH']}"
    else:
        env['PYTHONPATH'] = backend_dir
        
    env["CORS_ALLOW_ORIGINS"] = ",".join(ALLOWED_ORIGINS)
    
    data_dir = ensure_data_dir()
    
    command = [
        sys.executable, 
        "-m", "uvicorn",
        "api:app",  # Changed from backend.api:app to api:app since we're setting PYTHONPATH
        "--host", LOCALHOST,
        "--port", str(BACKEND_PORT),
        "--reload",
        "--log-level", "info"
    ]
    
    try:
        BACKEND_PROCESS = subprocess.Popen(
            command,
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        logger.info(f"🚀 Backend API: http://{LOCALHOST}:{BACKEND_PORT}")
        return True
    except Exception as e:
        logger.error(f"Erro ao iniciar backend: {e}")
        return False

def monitor_output():
    """Monitora e exibe a saída dos processos."""
    while FRONTEND_PROCESS or BACKEND_PROCESS:
        if BACKEND_PROCESS:
            while line := BACKEND_PROCESS.stdout.readline():
                print(f"[Backend] {line}", end="")
        time.sleep(0.1)

if __name__ == "__main__":
    try:
        # Add psutil to requirements if not present
        with open("requirements.txt", "a+") as f:
            f.seek(0)
            requirements = f.read()
            if "psutil" not in requirements:
                f.write("\npsutil>=5.9.0\n")
        
        install_dependencies()

        # Iniciar servidores
        if serve_backend() and serve_frontend():
            time.sleep(1)  # Pequena pausa para inicialização
            webbrowser.open(f"http://{LOCALHOST}:{FRONTEND_PORT}")
            
            print("\nPressione Ctrl+C para encerrar os servidores...\n")
            
            # Monitorar saída dos servidores
            monitor_output()

    except KeyboardInterrupt:
        logger.info("\nEncerrando os servidores...")
        kill_process_on_port(FRONTEND_PORT)
        kill_process_on_port(BACKEND_PORT)
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
    finally:
        if FRONTEND_PROCESS:
            FRONTEND_PROCESS.terminate()
        if BACKEND_PROCESS:
            BACKEND_PROCESS.terminate()
        logger.info("Servidores encerrados.")
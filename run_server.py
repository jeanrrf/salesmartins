import os
import subprocess
import sys
import platform

# Add the project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Debugging: Print the Python path to verify
print("🔍 Python Path:", sys.path)

def clear_port(port):
    """Limpa a porta especificada."""
    try:
        if platform.system() == "Windows":
            subprocess.run(f"netstat -ano | findstr :{port}", shell=True, check=True, stdout=subprocess.PIPE)
            result = subprocess.run(f"netstat -ano | findstr :{port}", shell=True, stdout=subprocess.PIPE, text=True)
            lines = result.stdout.strip().split("\n")
            for line in lines:
                parts = line.split()
                pid = parts[-1]
                subprocess.run(f"taskkill /PID {pid} /F", shell=True, check=True)
        else:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, check=True)
        print(f"✅ Porta {port} limpa com sucesso.")
    except Exception as e:
        print(f"⚠️ Não foi possível limpar a porta {port}: {e}")

def install_dependencies():
    """Instala ou atualiza as dependências do projeto."""
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
        print("✅ Dependências instaladas/atualizadas com sucesso.")
    except Exception as e:
        print(f"⚠️ Erro ao instalar dependências: {e}")

def run_server():
    """Executa o servidor FastAPI."""
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"], check=True)
    except KeyboardInterrupt:
        print("\n❌ Execução interrompida pelo usuário.")
    except Exception as e:
        print(f"⚠️ Erro ao executar o servidor: {e}")

if __name__ == "__main__":
    print("🔄 Limpando a porta 3000...")
    clear_port(3000)
    print("🔄 Instalando/atualizando dependências...")
    install_dependencies()
    print("🚀 Iniciando o servidor...")
    run_server()

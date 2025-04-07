import os
import subprocess
import sys
import platform
import logging
import threading
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")

project_root = os.path.abspath(os.path.dirname(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def clear_port(port):
    try:
        if platform.system() == "Windows":
            result = subprocess.run(f"netstat -ano | findstr :{port}", shell=True, stdout=subprocess.PIPE, text=True)
            for line in result.stdout.strip().split("\n"):
                pid = line.split()[-1]
                subprocess.run(f"taskkill /PID {pid} /F", shell=True, check=True)
        else:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, check=True)
    except Exception as e:
        logging.warning(f"Unable to clear port {port}: {e}")

def install_dependencies():
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", os.path.join(project_root, "backend", "requirements.txt")], check=True)
    except Exception as e:
        logging.warning(f"Error installing dependencies: {e}")

def run_server():
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"], check=True)
    except Exception as e:
        logging.warning(f"Error running the server: {e}")

def monitor_traffic(port):
    """Monitora o tráfego em uma porta específica."""
    try:
        while True:
            result = subprocess.run(f"netstat -ano | findstr :{port}", shell=True, stdout=subprocess.PIPE, text=True)
            for line in result.stdout.strip().split("\n"):
                logging.info(f"Port {port} traffic: {line}")
            time.sleep(5)  # Monitorar a cada 5 segundos
    except Exception as e:
        logging.warning(f"Unable to monitor traffic on port {port}: {e}")

if __name__ == "__main__":
    install_dependencies()
    clear_port(3000)
    threading.Thread(target=monitor_traffic, args=(3000,), daemon=True).start()
    run_server()

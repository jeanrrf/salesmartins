import os
import subprocess
import sys
import platform
import logging
import threading
import time
import json
import http.server
import socketserver
from functools import partial

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
        # Also ensure axios is installed for frontend
        frontend_dir = os.path.join(project_root, "shopee-frontend")
        if os.path.exists(frontend_dir):
            logging.info("Checking frontend dependencies...")
            try:
                subprocess.run(["npm", "list", "axios"], cwd=frontend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            except Exception:
                logging.info("Installing axios for frontend...")
                subprocess.run(["npm", "install", "--save", "axios"], cwd=frontend_dir, check=True)
    except Exception as e:
        logging.warning(f"Error installing dependencies: {e}")

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler with CORS headers"""
    
    def __init__(self, *args, **kwargs):
        self.directory = kwargs.pop('directory', os.getcwd())
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Content-Type', 'application/json')
        super().end_headers()
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_mock_server(port, directory):
    """Start a simple HTTP server for mock data with CORS support"""
    try:
        handler = partial(CORSHTTPRequestHandler, directory=directory)
        httpd = socketserver.TCPServer(("", port), handler)
        logging.info(f"Starting mock data server on http://localhost:{port}")
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        return True
    except Exception as e:
        logging.error(f"Error starting mock server: {e}")
        return False

def setup_mock_api():
    """Create a simple mock API for frontend development"""
    mock_data_dir = os.path.join(project_root, "backend", "mock_data")
    os.makedirs(mock_data_dir, exist_ok=True)
    
    # Create mock products data
    products_data = {
        "data": [
            {
                "id": 1,
                "name": "Product 1",
                "price": 19.99,
                "imageUrl": "https://via.placeholder.com/150",
                "sales": 100,
                "commission": 5
            },
            {
                "id": 2,
                "name": "Product 2",
                "price": 29.99,
                "imageUrl": "https://via.placeholder.com/150",
                "sales": 200,
                "commission": 7
            }
        ]
    }
    
    with open(os.path.join(mock_data_dir, "products.json"), "w") as f:
        json.dump(products_data, f, indent=2)
        
    logging.info("Mock API data created successfully")
    return mock_data_dir

def run_server():
    try:
        # Set up mock API data
        mock_data_dir = setup_mock_api()
        
        # Update api_config
        api_config_path = os.path.join(project_root, "backend", "api_config.json")
        api_config = {
            "API_BASE_URL": "http://localhost:3000/api",
            "USE_MOCK_DATA": True,
            "MOCK_DATA_URL": "http://localhost:3000/mock_data",
            "SKIP_AUTH": True  # Add flag to skip authentication
        }
        with open(api_config_path, "w") as f:
            json.dump(api_config, f, indent=2)
        
        # Setup environment variables for cross-origin requests
        cors_env = {
            **os.environ,
            "CORS_ALLOW_ORIGINS": "*",
            "CORS_ALLOW_METHODS": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
            "CORS_ALLOW_HEADERS": "Content-Type,Authorization,X-Requested-With",
            "CORS_ALLOW_CREDENTIALS": "true",
            "SKIP_AUTH": "true",  # Add env var to skip authentication
            "CONTENT_TYPE": "application/json"  # Ensure content type is set properly
        }
        
        # Create or update .env file for FastAPI to use
        env_path = os.path.join(project_root, "backend", ".env")
        with open(env_path, "w") as env_file:
            env_file.write("CORS_ALLOW_ORIGINS=*\n")
            env_file.write("CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH\n")
            env_file.write("CORS_ALLOW_HEADERS=Content-Type,Authorization,X-Requested-With\n")
            env_file.write("CORS_ALLOW_CREDENTIALS=true\n")
            env_file.write("SKIP_AUTH=true\n")
                
        # Start the frontend in a separate thread (if available)
        frontend_dir = os.path.join(project_root, "shopee-frontend")
        if os.path.exists(frontend_dir):
            logging.info("Starting frontend application...")
            frontend_thread = threading.Thread(
                target=lambda: subprocess.run(
                    ["npm", "start"], 
                    cwd=frontend_dir, 
                    env={**os.environ, "PORT": "3001", "NODE_OPTIONS": "--openssl-legacy-provider", "SKIP_AUTH": "true"}
                ),
                daemon=True
            )
            frontend_thread.start()
            logging.info("Frontend should be available at http://localhost:3001")
                
        # Run server with CORS enabled
        logging.info("Starting backend server on port 3000...")
        subprocess.run(
            [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"],
            env=cors_env,
            check=True
        )
    except Exception as e:
        logging.error(f"Error running the server: {str(e)}")
        
        if "Address already in use" in str(e):
            logging.error("Port 3000 is already in use. Try clearing it with --clear-port flag.")
        elif "No module named" in str(e):
            logging.error("Missing Python module. Try reinstalling dependencies.")
        
        # Try to start a fallback HTTP server for static files
        try:
            from http.server import HTTPServer, SimpleHTTPRequestHandler
            from functools import partial
            
            class CORSRequestHandler(SimpleHTTPRequestHandler):
                def end_headers(self):
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                    super().end_headers()
                
                def do_OPTIONS(self):
                    self.send_response(200)
                    self.end_headers()
            
            logging.info("Starting fallback HTTP server...")
            handler = partial(CORSRequestHandler, directory=project_root)
            httpd = HTTPServer(('0.0.0.0', 3000), handler)
            logging.info("Fallback server running on http://localhost:3000")
            httpd.serve_forever()
        except Exception as fallback_err:
            logging.error(f"Fallback server also failed: {fallback_err}")

def monitor_traffic(port):
    """Monitora o tráfego em uma porta específica."""
    try:
        while True:
            result = subprocess.run(f"netstat -ano | findstr :{port}", shell=True, stdout=subprocess.PIPE, text=True)
            for line in result.stdout.strip().split("\n"):
                if line:  # Only log if there's actual content
                    logging.info(f"Port {port} traffic: {line}")
            time.sleep(5)  # Monitorar a cada 5 segundos
    except Exception as e:
        logging.warning(f"Unable to monitor traffic on port {port}: {e}")

if __name__ == "__main__":
    # Parse arguments for additional options
    import argparse
    parser = argparse.ArgumentParser(description='Run the Shopee API server')
    parser.add_argument('--clear-port', action='store_true', help='Clear the port before starting')
    parser.add_argument('--skip-deps', action='store_true', help='Skip installing dependencies')
    args = parser.parse_args()
    
    # Install dependencies unless skipped
    if not args.skip_deps:
        install_dependencies()
    
    # Clear port if requested
    if args.clear_port:
        clear_port(3000)
        
    # Start monitoring in a separate thread
    threading.Thread(target=monitor_traffic, args=(3000,), daemon=True).start()
    
    # Run the server
    run_server()

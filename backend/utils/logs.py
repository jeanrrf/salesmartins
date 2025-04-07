import logging
import os

def setup_api_logs():
    """Configura logs exclusivos para monitorar o backend."""
    log_dir = "./logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "api.log")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    logging.info("✅ Logs configurados com sucesso. Servidor iniciado.")

def setup_traffic_logs():
    """Configura logs para monitorar tráfego de API."""
    log_dir = "./logs"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "api_traffic.log")

    traffic_logger = logging.getLogger("API_Traffic")
    traffic_logger.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    traffic_logger.addHandler(file_handler)

    logging.info("✅ API traffic logger configurado com sucesso.")
    return traffic_logger

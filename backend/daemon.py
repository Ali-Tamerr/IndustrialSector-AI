import time
import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

from agent import MqttTelemetryIngestor, logger

def run_daemon():
    logger.info("==========================================================================")
    logger.info("Industrial AI System: Starting MQTT Telemetry Ingestor Background Daemon")
    logger.info("==========================================================================")
    
    # Initialize the MQTT telemetry ingestor
    ingestor = MqttTelemetryIngestor()
    try:
        ingestor.start()
        logger.info("[Daemon] MQTT Ingestor running. Listening for real-time telemetry...")
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("[Daemon] KeyboardInterrupt received. Stopping background MQTT Ingestor...")
        ingestor.stop()
    except Exception as e:
        logger.error(f"[Daemon] Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Load environment variables
    dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if not os.path.exists(dotenv_path):
        dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path, override=True)
    
    run_daemon()

import os
import sys
import json
import datetime
import random
import logging
from typing import Dict, List, Any, Optional, Tuple

# Set up logging for agent-to-agent transitions and tool execution
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("IndustrialOrchestrator")

from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), ".env")

DATABASE_URL = None
CHROMA_HOST = None
CHROMA_API_KEY = None
CHROMA_TENANT = None
CHROMA_DATABASE = None
GEMINI_API_KEY = None
_genai_client = None
HAS_GEMINI_SDK = False

try:
    from google import genai
    HAS_GEMINI_SDK = True
except ImportError:
    logger.warning("google-genai package not found.")

def reload_env_vars():
    global DATABASE_URL, CHROMA_HOST, CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE, GEMINI_API_KEY, _genai_client
    home_dir = os.path.expanduser("~")
    app_env_path = os.path.join(home_dir, ".industrial_control_tower", ".env")
    if os.path.exists(app_env_path):
        load_dotenv(app_env_path, override=True)
    else:
        load_dotenv(dotenv_path, override=True)

    DATABASE_URL = os.getenv("DATABASE_URL")
    CHROMA_HOST = os.getenv("CHROMA_HOST", "api.trychroma.com")
    CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
    CHROMA_TENANT = os.getenv("CHROMA_TENANT")
    CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "IndustrialSector")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
    
    if HAS_GEMINI_SDK and GEMINI_API_KEY:
        try:
            _genai_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to configure Gemini Client: {e}")
            _genai_client = None
    else:
        _genai_client = None

# Initial load
reload_env_vars()

if not HAS_GEMINI_SDK or not GEMINI_API_KEY:
    logger.warning("Google AI Studio SDK is not fully configured (missing package or API key). Running in Smart LLM Emulator fallback mode.")

# Import psycopg2
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    logger.error("psycopg2 is not installed. Please install it using 'pip install psycopg2-binary'")
    sys.exit(1)

# Import chromadb
try:
    import chromadb
    from chromadb.utils import embedding_functions
except ImportError:
    logger.error("chromadb is not installed. Please install it using 'pip install chromadb'")
    sys.exit(1)


# ==============================================================================
# DATABASE CONNECTIONS
# ==============================================================================

def get_postgres_connection():
    """Establishes connection to PostgreSQL using the DATABASE_URL."""
    reload_env_vars()
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is missing from .env!")
    return psycopg2.connect(DATABASE_URL)


def get_chroma_client():
    """Connects to the Chroma DB client using TryChroma Cloud or local persistent fallback."""
    if CHROMA_API_KEY and CHROMA_TENANT:
        try:
            if hasattr(chromadb, "CloudClient"):
                return chromadb.CloudClient(
                    tenant=CHROMA_TENANT,
                    database=CHROMA_DATABASE,
                    api_key=CHROMA_API_KEY,
                    cloud_host=CHROMA_HOST or "api.trychroma.com"
                )
            else:
                from chromadb.config import Settings
                return chromadb.HttpClient(
                    host=CHROMA_HOST or "api.trychroma.com",
                    tenant=CHROMA_TENANT or "default",
                    database=CHROMA_DATABASE or "default",
                    settings=Settings(
                        chroma_client_auth_provider="chromadb.auth.token_authn.TokenHeaderAuthClientProvider",
                        chroma_client_auth_credentials=CHROMA_API_KEY
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to connect to Chroma Cloud: {e}. Falling back to local/ephemeral client.")
    
    # Local fallback
    try:
        return chromadb.PersistentClient(path="./chroma_db")
    except Exception:
        return chromadb.EphemeralClient()


# Ensure PostgreSQL database check constraint supports 'Pending_Sourcing' status
def verify_schema_constraints():
    """Alters the PostgreSQL maintenance_orders status check constraint to support 'Pending_Sourcing'."""
    logger.info("[Database] Verifying and updating schema constraints for 'Pending_Sourcing' status...")
    conn = None
    try:
        conn = get_postgres_connection()
        with conn.cursor() as cursor:
            # Check if constraint exists, drop and re-create to support 'Pending_Sourcing'
            cursor.execute("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'maintenance_orders' AND constraint_name = 'chk_maintenance_status';
            """)
            if cursor.fetchone():
                logger.info("[Database] Updating existing constraint 'chk_maintenance_status' to include 'Pending_Sourcing'...")
                cursor.execute("ALTER TABLE maintenance_orders DROP CONSTRAINT chk_maintenance_status;")
            
            cursor.execute("""
                ALTER TABLE maintenance_orders 
                ADD CONSTRAINT chk_maintenance_status 
                CHECK (status IN ('Pending', 'Approved', 'Dispatched', 'Pending_Sourcing', 'Dispatched_Sourcing_Active'));
            """)
            conn.commit()
            logger.info("[Database] Constraint 'chk_maintenance_status' updated successfully.")
    except Exception as e:
        logger.error(f"[Database] Failed to update schema constraints: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


def run_diagnostic_mapping(temp: float, vib: float, pres: float, cur: float, thresholds: Dict[str, float]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns (diagnosed_component, anomaly_signature, required_part_id) based on combinations:
    1. High Winding Temp + High Coil Amperage -> Flag 'Stator Winding Insulation Breakdown' (PART-004)
    2. High Radial Vibration alone or with Temperature -> Flag 'Rotor Shaft Bearing Failure' (PART-001)
    3. Low/Fluctuating Discharge Pressure + High Coil Amperage -> Flag 'Compression Cylinder Seal Blowby' (PART-002)
    4. Erratic Coil Amperage Spikes -> Flag 'Electrical Commutator Fault' (PART-004)
    """
    t_limit = thresholds.get("temperature", 80.0)
    v_limit = thresholds.get("vibration", 8.0)
    p_limit = thresholds.get("pressure", 5.0)
    c_limit = thresholds.get("current", 15.0)
    
    high_temp = t_limit > 0.0 and temp > t_limit
    high_vib = v_limit > 0.0 and vib > v_limit
    high_curr = c_limit > 0.0 and cur > c_limit
    low_pres = p_limit > 0.0 and pres < p_limit
    
    # Check combinations
    if high_temp and high_curr:
        return "Stator Winding Insulation Breakdown", "High Winding Temp + High Coil Amperage", "PART-004"
    elif high_vib:
        return "Rotor Shaft Bearing Failure", "High Radial Vibration alone or with Temperature", "PART-001"
    elif low_pres and high_curr:
        return "Compression Cylinder Seal Blowby", "Low/Fluctuating Discharge Pressure + High Coil Amperage", "PART-002"
    elif high_curr and cur > c_limit * 1.25: # Erratic spike
        return "Electrical Commutator Fault", "Erratic Coil Amperage Spikes", "PART-004"
    
    # Default fallbacks if it's general anomalies
    if high_temp:
        return "Stator Winding Insulation Breakdown", "High Winding Temp", "PART-004"
    if low_pres:
        return "Compression Cylinder Seal Blowby", "Low Discharge Pressure", "PART-002"
    if high_curr:
        return "Electrical Commutator Fault", "High Coil Amperage", "PART-004"
        
    return None, None, None


# ==============================================================================
# SMART LLM EMULATOR FALLBACK
# ==============================================================================

class SmartLLMEmulator:
    """
    A deterministic, highly intelligent emulator that mimics LLM tool decisions,
    RAG synthesis, and structured JSON outputs. This ensures the system runs
    perfectly out-of-the-box even if no GEMINI_API_KEY is supplied.
    """
    @staticmethod
    def evaluate_anomaly(machine_id: str, machine_name: str, telemetry: List[Dict[str, Any]], thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Mimics the Anomaly Detection Agent's LLM analysis."""
        temps = [t['temperature'] for t in telemetry]
        vibs = [t['vibration'] for t in telemetry]
        pressures = [t['pressure'] for t in telemetry]
        currents = [t['current'] for t in telemetry]
        
        latest_temp = temps[-1] if temps else 0.0
        latest_vib = vibs[-1] if vibs else 0.0
        latest_pres = pressures[-1] if pressures else 0.0
        latest_cur = currents[-1] if currents else 0.0
        
        # Run diagnostic mapping to check for threshold breach
        diag_comp, anom_sig, part_needed = run_diagnostic_mapping(latest_temp, latest_vib, latest_pres, latest_cur, thresholds)
        
        if diag_comp:
            explanation = f"Empirical telemetry analysis for '{machine_name}' confirms operating anomaly: {anom_sig}. Localized component breakdown: {diag_comp}."
            return {
                "is_anomaly": True,
                "machine_id": machine_id,
                "severity": "Critical" if (latest_temp > thresholds.get("temperature", 80.0)*1.15 or latest_vib > thresholds.get("vibration", 8.0)*1.15) else "Degraded",
                "explanation": explanation,
                "diagnosed_component": diag_comp,
                "anomaly_signature": anom_sig,
                "required_replacement_part": part_needed
            }
            
        # Delta calculations for trends
        temp_delta = temps[-1] - temps[0] if temps else 0
        vib_delta = vibs[-1] - vibs[0] if vibs else 0
        
        is_anomaly = False
        reasons = []
        severity = "Healthy"
        
        # Trend checks
        t_limit = thresholds.get('temperature', 0.0)
        if t_limit > 0.0 and temp_delta > 15.0 and temps[-1] > t_limit * 0.8:
            is_anomaly = True
            severity = "Degraded"
            reasons.append(f"Statistical Anomaly: High thermal ramp rate detected (+{temp_delta:.2f}°C).")
            diag_comp = "Stator Winding Insulation Breakdown"
            anom_sig = "High thermal ramp rate detected"
            part_needed = "PART-004"
        
        v_limit = thresholds.get('vibration', 0.0)
        if not is_anomaly and v_limit > 0.0 and vib_delta > 3.0 and vibs[-1] > v_limit * 0.7:
            is_anomaly = True
            severity = "Degraded"
            reasons.append(f"Statistical Anomaly: High vibration acceleration slope detected (+{vib_delta:.2f} mm/s).")
            diag_comp = "Rotor Shaft Bearing Failure"
            anom_sig = "High vibration acceleration slope detected"
            part_needed = "PART-001"
            
        if is_anomaly:
            explanation = f"Statistical telemetry analysis for '{machine_name}' confirms operating anomaly. " + " ".join(reasons)
            return {
                "is_anomaly": True,
                "machine_id": machine_id,
                "severity": severity,
                "explanation": explanation,
                "diagnosed_component": diag_comp,
                "anomaly_signature": anom_sig,
                "required_replacement_part": part_needed
            }
        else:
            return {
                "is_anomaly": False,
                "machine_id": machine_id,
                "severity": "Healthy",
                "explanation": f"All readings within nominal limits."
            }

    @staticmethod
    def diagnose_fault(machine_id: str, telemetry: List[Dict[str, Any]], rag_context: str, diagnosed_component: Optional[str] = None, required_replacement_part: Optional[str] = None) -> Dict[str, Any]:
        """Mimics the Diagnostic & Root Cause Agent's LLM analysis over manual RAG text."""
        if diagnosed_component and required_replacement_part:
            detected_fault = diagnosed_component
            part_needed = required_replacement_part
            rul = 12 if "Bearing" in diagnosed_component else (24 if "Seal" in diagnosed_component else 36)
        else:
            # Map specific machine IDs to their corresponding RAG faults
            if machine_id == "MCH-001":
                detected_fault = "Rotary gear pump main bearing cage wear and localized race friction"
                part_needed = "PART-001"
                rul = 36
            elif machine_id == "MCH-002":
                detected_fault = "AC stator winding thermal overload and structural blade imbalance"
                part_needed = "PART-004"
                rul = 48
            elif machine_id == "MCH-003":
                detected_fault = "Centrifugal impeller cavitation leading to hydraulic seal fracture"
                part_needed = "PART-002"
                rul = 24
            else:
                detected_fault = "Standard mechanical wear and operating friction"
                part_needed = "PART-001"
                rul = 72
            
        # Refine remaining useful life based on telemetry severity (e.g. vibration magnitude)
        max_vib = max([t['vibration'] for t in telemetry]) if telemetry else 0.0
        if max_vib > 9.5:
            rul = int(rul * 0.3)  # Rapidly degrading!
        elif max_vib > 8.0:
            rul = int(rul * 0.6)
            
        return {
            "detected_fault": detected_fault,
            "remaining_useful_life_hours": rul,
            "required_replacement_part": part_needed
        }


# ==============================================================================
# 1. ANOMALY DETECTION AGENT (EVALUATOR)
# ==============================================================================

class AnomalyDetectionAgent:
    """
    Evaluator Agent: Periodically queries PostgreSQL sensor_telemetry and evaluates
    if a machine has crossed rules or shows statistical anomaly trends.
    Uses structured reasoning combining rules and LLM validation.
    """
    def __init__(self, use_llm: bool = (HAS_GEMINI_SDK and GEMINI_API_KEY is not None)):
        self.use_llm = use_llm
        self.agent_name = "Machine Checker Agent"

    def scan_fleet_telemetry(self, conn) -> List[Dict[str, Any]]:
        """Scans PostgreSQL telemetry for all machines and detects anomalies."""
        logger.info(f"[{self.agent_name}] Initiating telemetry fleet scan...")
        anomalies_detected = []
        
        # 1. Fetch all machines and their thresholds
        machines = []
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id, name, location, status, critical_thresholds FROM machines;")
            machines = cursor.fetchall()
            
        # Batch load latest 10 telemetry points for all machines
        telemetry_by_machine = {}
        logger.info(f"[{self.agent_name}] Batch loading telemetry records for the fleet...")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, machine_id, timestamp, temperature, vibration, pressure, current 
                FROM (
                    SELECT id, machine_id, timestamp, temperature, vibration, pressure, current,
                           ROW_NUMBER() OVER (PARTITION BY machine_id ORDER BY timestamp DESC) as rn
                    FROM sensor_telemetry
                ) t
                WHERE rn <= 10;
            """)
            rows = cursor.fetchall()
            for r in rows:
                m_id = r['machine_id']
                if m_id not in telemetry_by_machine:
                    telemetry_by_machine[m_id] = []
                telemetry_by_machine[m_id].append(r)
            
        for m in machines:
            machine_id = m['id']
            machine_name = m['name']
            thresholds = m['critical_thresholds']
            
            telemetry = list(telemetry_by_machine.get(machine_id, []))
            
            if not telemetry:
                logger.warning(f"[{self.agent_name}] No telemetry found for machine {machine_id}.")
                continue
                
            # Reverse telemetry to chronological order
            telemetry.reverse()
            
            # 2. Evaluate anomaly (LLM vs Emulator fallback)
            logger.info(f"[{self.agent_name}] Evaluating machine {machine_name} ({machine_id})...")
            
            evaluation = None
            if self.use_llm:
                evaluation = self._evaluate_with_llm(machine_id, machine_name, telemetry, thresholds)
            else:
                evaluation = SmartLLMEmulator.evaluate_anomaly(machine_id, machine_name, telemetry, thresholds)
                
            # Ensure programmatic physical combinations (Task 2) override and map correctly
            latest_point = telemetry[-1]
            d_comp, a_sig, p_needed = run_diagnostic_mapping(
                latest_point['temperature'], 
                latest_point['vibration'], 
                latest_point['pressure'], 
                latest_point['current'], 
                thresholds
            )
            if d_comp:
                evaluation['is_anomaly'] = True
                evaluation['severity'] = evaluation.get('severity') if evaluation.get('severity') != 'Healthy' else 'Degraded'
                evaluation['diagnosed_component'] = d_comp
                evaluation['anomaly_signature'] = a_sig
                evaluation['required_replacement_part'] = p_needed
                
            logger.info(f"[{self.agent_name}] Machine {machine_id} Evaluation: Anomaly={evaluation['is_anomaly']}, Severity={evaluation['severity']}")
            
            if evaluation['is_anomaly']:
                # Update PostgreSQL machine status
                with conn.cursor() as cursor:
                    cursor.execute(
                        "UPDATE machines SET status = %s, updated_at = NOW() WHERE id = %s;",
                        (evaluation['severity'], machine_id)
                    )
                    
                    # Update diagnosed_component and anomaly_signature in sensor_telemetry
                    latest_id = telemetry[-1]['id']
                    diag_comp = evaluation.get("diagnosed_component")
                    anom_sig = evaluation.get("anomaly_signature")
                    if diag_comp:
                        cursor.execute(
                            "UPDATE sensor_telemetry SET diagnosed_component = %s, anomaly_signature = %s WHERE id = %s;",
                            (diag_comp, anom_sig, latest_id)
                        )
                conn.commit()
                logger.info(f"[{self.agent_name}] Updated PostgreSQL machine '{machine_id}' status to '{evaluation['severity']}' and latest telemetry row.")
                
                # Add context for next agent handoff
                evaluation['telemetry_context'] = telemetry
                evaluation['machine_name'] = machine_name
                evaluation['critical_thresholds'] = thresholds
                anomalies_detected.append(evaluation)
                
        return anomalies_detected

    def _evaluate_with_llm(self, machine_id: str, machine_name: str, telemetry: List[Dict[str, Any]], thresholds: Dict[str, float]) -> Dict[str, Any]:
        """Calls Gemini API to evaluate telemetry data and return structured alert evaluation."""
        prompt = f"""
        You are the Anomaly Detection Agent for a highly sensitive industrial manufacturing facility.
        Your task is to analyze the 10 most recent sensor readings of machine '{machine_name}' (ID: {machine_id}) and determine if there is an operational anomaly.
        
        Machine Critical Operating Thresholds:
        {json.dumps(thresholds, indent=2)}
        
        Recent Telemetry History (ordered from oldest to newest):
        {json.dumps([{**t, 'timestamp': t['timestamp'].isoformat() if isinstance(t['timestamp'], datetime.datetime) else str(t['timestamp'])} for t in telemetry], indent=2)}
        
        CRITERIA FOR ANOMALY:
        1. Rule-based: Any metric currently exceeding its critical threshold, or dropping below a minimum pressure threshold.
        2. Statistical/Trend-based: If any metric is accelerating/decelerating at an alarming rate that indicates imminent failure (e.g. rapid thermal spikes or progressive vibrational degradation) even if it hasn't fully crossed the boundary yet.
        
        You MUST respond in JSON format with the following exact keys:
        - "is_anomaly": boolean (true/false)
        - "machine_id": string (must match "{machine_id}")
        - "severity": string ("Healthy", "Degraded", or "Critical")
        - "explanation": string (detailed technical reasoning explaining the statistical anomalies, ramps, and alerts)
        - "diagnosed_component": string or null (if is_anomaly is true, map it to: "Stator Winding Insulation Breakdown", "Rotor Shaft Bearing Failure", "Compression Cylinder Seal Blowby", or "Electrical Commutator Fault")
        - "anomaly_signature": string or null (if is_anomaly is true, describe the combination signature e.g. "High Winding Temp + High Coil Amperage")
        """
        try:
            reload_env_vars()
            if _genai_client is None:
                raise RuntimeError("Gemini client not initialised — missing API key.")
            response = _genai_client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            if response.text is None:
                raise RuntimeError("Empty response from Gemini API.")
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            logger.error(f"[{self.agent_name}] LLM API error during anomaly detection: {e}. Falling back to Smart Emulator.")
            return SmartLLMEmulator.evaluate_anomaly(machine_id, machine_name, telemetry, thresholds)


# ==============================================================================
# 2. DIAGNOSTIC & ROOT CAUSE AGENT (RAG/ANALYST)
# ==============================================================================

class DiagnosticAgent:
    """
    RAG / Analyst Agent: Receives anomaly telemetry, queries ChromaDB's equipment_manuals
    collection, performs semantic search to retrieve manual chunks, and uses the LLM
    to diagnose the root cause, estimate Remaining Useful Life (RUL), and identify replacement parts.
    """
    def __init__(self, use_llm: bool = (HAS_GEMINI_SDK and GEMINI_API_KEY is not None)):
        self.use_llm = use_llm
        self.agent_name = "Gemini (or any LLM)"

    def diagnose_anomaly(self, conn, chroma_client, anomaly_context: Dict[str, Any]) -> Dict[str, Any]:
        """Performs RAG to retrieve operational manual and performs AI fault diagnosis."""
        machine_id = anomaly_context['machine_id']
        machine_name = anomaly_context['machine_name']
        telemetry = anomaly_context['telemetry_context']
        explanation = anomaly_context['explanation']
        
        logger.info(f"\n>>> Handoff to {self.agent_name} for Machine {machine_name} ({machine_id})")
        logger.info(f"[{self.agent_name}] Performing RAG query against Chroma Vector Database...")
        
        # 1. RAG Semantic Query formulation
        # Formulate query based on the anomaly explanation and latest metrics
        latest_reading = telemetry[-1]
        rag_query = f"troubleshooting manual {machine_name} temperature {latest_reading['temperature']:.1f} vibration {latest_reading['vibration']:.1f} pressure {latest_reading['pressure']:.1f} current {latest_reading['current']:.1f} {explanation}"
        
        rag_context = ""
        try:
            # Query the 'equipment_manuals' collection
            manuals_collection = chroma_client.get_collection("equipment_manuals")
            rag_results = manuals_collection.query(
                query_texts=[rag_query],
                n_results=2
            )
            
            if rag_results and 'documents' in rag_results and rag_results['documents']:
                documents = rag_results['documents'][0]
                metadatas = rag_results['metadatas'][0] if 'metadatas' in rag_results else []
                logger.info(f"[{self.agent_name}] Successfully retrieved {len(documents)} relevant manual chunks from ChromaDB.")
                
                # Format the retrieved documents as RAG context
                for i, doc in enumerate(documents):
                    meta_str = f" [Metadata: {json.dumps(metadatas[i])}]" if i < len(metadatas) else ""
                    rag_context += f"--- Manual Document Chunk {i+1} ---\n{doc}{meta_str}\n\n"
            else:
                logger.warning(f"[{self.agent_name}] No matching manual documents returned from Chroma query.")
                rag_context = "No relevant operational manuals found in the vector database."
        except Exception as e:
            logger.error(f"[{self.agent_name}] Error querying Chroma DB: {e}. Falling back to default manual string.")
            # Hardcoded mock manual string for safety
            rag_context = """
            Equipment: Rotary Bearings (Model RX-200 / PART-001). 
            Radial vibration exceeding 8.0 mm/s or temperature > 90.0°C indicates lubrication compromise and severe friction.
            Equipment: Centrifugal Pumps (Model CP-500 / PART-003). 
            Cavitation manifests as dropping discharge pressure (below 6.5 bar). Verify mechanical seals (PART-002).
            Equipment: Industrial Exhaust Fans (Model EF-90 / PART-004). 
            AC stator windings exceeding 80.0°C or amperage > 15.0A indicates electric winding degradation or load blockage.
            """

        # 2. Diagnosing root cause
        logger.info(f"[{self.agent_name}] Analyzing telemetry alongside operational manuals to isolate root cause...")
        
        # Query PG database to check if a custom required_part_id is mapped in machine thresholds
        custom_part_id = None
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT critical_thresholds FROM machines WHERE id = %s;", (machine_id,))
                row = cursor.fetchone()
                if row:
                    thresh = row[0]
                    if isinstance(thresh, str):
                        thresh = json.loads(thresh)
                    if isinstance(thresh, dict) and "required_part_id" in thresh:
                        custom_part_id = thresh["required_part_id"]
        except Exception as e:
            logger.error(f"Error querying custom required_part_id for machine {machine_id}: {e}")

        diagnosis = None
        if self.use_llm:
            diagnosis = self._diagnose_with_llm(machine_id, machine_name, telemetry, explanation, rag_context)
            if anomaly_context.get("diagnosed_component"):
                diagnosis["diagnosed_component"] = anomaly_context.get("diagnosed_component")
                diagnosis["anomaly_signature"] = anomaly_context.get("anomaly_signature")
                diagnosis["required_replacement_part"] = anomaly_context.get("required_replacement_part")
            if custom_part_id:
                diagnosis['required_replacement_part'] = custom_part_id
        else:
            diagnosis = SmartLLMEmulator.diagnose_fault(
                machine_id, 
                telemetry, 
                rag_context,
                diagnosed_component=anomaly_context.get("diagnosed_component"),
                required_replacement_part=anomaly_context.get("required_replacement_part")
            )
            if custom_part_id:
                diagnosis['required_replacement_part'] = custom_part_id
            
        logger.info(f"[{self.agent_name}] Diagnostic Completed: Fault='{diagnosis['detected_fault']}', "
                    f"RUL={diagnosis['remaining_useful_life_hours']}h, Part Needed={diagnosis['required_replacement_part']}")
        
        # Merge telemetry anomaly context into diagnosis payload for downstream agent
        diagnosis['machine_id'] = machine_id
        diagnosis['machine_name'] = machine_name
        diagnosis['severity'] = anomaly_context['severity']
        diagnosis['anomaly_explanation'] = explanation
        diagnosis['rag_context_used'] = rag_context
        
        if anomaly_context.get("diagnosed_component"):
            diagnosis['diagnosed_component'] = anomaly_context.get("diagnosed_component")
        if anomaly_context.get("anomaly_signature"):
            diagnosis['anomaly_signature'] = anomaly_context.get("anomaly_signature")
        
        return diagnosis

    def _diagnose_with_llm(self, machine_id: str, machine_name: str, telemetry: List[Dict[str, Any]], explanation: str, rag_context: str) -> Dict[str, Any]:
        """Calls Gemini API to diagnose root cause, RUL, and spare part using RAG context."""
        prompt = f"""
        You are the Diagnostic & Root Cause Agent for an Industrial AI System.
        Your task is to analyze a machine's telemetry anomaly context alongside chunks of technical operational manuals, isolate the exact root cause mechanical/electrical fault, estimate Remaining Useful Life (RUL) in hours, and identify the required replacement spare part.
        
        Machine Details:
        - Name: {machine_name}
        - ID: {machine_id}
        
        Anomaly Context:
        {explanation}
        
        Latest Telemetry Point:
        {json.dumps({**telemetry[-1], 'timestamp': telemetry[-1]['timestamp'].isoformat() if isinstance(telemetry[-1]['timestamp'], datetime.datetime) else str(telemetry[-1]['timestamp'])}, indent=2)}
        
        ChromaDB Vector RAG Retrieved Technical Manuals:
        ========================================================================
        {rag_context}
        ========================================================================
        
        DIAGNOSTIC CRITERIA:
        - Read the manual specs carefully. Match the threshold violations or performance drop with the mechanical specs.
        - Map the equipment failure to one of the critical spare parts:
          - Heavy-Duty Bearing Assembly: PART-001 (associated with bearings / RX-200)
          - High-Pressure Hydraulic Seal: PART-002 (associated with mechanical seals / pump CP-500)
          - Centrifugal Pump Impeller: PART-003 (associated with pump impeller / CP-500)
          - 3-Phase Electric Motor Winding: PART-004 (associated with fan windings / EF-90)
        - Estimate Remaining Useful Life (RUL) in hours:
          - Critical status: RUL should be low (e.g. 5 to 15 hours).
          - Degraded status: RUL should be moderate (e.g. 24 to 72 hours).
          
        You MUST respond in JSON format with the following exact keys:
        - "detected_fault": string (highly specific root cause mechanical/electrical diagnosis)
        - "remaining_useful_life_hours": integer (estimated RUL hours until catastrophic breakdown)
        - "required_replacement_part": string (must be one of: "PART-001", "PART-002", "PART-003", "PART-004")
        """
        try:
            reload_env_vars()
            if _genai_client is None:
                raise RuntimeError("Gemini client not initialised — missing API key.")
            response = _genai_client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            if response.text is None:
                raise RuntimeError("Empty response from Gemini API.")
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            logger.error(f"[{self.agent_name}] LLM API error during diagnostics: {e}. Falling back to Smart Emulator.")
            return SmartLLMEmulator.diagnose_fault(machine_id, telemetry, rag_context)


# ==============================================================================
# SOURCING OPTIMIZATION AGENT (LOGISTICS/AI)
# ==============================================================================

class SourcingOptimizationAgent:
    """
    Sourcing Optimization Agent:
    Takes a list of alternative suppliers, transit times, risk ratings, and prices,
    calculates a 'Resilience & Efficiency Score' for each option using an LLM,
    and returns the absolute best supplier to minimize downtime.
    """
    def __init__(self, use_llm: bool = (HAS_GEMINI_SDK and GEMINI_API_KEY is not None)):
        self.use_llm = use_llm
        self.agent_name = "Sourcing roadmap agent"

    def optimize_sourcing(self, part_name: str, suppliers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Uses LLM (or fallback logic) to evaluate and choose the best supplier."""
        logger.info(f"[{self.agent_name}] Optimizing sourcing for part '{part_name}' with {len(suppliers)} options...")
        
        if not suppliers:
            return {
                "selected_supplier_id": None,
                "selected_supplier_name": "Unknown",
                "reasoning": "No alternative suppliers found in graph.",
                "scores": {}
            }

        if self.use_llm:
            return self._optimize_with_llm(part_name, suppliers)
        else:
            return self._optimize_with_emulator(part_name, suppliers)

    def _optimize_with_emulator(self, part_name: str, suppliers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Fallback logic to compute Resilience & Efficiency Score:
        Score = 100 - (transit_days * 8) - (risk_rating * 45) - (price / 50)
        """
        scored_suppliers = []
        for s in suppliers:
            # Transit time is critical for preventing industrial downtime (high penalty)
            transit_penalty = s["transit_time_days"] * 7.5
            # Supplier risk (0.0 to 1.0) represents reliability (high penalty)
            risk_penalty = s["risk_rating"] * 45.0
            # Small penalty for pricing
            price_penalty = (s["price"] / 100.0) * 1.5
            
            score = 100.0 - transit_penalty - risk_penalty - price_penalty
            scored_suppliers.append({
                "supplier_id": s["supplier_id"],
                "supplier_name": s["supplier_name"],
                "score": round(max(0.0, score), 2),
                "transit_time_days": s["transit_time_days"],
                "risk_rating": s["risk_rating"],
                "price": s["price"]
            })
            
        # Sort by score descending
        scored_suppliers.sort(key=lambda x: x["score"], reverse=True)
        best_supplier = scored_suppliers[0]
        
        scores_map = {s["supplier_id"]: s["score"] for s in scored_suppliers}
        
        reasoning = (
            f"Optimized selection for '{part_name}': Chosen '{best_supplier['supplier_name']}' with score {best_supplier['score']}. "
            f"This option minimizes downtime with a transit time of {best_supplier['transit_time_days']} days, "
            f"a supplier risk rating of {best_supplier['risk_rating']:.2f}, and an total cost of ${best_supplier['price']:.2f}. "
            f"Compared to higher-risk or slower options (e.g. Siemens Shanghai at 28 days), this provides the best resilience and efficiency trade-off."
        )
        
        return {
            "selected_supplier_id": best_supplier["supplier_id"],
            "selected_supplier_name": best_supplier["supplier_name"],
            "reasoning": reasoning,
            "scores": scores_map,
            "best_option": best_supplier
        }

    def _optimize_with_llm(self, part_name: str, suppliers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calls Gemini API to rank alternative suppliers based on risk, price, and lead time."""
        prompt = f"""
        You are the Sourcing Optimization Agent for an Industrial AI System.
        Your goal is to choose the absolute best supplier for a missing component to resolve a factory emergency and minimize production downtime.
        
        Missing Component: {part_name}
        
        Available Suppliers and Route Options:
        {json.dumps(suppliers, indent=2)}
        
        CRITERIA FOR RESILIENCE & EFFICIENCY SCORE (0-100):
        1. Transit/Lead Time (60% weight): Every day of delay causes severe manufacturing downtime losses. Fast shipping is of paramount importance.
        2. Supplier Risk Rating (30% weight): Supplier risks (0.0 to 1.0) represent the chance of shipment loss, quality issues, or customs delays. We must avoid high-risk lines (especially for critical emergencies).
        3. Cost/Pricing (10% weight): While emergency budgets are pre-approved, excessive over-pricing should be penalized slightly.
        
        Calculate a "Resilience & Efficiency Score" out of 100 for each supplier. Select the single best supplier.
        
        You MUST respond in JSON format with the following exact keys:
        - "selected_supplier_id": string (the ID of the best supplier, e.g. "SUP-002")
        - "selected_supplier_name": string (the name of the best supplier)
        - "scores": object (mapping of supplier_id to its calculated numerical score out of 100)
        - "reasoning": string (technical justification comparing lead times, risk, and costs, explaining the winning option)
        """
        try:
            reload_env_vars()
            if _genai_client is None:
                raise RuntimeError("Gemini client not initialised — missing API key.")
            response = _genai_client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            if response.text is None:
                raise RuntimeError("Empty response from Gemini API.")
            data = json.loads(response.text.strip())
            return data
        except Exception as e:
            logger.error(f"[{self.agent_name}] LLM API error during sourcing optimization: {e}. Falling back to Emulator.")
            return self._optimize_with_emulator(part_name, suppliers)


# ==============================================================================
# 3. PLANNING & TOOL AGENT (ACTION)
# ==============================================================================

class PlanningToolAgent:
    """
    Action Agent: Orchestrates execution tools using structured functions.
    Tools:
    - check_inventory(part_id)
    - create_maintenance_order(machine_id, priority, root_cause, status, assigned_technician)
    - trigger_supply_chain_reroute(part_id)
    
    If in-stock: Creates 'Approved' status maintenance ticket.
    If out-of-stock: Creates 'Pending_Sourcing' ticket and calls supply chain rerouting.
    """
    def __init__(self, conn, chroma_client):
        self.conn = conn
        self.chroma_client = chroma_client
        self.agent_name = "E-Mailing Agent"

    # ==========================================================================
    # AGENT PYTHON TOOLS
    # ==========================================================================
    
    def check_inventory(self, part_id: str) -> Dict[str, Any]:
        """Tool: Queries the PostgreSQL inventory table for current stock details."""
        logger.info(f"[{self.agent_name} Tool] Executing check_inventory for Part: {part_id}")
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT part_id, part_name, stock_level, reorder_point, cost, location FROM inventory WHERE part_id = %s;",
                (part_id,)
            )
            res = cursor.fetchone()
            if not res:
                return {"part_id": part_id, "exists": False, "stock_level": 0, "reorder_point": 0}
            
            data = dict(res)
            data["exists"] = True
            # In stock if stock level is STRICTLY above the reorder point
            data["is_in_stock"] = data["stock_level"] > data["reorder_point"]
            return data

    def create_maintenance_order(self, machine_id: str, priority: str, root_cause: str, status: str, assigned_technician: str, diagnosed_component: Optional[str] = None, anomaly_signature: Optional[str] = None) -> Dict[str, Any]:
        """Tool: Inserts a new row in the PostgreSQL maintenance_orders table."""
        logger.info(f"[{self.agent_name} Tool] Executing create_maintenance_order status='{status}'...")
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO maintenance_orders (machine_id, priority, status, root_cause, assigned_technician, diagnosed_component, anomaly_signature)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at;
                """,
                (machine_id, priority, status, root_cause, assigned_technician, diagnosed_component, anomaly_signature)
            )
            order_id, created_at = cursor.fetchone()
        self.conn.commit()
        return {
            "order_id": order_id,
            "machine_id": machine_id,
            "status": status,
            "priority": priority,
            "diagnosed_component": diagnosed_component,
            "anomaly_signature": anomaly_signature,
            "created_at": created_at.isoformat() if isinstance(created_at, datetime.datetime) else str(created_at)
        }

    def traverse_supplier_graph(self, part_name: str) -> List[Dict[str, Any]]:
        """
        Graph Traversal Logic:
        Searches the supplier_graph and supplier_edges tables in PostgreSQL.
        Given a missing part_name, find all suppliers capable of delivering that part or its raw materials.
        """
        logger.info(f"[{self.agent_name}] Executing recursive supplier graph traversal for: {part_name}")
        query = """
        WITH RECURSIVE supply_paths AS (
            -- Anchor member: Start at the target part by name
            SELECT 
                node_id AS current_node,
                node_name AS current_name,
                node_type AS current_type,
                ARRAY[node_id]::VARCHAR[] AS path,
                0.0 AS accumulated_price,
                0 AS accumulated_transit_days,
                CAST(NULL AS VARCHAR) AS supply_relation
            FROM supplier_graph
            WHERE node_name = %s AND node_type = 'Part'

            UNION ALL

            -- Recursive member: Traverse backwards from Part <- Edge <- Source Node
            SELECT 
                g.node_id AS current_node,
                g.node_name AS current_name,
                g.node_type AS current_type,
                p.path || g.node_id AS path,
                p.accumulated_price + COALESCE(e.price, 0.0) AS accumulated_price,
                p.accumulated_transit_days + COALESCE(e.transit_time_days, 0) AS accumulated_transit_days,
                e.relationship AS supply_relation
            FROM supply_paths p
            JOIN supplier_edges e ON p.current_node = e.to_node
            JOIN supplier_graph g ON e.from_node = g.node_id
            -- Prevent infinite loops
            WHERE NOT (g.node_id = ANY(p.path))
        )
        SELECT DISTINCT ON (current_node)
            current_node AS supplier_id,
            current_name AS supplier_name,
            current_type AS supplier_type,
            accumulated_price AS price,
            accumulated_transit_days AS transit_time_days,
            (SELECT risk_rating FROM supplier_graph WHERE node_id = current_node) AS risk_rating,
            (SELECT contact_email FROM supplier_graph WHERE node_id = current_node) AS contact_email,
            path
        FROM supply_paths
        WHERE current_type = 'Supplier';
        """
        suppliers = []
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (part_name,))
                results = cursor.fetchall()
                for row in results:
                    suppliers.append({
                        "supplier_id": row["supplier_id"],
                        "supplier_name": row["supplier_name"],
                        "price": float(row["price"]),
                        "transit_time_days": int(row["transit_time_days"]),
                        "risk_rating": float(row["risk_rating"]) if row["risk_rating"] is not None else 0.5,
                        "contact_email": row["contact_email"],
                        "path": row["path"]
                    })
        except Exception as e:
            logger.error(f"[{self.agent_name}] Error during recursive graph traversal query: {e}")
        return suppliers

    def draft_procurement_order(self, supplier_id: str, part_name: str, quantity: int, machine_id: str, order_id: int) -> Dict[str, Any]:
        """
        Autonomous Procurement Tool:
        Generates a professional, contextual email procurement draft and updates 
        maintenance_orders status to 'Dispatched_Sourcing_Active'.
        """
        logger.info(f"[{self.agent_name} Tool] Executing draft_procurement_order for Supplier: {supplier_id}")
        
        # 1. Fetch supplier details
        supplier_name = "Supplier"
        contact_email = "orders@supplier.com"
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT node_name, contact_email FROM supplier_graph WHERE node_id = %s;",
                (supplier_id,)
            )
            res = cursor.fetchone()
            if res:
                supplier_name = res["node_name"]
                contact_email = res["contact_email"] or f"orders@{supplier_name.lower().replace(' ', '')}.com"
                
        # 2. Fetch machine details
        machine_name = "Equipment"
        machine_status = "Degraded"
        with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT name, status FROM machines WHERE id = %s;",
                (machine_id,)
            )
            res_m = cursor.fetchone()
            if res_m:
                machine_name = res_m["name"]
                machine_status = res_m["status"]

        # 3. Create professional email draft
        email_subject = f"URGENT: Expedited Parts Procurement Order - Machine Down ({machine_id})"
        email_body = f"""Subject: {email_subject}
To: {contact_email} (Attn: {supplier_name} Sales & Logistics)
From: procurement-agent@industrial-ai.com
Date: {datetime.datetime.now().strftime('%Y-%m-%d')}

Dear {supplier_name} Team,

This is an URGENT automated procurement request on behalf of our Industrial Operations Facility. 

We have encountered a critical equipment status alert on our factory floor:
- Equipment: {machine_name} (ID: {machine_id})
- Fleet Operational Status: {machine_status.upper()} / IMMINENT DOWNTIME HAZARD

To prevent severe assembly line stagnation and operational downtime, we require the immediate dispatch of the following component:
- Required Component: {part_name}
- Requested Quantity: {quantity} unit(s)

As our supplier graph indicates you are our optimal source, please process this order for EXPEDITED shipping immediately. Please confirm stock availability, estimated dispatch time, and provide tracking numbers to our digital logistics webhook as soon as they are generated.

We request priority processing and air-courier routing if possible. All associated expedited freight surcharges have been pre-approved on our corporate procurement billing profile.

Thank you for your rapid cooperation in resolving this production emergency.

Sincerely,
Autonomous Supply Chain Procurement Agent
Industrial Sector AI Automation Network
"""

        # 4. Update the maintenance_orders status to 'Dispatched_Sourcing_Active'
        procurement_summary = (
            f"\n\n[Procurement Action] Order dispatched to {supplier_name} ({supplier_id}). "
            f"Professional email draft generated. Requested {quantity} unit(s) with expedited shipping."
        )
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE maintenance_orders 
                SET status = 'Dispatched_Sourcing_Active', 
                    root_cause = root_cause || %s,
                    updated_at = NOW()
                WHERE id = %s;
                """,
                (procurement_summary, order_id)
            )
        self.conn.commit()
        logger.info(f"[{self.agent_name} Tool] Updated maintenance order #{order_id} status to 'Dispatched_Sourcing_Active'")

        return {
            "supplier_id": supplier_id,
            "supplier_name": supplier_name,
            "contact_email": contact_email,
            "email_subject": email_subject,
            "email_body": email_body,
            "status_updated": "Dispatched_Sourcing_Active"
        }

    def trigger_supply_chain_reroute(self, part_id: str, machine_id: Optional[str] = None, order_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Tool: Searches the supply chain graph, optimizes supplier selection using Sourcing Optimization Agent,
        and generates automated procurement drafts to resolve emergencies.
        """
        logger.info(f"[{self.agent_name} Tool] Triggering supply chain reroute for Part ID: {part_id}...")
        
        # 1. Map part_id to part_name
        inventory_status = self.check_inventory(part_id)
        part_name = inventory_status.get("part_name", "Spare Part")
        
        # 2. Graph Traversal Logic (PostgreSQL CTE)
        suppliers = self.traverse_supplier_graph(part_name)
        
        # Fallback to Chroma supplier_routes if Postgres graph has no results
        if not suppliers:
            logger.warning(f"[{self.agent_name} Tool] No suppliers found in graph database. Querying Chroma DB...")
            try:
                routes_collection = self.chroma_client.get_collection("supplier_routes")
                results = routes_collection.query(
                    query_texts=[f"Alternative routes supplier transit lead time cost risk for {part_id} {part_name}"],
                    n_results=2
                )
                if results and 'documents' in results and results['documents']:
                    documents = results['documents'][0]
                    metadatas = results['metadatas'][0] if 'metadatas' in results else []
                    for idx, doc in enumerate(documents):
                        meta = metadatas[idx] if idx < len(metadatas) else {}
                        suppliers.append({
                            "supplier_id": f"SUP-CHROMA-{idx}",
                            "supplier_name": meta.get("supplier", "Chroma Vendor"),
                            "price": float(meta.get("cost", 300.0)),
                            "transit_time_days": int(meta.get("lead_time_days", 10)),
                            "risk_rating": 0.2 if meta.get("risk", "low") == "low" else 0.5,
                            "contact_email": f"orders@{meta.get('supplier', 'chromavendor').lower().replace(' ', '')}.com",
                            "path": [part_id, meta.get("supplier")]
                        })
            except Exception as e:
                logger.error(f"[{self.agent_name} Tool] Fallback Chroma query failed: {e}")

        if not suppliers:
            return {
                "part_id": part_id,
                "part_name": part_name,
                "suppliers_found": [],
                "optimization_result": {"selected_supplier_id": None, "selected_supplier_name": "None", "reasoning": "No suppliers available."},
                "procurement_result": None
            }

        # 3. Sourcing Optimization
        sourcing_agent = SourcingOptimizationAgent(use_llm=(HAS_GEMINI_SDK and GEMINI_API_KEY is not None))
        optimization_res = sourcing_agent.optimize_sourcing(part_name, suppliers)
        best_supplier_id = optimization_res.get("selected_supplier_id")
        
        # 4. Autonomous Procurement Action
        procurement_res = None
        if best_supplier_id and machine_id and order_id:
            # Calculate quantity to order
            stock_level = inventory_status.get("stock_level", 0)
            reorder_point = inventory_status.get("reorder_point", 0)
            quantity = max(1, reorder_point - stock_level + 2)
            
            procurement_res = self.draft_procurement_order(
                supplier_id=best_supplier_id,
                part_name=part_name,
                quantity=quantity,
                machine_id=machine_id,
                order_id=order_id
            )

        # Backwards compatible mapping fields
        optimal_supplier = optimization_res.get("selected_supplier_name", "Unknown Supplier")
        best_opt = optimization_res.get("best_option", {})
        transit_days = best_opt.get("transit_time_days", 10)
        exp_cost = best_opt.get("price", 0.0)
        risk = str(best_opt.get("risk_rating", 0.5))
        
        return {
            "part_id": part_id,
            "part_name": part_name,
            "suppliers_found": suppliers,
            "optimization_result": optimization_res,
            "procurement_result": procurement_res,
            # Backwards compatibility fields for runner outputs
            "optimal_supplier": optimal_supplier,
            "transit_days": transit_days,
            "expedited_shipping_cost": exp_cost,
            "logistical_risk": risk,
            "routing_details": optimization_res.get("reasoning", "")
        }

    # ==========================================================================
    # CORE AGENT EXECUTION FLOW
    # ==========================================================================
    
    def execute_workflow(self, diagnostic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the planning and tool selection logic based on the diagnostic payload.
        Determines parts stock level, executes appropriate orders and triggers supply chain routing.
        """
        machine_id = diagnostic_payload['machine_id']
        machine_name = diagnostic_payload['machine_name']
        severity = diagnostic_payload['severity']
        detected_fault = diagnostic_payload['detected_fault']
        rul = diagnostic_payload['remaining_useful_life_hours']
        required_part = diagnostic_payload['required_replacement_part']
        anomaly_explanation = diagnostic_payload['anomaly_explanation']
        diagnosed_component = diagnostic_payload.get('diagnosed_component')
        anomaly_signature = diagnostic_payload.get('anomaly_signature')
        
        logger.info(f"\n>>> Handoff to {self.agent_name} for Action Planning")
        logger.info(f"[{self.agent_name}] Analyzing diagnostic. Required part: {required_part}")
        
        # Step 1: Check Inventory Tool Call
        inventory_status = self.check_inventory(required_part)
        part_name = inventory_status.get("part_name", "Spare Part")
        stock_level = inventory_status.get("stock_level", 0)
        reorder_point = inventory_status.get("reorder_point", 0)
        
        logger.info(f"[{self.agent_name}] Tool Call Response: Stock Level = {stock_level}, Reorder point = {reorder_point}")
        
        technician = "Sarah Jenkins (PdM Specialist)"
        priority = "Critical" if severity == "Critical" else "High"
        
        # Step 2: Branch based on stock level
        is_in_stock = inventory_status.get("is_in_stock", False)
        
        if is_in_stock:
            # PART IS IN STOCK: Create 'Approved' order and schedule technician
            logger.info(f"[{self.agent_name}] Success: Part {required_part} is IN STOCK (Stock: {stock_level} > Reorder Point: {reorder_point}).")
            
            detailed_cause = (
                f"Automated PdM Diagnostic & Dispatch Report:\n"
                f"- Isolated Fault: {detected_fault}\n"
                f"- Remaining Useful Life (RUL): {rul} Hours\n"
                f"- Required Part: {required_part} ({part_name}) - IN STOCK (Stock Level: {stock_level}, Location: {inventory_status.get('location')})\n"
                f"- Dispatch Action: PART SECURED. Maintenance order approved automatically. Scheduling immediate technician dispatch.\n\n"
                f"Anomaly Telemetry Analysis:\n"
                f"{anomaly_explanation}"
            )
            
            order_status = "Approved"
            order_res = self.create_maintenance_order(
                machine_id=machine_id,
                priority=priority,
                root_cause=detailed_cause,
                status=order_status,
                assigned_technician=technician,
                diagnosed_component=diagnosed_component,
                anomaly_signature=anomaly_signature
            )
            
            return {
                "success": True,
                "workflow_result": "Immediate Dispatch Scheduled",
                "part_in_stock": True,
                "inventory_status": inventory_status,
                "maintenance_order": order_res,
                "supply_chain_reroute": None
            }
            
        else:
            # PART IS OUT OF STOCK / BELOW REORDER LIMITS: Sourcing action required!
            logger.warning(f"[{self.agent_name}] Supply Chain Alert: Part {required_part} is OUT OF STOCK or BELOW REORDER POINT "
                           f"(Stock: {stock_level} <= Reorder Point: {reorder_point}). Sourcing action required!")
            
            # Step 2a: Initialize maintenance order in 'Pending_Sourcing' status
            detailed_cause = (
                f"Automated PdM Diagnostic & Supply Chain Routing Report:\n"
                f"- Isolated Fault: {detected_fault}\n"
                f"- Remaining Useful Life (RUL): {rul} Hours\n"
                f"- Required Part: {required_part} ({part_name}) - OUT OF STOCK / BELOW REORDER LIMIT (Stock Level: {stock_level}, Reorder Threshold: {reorder_point})\n"
                f"- Logistical Urgent Dispatch: Triggered supply chain routing search in supplier graph database."
            )
            
            order_res = self.create_maintenance_order(
                machine_id=machine_id,
                priority=priority,
                root_cause=detailed_cause,
                status="Pending_Sourcing",
                assigned_technician="Procurement & Logistics Agent",
                diagnosed_component=diagnosed_component,
                anomaly_signature=anomaly_signature
            )
            order_id = order_res["order_id"]
            
            # Step 2b: Trigger Supply Chain Reroute (includes Graph Traversal, Sourcing Optimization, Procurement Order simulation, and Order update)
            reroute_res = self.trigger_supply_chain_reroute(
                part_id=required_part,
                machine_id=machine_id,
                order_id=order_id
            )
            
            # Retrieve latest maintenance order state
            updated_order = order_res.copy()
            updated_order["status"] = "Dispatched_Sourcing_Active"
            
            return {
                "success": True,
                "workflow_result": "Pending Supply Chain Procurement - Sourcing Dispatched",
                "part_in_stock": False,
                "inventory_status": inventory_status,
                "maintenance_order": updated_order,
                "supply_chain_reroute": reroute_res
            }


# ==============================================================================
# ORCHESTRATOR / RUNNER CLASS
# ==============================================================================

class PredictiveMaintenanceOrchestrator:
    """
    Main Orchestrator: Combines the 3 agents into a unified, robust executing pipeline.
    It runs schema updates, executes the scan, routes diagnostics via RAG,
    performs tool executions, and returns comprehensive diagnostic results.
    """
    def __init__(self, use_llm: bool = (HAS_GEMINI_SDK and GEMINI_API_KEY is not None)):
        self.use_llm = use_llm
        verify_schema_constraints()
        
        self.anomaly_detector = AnomalyDetectionAgent(use_llm=use_llm)
        self.diagnostician = DiagnosticAgent(use_llm=use_llm)
        
    def run_pipeline(self) -> List[Dict[str, Any]]:
        """Runs the end-to-end multi-agent orchestration pipeline."""
        logger.info("\n" + "="*80)
        logger.info("STARTING PREDICTIVE MAINTENANCE MULTI-AGENT ORCHESTRATION PIPELINE")
        logger.info("="*80)
        
        pipeline_results = []
        conn = None
        chroma_cli = None
        
        try:
            conn = get_postgres_connection()
            chroma_cli = get_chroma_client()
            
            # Step 1: Scan Telemetry and Detect Anomalies (Evaluator Agent)
            anomaly_payloads = self.anomaly_detector.scan_fleet_telemetry(conn)
            
            if not anomaly_payloads:
                logger.info("\n[Orchestrator] All machines in the fleet are operating normally. No anomalies detected.")
                return []
                
            logger.info(f"\n[Orchestrator] Anomaly Detector isolated {len(anomaly_payloads)} anomalous machine(s). Handing off...")
            
            # Step 2: Loop through each anomaly to diagnose and solve
            for anomaly_context in anomaly_payloads:
                machine_name = anomaly_context['machine_name']
                
                # Step 2a: Root Cause & RAG Analysis (Diagnostic Agent)
                diagnostic_payload = self.diagnostician.diagnose_anomaly(conn, chroma_cli, anomaly_context)
                
                # Step 2b: Action and Tool Scheduling (Planning & Tool Agent)
                action_agent = PlanningToolAgent(conn, chroma_cli)
                workflow_res = action_agent.execute_workflow(diagnostic_payload)
                
                logger.info(f"\n[Orchestrator] Workflow completed for machine: '{machine_name}'!")
                logger.info(f"[Orchestrator] Outcome: {workflow_res['workflow_result']}.")
                logger.info(f"[Orchestrator] New Maintenance Order ID: #{workflow_res['maintenance_order']['order_id']}")
                
                pipeline_results.append({
                    "machine_name": machine_name,
                    "anomaly_detection": anomaly_context,
                    "diagnostic": diagnostic_payload,
                    "execution_details": workflow_res
                })
                
        except Exception as e:
            logger.error(f"[Orchestrator] Pipeline critical execution error: {e}", exc_info=True)
        finally:
            if conn:
                conn.close()
                logger.info("[Database] PostgreSQL connection closed.")
                
        logger.info("\n" + "="*80)
        logger.info("PREDICTIVE MAINTENANCE ORCHESTRATION PIPELINE COMPLETED")
        logger.info("="*80 + "\n")
        
        return pipeline_results


class MqttTelemetryIngestor:
    """
    Subscribes to an EMQX Broker, receives telemetry JSON payloads from factory/machines/+/telemetry,
    converts real-world physical sensor names to database column names, saves them in Postgres,
    and runs the Multi-Agent Anomaly Detection & Diagnostics loops on the fly!
    """
    def __init__(self, broker_host=None, broker_port=None, username=None, password=None, use_llm=False):
        self.broker_host = broker_host or os.getenv("MQTT_BROKER_HOST", "broker.emqx.io")
        self.broker_port = int(broker_port or os.getenv("MQTT_BROKER_PORT", 1883))
        self.username = username or os.getenv("MQTT_USERNAME")
        self.password = password or os.getenv("MQTT_PASSWORD")
        self.use_llm = use_llm
        self.topic = "factory/machines/+/telemetry"
        self.client = None
        self.orchestrator = PredictiveMaintenanceOrchestrator(use_llm=self.use_llm)

    def start(self):
        import paho.mqtt.client as mqtt
        
        try:
            self.client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        except Exception:
            # Fallback for older paho-mqtt versions
            self.client = mqtt.Client()

        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        logger.info(f"[MQTT] Connecting to EMQX Broker at {self.broker_host}:{self.broker_port}...")
        self.client.connect(self.broker_host, self.broker_port, 60)
        self.client.loop_start()

    def stop(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("[MQTT] Disconnected from broker.")

    def on_connect(self, client, userdata, flags, rc, properties=None):
        logger.info(f"[MQTT] Connected with result code {rc}")
        client.subscribe(self.topic)
        logger.info(f"[MQTT] Subscribed to topic: {self.topic}")

    def on_message(self, client, userdata, msg):
        try:
            # Extract machine_id from topic (factory/machines/MCH-001/telemetry)
            parts = msg.topic.split('/')
            if len(parts) < 3:
                return
            machine_id = parts[2]
            
            payload = json.loads(msg.payload.decode('utf-8'))
            logger.info(f"[MQTT] Received telemetry for machine {machine_id}: {payload}")
            
            # Map client-side/real-world physical sensor names to database fields
            temp = float(payload.get("winding_temp") or payload.get("temperature") or 0.0)
            vib = float(payload.get("radial_vibration") or payload.get("vibration") or 0.0)
            pres = float(payload.get("discharge_pressure") or payload.get("pressure") or 0.0)
            cur = float(payload.get("coil_amperage") or payload.get("current") or 0.0)
            
            # Connect to PostgreSQL and insert telemetry
            conn = get_postgres_connection()
            try:
                # Retrieve machine critical thresholds
                with conn.cursor() as cursor:
                    cursor.execute("SELECT name, critical_thresholds FROM machines WHERE id = %s;", (machine_id,))
                    res = cursor.fetchone()
                    if not res:
                        logger.warning(f"[MQTT] Machine {machine_id} not found in database. Skipping ingestion.")
                        return
                    machine_name, thresholds = res
                    if isinstance(thresholds, str):
                        thresholds = json.loads(thresholds)
                
                # Check for thresholds breach and diagnose component
                diag_comp, anom_sig, part_needed = run_diagnostic_mapping(temp, vib, pres, cur, thresholds)
                
                # Insert telemetry row
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current, diagnosed_component, anomaly_signature)
                        VALUES (%s, NOW(), %s, %s, %s, %s, %s, %s)
                        RETURNING id;
                        """,
                        (machine_id, temp, vib, pres, cur, diag_comp, anom_sig)
                    )
                    row = cursor.fetchone()
                    if row is None:
                        raise RuntimeError("INSERT INTO sensor_telemetry returned no row ID.")
                    telemetry_row_id = row[0]
                conn.commit()
                logger.info(f"[MQTT] Telemetry transacted into database. Row ID: {telemetry_row_id}")
                
                # Update machine status in Postgres if anomaly is found or if healthy
                new_status = "Healthy"
                severity = "Healthy"
                if diag_comp:
                    severity = "Critical" if (temp > thresholds.get("temperature", 80.0)*1.15 or vib > thresholds.get("vibration", 8.0)*1.15) else "Degraded"
                    new_status = severity
                
                with conn.cursor() as cursor:
                    cursor.execute(
                        "UPDATE machines SET status = %s, updated_at = NOW() WHERE id = %s;",
                        (new_status, machine_id)
                    )
                conn.commit()
                
                # If an anomaly is identified, trigger the orchestrator loops automatically
                if diag_comp:
                    logger.info(f"[MQTT] Dynamic anomaly detected: {diag_comp}! Triggering maintenance orchestrator loop...")
                    
                    # Package anomaly context
                    anomaly_context = {
                        "is_anomaly": True,
                        "machine_id": machine_id,
                        "machine_name": machine_name,
                        "severity": severity,
                        "explanation": f"EMQX Broker Real-time Alert: {anom_sig}. Localized component breakdown: {diag_comp}.",
                        "diagnosed_component": diag_comp,
                        "anomaly_signature": anom_sig,
                        "required_replacement_part": part_needed,
                        "telemetry_context": [
                            {"temperature": temp, "vibration": vib, "pressure": pres, "current": cur}
                        ]
                    }
                    
                    # Run RAG Diagnostics and Sourcing
                    chroma_cli = get_chroma_client()
                    
                    # Run root cause diagnostic
                    diagnostic_payload = self.orchestrator.diagnostician.diagnose_anomaly(conn, chroma_cli, anomaly_context)
                    diagnostic_payload["diagnosed_component"] = diag_comp
                    diagnostic_payload["anomaly_signature"] = anom_sig
                    diagnostic_payload["required_replacement_part"] = part_needed
                    
                    # Plan maintenance & sourcing
                    action_agent = PlanningToolAgent(conn, chroma_cli)
                    workflow_res = action_agent.execute_workflow(diagnostic_payload)
                    
                    logger.info(f"[MQTT] Autonomous maintenance dispatched successfully. Order ID: #{workflow_res['maintenance_order']['order_id']}")
                    
            except Exception as e:
                logger.error(f"[MQTT] Error processing MQTT telemetry payload: {e}", exc_info=True)
                if conn:
                    conn.rollback()
            finally:
                if conn:
                    conn.close()
                    
        except Exception as e:
            logger.error(f"[MQTT] Error parsing MQTT message: {e}")


# Execute orchestrator pipeline directly if executed as a main script
if __name__ == "__main__":
    import time
    # Check if MQTT mode is requested or start directly
    print("Starting Predictive Maintenance Orchestration...")
    ingestor = MqttTelemetryIngestor()
    ingestor.start()
    try:
        # Also run a fleet scan on start
        orchestrator = PredictiveMaintenanceOrchestrator()
        results = orchestrator.run_pipeline()
        print(f"\nPipeline processed {len(results)} fleet scan anomalies.")
        # Keep the MQTT client running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping ingestor...")
        ingestor.stop()

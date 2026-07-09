import os
import sys
import json
import random
import datetime
from dotenv import load_dotenv

# Try importing psycopg2 (PostgreSQL adapter)
try:
    import psycopg2
    from psycopg2.extras import Json
except ImportError:
    print("Error: psycopg2 is not installed. Please install it using 'pip install psycopg2-binary'")
    sys.exit(1)

# Try importing chromadb (Vector DB)
try:
    import chromadb
    from chromadb.utils import embedding_functions
except ImportError:
    print("Error: chromadb is not installed. Please install it using 'pip install chromadb'")
    sys.exit(1)

# Load environment variables from the workspace .env file
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path, override=True)

# Retrieve configuration with robust defaults
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/industrial_pdm")
CHROMA_HOST = os.getenv("CHROMA_HOST", "api.trychroma.com")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "IndustrialSector")

print("==========================================================================")
print("Industrial AI System: Initializing Hybrid DB Foundation (Postgres + Chroma)")
print("==========================================================================")


# ==============================================================================
# 1. POSTGRESQL INITIALIZATION & SEEDING
# ==============================================================================

def get_postgres_connection():
    """Establishes a connection to the PostgreSQL database."""
    print(f"Connecting to PostgreSQL at: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        print("\nNote: Please make sure PostgreSQL is running and DATABASE_URL in .env is correct.")
        print("Example format: DATABASE_URL=postgresql://username:password@localhost:5432/db_name\n")
        raise e


def initialize_postgres_schema(conn):
    """Reads schema.sql and executes DDL to create tables and indexes."""
    print("Executing schema.sql to initialize tables and indexes...")
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    
    if not os.path.exists(schema_path):
        print(f"Error: schema.sql file not found at {schema_path}")
        return False
        
    with open(schema_path, "r") as f:
        schema_sql = f.read()
        
    with conn.cursor() as cursor:
        cursor.execute(schema_sql)
    conn.commit()
    print("PostgreSQL tables and optimized indexes created successfully.")
    return True


def seed_postgres_data(conn):
    """Seeds the workspaces, machines and inventory tables with baseline operational data."""
    print("Seeding baseline Workspaces, 1000 Fleet Machines, and Spare Parts Inventory...")
    
    # 0. Seed a default workspace
    default_workspace = ("WS-001", "Primary Production Facility", "Main plant floor fleet control tower.")

    # 1. Seed 3 Machines with structured JSONB critical thresholds + workspace_id
    machines_data = [
        (
            "MCH-001",
            "WS-001",
            "Rotary Gear Pump A",
            "Bay 3 - Fluids Processing",
            "Operational",
            Json({
                "temperature": 90.0,  # Max temperature in Celsius
                "vibration": 8.0,     # Max vibration in mm/s
                "pressure": 6.5,      # Max pressure in Bar
                "current": 15.0       # Max motor current in Amps
            })
        ),
        (
            "MCH-002",
            "WS-001",
            "High-Speed Industrial Fan B",
            "Bay 7 - Ventilation and Exhaust",
            "Operational",
            Json({
                "temperature": 80.0,
                "vibration": 10.0,
                "pressure": 3.0,
                "current": 20.0
            })
        ),
        (
            "MCH-003",
            "WS-001",
            "Heavy-Duty Compressor C",
            "Bay 12 - Pneumatics & Air Power",
            "Operational",
            Json({
                "temperature": 95.0,
                "vibration": 7.5,
                "pressure": 8.5,
                "current": 25.0
            })
        )
    ]

    # Generate remaining 997 machines (MCH-004 to MCH-1000)
    for i in range(4, 1001):
        mch_id = f"MCH-{i:03d}"
        asset_type = i % 4
        if asset_type == 0:
            name = f"Centrifugal Pump {i}"
            loc = f"Bay {i % 15 + 1} - Fluids Processing"
            part = "PART-003"
            t = 90.0; v = 8.0; p = 6.5; c = 15.0
        elif asset_type == 1:
            name = f"Exhaust Fan {i}"
            loc = f"Bay {i % 15 + 1} - Ventilation"
            part = "PART-004"
            t = 80.0; v = 10.0; p = 3.0; c = 20.0
        elif asset_type == 2:
            name = f"Compressor Unit {i}"
            loc = f"Bay {i % 15 + 1} - Pneumatics"
            part = "PART-002"
            t = 95.0; v = 7.5; p = 8.5; c = 25.0
        else:
            name = f"Motor Drive {i}"
            loc = f"Bay {i % 15 + 1} - Assembly Line"
            part = "PART-001"
            t = 85.0; v = 7.0; p = 5.0; c = 18.0

        machines_data.append((
            mch_id,
            "WS-001",
            name,
            loc,
            "Operational",
            Json({
                "temperature": t,
                "vibration": v,
                "pressure": p,
                "current": c,
                "required_part_id": part
            })
        ))
    
    # 2. Seed initial spare parts inventory (including parts below reorder points to demonstrate supply chain alerts)
    inventory_data = [
        ("PART-001", "Heavy-Duty Bearing Assembly", 15, 5, 120.50, "Warehouse A - Aisle 4"),
        ("PART-002", "High-Pressure Hydraulic Seal", 3, 10, 45.00, "Warehouse A - Aisle 6"),  # Needs reorder
        ("PART-003", "Centrifugal Pump Impeller", 8, 2, 350.00, "Warehouse B - Aisle 2"),
        ("PART-004", "3-Phase Electric Motor Winding", 1, 3, 850.00, "Warehouse B - Aisle 5")  # Needs reorder
    ]

    # 3. Seed Supplier Graph Nodes
    supplier_nodes = [
        ("SUP-001", "Siemens Shanghai", "Supplier", 0.70, "procurement@siemens.cn"),
        ("SUP-002", "SKF Munich", "Supplier", 0.15, "logistics@skf.de"),
        ("SUP-003", "CopperWorks Ohio", "Supplier", 0.10, "orders@copperworksohio.com"),
        ("SUP-004", "VarnishTech Graz", "Supplier", 0.20, "sales@varnishtech.at"),
        ("SUP-005", "Parker Hannifin Cleveland", "Supplier", 0.05, "orders@parkerhannifin.com"),
        ("SUP-006", "Sulzer Gothenburg", "Supplier", 0.12, "procurement@sulzer.se"),
        ("PART-001", "Heavy-Duty Bearing Assembly", "Part", None, None),
        ("PART-002", "High-Pressure Hydraulic Seal", "Part", None, None),
        ("PART-003", "Centrifugal Pump Impeller", "Part", None, None),
        ("PART-004", "3-Phase Electric Motor Winding", "Part", None, None),
        ("MAT-001", "High-Conductivity Copper Wire", "Material", None, None),
        ("MAT-002", "High-Temperature Insulating Varnish", "Material", None, None),
        ("MAT-003", "NBR Rubber Compound", "Material", None, None),
        ("MAT-004", "Stainless Steel Casting", "Material", None, None)
    ]

    # 4. Seed Supplier Graph Edges (from_node, to_node, relationship, transit_time_days, price)
    supplier_edges = [
        ("SUP-002", "PART-001", "SUPPLIES", 5, 450.00),
        ("SUP-005", "PART-002", "SUPPLIES", 2, 35.00),
        ("SUP-006", "PART-003", "SUPPLIES", 14, 250.00),
        ("SUP-001", "PART-004", "SUPPLIES", 28, 850.00),
        ("SUP-002", "PART-004", "SUPPLIES", 5, 1200.00),
        ("SUP-003", "MAT-001", "SUPPLIES", 3, 300.00),
        ("MAT-001", "PART-004", "USED_IN", 3, 400.00),
        ("SUP-004", "MAT-002", "SUPPLIES", 4, 150.00),
        ("MAT-002", "PART-004", "USED_IN", 2, 600.00),
        ("SUP-003", "MAT-003", "SUPPLIES", 3, 10.00),
        ("MAT-003", "PART-002", "USED_IN", 1, 15.00),
        ("SUP-003", "MAT-004", "SUPPLIES", 5, 80.00),
        ("MAT-004", "PART-003", "USED_IN", 4, 120.00)
    ]
    
    with conn.cursor() as cursor:
        # Seed workspace
        cursor.execute(
            """
            INSERT INTO workspaces (id, name, description)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name, description = EXCLUDED.description;
            """,
            default_workspace
        )

        # Seed machines
        for m in machines_data:
            cursor.execute(
                """
                INSERT INTO machines (id, workspace_id, name, location, status, critical_thresholds)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE 
                SET workspace_id = EXCLUDED.workspace_id, name = EXCLUDED.name, location = EXCLUDED.location, 
                    status = EXCLUDED.status, critical_thresholds = EXCLUDED.critical_thresholds;
                """,
                m
            )
        
        # Seed inventory
        for inv in inventory_data:
            cursor.execute(
                """
                INSERT INTO inventory (part_id, part_name, stock_level, reorder_point, cost, location)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (part_id) DO UPDATE
                SET part_name = EXCLUDED.part_name, stock_level = EXCLUDED.stock_level,
                    reorder_point = EXCLUDED.reorder_point, cost = EXCLUDED.cost, location = EXCLUDED.location;
                """,
                inv
            )

        # Seed supplier graph nodes
        for node in supplier_nodes:
            cursor.execute(
                """
                INSERT INTO supplier_graph (node_id, node_name, node_type, risk_rating, contact_email)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (node_id) DO UPDATE
                SET node_name = EXCLUDED.node_name, node_type = EXCLUDED.node_type,
                    risk_rating = EXCLUDED.risk_rating, contact_email = EXCLUDED.contact_email;
                """,
                node
            )

        # Clear existing edges
        cursor.execute("TRUNCATE TABLE supplier_edges RESTART IDENTITY CASCADE;")
        # Seed supplier graph edges
        for edge in supplier_edges:
            cursor.execute(
                """
                INSERT INTO supplier_edges (from_node, to_node, relationship, transit_time_days, price)
                VALUES (%s, %s, %s, %s, %s);
                """,
                edge
            )
            
    conn.commit()
    print("Structured workspaces, fleet metadata, and supplier graph seeded successfully.")


def generate_baseline_telemetry(conn):
    """
    Generates baseline telemetry for all 1000 machines.
    Inserts 15 points per machine (150 minutes of history).
    """
    print("Generating healthy baseline telemetry for all 1,000 machines...")
    now = datetime.datetime.now(datetime.timezone.utc)
    points_to_generate = 15
    
    # Retrieve all machine IDs and thresholds
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, critical_thresholds FROM machines;")
        machines = cursor.fetchall()
        
    telemetry_records = []
    
    for machine_id, thresholds in machines:
        if isinstance(thresholds, str):
            thresholds = json.loads(thresholds)
            
        t_limit = thresholds.get("temperature", 80.0)
        v_limit = thresholds.get("vibration", 8.0)
        p_limit = thresholds.get("pressure", 5.0)
        c_limit = thresholds.get("current", 15.0)
        
        # Base healthy values: ~65% of limits
        base_temp = t_limit * 0.65
        base_vib = v_limit * 0.35
        base_pres = p_limit * 0.95
        base_cur = c_limit * 0.75
        
        for i in range(points_to_generate):
            timestamp = now - datetime.timedelta(minutes=10 * (points_to_generate - i))
            
            temp = base_temp + random.uniform(-1.0, 1.0)
            vib = base_vib + random.uniform(-0.15, 0.15)
            pres = base_pres + random.uniform(-0.1, 0.1)
            cur = base_cur + random.uniform(-0.3, 0.3)
            
            # Columns: machine_id, timestamp, temperature, vibration, pressure, current, diagnosed_component, anomaly_signature
            telemetry_records.append((machine_id, timestamp, temp, vib, pres, cur, None, None))
            
    with conn.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current, diagnosed_component, anomaly_signature)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            telemetry_records
        )
    conn.commit()
    print(f"Seeded {len(telemetry_records)} normal sensor readings for 1,000 machines.")


# ==============================================================================
# 2. PROGRESSIVE DEGRADATION / ANOMALY GENERATOR
# ==============================================================================

def trigger_anomaly(conn, machine_id):
    """
    Simulates a progressive mechanical degradation anomaly over a 24-hour period 
    for the specified machine (e.g., severe bearing wear and pump cavitation).
    
    - Over 24 hours, the parameters steadily worsen and cross critical thresholds.
    - Updates the machine's status to 'Degraded' or 'Critical' in the database.
    - Automatically spawns a high-priority maintenance order detailing root cause.
    """
    print(f"\n--- TRIGGERING ANOMALY SIMULATION ON MACHINE: {machine_id} ---")
    
    # 1. Retrieve the machine thresholds
    with conn.cursor() as cursor:
        cursor.execute("SELECT name, critical_thresholds FROM machines WHERE id = %s", (machine_id,))
        res = cursor.fetchone()
        if not res:
            print(f"Error: Machine {machine_id} not found in database.")
            return
        machine_name, thresholds = res
    
    print(f"Selected Machine: {machine_name}")
    print(f"Operational Limits: {thresholds}")
    
    # Clean previous telemetry for this machine in the simulated 24h window to replace it with the degradation
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM sensor_telemetry WHERE machine_id = %s", (machine_id,))
    
    now = datetime.datetime.now(datetime.timezone.utc)
    points = 144  # 24 hours, every 10 minutes
    
    # Initial healthy baselines for the pump
    base_temp = 55.0
    base_vib = 1.8
    base_pres = 5.2
    base_cur = 8.2
    
    telemetry_records = []
    
    # We will simulate a steady degradation that starts slow and accelerates near the end (exponential or linear)
    for i in range(points):
        timestamp = now - datetime.timedelta(minutes=10 * (points - i))
        progress = i / float(points - 1)  # 0.0 to 1.0
        
        # Exponential curve for degradation profile
        deg_factor = progress ** 2.2
        
        # Temperature climbs from 55C to 98.5C (Threshold is 90.0C)
        temp = base_temp + (43.5 * deg_factor) + random.uniform(-0.8, 0.8)
        
        # Vibration climbs from 1.8 mm/s to 9.8 mm/s (Threshold is 8.0 mm/s)
        vib = base_vib + (8.0 * deg_factor) + random.uniform(-0.15, 0.15)
        
        # Pressure drops from 5.2 bar down to 2.9 bar (showing severe cavitation / pressure loss)
        pres = base_pres - (2.3 * deg_factor) + random.uniform(-0.1, 0.1)
        
        # Current spikes from 8.2 Amps to 17.5 Amps (Threshold is 15.0 Amps, indicating motor strain)
        cur = base_cur + (9.3 * deg_factor) + random.uniform(-0.3, 0.3)
        
        # High Radial Vibration alone or with Temperature -> Flag 'Rotor Shaft Bearing Failure'
        is_anomaly_point = progress > 0.85
        diag_comp = 'Rotor Shaft Bearing Failure' if is_anomaly_point else None
        anom_sig = 'High Radial Vibration alone or with Temperature' if is_anomaly_point else None
        
        telemetry_records.append((machine_id, timestamp, temp, vib, pres, cur, diag_comp, anom_sig))
        
    # Write degradation telemetry to PostgreSQL
    with conn.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current, diagnosed_component, anomaly_signature)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            telemetry_records
        )
        
        # 2. Update machine status to 'Degraded'
        cursor.execute(
            """
            UPDATE machines 
            SET status = 'Degraded', updated_at = NOW() 
            WHERE id = %s
            """,
            (machine_id,)
        )
        
        # 3. Insert an automated high-priority maintenance order
        root_cause_msg = (
            f"Automated PdM Alert: Progressive thermodynamic and mechanical degradation detected. "
            f"Vibration levels exceeded safety threshold of {thresholds.get('vibration')} mm/s, reaching {vib:.2f} mm/s. "
            f"Motor winding temperature reached {temp:.1f}°C (Threshold: {thresholds.get('temperature')}°C). "
            f"Discharge pressure dropped to {pres:.2f} bar indicating hydraulic cavitation and seal compromise. "
            f"Motor operating current spiked to {cur:.2f} A, indicating high mechanical friction and load resistance."
        )
        
        cursor.execute(
            """
            INSERT INTO maintenance_orders (machine_id, priority, status, root_cause, assigned_technician, diagnosed_component, anomaly_signature)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (machine_id, 'High', 'Pending', root_cause_msg, 'Sarah Jenkins (PdM Specialist)', 'Rotor Shaft Bearing Failure', 'High Radial Vibration alone or with Temperature')
        )
        order_id = cursor.fetchone()[0]
        
    conn.commit()
    print(f"Degradation telemetry successfully populated ({len(telemetry_records)} points).")
    print(f"Machine {machine_id} status updated to 'Degraded'.")
    print(f"Maintenance Ticket #{order_id} raised automatically for Sarah Jenkins. Priority: High.")
    print("--------------------------------------------------------------------------")


# ==============================================================================
# 3. CHROMA VECTOR DATABASE INITIALIZATION
# ==============================================================================

def get_chroma_client():
    """
    Connects to the Chroma DB client.
    First attempts connection to remote TryChroma Cloud Server using environment keys,
    and falls back to a high-performance local SQLite persistent storage on failure.
    """
    print("\nInitializing Chroma Client...")
    
    if CHROMA_API_KEY and CHROMA_TENANT:
        print(f"Chroma Cloud settings detected. Tenant: {CHROMA_TENANT}")
        try:
            # Using standard official CloudClient SDK connection
            if hasattr(chromadb, "CloudClient"):
                client = chromadb.CloudClient(
                    tenant=CHROMA_TENANT,
                    database=CHROMA_DATABASE,
                    api_key=CHROMA_API_KEY,
                    cloud_host=CHROMA_HOST
                )
                print("Chroma Cloud Client connected successfully via CloudClient API.")
                return client
            else:
                # HttpClient approach with custom authentication settings
                from chromadb.config import Settings
                client = chromadb.HttpClient(
                    host=CHROMA_HOST,
                    tenant=CHROMA_TENANT,
                    database=CHROMA_DATABASE,
                    settings=Settings(
                        chroma_client_auth_provider="chromadb.auth.token_authn.TokenHeaderAuthClientProvider",
                        chroma_client_auth_credentials=CHROMA_API_KEY
                    )
                )
                print("Chroma Cloud Client connected successfully via HttpClient.")
                return client
        except Exception as e:
            print(f"Failed to initialize Chroma Cloud: {e}")
            print("Falling back to local high-performance persistent storage...")
    else:
        print("No Chroma Cloud keys found in environment variables.")
        print("Initializing local persistent client (./chroma_db)...")
        
    # Local fallback persistent storage
    try:
        client = chromadb.PersistentClient(path="./chroma_db")
        print("Local Chroma Persistent Client initialized successfully.")
        return client
    except Exception as e:
        print(f"Error initializing local persistent client: {e}")
        print("Using Ephemeral (in-memory) Client as absolute backup...")
        return chromadb.EphemeralClient()


def initialize_chroma_collections(client):
    """
    Checks for or creates required collections, then inserts structured text data chunks
    embedded automatically using the built-in all-MiniLM-L6-v2 model.
    """
    # Define default embedding function (lightweight and requires no API keys)
    default_ef = embedding_functions.DefaultEmbeddingFunction()
    
    # --------------------------------------------------------------------------
    # A. Collection: equipment_manuals
    # --------------------------------------------------------------------------
    print("\nSetting up 'equipment_manuals' collection...")
    try:
        # Delete if exists to ensure fresh/clean write of the synthetic data
        try:
            client.delete_collection("equipment_manuals")
        except Exception:
            pass # Did not exist
            
        equipment_manuals = client.get_or_create_collection(
            name="equipment_manuals",
            embedding_function=default_ef,
            metadata={"description": "Structured chunks of industrial machinery manuals and troubleshooting rules."}
        )
        
        # Prepare structured troubleshooting text chunks
        manual_documents = [
            # Bearings manual chunk
            (
                "doc_bearing_01",
                "Equipment: Rotary Bearings (Model RX-200 / PART-001). "
                "Troubleshooting Rules for Bearing Heating and Vibration: "
                "1. If radial vibration exceeds 8.0 mm/s velocity RMS, inspect immediately for bearing cage wear or race fatigue. "
                "2. Temperature exceeding 90.0°C indicates lubrication compromise. Runout and severe friction cause microscopic welding on ball bearings. "
                "3. Lubrication Specs: Inject 15g of Lithium-soap base grease (ISO VG 100) into grease nipples. Avoid over-greasing as it induces churn heating. "
                "4. Preventive Action: Re-align shafts using dial indicators or laser alignment systems to within 0.05 mm variance.",
                {"equipment": "bearings", "model": "RX-200", "associated_part": "PART-001", "critical_vibration": 8.0, "critical_temp": 90.0}
            ),
            # Centrifugal pump manual chunk
            (
                "doc_pump_01",
                "Equipment: Centrifugal Pumps (Model CP-500 / PART-003). "
                "Troubleshooting Rules for Cavitation & Pressure Fluctuations: "
                "1. Cavitation manifests as a loud rattle, sounding like pumping gravel, accompanied by dropping discharge pressure (below 6.5 bar). "
                "2. Root Cause: Net Positive Suction Head Available (NPSHa) drops below Required NPSH. Liquid vaporizes in suction lines, and bubbles implode on impeller vanes. "
                "3. Correction: Partially close discharge valves to decrease flow rate. Ensure liquid level in the suction tank is above 4.5 meters. "
                "4. Inspection: Check mechanical shaft seals for micro-cracks allowing air leakage. Replace seal if stock level permits (PART-002).",
                {"equipment": "pumps", "model": "CP-500", "associated_part": "PART-003", "critical_pressure": 6.5}
            ),
            # Industrial exhaust fan manual chunk
            (
                "doc_fan_01",
                "Equipment: Industrial Exhaust Fans (Model EF-90 / PART-004). "
                "Troubleshooting Rules for Rotational Imbalance and Electrical Load: "
                "1. Impeller particulate buildup (dust, moisture, grease) causes eccentric center of mass, producing high vibration. "
                "2. Winding Temperature Limits: If the 3-phase AC stator windings exceed 80.0°C, inspect ventilation pathways. "
                "3. Amperage Overload: Motor current above 15.0 Amps suggests bearing locking or mechanical blockage. "
                "4. Operational Recovery: Isolate fan using electrical lockout-tagout (LOTO). Scrape particulates off exhaust fan blades, check balancing clips, and inspect motor stator windings.",
                {"equipment": "fans", "model": "EF-90", "associated_part": "PART-004", "critical_current": 15.0, "critical_temp": 80.0}
            )
        ]
        
        # Unpack and add to collection
        ids = [doc[0] for doc in manual_documents]
        texts = [doc[1] for doc in manual_documents]
        metadatas = [doc[2] for doc in manual_documents]
        
        equipment_manuals.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        print(f"Collection 'equipment_manuals' populated with {len(ids)} detailed industrial manual records.")
        
    except Exception as e:
        print(f"Error setting up equipment_manuals: {e}")
        
    # --------------------------------------------------------------------------
    # B. Collection: supplier_routes
    # --------------------------------------------------------------------------
    print("\nSetting up 'supplier_routes' collection...")
    try:
        try:
            client.delete_collection("supplier_routes")
        except Exception:
            pass # Did not exist
            
        supplier_routes = client.get_or_create_collection(
            name="supplier_routes",
            embedding_function=default_ef,
            metadata={"description": "Supply chain intelligence: Alternative routing, logistics, transit times and risks."}
        )
        
        # Prepare supply chain routing text profiles
        route_documents = [
            (
                "route_part_001_A",
                "Part ID: PART-001 (Heavy-Duty Bearing Assembly). "
                "Supplier Route Option A (Expedited / Premium): "
                "Supplier: SKF Munich (Germany). Logistics Route: Air Freight from Munich Airport (MUC) to Newark Airport (EWR), followed by direct LTL road transit to Factory. "
                "Transit Time: 5 days. Unit Shipping Cost: $450.00. Risk Rating: Low. "
                "Logistical Notes: Highly reliable supply line, rapid customs clearance, guaranteed stock priority. Use in critical machine breakdowns.",
                {"part_id": "PART-001", "route_id": "A", "supplier": "SKF Munich", "lead_time_days": 5, "risk": "low", "cost": 450.00}
            ),
            (
                "route_part_001_B",
                "Part ID: PART-001 (Heavy-Duty Bearing Assembly). "
                "Supplier Route Option B (Standard / Bulk): "
                "Supplier: NSK Yokohama (Japan). Logistics Route: Ocean Freight from Port of Yokohama to Port of Los Angeles (LAX), rail freight to regional terminal, local delivery truck. "
                "Transit Time: 22 days. Unit Shipping Cost: $120.00. Risk Rating: Medium. "
                "Logistical Notes: Low-cost option optimized for scheduled replenishment. Subject to potential port congestion delays and maritime weather delays at LAX.",
                {"part_id": "PART-001", "route_id": "B", "supplier": "NSK Japan", "lead_time_days": 22, "risk": "medium", "cost": 120.00}
            ),
            (
                "route_part_002_A",
                "Part ID: PART-002 (High-Pressure Hydraulic Seal). "
                "Supplier Route Option A (Domestic / Rapid): "
                "Supplier: Parker Hannifin (Cleveland, OH, USA). Logistics Route: Ground courier road shipping directly to Factory. "
                "Transit Time: 2 days. Unit Shipping Cost: $35.00. Risk Rating: Low. "
                "Logistical Notes: Outstanding domestic delivery, extremely low risk, high availability. Keep as primary routing for seals.",
                {"part_id": "PART-002", "route_id": "A", "supplier": "Parker Hannifin", "lead_time_days": 2, "risk": "low", "cost": 35.00}
            ),
            (
                "route_part_003_A",
                "Part ID: PART-003 (Centrifugal Pump Impeller). "
                "Supplier Route Option A (Ocean Replenishment): "
                "Supplier: Sulzer Gothenburg (Sweden). Logistics Route: Ocean cargo vessel from Gothenburg Port to Port of Hamburg, transfer to transatlantic vessel to Port of Newark, road carrier to Factory. "
                "Transit Time: 14 days. Unit Shipping Cost: $250.00. Risk Rating: Low. "
                "Logistical Notes: Highly stable northern European supply link. Customs operations at Hamburg and Newark are routine with minimal delay probability.",
                {"part_id": "PART-003", "route_id": "A", "supplier": "Sulzer Sweden", "lead_time_days": 14, "risk": "low", "cost": 250.00}
            ),
            (
                "route_part_004_A",
                "Part ID: PART-004 (3-Phase Electric Motor Winding). "
                "Supplier Route Option A (Long-Distance Maritime): "
                "Supplier: Siemens Shanghai (China). Logistics Route: Ocean vessel to Port of Seattle, transcontinental rail line, and final road haulage. "
                "Transit Time: 28 days. Unit Shipping Cost: $180.00. Risk Rating: High. "
                "Logistical Notes: Susceptible to tariff audits, shipping route disruptions in the Pacific, and seasonal weather anomalies. Reorder well in advance of reorder threshold.",
                {"part_id": "PART-004", "route_id": "A", "supplier": "Siemens China", "lead_time_days": 28, "risk": "high", "cost": 180.00}
            )
        ]
        
        # Unpack and add to collection
        ids = [doc[0] for doc in route_documents]
        texts = [doc[1] for doc in route_documents]
        metadatas = [doc[2] for doc in route_documents]
        
        supplier_routes.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        print(f"Collection 'supplier_routes' populated with {len(ids)} detailed logistics profiles.")
        
    except Exception as e:
        print(f"Error setting up supplier_routes: {e}")


# ==============================================================================
# MAIN EXECUTION ROUTINE
# ==============================================================================

if __name__ == "__main__":
    pg_conn = None
    try:
        # Step 1: PostgreSQL Setup
        pg_conn = get_postgres_connection()
        
        # Step 2: Initialize Schema from schema.sql
        if initialize_postgres_schema(pg_conn):
            # Step 3: Seed Machines and Inventory Structured Tables
            seed_postgres_data(pg_conn)
            
            # Step 4: Generate Baseline Telemetry
            generate_baseline_telemetry(pg_conn)
            
            # Step 5: Trigger Predictive Maintenance (PdM) Anomaly Simulation on Pump A (MCH-001)
            trigger_anomaly(pg_conn, "MCH-001")
            
        print("\nPostgreSQL Database Setup and Anomaly Injection Completed Successfully.")
        
    except Exception as ex:
        print(f"\nPostgreSQL initial setup failed: {ex}")
        print("Skipping further PostgreSQL operations...")
        
    finally:
        if pg_conn:
            pg_conn.close()
            print("PostgreSQL Connection closed.")
            
    try:
        # Step 6: Chroma VDB Setup and Seeding
        chroma_cli = get_chroma_client()
        initialize_chroma_collections(chroma_cli)
        print("\nChroma Vector Database Setup and Seeding Completed Successfully.")
        
    except Exception as ex:
        print(f"\nChroma setup failed: {ex}")
        
    print("\n==========================================================================")
    print("Database Foundation and Predictive Maintenance (PdM) Data Hydration Done!")
    print("==========================================================================")

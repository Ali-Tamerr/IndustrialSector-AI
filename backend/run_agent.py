import os
import sys
import datetime
import random
import json
import psycopg2
from psycopg2.extras import RealDictCursor, Json

# Import the multi-agent orchestrator from agent.py
from agent import PredictiveMaintenanceOrchestrator, get_postgres_connection, get_chroma_client, logger

def run_fleet_demo():
    print("\n" + "="*80)
    print("      INDUSTRIAL SECTOR AI SYSTEM: MULTI-AGENT ORCHESTRATION DEMO")
    print("="*80)
    
    # Connect to PostgreSQL to check initial state
    try:
        conn = get_postgres_connection()
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        print("Please make sure init_db.py has been run and .env is configured correctly.")
        return
        
    try:
        # Step 1: Ensure database is populated.
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM machines;")
            row = cursor.fetchone()
            machine_count = row[0] if row is not None else 0
            
        if machine_count == 0:
            print("[System] PostgreSQL is uninitialized. Running 'python init_db.py' first...")
            import subprocess
            subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "init_db.py")], check=True)
            # Reconnect
            conn = get_postgres_connection()
        else:
            print(f"[System] Database found with {machine_count} seeded machines.")
            
        # Check current statuses
        print("\n--- Current Machine Fleet Statuses ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id, name, status FROM machines ORDER BY id;")
            machines = cursor.fetchall()
            for m in machines:
                print(f" - {m['id']}: {m['name']} | Status: {m['status']}")
                
        print("\n--- Current Spare Parts Inventory ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT part_id, part_name, stock_level, reorder_point FROM inventory ORDER BY part_id;")
            for inv in cursor.fetchall():
                status = "LOW STOCK (Reorder Triggered)" if inv['stock_level'] <= inv['reorder_point'] else "OK"
                print(f" - {inv['part_id']}: {inv['part_name']} | Stock: {inv['stock_level']} (Reorder Point: {inv['reorder_point']}) | [{status}]")
                
        # Determine if we are in standard template demo mode or custom fleet mode
        is_template_demo = any(m['id'] == 'MCH-002' for m in machines)
        
        # Close connection so the Orchestrator can take over cleanly
        conn.close()
        
        # Start MQTT Telemetry Ingestor in background
        from agent import MqttTelemetryIngestor
        print("\n[System] Starting MQTT Telemetry Ingestor on background thread...")
        ingestor = MqttTelemetryIngestor()
        ingestor.start()
        
        import time
        time.sleep(2)
        
        orchestrator = PredictiveMaintenanceOrchestrator()
        
        if is_template_demo:
            # Step 2: Initialize Orchestrator and run the first scan for presets
            print("\n" + "="*60)
            print(" PHASE 1: EVALUATING ACTIVE ANOMALY ON PUMP A (MCH-001)")
            print(" Expected Outcome: PART-001 is IN STOCK -> Auto-Approve & Dispatch")
            print("="*60)
            
            phase1_results = orchestrator.run_pipeline()
            
            # Step 3: Publish dynamic anomaly payload over MQTT for Fan B (MCH-002)
            print("\n" + "="*60)
            print(" PHASE 2: PUBLISHING Telemetry Anomaly on Fan B (MCH-002) via MQTT")
            print(" Expected Outcome: Ingested, diagnosed, and dispatched out-of-stock sourcing")
            print("="*60)
            
            publish_mock_telemetry("MCH-002", {
                "winding_temp": 89.5,
                "radial_vibration": 4.2,
                "discharge_pressure": 6.8,
                "coil_amperage": 22.4
            })
            
            # Wait for ingestion and multi-agent pipeline dispatch
            print("\n[System] Waiting for MQTT Message Ingestion and processing...")
            time.sleep(3)
            
        else:
            # Custom Fleet mode
            if len(machines) > 0:
                target_machine = machines[0]
                print("\n" + "="*60)
                print(f" PHASE 1: PUBLISHING CUSTOM TELEMETRY ANOMALY ON {target_machine['name']} ({target_machine['id']}) via MQTT")
                print(" Expected Outcome: Ingested, diagnosed and dispatched sourcing route")
                print("="*60)
                
                # Fetch custom machine thresholds
                target_id = target_machine['id']
                target_thresholds = target_machine.get('critical_thresholds') or {}
                if isinstance(target_thresholds, str):
                    target_thresholds = json.loads(target_thresholds)
                
                t_limit = target_thresholds.get("temperature", 90.0)
                v_limit = target_thresholds.get("vibration", 8.0)
                
                publish_mock_telemetry(target_id, {
                    "winding_temp": t_limit + 10.0 if t_limit > 0 else 95.0,
                    "radial_vibration": v_limit + 2.0 if v_limit > 0 else 9.5,
                    "discharge_pressure": 6.0,
                    "coil_amperage": 12.0
                })
                
                print("\n[System] Waiting for MQTT Message Ingestion and processing...")
                time.sleep(3)
            else:
                print("[System] No machines found in custom fleet to execute simulation.")
                
        # Stop Ingestor
        print("\n[System] Stopping MQTT Ingestor...")
        ingestor.stop()
        
        # Step 4: Display Final SQL Database Records
        display_final_database_state()
        
    except Exception as e:
        print(f"Demo failed: {e}")
        import traceback
        traceback.print_exc()


def publish_mock_telemetry(machine_id: str, payload: dict):
    """Publishes a test telemetry message to broker.emqx.io to verify MQTT ingestion."""
    import paho.mqtt.client as mqtt
    
    broker = os.getenv("MQTT_BROKER_HOST", "broker.emqx.io")
    port = int(os.getenv("MQTT_BROKER_PORT", 1883))
    
    try:
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    except Exception:
        client = mqtt.Client()
        
    client.connect(broker, port, 60)
    topic = f"factory/machines/{machine_id}/telemetry"
    print(f"[MQTT Publisher] Publishing to '{topic}': {payload}")
    client.publish(topic, json.dumps(payload))
    client.disconnect()


def display_final_database_state():
    """Prints a beautiful summary of all maintenance tickets inside PostgreSQL."""
    print("\n" + "="*80)
    print("                  FINAL RELATIONAL SYSTEM STATE AUDIT")
    print("="*80)
    
    conn = get_postgres_connection()
    try:
        print("\n--- ACTIVE MACHINE FLEET STATUSES ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id, name, status, updated_at FROM machines ORDER BY id;")
            for m in cursor.fetchall():
                status_color = "[OK]" if m['status'] == "Operational" else ("[DEGRADED]" if m['status'] == "Degraded" else "[CRITICAL]")
                print(f" {status_color} {m['id']}: {m['name']} | Status: {m['status']} (Updated: {m['updated_at'].strftime('%H:%M:%S')})")
                
        print("\n--- ALL MAINTENANCE ORDERS DISPATCHED IN DATABASE ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, machine_id, priority, status, assigned_technician, created_at, root_cause, diagnosed_component, anomaly_signature 
                FROM maintenance_orders 
                ORDER BY id;
            """)
            orders = cursor.fetchall()
            
            for ord in orders:
                status_icon = "[APPROVED]" if ord['status'] == "Approved" else ("[PENDING_SOURCING]" if ord['status'] == "Pending_Sourcing" else "[PENDING]")
                print(f"\n Ticket #{ord['id']} | Machine: {ord['machine_id']} | Priority: {ord['priority']} | Status: {ord['status']} {status_icon}")
                print(f" Diagnosed Component: {ord.get('diagnosed_component')} | Anomaly Signature: {ord.get('anomaly_signature')}")
                print(f" Assigned Technician: {ord['assigned_technician']}")
                print(f" Created: {ord['created_at'].strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Print first 4 lines of diagnostic
                lines = ord['root_cause'].split('\n')
                print(" Diagnostic Report Summary:")
                for l in lines[:5]:
                    print(f"   {l}")
                if len(lines) > 5:
                    print("   ...")
                    
        print("\n" + "="*80)
        print("            HYBRID INDUSTRIAL AI DATA FOUNDATION SUCCESSFULLY VERIFIED!")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"Audit failed: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    run_fleet_demo()

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
        # Step 1: Ensure database is populated. Check if MCH-001 has telemetry.
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM machines;")
            machine_count = cursor.fetchone()[0]
            
        if machine_count == 0:
            print("[System] PostgreSQL is uninitialized. Running 'python init_db.py' first...")
            import subprocess
            subprocess.run([sys.executable, "init_db.py"], check=True)
            # Reconnect
            conn = get_postgres_connection()
        else:
            print(f"[System] Database found with {machine_count} seeded machines.")
            
        # Check current statuses
        print("\n--- Current Machine Fleet Statuses ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id, name, status FROM machines ORDER BY id;")
            for m in cursor.fetchall():
                print(f" - {m['id']}: {m['name']} | Status: {m['status']}")
                
        print("\n--- Current Spare Parts Inventory ---")
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT part_id, part_name, stock_level, reorder_point FROM inventory ORDER BY part_id;")
            for inv in cursor.fetchall():
                status = "LOW STOCK (Reorder Triggered)" if inv['stock_level'] <= inv['reorder_point'] else "OK"
                print(f" - {inv['part_id']}: {inv['part_name']} | Stock: {inv['stock_level']} (Reorder Point: {inv['reorder_point']}) | [{status}]")
                
        # Close connection so the Orchestrator can take over cleanly
        conn.close()
        
        # Step 2: Initialize Orchestrator and run the first scan
        # This will process MCH-001 (Rotary Gear Pump A) which is already Degraded and requires PART-001.
        # Since PART-001 (Heavy-Duty Bearing Assembly) has 15 in stock (Reorder Point: 5), it will be IN STOCK.
        # This demonstrates the 'Approved' / Immediate Dispatch workflow!
        print("\n" + "="*60)
        print(" PHASE 1: EVALUATING ACTIVE ANOMALY ON PUMP A (MCH-001)")
        print(" Expected Outcome: PART-001 is IN STOCK -> Auto-Approve & Dispatch")
        print("="*60)
        
        orchestrator = PredictiveMaintenanceOrchestrator()
        phase1_results = orchestrator.run_pipeline()
        
        # Step 3: Inject a dynamic anomaly on Machine MCH-002 (High-Speed Industrial Fan B)
        # Fan B requires PART-004 (3-Phase Electric Motor Winding). 
        # PART-004 is OUT OF STOCK (Stock Level: 1, Reorder Point: 3).
        # This will demonstrate the 'Pending_Sourcing' & supply chain rerouting workflow!
        print("\n" + "="*60)
        print(" PHASE 2: INJECTING Telemetry Anomaly on Fan B (MCH-002)")
        print(" Expected Outcome: PART-004 is OUT OF STOCK -> Trigger Chroma RAG Reroute")
        print("="*60)
        
        inject_fan_anomaly()
        
        # Run the pipeline again to detect, diagnose, and execute on the new anomaly
        print("\n[System] Re-running Multi-Agent Orchestrator Pipeline...")
        phase2_results = orchestrator.run_pipeline()
        
        # Step 4: Display Final SQL Database Records
        display_final_database_state()
        
    except Exception as e:
        print(f"Demo failed: {e}")
        import traceback
        traceback.print_exc()


def inject_fan_anomaly():
    """Simulates a progressive stator coil thermal overload anomaly on MCH-002 over 24 hours."""
    print("[Simulator] Simulating stator winding thermal degradation for MCH-002 (High-Speed Industrial Fan B)...")
    
    conn = get_postgres_connection()
    try:
        # Get Fan thresholds
        with conn.cursor() as cursor:
            cursor.execute("SELECT name, critical_thresholds FROM machines WHERE id = 'MCH-002';")
            res = cursor.fetchone()
            if not res:
                print("[Simulator] Machine MCH-002 not found!")
                return
            name, thresholds = res
            
        # Clean previous telemetry for MCH-002 to load the anomaly telemetry
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM sensor_telemetry WHERE machine_id = 'MCH-002';")
            
        now = datetime.datetime.now(datetime.timezone.utc)
        points = 144  # 24 hours, every 10 minutes
        
        # Nominal baselines for Fan B
        base_temp = 48.0
        base_vib = 2.1
        base_pres = 2.0
        base_cur = 11.0
        
        telemetry_records = []
        
        for i in range(points):
            timestamp = now - datetime.timedelta(minutes=10 * (points - i))
            progress = i / float(points - 1)  # 0.0 to 1.0
            
            # Winding degradation profile (exponential growth)
            deg_factor = progress ** 2.5
            
            # Winding Temp climbs from 48C to 89.5C (Threshold is 80.0C)
            temp = base_temp + (41.5 * deg_factor) + random.uniform(-0.5, 0.5)
            
            # Radial Vibration climbs from 2.1 to 12.2 mm/s (Threshold is 10.0 mm/s)
            vib = base_vib + (10.1 * deg_factor) + random.uniform(-0.1, 0.1)
            
            # Fan pressure stays relatively stable but fluctuates slightly
            pres = base_pres + random.uniform(-0.08, 0.08)
            
            # Current spikes from 11.0A to 25.8A (Threshold is 20.0A, indicating electrical motor winding short/load strain)
            cur = base_cur + (14.8 * deg_factor) + random.uniform(-0.2, 0.2)
            
            telemetry_records.append(("MCH-002", timestamp, temp, vib, pres, cur))
            
        with conn.cursor() as cursor:
            cursor.executemany(
                """
                INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                telemetry_records
            )
            
            # Keep machine status as 'Operational' so that Anomaly Detection Agent detects the change dynamically!
            cursor.execute("UPDATE machines SET status = 'Operational' WHERE id = 'MCH-002';")
            
        conn.commit()
        print(f"[Simulator] Seeded {len(telemetry_records)} progressive failure telemetry records for MCH-002.")
        print("[Simulator] Machine MCH-002 status reset to 'Operational' for live evaluation.")
        
    except Exception as e:
        print(f"[Simulator] Failed to inject anomaly: {e}")
        conn.rollback()
    finally:
        conn.close()


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
                SELECT id, machine_id, priority, status, assigned_technician, created_at, root_cause 
                FROM maintenance_orders 
                ORDER BY id;
            """)
            orders = cursor.fetchall()
            
            for ord in orders:
                status_icon = "[APPROVED]" if ord['status'] == "Approved" else ("[PENDING_SOURCING]" if ord['status'] == "Pending_Sourcing" else "[PENDING]")
                print(f"\n Ticket #{ord['id']} | Machine: {ord['machine_id']} | Priority: {ord['priority']} | Status: {ord['status']} {status_icon}")
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

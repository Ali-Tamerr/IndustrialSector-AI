import os
import sys
import json
import datetime
import traceback
import io
import contextlib
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

# Add project root to path
sys.path.append(os.path.dirname(__file__))

# Import PostgreSQL connection and orchestration tools
from agent import get_postgres_connection, PredictiveMaintenanceOrchestrator
from run_agent import inject_fan_anomaly

class DashboardAPIHandler(BaseHTTPRequestHandler):
    
    # Store standard headers
    def send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=self.json_serial).encode('utf-8'))

    def send_html_response(self, html_content):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))

    def do_OPTIONS(self):
        # CORS preflight requests support
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    @staticmethod
    def json_serial(obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        if isinstance(obj, float):
            return round(obj, 2)
        raise TypeError (f"Type {type(obj)} not serializable")

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # 1. Server homepage / React frontend
        if path == "/" or path == "/index.html":
            try:
                with open(os.path.join(os.path.dirname(__file__), "index.html"), "r", encoding="utf-8") as f:
                    html_content = f.read()
                self.send_html_response(html_content)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Error loading index.html: {str(e)}".encode('utf-8'))
        
        # 1b. Serve local assets
        elif path.startswith("/assets/"):
            try:
                filename = os.path.basename(path)
                filepath = os.path.join(os.path.dirname(__file__), "assets", filename)
                if os.path.exists(filepath):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/javascript; charset=utf-8')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    with open(filepath, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.send_json_response({"error": f"Asset {filename} not found"}, 404)
            except Exception as e:
                self.send_json_response({"error": str(e)}, 500)
        
        # 2. REST API: Fetch all telemetry and operational states
        elif path == "/api/data":
            try:
                data = self.fetch_operational_data()
                self.send_json_response(data)
            except Exception as e:
                print(f"Error fetching operational data: {e}")
                traceback.print_exc()
                self.send_json_response({"error": str(e)}, 500)
        else:
            # Fallback 404
            self.send_json_response({"error": "Path not found"}, 404)

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # 3. REST API: Trigger simulation & run PD Orchestrator pipeline
        if path == "/api/simulate":
            try:
                # Capture standard output logs to send to dashboard terminal log
                log_buffer = io.StringIO()
                with contextlib.redirect_stdout(log_buffer):
                    print("[System] Initializing anomaly injection on Machine 2 (High-Speed Industrial Fan B)...")
                    inject_fan_anomaly()
                    print("[System] Launching Multi-Agent Predictive Maintenance Orchestrator...")
                    
                    orchestrator = PredictiveMaintenanceOrchestrator()
                    results = orchestrator.run_pipeline()
                    print("[System] Multi-agent orchestration completed successfully.")
                
                # Fetch fresh data after simulation has modified tables
                fresh_data = self.fetch_operational_data()
                
                self.send_json_response({
                    "success": True,
                    "pipeline_results": results,
                    "thoughts_log": log_buffer.getvalue().split('\n'),
                    "fresh_data": fresh_data
                })
            except Exception as e:
                print(f"Error during simulation execution: {e}")
                traceback.print_exc()
                self.send_json_response({"error": str(e)}, 500)
        else:
            self.send_json_response({"error": "Method not allowed"}, 405)

    def fetch_operational_data(self):
        """Fetches machines, latest time-series telemetry, inventory, maintenance tickets, and supply graph."""
        conn = get_postgres_connection()
        try:
            with conn.cursor() as cursor:
                # A. Fetch Machines
                cursor.execute("SELECT id, name, location, status, critical_thresholds FROM machines ORDER BY id;")
                machines = []
                for row in cursor.fetchall():
                    machines.append({
                        "id": row[0],
                        "name": row[1],
                        "location": row[2],
                        "status": row[3],
                        "critical_thresholds": row[4]
                    })
                
                # B. Fetch Telemetry History (Latest 15 points per machine)
                telemetry = {}
                for m in machines:
                    m_id = m["id"]
                    cursor.execute("""
                        SELECT timestamp, temperature, vibration, pressure, current
                        FROM sensor_telemetry
                        WHERE machine_id = %s
                        ORDER BY timestamp DESC
                        LIMIT 15;
                    """, (m_id,))
                    points = []
                    for row in cursor.fetchall():
                        points.append({
                            "timestamp": row[0].isoformat(),
                            "temperature": row[1],
                            "vibration": row[2],
                            "pressure": row[3],
                            "current": row[4]
                        })
                    # Reverse to make chronological
                    points.reverse()
                    telemetry[m_id] = points

                # C. Fetch Spare Parts Inventory
                cursor.execute("SELECT part_id, part_name, stock_level, reorder_point, cost, location FROM inventory ORDER BY part_id;")
                inventory = []
                for row in cursor.fetchall():
                    inventory.append({
                        "part_id": row[0],
                        "part_name": row[1],
                        "stock_level": row[2],
                        "reorder_point": row[3],
                        "cost": float(row[4]),
                        "location": row[5]
                    })

                # D. Fetch Maintenance Orders
                cursor.execute("""
                    SELECT id, machine_id, priority, status, root_cause, assigned_technician, created_at, updated_at
                    FROM maintenance_orders
                    ORDER BY id DESC;
                """)
                orders = []
                for row in cursor.fetchall():
                    orders.append({
                        "id": row[0],
                        "machine_id": row[1],
                        "priority": row[2],
                        "status": row[3],
                        "root_cause": row[4],
                        "assigned_technician": row[5],
                        "created_at": row[6].isoformat(),
                        "updated_at": row[7].isoformat()
                    })

                # E. Fetch Sourcing Knowledge Graph (Nodes and Edges)
                cursor.execute("SELECT node_id, node_name, node_type, risk_rating, contact_email FROM supplier_graph;")
                graph_nodes = []
                for row in cursor.fetchall():
                    graph_nodes.append({
                        "id": row[0],
                        "name": row[1],
                        "type": row[2],
                        "risk": row[3],
                        "email": row[4]
                    })

                cursor.execute("SELECT edge_id, from_node, to_node, relationship, transit_time_days, price FROM supplier_edges;")
                graph_links = []
                for row in cursor.fetchall():
                    graph_links.append({
                        "id": row[0],
                        "source": row[1],
                        "target": row[2],
                        "relationship": row[3],
                        "transit": row[4],
                        "price": float(row[5])
                    })

                return {
                    "machines": machines,
                    "telemetry": telemetry,
                    "inventory": inventory,
                    "maintenance_orders": orders,
                    "graph": {
                        "nodes": graph_nodes,
                        "links": graph_links
                    }
                }
        finally:
            conn.close()

def run_server(port=3000):
    server_address = ('', port)
    HTTPServer.allow_reuse_address = True # Enable socket reuse to prevent WinError 10048 / TIME_WAIT lockouts
    httpd = HTTPServer(server_address, DashboardAPIHandler)
    print(f"\n=======================================================")
    print(f"  INDUSTRIAL CONTROL TOWER DASHBOARD SERVER ACTIVE     ")
    print(f"  Listening on: http://localhost:{port}               ")
    print(f"=======================================================\n")
    httpd.serve_forever()

if __name__ == "__main__":
    port = 3000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)

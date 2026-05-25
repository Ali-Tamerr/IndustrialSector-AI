import { NextResponse } from "next/server";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';


// Manually load the root .env file to get DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/(^['"]|['"]$)/g, "");
          process.env[key.trim()] = value;
        }
      });
      databaseUrl = process.env.DATABASE_URL;
    }
  } catch (err) {
    console.error("Failed to read root .env file:", err);
  }
}

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl && databaseUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  if (!databaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  const client = await pool.connect();
  try {
    // A. Fetch Machines
    const machinesRes = await client.query(
      "SELECT id, name, location, status, critical_thresholds FROM machines ORDER BY id;"
    );
    const machines = machinesRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
      critical_thresholds: row.critical_thresholds,
    }));

    // B. Fetch Telemetry History (Latest 15 points per machine)
    const telemetry = {};
    for (const m of machines) {
      const telemetryRes = await client.query(
        `SELECT timestamp, temperature, vibration, pressure, current
         FROM sensor_telemetry
         WHERE machine_id = $1
         ORDER BY timestamp DESC
         LIMIT 15;`,
        [m.id]
      );
      
      const points = telemetryRes.rows.map((row) => ({
        timestamp: row.timestamp.toISOString(),
        temperature: row.temperature,
        vibration: row.vibration,
        pressure: row.pressure,
        current: row.current,
      }));
      
      // Reverse to make chronological
      points.reverse();
      telemetry[m.id] = points;
    }

    // C. Fetch Spare Parts Inventory
    const inventoryRes = await client.query(
      "SELECT part_id, part_name, stock_level, reorder_point, cost, location FROM inventory ORDER BY part_id;"
    );
    const inventory = inventoryRes.rows.map((row) => ({
      part_id: row.part_id,
      part_name: row.part_name,
      stock_level: row.stock_level,
      reorder_point: row.reorder_point,
      cost: parseFloat(row.cost),
      location: row.location,
    }));

    // D. Fetch Maintenance Orders
    const ordersRes = await client.query(
      `SELECT id, machine_id, priority, status, root_cause, assigned_technician, created_at, updated_at
       FROM maintenance_orders
       ORDER BY id DESC;`
    );
    const orders = ordersRes.rows.map((row) => ({
      id: row.id,
      machine_id: row.machine_id,
      priority: row.priority,
      status: row.status,
      root_cause: row.root_cause,
      assigned_technician: row.assigned_technician,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }));

    // E. Fetch Sourcing Knowledge Graph (Nodes and Edges)
    const graphNodesRes = await client.query(
      "SELECT node_id, node_name, node_type, risk_rating, contact_email FROM supplier_graph;"
    );
    const graphNodes = graphNodesRes.rows.map((row) => ({
      id: row.node_id,
      name: row.node_name,
      type: row.node_type,
      risk: row.risk_rating,
      email: row.contact_email,
    }));

    const graphLinksRes = await client.query(
      "SELECT edge_id, from_node, to_node, relationship, transit_time_days, price FROM supplier_edges;"
    );
    const graphLinks = graphLinksRes.rows.map((row) => ({
      id: row.edge_id,
      source: row.from_node,
      target: row.to_node,
      relationship: row.relationship,
      transit: row.transit_time_days,
      price: parseFloat(row.price),
    }));

    return NextResponse.json({
      machines,
      telemetry,
      inventory,
      maintenance_orders: orders,
      graph: {
        nodes: graphNodes,
        links: graphLinks,
      },
    });
  } catch (err) {
    console.error("Database query execution failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

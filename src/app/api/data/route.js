import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function HEAD() {
  if (!cleanDatabaseUrl) {
    return new Response(null, { status: 500 });
  }
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1;");
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Database connection check failed during HEAD request:", err);
    return new Response(null, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function GET(req) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    let workspaceId = searchParams.get("workspace_id");
    if (!workspaceId) {
      try {
        const workspaceRes = await client.query("SELECT id FROM workspaces LIMIT 1;");
        if (workspaceRes.rows.length > 0) {
          workspaceId = workspaceRes.rows[0].id;
        } else {
          workspaceId = "WS-001";
        }
      } catch (e) {
        workspaceId = "WS-001";
      }
    }

    // A. Fetch Machines
    const machinesRes = await client.query(
      "SELECT id, name, location, status, critical_thresholds FROM machines WHERE workspace_id = $1 ORDER BY id;",
      [workspaceId]
    );
    const machines = machinesRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      status: row.status,
      critical_thresholds: row.critical_thresholds,
    }));

    // B. Fetch Telemetry History (Latest 15 points per machine)
    const telemetryRes = await client.query(
      `SELECT machine_id, timestamp, temperature, vibration, pressure, current, diagnosed_component, anomaly_signature
       FROM (
         SELECT t.*, ROW_NUMBER() OVER (PARTITION BY t.machine_id ORDER BY t.timestamp DESC) AS rn
         FROM sensor_telemetry t
         JOIN machines m ON t.machine_id = m.id
         WHERE m.workspace_id = $1
       ) sub
       WHERE rn <= 15
       ORDER BY machine_id, timestamp ASC;`,
      [workspaceId]
    );

    const telemetry = {};
    for (const row of telemetryRes.rows) {
      if (!telemetry[row.machine_id]) telemetry[row.machine_id] = [];
      telemetry[row.machine_id].push({
        timestamp: row.timestamp.toISOString(),
        temperature: row.temperature,
        vibration: row.vibration,
        pressure: row.pressure,
        current: row.current,
        diagnosed_component: row.diagnosed_component,
        anomaly_signature: row.anomaly_signature,
      });
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
      `SELECT mo.id, mo.machine_id, mo.priority, mo.status, mo.root_cause, mo.assigned_technician, mo.diagnosed_component, mo.anomaly_signature, mo.created_at, mo.updated_at
       FROM maintenance_orders mo
       JOIN machines m ON mo.machine_id = m.id
       WHERE m.workspace_id = $1
       ORDER BY mo.id DESC;`,
      [workspaceId]
    );
    const orders = ordersRes.rows.map((row) => ({
      id: row.id,
      machine_id: row.machine_id,
      priority: row.priority,
      status: row.status,
      root_cause: row.root_cause,
      assigned_technician: row.assigned_technician,
      diagnosed_component: row.diagnosed_component,
      anomaly_signature: row.anomaly_signature,
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

import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const customDbUrl = req.headers.get("x-custom-db-url") || cleanDatabaseUrl;
  if (!customDbUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  let client;
  try {
    client = await pool.connect(customDbUrl);
    const body = await req.json();
    const { machines, inventory, nodes, edges } = body;

    await client.query("BEGIN;");

    // 1. Clear existing database configurations cleanly
    await client.query("DELETE FROM supplier_edges;");
    await client.query("DELETE FROM supplier_graph;");
    await client.query("DELETE FROM maintenance_orders;");
    await client.query("DELETE FROM sensor_telemetry;");
    await client.query("DELETE FROM machines;");
    await client.query("DELETE FROM inventory;");

    // Reset sequences
    await client.query("ALTER SEQUENCE supplier_edges_edge_id_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE maintenance_orders_id_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE sensor_telemetry_id_seq RESTART WITH 1;");

    // 2. Insert Custom Machines (batched)
    if (machines && Array.isArray(machines) && machines.length > 0) {
      const values = [];
      const params = [];
      machines.forEach((m, i) => {
        const offset = i * 5;
        values.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5})`);
        params.push(
          m.id,
          m.name || `Machine ${m.id}`,
          m.location || "Bay 1",
          m.status || "Operational",
          JSON.stringify(m.thresholds || { temperature: 90, vibration: 8, pressure: 6.5, current: 15, required_part_id: "PART-001" })
        );
      });
      await client.query(
        `INSERT INTO machines (id, name, location, status, critical_thresholds)
         VALUES ${values.join(", ")};`,
        params
      );
    }

    // 3. Insert Custom Inventory Parts (batched)
    if (inventory && Array.isArray(inventory) && inventory.length > 0) {
      const values = [];
      const params = [];
      inventory.forEach((inv, i) => {
        const offset = i * 6;
        values.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5}, $${offset+6})`);
        params.push(
          inv.part_id,
          inv.part_name || `Part ${inv.part_id}`,
          parseInt(inv.stock_level) || 0,
          parseInt(inv.reorder_point) || 0,
          parseFloat(inv.cost) || 0.0,
          inv.location || "Warehouse A"
        );
      });
      await client.query(
        `INSERT INTO inventory (part_id, part_name, stock_level, reorder_point, cost, location)
         VALUES ${values.join(", ")};`,
        params
      );
    }

    // 4. Insert Supply Chain Graph Nodes (batched)
    if (nodes && Array.isArray(nodes) && nodes.length > 0) {
      const values = [];
      const params = [];
      nodes.forEach((n, i) => {
        const offset = i * 5;
        values.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5})`);
        params.push(
          n.id,
          n.name || `Node ${n.id}`,
          n.type || "Supplier",
          parseFloat(n.risk) || 0.0,
          n.email || null
        );
      });
      await client.query(
        `INSERT INTO supplier_graph (node_id, node_name, node_type, risk_rating, contact_email)
         VALUES ${values.join(", ")};`,
        params
      );
    }

    // 5. Insert Supply Chain Graph Edges (batched)
    if (edges && Array.isArray(edges) && edges.length > 0) {
      const values = [];
      const params = [];
      edges.forEach((e, i) => {
        const offset = i * 5;
        values.push(`($${offset+1}, $${offset+2}, $${offset+3}, $${offset+4}, $${offset+5})`);
        params.push(
          e.source,
          e.target,
          e.relationship || "SUPPLIES",
          parseInt(e.transit) || 0,
          parseFloat(e.price) || 0.0
        );
      });
      await client.query(
        `INSERT INTO supplier_edges (from_node, to_node, relationship, transit_time_days, price)
         VALUES ${values.join(", ")};`,
        params
      );
    }

    // 6. Generate baseline telemetry for all custom machines (batched)
    if (machines && Array.isArray(machines) && machines.length > 0) {
      const now = new Date();
      const pointsToGenerate = 15;
      const defaultBaselines = { temp: 50.0, vib: 2.0, pres: 5.0, cur: 12.0 };

      const values = [];
      const params = [];
      let paramIdx = 1;
      for (const m of machines) {
        for (let i = 0; i < pointsToGenerate; i++) {
          const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
          const temp = defaultBaselines.temp + (Math.random() * 2 - 1);
          const vib = defaultBaselines.vib + (Math.random() * 0.4 - 0.2);
          const pres = defaultBaselines.pres + (Math.random() * 0.2 - 0.1);
          const cur = defaultBaselines.cur + (Math.random() * 0.6 - 0.3);
          values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5})`);
          params.push(m.id, timestamp.toISOString(), temp, vib, pres, cur);
          paramIdx += 6;
        }
      }
      await client.query(
        `INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current)
         VALUES ${values.join(", ")};`,
        params
      );
    }

    await client.query("COMMIT;");
    return NextResponse.json({ success: true });

  } catch (err) {
    if (client) await client.query("ROLLBACK;");
    console.error("[API] Config update failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

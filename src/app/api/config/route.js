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

const cleanDatabaseUrl = databaseUrl ? databaseUrl.split("?")[0] : databaseUrl;
const pool = new Pool({
  connectionString: cleanDatabaseUrl,
  ssl: cleanDatabaseUrl && cleanDatabaseUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
});

export async function POST(req) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  let client;
  try {
    client = await pool.connect();
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

    // 2. Insert Custom Machines
    if (machines && Array.isArray(machines)) {
      for (const m of machines) {
        await client.query(
          `INSERT INTO machines (id, name, location, status, critical_thresholds)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            m.id,
            m.name || `Machine ${m.id}`,
            m.location || "Bay 1",
            m.status || "Operational",
            JSON.stringify(m.thresholds || { temperature: 90, vibration: 8, pressure: 6.5, current: 15, required_part_id: "PART-001" })
          ]
        );
      }
    }

    // 3. Insert Custom Inventory Parts
    if (inventory && Array.isArray(inventory)) {
      for (const inv of inventory) {
        await client.query(
          `INSERT INTO inventory (part_id, part_name, stock_level, reorder_point, cost, location)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            inv.part_id,
            inv.part_name || `Part ${inv.part_id}`,
            parseInt(inv.stock_level) || 0,
            parseInt(inv.reorder_point) || 0,
            parseFloat(inv.cost) || 0.0,
            inv.location || "Warehouse A"
          ]
        );
      }
    }

    // 4. Insert Supply Chain Graph Nodes
    if (nodes && Array.isArray(nodes)) {
      for (const n of nodes) {
        await client.query(
          `INSERT INTO supplier_graph (node_id, node_name, node_type, risk_rating, contact_email)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            n.id,
            n.name || `Node ${n.id}`,
            n.type || "Supplier",
            parseFloat(n.risk) || 0.0,
            n.email || null
          ]
        );
      }
    }

    // 5. Insert Supply Chain Graph Edges
    if (edges && Array.isArray(edges)) {
      for (const e of edges) {
        await client.query(
          `INSERT INTO supplier_edges (from_node, to_node, relationship, transit_time_days, price)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            e.source,
            e.target,
            e.relationship || "SUPPLIES",
            parseInt(e.transit) || 0,
            parseFloat(e.price) || 0.0
          ]
        );
      }
    }

    // 6. Generate baseline telemetry for all custom machines
    const now = new Date();
    const pointsToGenerate = 15;
    const baselines = {
      temp: 50.0,
      vib: 2.0,
      pres: 5.0,
      cur: 12.0
    };

    if (machines && Array.isArray(machines)) {
      for (const m of machines) {
        for (let i = 0; i < pointsToGenerate; i++) {
          const timestamp = new Date(now.getTime() - 10 * 60 * 1000 * (pointsToGenerate - i));
          const temp = baselines.temp + (Math.random() * 2 - 1);
          const vib = baselines.vib + (Math.random() * 0.4 - 0.2);
          const pres = baselines.pres + (Math.random() * 0.2 - 0.1);
          const cur = baselines.cur + (Math.random() * 0.6 - 0.3);

          await client.query(
            `INSERT INTO sensor_telemetry (machine_id, timestamp, temperature, vibration, pressure, current)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [m.id, timestamp.toISOString(), temp, vib, pres, cur]
          );
        }
      }
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

import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl } from "@/lib/db";

export const dynamic = 'force-dynamic';

// Helper to ensure database tables and mock account are initialized
async function ensureTablesInitialized(client) {
  // Create admin_accounts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id VARCHAR(8) PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL
    );
  `);

  // Create machine_reports table
  await client.query(`
    CREATE TABLE IF NOT EXISTS machine_reports (
      id SERIAL PRIMARY KEY,
      admin_id VARCHAR(8) REFERENCES admin_accounts(id) ON DELETE CASCADE,
      machine_id VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      temperature DOUBLE PRECISION,
      vibration DOUBLE PRECISION,
      pressure DOUBLE PRECISION,
      current DOUBLE PRECISION,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default mockup admin account
  await client.query(`
    INSERT INTO admin_accounts (id, email, password)
    VALUES ('ADM-8A9F', 'admin@industrial.ai', 'password123')
    ON CONFLICT (email) DO NOTHING;
  `);
}

export async function GET(request) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");

  if (!adminId) {
    return NextResponse.json({ error: "Missing adminId parameter" }, { status: 400 });
  }

  let client;
  try {
    client = await pool.connect();
    await ensureTablesInitialized(client);

    // Fetch reports for the given admin ID
    const reportsRes = await client.query(
      `SELECT id, machine_id, status, temperature, vibration, pressure, current, message, created_at
       FROM machine_reports
       WHERE admin_id = $1
       ORDER BY created_at DESC;`,
      [adminId]
    );

    return NextResponse.json({ reports: reportsRes.rows });
  } catch (err) {
    console.error("Database query in GET /api/reports failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function POST(request) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  let client;
  try {
    const body = await request.json();
    const { adminId, machineId, status, temperature, vibration, pressure, current, message } = body;

    if (!adminId || !machineId || !status) {
      return NextResponse.json(
        { error: "Missing required fields (adminId, machineId, status)" },
        { status: 400 }
      );
    }

    client = await pool.connect();
    await ensureTablesInitialized(client);

    // Validate adminId exists
    const adminCheck = await client.query(
      "SELECT id FROM admin_accounts WHERE id = $1;",
      [adminId]
    );

    if (adminCheck.rows.length === 0) {
      return NextResponse.json(
        { error: `Admin Account with Link ID '${adminId}' does not exist.` },
        { status: 404 }
      );
    }

    // Insert new machine report
    const insertRes = await client.query(
      `INSERT INTO machine_reports (admin_id, machine_id, status, temperature, vibration, pressure, current, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at;`,
      [
        adminId,
        machineId,
        status,
        temperature !== undefined && temperature !== "" ? parseFloat(temperature) : null,
        vibration !== undefined && vibration !== "" ? parseFloat(vibration) : null,
        pressure !== undefined && pressure !== "" ? parseFloat(pressure) : null,
        current !== undefined && current !== "" ? parseFloat(current) : null,
        message || null,
      ]
    );

    // Optionally update the status of the machine if it exists in the main machines table
    try {
      await client.query(
        "UPDATE machines SET status = $1, updated_at = NOW() WHERE id = $2;",
        [status, machineId]
      );
    } catch (e) {
      console.warn(`Failed to update machine status for ${machineId}: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      reportId: insertRes.rows[0].id,
      createdAt: insertRes.rows[0].created_at,
    });
  } catch (err) {
    console.error("Database execution in POST /api/reports failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

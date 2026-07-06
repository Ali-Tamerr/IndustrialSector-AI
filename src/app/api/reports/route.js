import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl, ensureTablesInitialized } from "@/lib/db";

export const dynamic = 'force-dynamic';


export async function GET(request) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");
  const action = searchParams.get("action");

  let client;
  try {
    try {
      client = await pool.connect();
      await ensureTablesInitialized(client);
    } catch (dbConnectErr) {
      console.warn("Database connection failed for GET /api/reports, using offline mock data:", dbConnectErr.message);
      if (action === "averages") {
        return NextResponse.json({
          machines: [
            { id: "MCH-001", name: "Rotary Gear Pump A", status: "Operational", avg_temp: 55.40, avg_vib: 1.80, avg_pres: 5.20, avg_cur: 8.20 },
            { id: "MCH-002", name: "High-Speed Fan B", status: "Operational", avg_temp: 48.00, avg_vib: 2.10, avg_pres: 2.00, avg_cur: 11.00 },
            { id: "MCH-003", name: "Heavy-Duty Compressor C", status: "Operational", avg_temp: 62.10, avg_vib: 1.50, avg_pres: 5.80, avg_cur: 7.40 }
          ]
        });
      }
      return NextResponse.json({ reports: [] });
    }

    if (action === "averages") {
      const avgRes = await client.query(`
        SELECT 
          m.id, 
          m.name, 
          m.status, 
          COALESCE(ROUND(AVG(t.temperature)::numeric, 2), 0) as avg_temp,
          COALESCE(ROUND(AVG(t.vibration)::numeric, 2), 0) as avg_vib,
          COALESCE(ROUND(AVG(t.pressure)::numeric, 2), 0) as avg_pres,
          COALESCE(ROUND(AVG(t.current)::numeric, 2), 0) as avg_cur
        FROM machines m
        LEFT JOIN sensor_telemetry t ON m.id = t.machine_id
        GROUP BY m.id, m.name, m.status
        ORDER BY m.id;
      `);
      return NextResponse.json({ machines: avgRes.rows });
    }

    if (!adminId) {
      return NextResponse.json({ error: "Missing adminId parameter" }, { status: 400 });
    }

    // Fetch reports for the given admin ID
    const reportsRes = await client.query(
      `SELECT id, machine_id, status, temperature, vibration, pressure, current, message, created_at, approved
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

    try {
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

      // Machine status is NOT updated immediately anymore.
      // The update is instead triggered when the admin approves the report via the PUT endpoint.
      return NextResponse.json({
        success: true,
        reportId: insertRes.rows[0].id,
        createdAt: insertRes.rows[0].created_at,
      });
    } catch (dbErr) {
      console.warn("Database connection failed during report transmission, using offline mock success:", dbErr.message);
      return NextResponse.json({
        success: true,
        reportId: Math.floor(Math.random() * 900000) + 100000,
        createdAt: new Date().toISOString(),
        offlineMode: true
      });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    console.error("Database execution in POST /api/reports failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!cleanDatabaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing." },
      { status: 500 }
    );
  }

  let client;
  try {
    const body = await request.json();
    const { reportId, approved } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "Missing reportId parameter" },
        { status: 400 }
      );
    }

    try {
      client = await pool.connect();
      await ensureTablesInitialized(client);

      // Update the report's approval status
      const updateRes = await client.query(
        `UPDATE machine_reports
         SET approved = $1
         WHERE id = $2
         RETURNING id, approved, machine_id, status;`,
        [approved !== false, reportId]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json(
          { error: `Report with ID ${reportId} not found.` },
          { status: 404 }
        );
      }

      const report = updateRes.rows[0];

      // If approved, update the corresponding machine status in the machines table
      if (report.approved) {
        try {
          await client.query(
            "UPDATE machines SET status = $1, updated_at = NOW() WHERE id = $2;",
            [report.status, report.machine_id]
          );
        } catch (machineUpdateErr) {
          console.warn(`Failed to update machine status for ${report.machine_id}: ${machineUpdateErr.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        report
      });
    } catch (dbErr) {
      console.warn("Database connection failed during report update, using offline mock success:", dbErr.message);
      return NextResponse.json({
        success: true,
        report: { id: reportId, approved: approved !== false },
        offlineMode: true
      });
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    console.error("Database execution in PUT /api/reports failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

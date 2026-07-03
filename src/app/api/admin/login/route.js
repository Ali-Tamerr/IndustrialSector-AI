import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl, ensureTablesInitialized } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Default offline/mock credentials fallback
    const mockEmail = "admin@industrial.ai";
    const mockPassword = "password123";
    const mockAdminId = "ADM-8A9F";

    if (!cleanDatabaseUrl) {
      // Local fallback mode when DATABASE_URL is not set
      if (email === mockEmail && password === mockPassword) {
        return NextResponse.json({
          success: true,
          adminId: mockAdminId,
          offlineMode: true
        });
      }
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    let client;
    try {
      client = await pool.connect();
      await ensureTablesInitialized(client);

      const res = await client.query(
        "SELECT id, email, password FROM admin_accounts WHERE email = $1;",
        [email]
      );

      if (res.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      const admin = res.rows[0];
      if (admin.password !== password) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        adminId: admin.id
      });
    } catch (dbErr) {
      console.warn("Database connection failed during login, using offline mock check:", dbErr.message);
      if (email === mockEmail && password === mockPassword) {
        return NextResponse.json({
          success: true,
          adminId: mockAdminId,
          offlineMode: true
        });
      }
      return NextResponse.json(
        { error: "Invalid email or password. (Offline Check)" },
        { status: 401 }
      );
    } finally {
      if (client) client.release();
    }
  } catch (err) {
    console.error("Login verification failed:", err);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

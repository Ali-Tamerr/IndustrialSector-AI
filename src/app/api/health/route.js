import { NextResponse } from "next/server";
import { pool, cleanDatabaseUrl } from "@/lib/db";

export const dynamic = 'force-dynamic';

async function checkDatabase(customDbUrl) {
  const finalUrl = customDbUrl || cleanDatabaseUrl;
  if (!finalUrl) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }
  const client = await pool.connect(finalUrl);
  try {
    await client.query("SELECT 1;");
  } finally {
    client.release();
  }
}

export async function GET(req) {
  try {
    const customDbUrl = req.headers.get("x-custom-db-url");
    await checkDatabase(customDbUrl);
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(
      { status: "unhealthy", error: err.message },
      { status: 500 }
    );
  }
}

export async function HEAD(req) {
  try {
    const customDbUrl = req.headers.get("x-custom-db-url");
    await checkDatabase(customDbUrl);
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Health check failed during HEAD request:", err);
    return new Response(null, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = 'force-dynamic';

// Helper to verify a database connection
async function testDbConnection(databaseUrl) {
  if (!databaseUrl) {
    return { dbConnected: false, dbError: "No connection string provided." };
  }
  const cleanUrl = databaseUrl.split("?")[0];
  const testClient = new Client({
    connectionString: cleanUrl,
    ssl: cleanUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 4000,
  });
  try {
    await testClient.connect();
    await testClient.query("SELECT 1;");
    return { dbConnected: true, dbError: null };
  } catch (err) {
    return { dbConnected: false, dbError: err.message };
  } finally {
    await testClient.end().catch(() => {});
  }
}

export async function GET(req) {
  try {
    const customDbUrl = req.headers.get("x-custom-db-url");
    const customGeminiKey = req.headers.get("x-custom-gemini-key");

    const databaseUrl = customDbUrl || process.env.DATABASE_URL || "";
    const geminiApiKey = customGeminiKey || process.env.GEMINI_API_KEY || "";

    const { dbConnected, dbError } = await testDbConnection(databaseUrl);

    return NextResponse.json({
      dbConnected,
      dbError,
      geminiConfigured: !!geminiApiKey,
      dbConfigured: !!databaseUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { DATABASE_URL, GEMINI_API_KEY } = await req.json();

    // Verify connection to the provided database URL
    const { dbConnected, dbError } = await testDbConnection(DATABASE_URL);

    return NextResponse.json({
      success: true,
      dbConnected,
      dbError,
      geminiConfigured: !!GEMINI_API_KEY,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

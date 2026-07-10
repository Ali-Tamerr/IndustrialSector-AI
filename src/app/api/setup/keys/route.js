import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { Client } from "pg";
import { updateDatabaseUrl } from "@/lib/db";

export const dynamic = 'force-dynamic';

const envFolder = path.join(os.homedir(), ".industrial_control_tower");
const envPath = path.join(envFolder, ".env");

// Helper to parse env content
function parseEnv(content) {
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/(^['"]|['"]$)/g, "");
      env[key.trim()] = value;
    }
  });
  return env;
}

export async function GET() {
  try {
    let databaseUrl = process.env.DATABASE_URL || "";
    let geminiApiKey = process.env.GEMINI_API_KEY || "";

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const env = parseEnv(content);
      if (env.DATABASE_URL) databaseUrl = env.DATABASE_URL;
      if (env.GEMINI_API_KEY) geminiApiKey = env.GEMINI_API_KEY;
    }

    // Verify DB connection
    let dbConnected = false;
    let dbError = null;
    if (databaseUrl) {
      const cleanUrl = databaseUrl.split("?")[0];
      const testClient = new Client({
        connectionString: cleanUrl,
        ssl: cleanUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 4000,
      });
      try {
        await testClient.connect();
        await testClient.query("SELECT 1;");
        dbConnected = true;
      } catch (err) {
        dbError = err.message;
      } finally {
        await testClient.end().catch(() => {});
      }
    }

    return NextResponse.json({
      DATABASE_URL: databaseUrl,
      GEMINI_API_KEY: geminiApiKey,
      dbConnected,
      dbError,
      geminiConfigured: !!geminiApiKey,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { DATABASE_URL, GEMINI_API_KEY } = await req.json();

    if (!fs.existsSync(envFolder)) {
      fs.mkdirSync(envFolder, { recursive: true });
    }

    // Write to home folder .env
    const envContent = [
      `DATABASE_URL=${DATABASE_URL || ""}`,
      `GEMINI_API_KEY=${GEMINI_API_KEY || ""}`
    ].join("\n");

    fs.writeFileSync(envPath, envContent, "utf8");

    // Update in-memory process env and Next.js DB pool
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.GEMINI_API_KEY = GEMINI_API_KEY;
    updateDatabaseUrl(DATABASE_URL);

    // Verify connection to the new database URL
    let dbConnected = false;
    let dbError = null;
    if (DATABASE_URL) {
      const cleanUrl = DATABASE_URL.split("?")[0];
      const testClient = new Client({
        connectionString: cleanUrl,
        ssl: cleanUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 4000,
      });
      try {
        await testClient.connect();
        await testClient.query("SELECT 1;");
        dbConnected = true;
      } catch (err) {
        dbError = err.message;
      } finally {
        await testClient.end().catch(() => {});
      }
    }

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

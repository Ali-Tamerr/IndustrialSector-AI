import { Pool } from "pg";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to load and parse an env file into process.env
function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const envContent = fs.readFileSync(filePath, "utf8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/(^['"]|['"]$)/g, "");
          process.env[key.trim()] = value;
        }
      });
    }
  } catch (err) {
    console.error(`Failed to read env file: ${filePath}`, err);
  }
}

// 1. Load local env file
loadEnvFile(path.resolve(process.cwd(), ".env"));

// 2. Load ~/.industrial_control_tower/.env (overrides local env)
const towerEnvPath = path.join(os.homedir(), ".industrial_control_tower", ".env");
loadEnvFile(towerEnvPath);

// Establish database url variables
export let cleanDatabaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.split("?")[0] : null;

const pools = {};

export function getOrCreatePool(customUrl) {
  const latestUrl = customUrl || process.env.DATABASE_URL;
  const cleanUrl = latestUrl ? latestUrl.split("?")[0] : null;

  if (!cleanUrl) {
    return null;
  }

  if (!pools[cleanUrl]) {
    pools[cleanUrl] = new Pool({
      connectionString: cleanUrl,
      ssl: cleanUrl.includes("aivencloud.com") ? { rejectUnauthorized: false } : false,
    });
  }
  return pools[cleanUrl];
}

// Wrapper object that implements the standard Pool interface used in the app
const pool = {
  connect: (customUrl) => {
    const p = getOrCreatePool(customUrl);
    if (!p) throw new Error("Database not configured — set DATABASE_URL in Settings.");
    return p.connect();
  },
  query: (text, params, customUrl) => {
    const p = getOrCreatePool(customUrl);
    if (!p) throw new Error("Database not configured — set DATABASE_URL in Settings.");
    return p.query(text, params);
  },
  end: () => {
    const promises = Object.values(pools).map(p => p.end());
    return Promise.all(promises);
  }
};

export function updateDatabaseUrl(newUrl) {
  process.env.DATABASE_URL = newUrl;
  cleanDatabaseUrl = newUrl ? newUrl.split("?")[0] : newUrl;
}

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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved BOOLEAN DEFAULT FALSE
    );
  `);

  // Retrofit check: ensure approved column exists in case the table was already created
  await client.query(`
    ALTER TABLE machine_reports ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;
  `);

  // Seed default mockup admin account
  await client.query(`
    INSERT INTO admin_accounts (id, email, password)
    VALUES ('ADM-8A9F', 'admin@industrial.ai', 'password123')
    ON CONFLICT (email) DO NOTHING;
  `);
}

export { pool, ensureTablesInitialized };


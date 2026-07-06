import { Pool } from "pg";
import fs from "fs";
import path from "path";

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

export { pool, cleanDatabaseUrl, ensureTablesInitialized };


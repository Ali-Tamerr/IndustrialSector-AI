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

export { pool, cleanDatabaseUrl };

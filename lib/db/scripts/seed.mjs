import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "mtotdumwifmxmzaagrim";
  if (!password) {
    throw new Error("Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env");
  }

  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
}

const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "glory2026";

const pool = new pg.Pool({
  connectionString: resolveDatabaseUrl(),
  ssl: resolveDatabaseUrl().includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

const setupSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'volunteer', 'attendee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT UNIQUE,
  email           TEXT UNIQUE,
  phone           TEXT,
  display_name    TEXT NOT NULL,
  password_hash   TEXT,
  role            user_role NOT NULL DEFAULT 'volunteer',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_identity_check CHECK (username IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
`;

async function main() {
  const client = await pool.connect();
  try {
    console.log("Setting up users table...");
    await client.query(setupSql);

    console.log(`Seeding admin user "${adminUsername}"...`);
    const result = await client.query(
      `INSERT INTO users (username, display_name, password_hash, role)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), 'admin')
       ON CONFLICT (username) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING id, username, role`,
      [adminUsername, "Administrator", adminPassword],
    );

    const user = result.rows[0];
    console.log(`Done. Admin user ready: ${user.username} (${user.role})`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

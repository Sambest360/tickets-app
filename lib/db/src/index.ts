import "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "mtotdumwifmxmzaagrim";

  if (password) {
    const encodedPassword = encodeURIComponent(password);
    return `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
  }

  throw new Error(
    "DATABASE_URL or SUPABASE_DB_PASSWORD must be set. Get the database password from Supabase Dashboard → Project Settings → Database.",
  );
}

const databaseUrl = resolveDatabaseUrl();
const isSupabase = databaseUrl.includes("supabase.com");

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

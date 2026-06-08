import "./src/env";
import { defineConfig } from "drizzle-kit";
import path from "path";

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

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});

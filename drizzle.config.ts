import { defineConfig } from "drizzle-kit";

/**
 * Reads DATABASE_URL from the environment (drizzle-kit auto-loads .env).
 * Fallback matches the local sandbox defaults.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});

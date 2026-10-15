<<<<<<< HEAD
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
=======
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
  },
});

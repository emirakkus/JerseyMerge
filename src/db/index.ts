import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

<<<<<<< HEAD
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Create a .env file at the project root with your PostgreSQL connection string, e.g.\n" +
      '  DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/app_db\n' +
      "Step-by-step setup (Docker / local / Neon) and verification: see SETUP_DB.md"
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
=======
type Database = ReturnType<typeof drizzle>;
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDatabase?: Database;
};

function getDatabase(): Database {
  if (globalForDb.__arenaNextJsPostgresqlDatabase) {
    return globalForDb.__arenaNextJsPostgresqlDatabase;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  const database = drizzle(pool);
  globalForDb.__arenaNextJsPostgresqlDatabase = database;
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDatabase();
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c

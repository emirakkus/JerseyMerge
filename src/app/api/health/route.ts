import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Liveness + DB check. Kullan: curl http://localhost:3000/api/health */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return Response.json(
    {
      ok: dbOk,
      db: dbOk,
      dbLatencyMs: Date.now() - started,
      databaseUrl: process.env.DATABASE_URL ? "set" : "missing — see SETUP_DB.md",
    },
    { status: dbOk ? 200 : 503 }
  );
}

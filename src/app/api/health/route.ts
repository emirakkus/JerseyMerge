import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

<<<<<<< HEAD
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
=======
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
}

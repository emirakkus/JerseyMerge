import { NextResponse } from "next/server";
import { asc, desc, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Global top 10 players by best score (public). */
export async function GET() {
  const rows = await db
    .select({
      username: users.username,
      bestScore: users.bestScore,
      bestTimeMs: users.bestTimeMs,
      bestAt: users.bestAt,
    })
    .from(users)
    .where(gt(users.bestScore, 0))
    .orderBy(desc(users.bestScore), asc(users.bestTimeMs))
    .limit(10);

  const entries = rows.map((r) => ({
    name: r.username,
    score: r.bestScore,
    timeMs: r.bestTimeMs,
    at: r.bestAt.getTime(),
  }));

  return NextResponse.json({ entries });
}

import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scores, userBadges } from "@/db/schema";
import { requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(scores)
    .where(eq(scores.userId, user.id))
    .orderBy(desc(scores.score), asc(scores.timeMs))
    .limit(10);

  const top = rows.map((r) => ({
    name: user.username,
    score: r.score,
    timeMs: r.timeMs,
    at: r.createdAt.getTime(),
  }));

  const badgeRows = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, user.id));

  return NextResponse.json({ user, top, badges: badgeRows.map((b) => b.badgeId) });
}

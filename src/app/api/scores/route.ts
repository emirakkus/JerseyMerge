import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scores, users } from "@/db/schema";
import { requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { score?: unknown; timeMs?: unknown; powerupsUsed?: unknown; bestCombo?: unknown };
  try {
    body = (await req.json()) as { score?: unknown; timeMs?: unknown; powerupsUsed?: unknown; bestCombo?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const score = Math.max(0, Math.floor(Number(body.score ?? 0)));
  const timeMs = Math.max(0, Math.floor(Number(body.timeMs ?? 0)));
  const powerupsUsed = Math.max(0, Math.min(1_000_000, Math.floor(Number(body.powerupsUsed ?? 0))));
  const bestCombo = Math.max(0, Math.min(1_000_000, Math.floor(Number(body.bestCombo ?? 0))));
  if (!Number.isFinite(score) || score > 1_000_000) {
    return NextResponse.json({ error: "Invalid score." }, { status: 400 });
  }

  await db
    .insert(scores)
    .values({ userId: user.id, score, timeMs, powerupsUsed, bestCombo });

  const isNewBest = score > user.bestScore;
  const best = Math.max(user.bestScore, score);
  if (isNewBest) {
    await db
      .update(users)
      .set({ bestScore: best, bestTimeMs: timeMs, bestAt: new Date() })
      .where(eq(users.id, user.id));
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

  return NextResponse.json({ best, isNewBest, top });
}

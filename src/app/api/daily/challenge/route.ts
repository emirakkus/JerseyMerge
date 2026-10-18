import { NextResponse } from "next/server";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { dailyScores } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { requireUser } from "@/lib/server/auth";
import { dailySeed, utcDayKey } from "@/lib/game/prng";
import { validateDailySubmission } from "@/lib/daily/validation";
import type { DailyChallengeResult, DailyChallengeSubmit } from "@/lib/daily/types";

export const dynamic = "force-dynamic";

/**
 * Submits a daily challenge score. Rules:
 * - sign-in required (guests can play but are not recorded)
 * - best-score-per-day rule: only the highest submission of the day is kept
 * - rate limited per user and per IP
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit a daily score." }, { status: 401 });
  }
  if (
    !rateLimit(`daily:u${user.id}`, 10, 10 * 60 * 1000) ||
    !rateLimit(`daily:ip${clientIp(req)}`, 30, 10 * 60 * 1000)
  ) {
    return NextResponse.json({ error: "Too many submissions. Try again in a few minutes." }, { status: 429 });
  }

  let body: DailyChallengeSubmit;
  try {
    body = (await req.json()) as DailyChallengeSubmit;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const check = validateDailySubmission(body);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const dayKey = utcDayKey();
  if (body.dayKey !== dayKey || body.seed !== dailySeed(dayKey)) {
    return NextResponse.json({ error: "Günlük oyun tohumu doğrulanamadı." }, { status: 400 });
  }
  const existing = await db
    .select()
    .from(dailyScores)
    .where(and(eq(dailyScores.userId, user.id), eq(dailyScores.dayKey, dayKey)))
    .limit(1);
  const row = existing[0];

  const isNewBest = !row || check.score > row.score;
  if (!row) {
    await db
      .insert(dailyScores)
      .values({ userId: user.id, dayKey, score: check.score, timeMs: check.timeMs });
  } else if (check.score > row.score) {
    await db
      .update(dailyScores)
      .set({ score: check.score, timeMs: check.timeMs, submittedAt: new Date() })
      .where(eq(dailyScores.id, row.id));
  }

  const best = row ? Math.max(row.score, check.score) : check.score;
  const ahead = await db
    .select({ n: count() })
    .from(dailyScores)
    .where(and(eq(dailyScores.dayKey, dayKey), gt(dailyScores.score, best)));
  const result: DailyChallengeResult = {
    dayKey,
    best,
    isNewBest,
    rank: Number(ahead[0]?.n ?? 0) + 1,
  };
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { dailyScores, dailyQuestClaims, users } from "@/db/schema";
import { requireUser } from "@/lib/server/auth";
import { dailySeed, utcDayKey } from "@/lib/game/prng";
import { getDailyQuests } from "@/lib/daily/quests";
import type { DailyStateResponse } from "@/lib/daily/types";

export const dynamic = "force-dynamic";

/** Public daily state: day key, seed, quests, board, and (if signed in) "you". */
export async function GET(req: Request) {
  const dayKey = utcDayKey();
  const quests = getDailyQuests(dayKey);

  const boardRows = await db
    .select({
      name: users.username,
      score: dailyScores.score,
      timeMs: dailyScores.timeMs,
    })
    .from(dailyScores)
    .innerJoin(users, eq(dailyScores.userId, users.id))
    .where(eq(dailyScores.dayKey, dayKey))
    .orderBy(desc(dailyScores.score), asc(dailyScores.timeMs))
    .limit(10);
  const board = boardRows.map((r) => ({ name: r.name, score: r.score, timeMs: r.timeMs }));

  let you: DailyStateResponse["you"] = null;
  const user = await requireUser(req);
  if (user) {
    const dayRows = await db
      .select()
      .from(dailyScores)
      .where(and(eq(dailyScores.userId, user.id), eq(dailyScores.dayKey, dayKey)))
      .limit(1);
    const dayEntry = dayRows[0];
    let dailyRank: number | null = null;
    if (dayEntry) {
      const ahead = await db
        .select({ n: count() })
        .from(dailyScores)
        .where(and(eq(dailyScores.dayKey, dayKey), gt(dailyScores.score, dayEntry.score)));
      dailyRank = Number(ahead[0]?.n ?? 0) + 1;
    }
    const claims = await db
      .select({ questId: dailyQuestClaims.questId })
      .from(dailyQuestClaims)
      .where(and(eq(dailyQuestClaims.userId, user.id), eq(dailyQuestClaims.dayKey, dayKey)));
    you = {
      streak: user.streak,
      lastActiveDay: user.lastActiveDay,
      dailyBest: dayEntry ? dayEntry.score : null,
      dailyRank,
      claimed: claims.map((c) => c.questId),
<<<<<<< HEAD
      questCounters: {
        merges: 0,
        maxValue: 0,
        maxCombo: 0,
        score: 0,
        drops: 0,
        powerupsUsed: 0,
        matches: 0,
        collectionPoints: 0,
      },
=======
>>>>>>> d1b38aefa4f1b225d8dfcb37773cf7db75f17f0c
    };
  }

  const body: DailyStateResponse = {
    dayKey,
    seed: dailySeed(dayKey),
    quests,
    board,
    you,
  };
  return NextResponse.json(body);
}

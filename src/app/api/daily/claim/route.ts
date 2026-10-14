import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyQuestClaims } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { requireUser } from "@/lib/server/auth";
import { isValidQuestForDay } from "@/lib/daily/quests";
import { utcDayKey } from "@/lib/game/prng";
import type { DailyClaimRequest, DailyClaimResult } from "@/lib/daily/types";

export const dynamic = "force-dynamic";

/**
 * Claims a daily quest reward — once per user per quest per UTC day.
 * The client applies the reward to its local power-up bank.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Sign in to claim quest rewards." }, { status: 401 });
  }
  if (!rateLimit(`claim:u${user.id}`, 8, 10 * 60 * 1000) || !rateLimit(`claim:ip${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many claims. Try again in a few minutes." }, { status: 429 });
  }

  let body: DailyClaimRequest;
  try {
    body = (await req.json()) as DailyClaimRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const dayKey = typeof body.dayKey === "string" ? body.dayKey : utcDayKey();
  const quest = isValidQuestForDay(dayKey, typeof body.questId === "string" ? body.questId : "");
  if (!quest) {
    return NextResponse.json({ error: "That quest is not valid for this day." }, { status: 400 });
  }

  const already = await db
    .select({ questId: dailyQuestClaims.questId })
    .from(dailyQuestClaims)
    .where(
      and(
        eq(dailyQuestClaims.userId, user.id),
        eq(dailyQuestClaims.dayKey, dayKey),
        eq(dailyQuestClaims.questId, quest.id)
      )
    )
    .limit(1);
  if (already.length > 0) {
    return NextResponse.json({ error: "Already claimed today." }, { status: 409 });
  }

  await db.insert(dailyQuestClaims).values({ userId: user.id, dayKey, questId: quest.id });

  const all = await db
    .select({ questId: dailyQuestClaims.questId })
    .from(dailyQuestClaims)
    .where(and(eq(dailyQuestClaims.userId, user.id), eq(dailyQuestClaims.dayKey, dayKey)));

  const result: DailyClaimResult = {
    reward: { questId: quest.id, powerup: quest.reward },
    claimed: all.map((c) => c.questId),
  };
  return NextResponse.json(result);
}

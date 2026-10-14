import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { requireUser } from "@/lib/server/auth";
import { touchStreak } from "@/lib/daily/streak";
import { utcDayKey } from "@/lib/game/prng";
import type { TouchResult } from "@/lib/daily/types";

export const dynamic = "force-dynamic";

/**
 * Marks "app opened today" for the streak. Day boundaries are UTC.
 * Idempotent per day: opening again the same UTC day does not change the streak.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Sign in to track your streak." }, { status: 401 });
  }
  if (!rateLimit(`touch:u${user.id}`, 5, 60 * 1000) || !rateLimit(`touch:ip${clientIp(req)}`, 15, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const dayKey = utcDayKey();
  const next = touchStreak({ streak: user.streak, lastActiveDay: user.lastActiveDay }, dayKey);
  if (next.streak !== user.streak || next.lastActiveDay !== user.lastActiveDay) {
    await db.update(users).set({ streak: next.streak, lastActiveDay: next.lastActiveDay }).where(eq(users.id, user.id));
  }
  const result: TouchResult = { dayKey, streak: next.streak };
  return NextResponse.json(result);
}

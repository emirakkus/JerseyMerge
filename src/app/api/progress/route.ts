import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { playerProgress } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { requireUser } from "@/lib/server/auth";
import { mergeProgress } from "@/lib/progress/merge";
import { sanitizeProgress } from "@/lib/progress/api";
import { emptyProgress } from "@/lib/progress/types";
import type { ProgressDto, ProgressSyncResult } from "@/lib/progress/api";

export const dynamic = "force-dynamic";

function rowToDto(row: { xp: number; counters: unknown; achievements: unknown } | undefined): ProgressDto {
  if (!row) return emptyProgress();
  return sanitizeProgress({
    xp: row.xp,
    counters: row.counters,
    achievements: row.achievements,
  });
}

/** Fetches the signed-in user's stored progress. */
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync progress." }, { status: 401 });
  }
  const rows = await db.select().from(playerProgress).where(eq(playerProgress.userId, user.id)).limit(1);
  return NextResponse.json(rowToDto(rows[0]));
}

/**
 * Syncs device progress to the account using the "most advanced wins" rule
 * (per-counter max, xp max, achievement union). Returns the merged state.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Sign in to sync progress." }, { status: 401 });
  }
  if (!rateLimit(`progress:u${user.id}`, 10, 10 * 60 * 1000) || !rateLimit(`progress:ip${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many syncs. Try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const incoming = sanitizeProgress(body);

  const rows = await db.select().from(playerProgress).where(eq(playerProgress.userId, user.id)).limit(1);
  const stored = rowToDto(rows[0]);
  const merged = mergeProgress(stored, incoming);

  const now = new Date();
  if (rows[0]) {
    await db
      .update(playerProgress)
      .set({ xp: merged.xp, counters: merged.counters, achievements: merged.achievements, updatedAt: now })
      .where(eq(playerProgress.userId, user.id));
  } else {
    await db
      .insert(playerProgress)
      .values({ userId: user.id, xp: merged.xp, counters: merged.counters, achievements: merged.achievements, updatedAt: now });
  }

  const result: ProgressSyncResult = { merged };
  return NextResponse.json(result);
}

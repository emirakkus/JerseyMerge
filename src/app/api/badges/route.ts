import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userBadges } from "@/db/schema";
import { requireUser } from "@/lib/server/auth";
import { BADGES } from "@/lib/game/badges";

export const dynamic = "force-dynamic";

const KNOWN = new Set(BADGES.map((b) => b.id));

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { badges?: unknown };
  try {
    body = (await req.json()) as { badges?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const ids = Array.isArray(body.badges)
    ? body.badges.filter((b): b is string => typeof b === "string" && KNOWN.has(b))
    : [];

  for (const badgeId of ids) {
    await db
      .insert(userBadges)
      .values({ userId: user.id, badgeId })
      .onConflictDoNothing();
  }

  const rows = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, user.id));

  return NextResponse.json({ owned: rows.map((r) => r.badgeId) });
}

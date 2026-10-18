import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { applyTokenCookie, issueSession, toPublicUser } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { GAME_UI } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z0-9_]{3,14}$/;

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`auth:register:ip:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: GAME_UI.auth.errors.rateLimit }, { status: 429 });
  }
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: GAME_UI.auth.errors.generic }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: GAME_UI.auth.errors.username },
      { status: 400 }
    );
  }
  if (password.length < 8 || password.length > 64) {
    return NextResponse.json({ error: GAME_UI.auth.errors.passwordLength }, { status: 400 });
  }
  if (!rateLimit(`auth:register:pair:${ip}:${username.toLowerCase()}`, 4, 15 * 60 * 1000)) {
    return NextResponse.json({ error: GAME_UI.auth.errors.rateLimit }, { status: 429 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: GAME_UI.auth.errors.taken }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db.insert(users).values({ username, passwordHash }).returning();
  const user = inserted[0];
  if (!user) {
    return NextResponse.json({ error: GAME_UI.auth.errors.account }, { status: 500 });
  }

  const token = await issueSession(user.id);
  const res = NextResponse.json({ token, user: toPublicUser(user) });
  applyTokenCookie(res, token, new URL(req.url).protocol === "https:");
  return res;
}

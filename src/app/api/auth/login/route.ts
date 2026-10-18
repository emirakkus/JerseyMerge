import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { applyTokenCookie, issueSession, toPublicUser } from "@/lib/server/auth";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { GAME_UI } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`auth:login:ip:${ip}`, 20, 15 * 60 * 1000)) {
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
  if (!username || !password) {
    return NextResponse.json({ error: GAME_UI.auth.errors.required }, { status: 400 });
  }
  if (password.length < 8 || password.length > 64) {
    return NextResponse.json({ error: GAME_UI.auth.errors.passwordLength }, { status: 400 });
  }
  if (!rateLimit(`auth:login:pair:${ip}:${username.toLowerCase()}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: GAME_UI.auth.errors.rateLimit }, { status: 429 });
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: GAME_UI.auth.errors.credentials }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: GAME_UI.auth.errors.credentials }, { status: 401 });
  }

  const token = await issueSession(user.id);
  const res = NextResponse.json({ token, user: toPublicUser(user) });
  applyTokenCookie(res, token, new URL(req.url).protocol === "https:");
  return res;
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { applyTokenCookie, issueSession, toPublicUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "No account found with that username." }, { status: 404 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Wrong password. Try again." }, { status: 401 });
  }

  const token = await issueSession(user.id);
  const res = NextResponse.json({ token, user: toPublicUser(user) });
  applyTokenCookie(res, token, new URL(req.url).protocol === "https:");
  return res;
}

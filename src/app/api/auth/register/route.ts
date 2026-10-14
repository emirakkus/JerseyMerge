import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { applyTokenCookie, issueSession, toPublicUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z0-9_]{3,14}$/;

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-14 characters: letters, numbers or underscore." },
      { status: 400 }
    );
  }
  if (password.length < 4 || password.length > 64) {
    return NextResponse.json({ error: "Password must be 4-64 characters." }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db.insert(users).values({ username, passwordHash }).returning();
  const user = inserted[0];
  if (!user) {
    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }

  const token = await issueSession(user.id);
  const res = NextResponse.json({ token, user: toPublicUser(user) });
  applyTokenCookie(res, token, new URL(req.url).protocol === "https:");
  return res;
}

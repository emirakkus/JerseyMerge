/** Server-side session helpers: token creation, lookup, request auth. */

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export interface PublicUser {
  id: number;
  username: string;
  bestScore: number;
  bestTimeMs: number;
  bestAt: number;
  createdAt: number;
  lastActiveDay: string | null;
  streak: number;
}

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export function toPublicUser(user: {
  id: number;
  username: string;
  bestScore: number;
  bestTimeMs: number;
  bestAt: Date;
  createdAt: Date;
  lastActiveDay: string | null;
  streak: number;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    bestScore: user.bestScore,
    bestTimeMs: user.bestTimeMs,
    bestAt: user.bestAt.getTime(),
    createdAt: user.createdAt.getTime(),
    lastActiveDay: user.lastActiveDay,
    streak: user.streak,
  };
}

export const TOKEN_COOKIE = "jm_token";

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function tokenFromCookie(req: Request): string | null {
  const header = req.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;\\s]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export async function getUserByToken(token: string | null): Promise<PublicUser | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));
  if (rows.length === 0) return null;
  return toPublicUser(rows[0].user);
}

export async function requireUser(req: Request): Promise<PublicUser | null> {
  const token = bearerToken(req) ?? tokenFromCookie(req);
  return getUserByToken(token);
}

/** Creates a session row and returns the token. */
export async function issueSession(userId: number): Promise<string> {
  const token = createToken();
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function applyTokenCookie(res: NextResponse, token: string, secure: boolean): void {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export function clearTokenCookie(res: NextResponse): void {
  res.cookies.delete(TOKEN_COOKIE);
}

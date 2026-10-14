import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { bearerToken, clearTokenCookie, tokenFromCookie } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = bearerToken(req) ?? tokenFromCookie(req);
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  const res = NextResponse.json({ ok: true });
  clearTokenCookie(res);
  return res;
}

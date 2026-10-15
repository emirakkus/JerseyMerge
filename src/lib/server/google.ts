/** Google OAuth 2.0 (authorization code + PKCE) server helpers. */

import crypto from "node:crypto";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { toPublicUser, type PublicUser } from "./auth";

export interface GoogleProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Registered redirect URI: explicit env wins, otherwise derive from the incoming request. */
export function redirectUriFor(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${new URL(req.url).origin}/api/auth/google/callback`;
}

export function newNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function newPkceVerifier(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function buildConsentUrl(clientId: string, redirectUri: string, state: string, verifier: string): string {
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForProfile(
  code: string,
  redirectUri: string,
  verifier: string
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("google not configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error ?? "token exchange failed");
  }

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!infoRes.ok) throw new Error("userinfo request failed");
  const info = (await infoRes.json()) as Partial<GoogleProfile>;
  if (!info.sub) throw new Error("invalid google profile");
  return { sub: info.sub, name: info.name, email: info.email, picture: info.picture };
}

function usernameFromEmail(email: string | undefined, sub: string): string {
  const raw = (email ? email.split("@")[0] : `g${sub}`).toLowerCase();
  let base = raw
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (base.length < 3) base = base.length > 0 ? `player_${base}` : "player";
  if (base.length > 14) base = base.slice(0, 14).replace(/_+$/g, "");
  return base;
}

/** Finds a user by Google email, creating the account on first sign-in. */
export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<PublicUser> {
  const email = profile.email?.toLowerCase();

  if (email) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const existing = rows[0];
    if (existing) {
      if (profile.picture && existing.avatarUrl !== profile.picture) {
        await db.update(users).set({ avatarUrl: profile.picture }).where(eq(users.id, existing.id));
      }
      return toPublicUser(existing);
    }
  }

  const base = usernameFromEmail(email, profile.sub);
  let username = base;
  for (let i = 2; i <= 50; i += 1) {
    const rows = await db.select({ n: count() }).from(users).where(eq(users.username, username));
    if (Number(rows[0]?.n ?? 0) === 0) break;
    username = `${base.slice(0, 14 - String(i).length)}${i}`;
  }

  const inserted = await db
    .insert(users)
    .values({
      username,
      email: email ?? null,
      provider: "google",
      avatarUrl: profile.picture ?? null,
      passwordHash: "",
    })
    .returning();
  const user = inserted[0];
  if (!user) throw new Error("could not create google user");
  return toPublicUser(user);
}

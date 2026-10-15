import { NextResponse } from "next/server";
import {
  buildConsentUrl,
  googleConfigured,
  newNonce,
  newPkceVerifier,
  redirectUriFor,
} from "@/lib/server/google";

export const dynamic = "force-dynamic";

/** Step 1: redirect the browser to Google's consent screen (PKCE + state). */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment.",
      },
      { status: 503 }
    );
  }
  if (!clientId) return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID." }, { status: 500 });

  const state = newNonce();
  const verifier = newPkceVerifier();
  const redirectUri = redirectUriFor(req);
  const url = buildConsentUrl(clientId, redirectUri, state, verifier);

  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  res.cookies.set("jm_oauth_state", state, opts);
  res.cookies.set("jm_oauth_verifier", verifier, opts);
  return res;
}

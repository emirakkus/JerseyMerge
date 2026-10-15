import { NextResponse } from "next/server";
import { applyTokenCookie, issueSession } from "@/lib/server/auth";
import {
  exchangeCodeForProfile,
  findOrCreateGoogleUser,
  googleConfigured,
  redirectUriFor,
} from "@/lib/server/google";

export const dynamic = "force-dynamic";

function fail(origin: string): NextResponse {
  return NextResponse.redirect(`${origin}/?auth=error`);
}

/** Step 2: Google redirects back with ?code&state — finish the session. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const secure = new URL(req.url).protocol === "https:";

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = req.headers.get("cookie")?.match(/(?:^|;\s*)jm_oauth_state=([^;\s]*)/)?.[1];
  const verifierCookie = req.headers.get("cookie")?.match(/(?:^|;\s*)jm_oauth_verifier=([^;\s]*)/)?.[1];

  if (url.searchParams.get("error") || !code || !state || !stateCookie || state !== stateCookie || !verifierCookie) {
    return fail(origin);
  }
  if (!googleConfigured()) return fail(origin);

  try {
    const verifier = decodeURIComponent(verifierCookie);
    const profile = await exchangeCodeForProfile(code, redirectUriFor(req), verifier);
    if (!profile.email) return fail(origin);
    const user = await findOrCreateGoogleUser(profile);
    const token = await issueSession(user.id);

    const res = NextResponse.redirect(`${origin}/?auth=google`);
    applyTokenCookie(res, token, secure);
    res.cookies.delete("jm_oauth_state");
    res.cookies.delete("jm_oauth_verifier");
    return res;
  } catch {
    return fail(origin);
  }
}

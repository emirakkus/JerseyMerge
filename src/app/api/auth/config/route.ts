import { NextResponse } from "next/server";
import { googleConfigured } from "@/lib/server/google";

export const dynamic = "force-dynamic";

/** Lets the UI decide whether to offer the Google button. */
export async function GET() {
  return NextResponse.json({ google: googleConfigured() });
}

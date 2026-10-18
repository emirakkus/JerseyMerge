import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
type Stock = { joker: number; bomb: number; scramble: number };
const sanitize = (value: unknown): Stock => {
  const input = (value && typeof value === "object" ? value : {}) as Partial<Stock>;
  return {
    joker: Math.min(3, Math.max(0, Math.floor(Number(input.joker) || 0))),
    bomb: Math.min(3, Math.max(0, Math.floor(Number(input.bomb) || 0))),
    scramble: Math.min(3, Math.max(0, Math.floor(Number(input.scramble) || 0))),
  };
};

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const [row] = await db.select({ stock: users.powerupInventory }).from(users).where(eq(users.id, user.id)).limit(1);
  return NextResponse.json({ stock: sanitize(row?.stock) });
}

export async function PUT(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  try {
    const body = (await req.json()) as { stock?: unknown };
    const stock = sanitize(body.stock);
    await db.update(users).set({ powerupInventory: stock }).where(eq(users.id, user.id));
    return NextResponse.json({ stock });
  } catch {
    return NextResponse.json({ error: "Geçersiz stok." }, { status: 400 });
  }
}

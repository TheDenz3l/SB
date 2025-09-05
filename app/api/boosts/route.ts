import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  if (!experienceId) return bad(400, "missing-experienceId");
  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return NextResponse.json({ ok: true, activeCredits: 0, entries: [] });
  const now = new Date();
  const entries = await prisma.boostCredit.findMany({ where: { creatorId: me.id, expiresAt: { gt: now } }, orderBy: { expiresAt: "asc" } });
  const activeCredits = entries.reduce((sum: number, e: any) => sum + Math.max(0, e.credits - e.consumed), 0);
  return NextResponse.json({ ok: true, activeCredits, entries });
}

// Dev-only: grant credits manually
export async function POST(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const body = await req.json().catch(()=>null) as any;
  const experienceId = body?.experienceId as string | undefined;
  const credits = Number(body?.credits ?? 1);
  if (!experienceId || !credits) return bad(422, "invalid-input");
  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return bad(404, "unknown-creator");
  const expiresAt = new Date(Date.now() + 7*24*3600*1000);
  const entry = await prisma.boostCredit.create({ data: { creatorId: me.id, credits, expiresAt } });
  return NextResponse.json({ ok: true, entry });
}

import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { previousMonthRange, closeInvoiceForCreator } from "@/lib/billing";

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  if (!experienceId) return bad(400, "missing-experienceId");
  const creator = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!creator) return NextResponse.json({ ok: true, summary: null, invoices: [] });
  const invoices = await prisma.invoice.findMany({ where: { creatorId: creator.id }, orderBy: { periodStart: "desc" } });
  // summary = latest open or latest overall
  const summary = invoices[0] ?? null;
  return NextResponse.json({ ok: true, summary, invoices });
}

export async function POST(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const body = await req.json().catch(() => null) as any;
  const experienceId = body?.experienceId as string | undefined;
  if (!experienceId) return bad(400, "missing-experienceId");
  const creator = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!creator) return bad(404, "unknown-creator");
  const { periodStart, periodEnd } = previousMonthRange();
  const invoice = await closeInvoiceForCreator(creator.id, periodStart, periodEnd);
  return NextResponse.json({ ok: true, invoice });
}

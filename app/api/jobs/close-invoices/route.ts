import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { previousMonthRange, closeInvoiceForCreator } from "@/lib/billing";

function unauthorized() { return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }); }

export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) return unauthorized();
  const secret = req.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET) return unauthorized();

  const { periodStart, periodEnd } = previousMonthRange();
  const key = periodStart.toISOString();

  // Idempotency for the job run
  try {
    await prisma.jobRun.create({ data: { jobName: "close-invoices", key } });
  } catch {
    return NextResponse.json({ ok: true, deduped: true, periodStart, periodEnd }, { status: 409 });
  }

  const creators = await prisma.creatorProfile.findMany({});
  let closed = 0;
  for (const c of creators) {
    await closeInvoiceForCreator(c.id, periodStart, periodEnd);
    closed++;
  }

  return NextResponse.json({ ok: true, periodStart, periodEnd, closed });
}


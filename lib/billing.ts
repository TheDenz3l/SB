// Use runtime Prisma to avoid instantiating the client during build
// (Vercel build can fail if DATABASE_URL is not available at build-time).

export function monthRange(year: number, month: number) {
  const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { periodStart, periodEnd };
}

export function previousMonthRange(ref: Date = new Date()) {
  const y = ref.getUTCFullYear();
  const m = ref.getUTCMonth() + 1; // 1..12
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return monthRange(prev.y, prev.m);
}

function monthsBetween(a: Date, b: Date) {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

function feeCents(amountCents: number) {
  return Math.round(amountCents * 0.05);
}

const MEMBER_CAP_CENTS = 50_00;

export async function computeSuccessFeeCents(creatorId: string, periodStart: Date, periodEnd: Date) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  // Load all attributed payment events up to periodEnd for this creator
  const events = await prisma.paymentEvent.findMany({
    where: { creatorId, ts: { lt: periodEnd } },
    orderBy: { ts: "asc" },
  });
  // Load attribution for involved members (firstPaidAt)
  const memberIds = Array.from(new Set(events.map(e => e.memberId).filter(Boolean) as string[]));
  const atts = await prisma.attribution.findMany({ where: { memberId: { in: memberIds } } });
  const attByMember = new Map(atts.map(a => [a.memberId, a]));

  let feeThisPeriod = 0;
  const feeBefore: Record<string, number> = {};

  // First, compute fee accumulated before periodStart per member (for cap tracking)
  for (const e of events) {
    if (!e.memberId) continue;
    const att = attByMember.get(e.memberId);
    if (!att || !att.firstPaidAt) continue;
    const cycleIndex = monthsBetween(att.firstPaidAt, e.ts);
    if (cycleIndex < 0 || cycleIndex > 2) continue; // only first 3 cycles
    const f = feeCents(e.amountCents);
    if (e.ts < periodStart) {
      feeBefore[e.memberId] = (feeBefore[e.memberId] || 0) + f;
      if (feeBefore[e.memberId] > MEMBER_CAP_CENTS) feeBefore[e.memberId] = MEMBER_CAP_CENTS;
    }
  }

  // Then, compute fee in [periodStart, periodEnd), bounded by remaining cap
  for (const e of events) {
    if (!e.memberId) continue;
    const att = attByMember.get(e.memberId);
    if (!att || !att.firstPaidAt) continue;
    const cycleIndex = monthsBetween(att.firstPaidAt, e.ts);
    if (cycleIndex < 0 || cycleIndex > 2) continue; // only first 3 cycles
    if (e.ts < periodStart || e.ts >= periodEnd) continue;
    const remain = Math.max(0, MEMBER_CAP_CENTS - (feeBefore[e.memberId] || 0));
    if (remain <= 0) continue;
    const f = feeCents(e.amountCents);
    const applied = Math.min(remain, f);
    feeThisPeriod += applied;
    feeBefore[e.memberId] = (feeBefore[e.memberId] || 0) + applied;
  }

  return feeThisPeriod;
}

export async function closeInvoiceForCreator(creatorId: string, periodStart: Date, periodEnd: Date) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  // idempotent by unique(creatorId, periodStart)
  const existing = await prisma.invoice.findUnique({ where: { creatorId_periodStart: { creatorId, periodStart } } });
  if (existing) return existing;
  const successFeeCents = await computeSuccessFeeCents(creatorId, periodStart, periodEnd);
  const minimumCents = 29_00;
  const amountDueCents = Math.max(minimumCents, successFeeCents);
  const invoice = await prisma.invoice.create({ data: {
    creatorId,
    periodStart,
    periodEnd,
    successFeeCents,
    minimumCents,
    amountDueCents,
    status: "open",
  }});
  return invoice;
}

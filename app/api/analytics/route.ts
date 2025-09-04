import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function dollars(n: number) { return Math.round(n / 100); }

function fmtDuration(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (m < 60) return `${m}m ${sec}s`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  if (!experienceId) return bad(400, "missing-experienceId");

  const creator = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!creator) return NextResponse.json({ ok: true, kpis: null, weeklyRevenueCents: [], topPartners: [] });

  const now = new Date();
  const since30d = new Date(now.getTime() - 30*24*3600*1000);
  const since8w = new Date(now.getTime() - 56*24*3600*1000);

  // Payments windowed queries
  const payments30d = await prisma.paymentEvent.findMany({ where: { creatorId: creator.id, ts: { gte: since30d } } });
  const payments8w = await prisma.paymentEvent.findMany({ where: { creatorId: creator.id, ts: { gte: since8w } } });

  // KPI: New paying members (unique memberIds in 30d payments)
  const newMembers = new Set((payments30d.filter(p=>p.kind==='payment').map(p=>p.memberId).filter(Boolean) as string[]));

  // KPI: Attributed revenue (net) in 30d
  const revenue30dCents = payments30d.reduce((s,p)=> s + p.amountCents, 0);

  // KPI: Acceptance rate (sent proposals only)
  const sentAccepted = await prisma.proposal.count({ where: { fromId: creator.id, status: 'accepted' } });
  const sentDecOrAcc = await prisma.proposal.count({ where: { fromId: creator.id, status: { in: ['accepted','declined'] } } });
  const acceptanceRate = sentDecOrAcc ? Math.round((sentAccepted / sentDecOrAcc) * 100) : 0;

  // KPI: Time to first swap (first accepted proposal vs profile createdAt)
  const firstSwap = await prisma.proposal.findFirst({ where: { status: 'accepted', OR: [{ fromId: creator.id }, { toId: creator.id }] }, orderBy: { createdAt: 'asc' } });
  const timeToFirstSwapLabel = firstSwap ? fmtDuration(firstSwap.createdAt.getTime() - creator.createdAt.getTime()) : '—';

  // Weekly revenue for last 8 weeks (rolling 7-day windows)
  const weeklyRevenueCents: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now.getTime() - (i+1)*7*24*3600*1000);
    const end = new Date(now.getTime() - i*7*24*3600*1000);
    const sum = payments8w.filter(p=> p.ts >= start && p.ts < end).reduce((s,p)=> s + p.amountCents, 0);
    weeklyRevenueCents.push(sum);
  }

  // Top partners by revenue (8w), counting clicks and paid members
  const memberIds = Array.from(new Set(payments8w.map(p=>p.memberId).filter(Boolean) as string[]));
  let topPartners: Array<{ partnerId: string; partnerName: string; clicks: number; paidMembers: number; revenueCents: number }>= [];
  if (memberIds.length > 0) {
    const atts = await prisma.attribution.findMany({ where: { memberId: { in: memberIds } }, include: { swap: { include: { proposal: { include: { from: true, to: true } } } } } });
    // Map memberId -> partnerId
    const partnerByMember = new Map<string, { partnerId: string; partnerName: string; swapId: string }>();
    for (const a of atts) {
      const partnerId = a.swap.proposal.fromId; // partner who promoted
      const partnerName = a.swap.proposal.from.title ?? a.swap.proposal.from.experienceId;
      partnerByMember.set(a.memberId, { partnerId, partnerName, swapId: a.swapId });
    }
    // Aggregate revenue and members per partner
    const agg = new Map<string, { partnerName: string; revenueCents: number; members: Set<string>; swapIds: Set<string> }>();
    for (const p of payments8w) {
      if (!p.memberId) continue;
      const info = partnerByMember.get(p.memberId);
      if (!info) continue;
      const entry = agg.get(info.partnerId) ?? { partnerName: info.partnerName, revenueCents: 0, members: new Set<string>(), swapIds: new Set<string>() };
      entry.revenueCents += p.amountCents;
      entry.members.add(p.memberId);
      entry.swapIds.add(info.swapId);
      agg.set(info.partnerId, entry);
    }
    // Load clicks for those swapIds
    const allSwapIds = Array.from(new Set(Array.from(agg.values()).flatMap(v=> Array.from(v.swapIds))));
    const clicks = allSwapIds.length ? await prisma.clickEvent.groupBy({ by: ['swapId'], where: { swapId: { in: allSwapIds } }, _count: { swapId: true } }) : [];
    const clicksBySwap = new Map(clicks.map(c=> [c.swapId, c._count.swapId]));

    topPartners = Array.from(agg.entries()).map(([partnerId, v])=> ({
      partnerId,
      partnerName: v.partnerName,
      revenueCents: v.revenueCents,
      paidMembers: v.members.size,
      clicks: Array.from(v.swapIds).reduce((s, id)=> s + (clicksBySwap.get(id) || 0), 0),
    })).sort((a,b)=> b.revenueCents - a.revenueCents).slice(0, 5);
  }

  return NextResponse.json({
    ok: true,
    kpis: {
      newPayingMembers: newMembers.size,
      attributedRevenueCents: revenue30dCents,
      acceptanceRate,
      timeToFirstSwapLabel,
    },
    weeklyRevenueCents,
    topPartners,
  });
}

import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { env } from "@/lib/env";

function unauthorized() { return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }); }

type Vec = Map<string, number>;
function toVec(tags: string[]): Vec { const v = new Map<string, number>(); for (const t of tags) v.set(t.toLowerCase(), (v.get(t.toLowerCase()) ?? 0) + 1); return v; }
function cosine(a: Vec, b: Vec): number { let dot = 0, na = 0, nb = 0; for (const [k, av] of a){ const bv = b.get(k) ?? 0; dot += av*bv; na += av*av; } for (const [, bv] of b) nb += bv*bv; if (!na || !nb) return 0; return dot/(Math.sqrt(na)*Math.sqrt(nb)); }
function sizePenalty(a: number, b: number, alpha = 0.6): number { if (a<=0||b<=0) return 0; const ratio=a/b; return Math.exp(-alpha*Math.abs(Math.log(ratio))); }

function genCopy({ fromTitle, toTitle, window, offer }: { fromTitle: string; toTitle: string; window: string; offer: string; }) {
  return [
    `Let\'s cross-promote! ${fromTitle} x ${toTitle}`,
    `Window: ${window}. Offer: ${offer}.`,
    `We\'ll include a clear call-to-action and track paid signups. Ready to go?`
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  if (!env.CRON_SECRET) return unauthorized();
  const secret = req.headers.get("x-cron-secret");
  if (secret !== env.CRON_SECRET) return unauthorized();

  const now = new Date();
  const boosts = await prisma.boostCredit.findMany({ where: { expiresAt: { gt: now } }, include: { creator: true } });

  let createdTotal = 0;
  for (const boost of boosts) {
    // Dispatch budget = credits*25 - already dispatched
    const dispatchedCount = await prisma.boostDispatch.count({ where: { boostCreditId: boost.id } });
    const allowed = boost.credits * 25 - dispatchedCount;
    if (allowed <= 0) {
      // mark consumed count
      const consumed = Math.min(boost.credits, Math.floor(dispatchedCount / 25));
      if (consumed !== boost.consumed) await prisma.boostCredit.update({ where: { id: boost.id }, data: { consumed } });
      continue;
    }

    const me = boost.creator;
    const meTags = Array.isArray(me.tags) ? (me.tags as string[]) : [];
    const meVec = toVec(meTags);
    const partners = await prisma.creatorProfile.findMany({ where: { NOT: { id: me.id } } });
    const scored = partners.map((p: any) => {
      const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
      const score = cosine(meVec, toVec(tags)) * sizePenalty(me.audienceSize, p.audienceSize);
      return { partner: p, score };
    }).filter((x: any) => x.score >= 0.55).sort((a: any, b: any) => b.score - a.score);

    // Exclusions: existing recent proposals and already dispatched for this boost
    const since = new Date(Date.now() - 14*24*3600*1000);
    const recent = await prisma.proposal.findMany({ where: { fromId: me.id, createdAt: { gte: since } }, select: { toId: true } });
    const recentSet = new Set(recent.map((r: any) => r.toId));
    const dispatched = await prisma.boostDispatch.findMany({ where: { boostCreditId: boost.id }, select: { partnerId: true } });
    const dispatchedSet = new Set(dispatched.map((d: any) => d.partnerId));

    let remaining = allowed;
    for (const { partner } of scored) {
      if (remaining <= 0) break;
      if (recentSet.has(partner.id) || dispatchedSet.has(partner.id)) continue;
      // Create proposal idempotently (reuse 14d window logic)
      const existing = await prisma.proposal.findFirst({ where: { fromId: me.id, toId: partner.id, status: "pending", createdAt: { gte: since } } });
      if (existing) continue;
      const aiCopy = genCopy({ fromTitle: me.title ?? me.experienceId, toTitle: partner.title ?? partner.experienceId, window: "Next 7 days", offer: "We\'ll cross-post in our feeds/newsletters." });
      await prisma.proposal.create({ data: { fromId: me.id, toId: partner.id, window: "Next 7 days", offer: "We\'ll cross-post in our feeds/newsletters.", aiCopy } });
      await prisma.boostDispatch.create({ data: { boostCreditId: boost.id, partnerId: partner.id } });
      remaining--; createdTotal++;
    }

    // Update consumed count based on dispatches
    const newCount = await prisma.boostDispatch.count({ where: { boostCreditId: boost.id } });
    const consumed = Math.min(boost.credits, Math.floor(newCount / 25));
    if (consumed !== boost.consumed) await prisma.boostCredit.update({ where: { id: boost.id }, data: { consumed } });
  }

  return NextResponse.json({ ok: true, created: createdTotal });
}

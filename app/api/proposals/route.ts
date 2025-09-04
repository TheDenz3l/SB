import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { generateUtmToken } from "@/lib/attribution";

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function genCopy({ fromTitle, toTitle, window, offer }: { fromTitle: string; toTitle: string; window: string; offer: string; }) {
  return [
    `Let\'s cross-promote! ${fromTitle} x ${toTitle}`,
    `Window: ${window}. Offer: ${offer}.`,
    `We\'ll include a clear call-to-action and track paid signups. Ready to go?`
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  const box = url.searchParams.get("box") || "inbox"; // inbox | sent
  if (!experienceId) return bad(400, "missing-experienceId");

  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return NextResponse.json({ ok: true, proposals: [] });

  const origin = url.origin;
  if (box === "inbox") {
    const proposals = await prisma.proposal.findMany({
      where: { toId: me.id },
      orderBy: { createdAt: "desc" },
      include: { from: true, swap: true },
    });
    return NextResponse.json({ ok: true, proposals: proposals.map(p => ({
      id: p.id,
      partnerName: p.from.title ?? p.from.experienceId,
      status: p.status,
      window: p.window,
      offer: p.offer,
      aiCopy: p.aiCopy,
      createdAt: p.createdAt,
      trackingUrl: p.swap ? `${origin}/api/click?sb=${encodeURIComponent(p.swap.utmToken)}` : null,
    })) });
  } else {
    const proposals = await prisma.proposal.findMany({
      where: { fromId: me.id },
      orderBy: { createdAt: "desc" },
      include: { to: true, swap: true },
    });
    return NextResponse.json({ ok: true, proposals: proposals.map(p => ({
      id: p.id,
      partnerName: p.to.title ?? p.to.experienceId,
      status: p.status,
      window: p.window,
      offer: p.offer,
      aiCopy: p.aiCopy,
      createdAt: p.createdAt,
      trackingUrl: p.swap ? `${origin}/api/click?sb=${encodeURIComponent(p.swap.utmToken)}` : null,
    })) });
  }
}

export async function POST(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const body = await req.json().catch(() => null) as any;
  const experienceId = body?.experienceId as string | undefined; // sender
  const toProfileId = body?.toProfileId as string | undefined;
  const window = (body?.window as string | undefined) ?? "Next 7 days";
  const offer = (body?.offer as string | undefined) ?? "We\'ll cross-post in our feeds/newsletters.";
  if (!experienceId || !toProfileId) return bad(422, "invalid-input");

  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return bad(400, "unknown-sender");
  if (me.id === toProfileId) return bad(400, "cannot-propose-to-self");

  // Idempotent-ish: reuse a pending proposal in last 14 days
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  const existing = await prisma.proposal.findFirst({
    where: { fromId: me.id, toId: toProfileId, status: "pending", createdAt: { gte: since } },
  });
  if (existing) return NextResponse.json({ ok: true, proposalId: existing.id, reused: true });

  const other = await prisma.creatorProfile.findUnique({ where: { id: toProfileId } });
  if (!other) return bad(404, "unknown-recipient");

  const aiCopy = genCopy({ fromTitle: me.title ?? me.experienceId, toTitle: other.title ?? other.experienceId, window, offer });
  const created = await prisma.proposal.create({ data: {
    fromId: me.id,
    toId: toProfileId,
    window,
    offer,
    aiCopy,
  }});

  return NextResponse.json({ ok: true, proposalId: created.id });
}

export async function PATCH(req: NextRequest) {
  const { getPrisma } = await import("@/lib/db-dynamic");
  const prisma = await getPrisma();
  const body = await req.json().catch(() => null) as any;
  const experienceId = body?.experienceId as string | undefined; // actor
  const proposalId = body?.id as string | undefined;
  const action = body?.action as ("accept" | "decline") | undefined;
  if (!experienceId || !proposalId || !action) return bad(422, "invalid-input");

  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return bad(400, "unknown-actor");

  const p = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!p) return bad(404, "not-found");
  if (p.toId !== me.id) return bad(403, "forbidden");
  if (p.status !== "pending") return bad(409, "not-pending");

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });
  let trackingUrl: string | null = null;
  if (action === "accept") {
    // Ensure a Swap exists with a signed UTM token
    const existingSwap = await prisma.swap.findUnique({ where: { proposalId: proposalId } });
    if (!existingSwap) {
      const token = generateUtmToken(proposalId);
      const s = await prisma.swap.create({ data: { proposalId, utmToken: token } });
      trackingUrl = `${new URL(req.url).origin}/api/click?sb=${encodeURIComponent(s.utmToken)}`;
    } else {
      trackingUrl = `${new URL(req.url).origin}/api/click?sb=${encodeURIComponent(existingSwap.utmToken)}`;
    }
  }
  return NextResponse.json({ ok: true, status: updated.status, trackingUrl });
}

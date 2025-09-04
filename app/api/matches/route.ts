import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";

type Vec = Map<string, number>;

function toVec(tags: string[]): Vec {
  const v = new Map<string, number>();
  for (const t of tags) v.set(t.toLowerCase(), (v.get(t.toLowerCase()) ?? 0) + 1);
  return v;
}

function cosine(a: Vec, b: Vec): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, av] of a) {
    const bv = b.get(k) ?? 0;
    dot += av * bv;
    na += av * av;
  }
  for (const [, bv] of b) nb += bv * bv;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function sizePenalty(a: number, b: number, alpha = 0.6): number {
  if (a <= 0 || b <= 0) return 0;
  const ratio = a / b;
  const penalty = Math.exp(-alpha * Math.abs(Math.log(ratio)));
  return penalty;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  if (!experienceId) return NextResponse.json({ ok: false, error: "missing-experienceId" }, { status: 400 });

  const me = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  if (!me) return NextResponse.json({ ok: true, matches: [] });

  const all = await prisma.creatorProfile.findMany({ where: { NOT: { experienceId } } });
  // Load active boosts for partners
  const now = new Date();
  const boosts = await prisma.boostCredit.findMany({
    where: { creatorId: { in: all.map(p=>p.id) }, expiresAt: { gt: now } }
  });
  const boostedIds = new Set<string>();
  for (const b of boosts) { if ((b.credits - b.consumed) > 0) boostedIds.add(b.creatorId); }
  const meTags = Array.isArray(me.tags) ? (me.tags as string[]) : [];
  const meVec = toVec(meTags);

  const scored = all.map((p) => {
    const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
    let score = cosine(meVec, toVec(tags)) * sizePenalty(me.audienceSize, p.audienceSize);
    if (boostedIds.has(p.id)) score *= 1.25; // simple boost weighting
    return {
      id: p.id,
      title: p.title ?? p.experienceId,
      tags,
      audienceSize: p.audienceSize,
      score,
      boosted: boostedIds.has(p.id),
    };
  }).filter((x) => x.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => ({
      id: x.id,
      name: x.title,
      tags: x.tags,
      overlap: Math.round(x.score * 100),
      boosted: (x as any).boosted,
    }));

  return NextResponse.json({ ok: true, matches: scored });
}

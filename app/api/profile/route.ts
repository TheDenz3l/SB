import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { prisma } from "@/lib/db";

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((x): x is string => typeof x === "string");
  if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const experienceId = url.searchParams.get("experienceId");
  if (!experienceId) return NextResponse.json({ ok: false, error: "missing-experienceId" }, { status: 400 });
  const profile = await prisma.creatorProfile.findUnique({ where: { experienceId } });
  return NextResponse.json({ ok: true, profile });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const experienceId = body?.experienceId as string | undefined;
  const title = (body?.title ?? null) as string | null;
  const tags = parseTags(body?.tags);
  const audienceSize = Number(body?.audienceSize ?? 0);
  if (!experienceId || !audienceSize || tags.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid-input" }, { status: 422 });
  }
  const profile = await prisma.creatorProfile.upsert({
    where: { experienceId },
    update: { title: title ?? undefined, tags, audienceSize },
    create: { experienceId, title: title ?? undefined, tags, audienceSize },
  });
  return NextResponse.json({ ok: true, profile });
}

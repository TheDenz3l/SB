import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { makeWebhookValidator, type WhopWebhookRequestBody } from "@whop/api";
import { prisma } from "@/lib/db";
import { parseAndVerifySignedToken } from "@/lib/crypto";
import { env } from "@/lib/env";

// In-memory idempotency cache for dev; replace with persistent store in production
const seenEventIds = new Set<string>();

function findMetadataSb(data: any): string | null {
  const paths = [
    ["metadata", "sb"],
    ["receipt", "metadata", "sb"],
    ["payment", "metadata", "sb"],
  ];
  for (const p of paths) {
    let cur: any = data;
    for (const k of p) { if (cur && typeof cur === "object" && k in cur) cur = cur[k]; else { cur = undefined; break; } }
    if (typeof cur === "string") return cur;
  }
  return null;
}

function extract(obj: any, keys: string[]): any {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null) return v;
  }
  return undefined;
}

function getMemberId(d: any): string | null {
  return (
    extract(d, ["memberId", "membershipId"]) ||
    d?.membership?.id ||
    d?.app_membership?.id ||
    d?.user?.id ||
    null
  );
}

function getExternalId(d: any): string | null {
  return (
    d?.receipt?.id || d?.payment?.id || d?.id || null
  );
}

function getAmountCents(d: any): number | null {
  const amt = d?.amount ?? d?.receipt?.amount ?? d?.payment?.amount;
  if (amt == null) return null;
  if (typeof amt === "number") return Math.round(amt);
  if (typeof amt === "string") {
    // try parse as cents (integer) or dollars string
    if (/^\d+$/.test(amt)) return parseInt(amt, 10);
    const f = parseFloat(amt);
    if (!Number.isNaN(f)) return Math.round(f * 100);
  }
  return null;
}

function getCurrency(d: any): string | null {
  return d?.currency || d?.receipt?.currency || d?.payment?.currency || null;
}

export async function POST(req: NextRequest) {
  if (!env.WHOP_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "missing-webhook-secret" }, { status: 500 });
  }

  let body: WhopWebhookRequestBody;
  try {
    const validate = makeWebhookValidator({ webhookSecret: env.WHOP_WEBHOOK_SECRET });
    // makeWebhookValidator reads and verifies the raw request body and signature
    body = await validate(req as unknown as Request);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "invalid-signature" }, { status: 401 });
  }

  // Build an idempotency key from action + embedded ids
  const key = (() => {
    // Common patterns: payment/receipt IDs or membership IDs within data
    const action = body.action;
    const id = (body as any)?.data?.id || (body as any)?.data?.payment?.id || (body as any)?.data?.receipt?.id || (body as any)?.data?.membership?.id;
    return `${action}:${id ?? "unknown"}`;
  })();
  if (seenEventIds.has(key)) return NextResponse.json({ ok: true, deduped: true });
  seenEventIds.add(key);

  const action = body.action;
  const data: any = (body as any).data ?? {};

  // Create attribution link if metadata contains sb token
  const sb = findMetadataSb(data);
  if (sb) {
    const v = parseAndVerifySignedToken<{ swapId: string }>(sb, env.WHOP_UTM_HMAC_SECRET);
    if (v.valid && v.payload?.swapId) {
      const memberId = getMemberId(data);
      if (memberId) {
        await prisma.attribution.upsert({
          where: { memberId },
          update: { swapId: v.payload.swapId },
          create: { memberId, swapId: v.payload.swapId },
        });
      }
    }
  }

  // DB-backed idempotency for this event key
  try {
    await prisma.idempotency.create({ data: { key, expiresAt: new Date(Date.now() + 7*24*3600*1000) } });
  } catch {
    return NextResponse.json({ ok: true, deduped: true });
  }

  if (action.endsWith("payment.succeeded") || action === "payment.succeeded" || action === "app_payment.succeeded") {
    const externalId = getExternalId(data) ?? key;
    const amountCents = getAmountCents(data) ?? 0;
    const currency = getCurrency(data) ?? "USD";
    const ts = new Date();
    const memberId = getMemberId(data);
    let creatorId: string | undefined = undefined;
    if (memberId) {
      const att = await prisma.attribution.findUnique({ where: { memberId }, include: { swap: { include: { proposal: true } } } });
      if (att?.swap?.proposal?.toId) creatorId = att.swap.proposal.toId;
      // Set firstPaidAt if missing
      if (att && !att.firstPaidAt) {
        await prisma.attribution.update({ where: { memberId }, data: { firstPaidAt: ts } });
      }
    }
    try {
      await prisma.paymentEvent.create({ data: { externalId, amountCents, currency, ts, kind: "payment", memberId: memberId ?? undefined, creatorId, raw: data } });
    } catch { /* ignore duplicate */ }

    // Award Boost credits if plan matches configured IDs
    const planId = (data?.planId || data?.plan?.id || data?.receipt?.plan?.id || data?.payment?.plan?.id) as string | undefined;
    if (planId && creatorId) {
      let credits = 0;
      if (env.BOOST_PLAN_ID_ONE && planId === env.BOOST_PLAN_ID_ONE) credits = 1;
      if (env.BOOST_PLAN_ID_FIVE && planId === env.BOOST_PLAN_ID_FIVE) credits = 5;
      if (credits > 0) {
        await prisma.boostCredit.create({ data: { creatorId, credits, expiresAt: new Date(Date.now() + 7*24*3600*1000) } });
      }
    }
  }

  if (action.startsWith("refund.")) {
    const externalId = getExternalId(data) ?? key;
    const amountCents = getAmountCents(data) ?? 0;
    const currency = getCurrency(data) ?? "USD";
    const ts = new Date();
    const memberId = getMemberId(data);
    let creatorId: string | undefined = undefined;
    if (memberId) {
      const att = await prisma.attribution.findUnique({ where: { memberId }, include: { swap: { include: { proposal: true } } } });
      if (att?.swap?.proposal?.toId) creatorId = att.swap.proposal.toId;
    }
    try {
      await prisma.paymentEvent.create({ data: { externalId, amountCents: -Math.abs(amountCents), currency, ts, kind: "refund", memberId: memberId ?? undefined, creatorId, raw: data } });
    } catch { /* ignore duplicate */ }
  }

  return NextResponse.json({ ok: true, action });
}

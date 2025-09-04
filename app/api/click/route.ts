import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { env, constants } from "@/lib/env";
import { parseAndVerifySignedToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/attribution";

// naive in-memory rate limiter (dev only). Replace with a durable store in prod
const rl = new Map<string, { count: number; ts: number }>();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("sb");
  const secret = env.WHOP_UTM_HMAC_SECRET;

  if (!token || !secret) {
    return NextResponse.json({ ok: false, error: "missing-token" }, { status: 400 });
  }

  const verification = parseAndVerifySignedToken<{ swapId: string }>(token, secret);
  if (!verification.valid || !verification.payload?.swapId) {
    return NextResponse.json({ ok: false, error: verification.reason ?? "invalid" }, { status: 400 });
  }

  const swapId = verification.payload.swapId;

  // Rate limiting by IP hash (per 60s window)
  const ip = getClientIp(req) ?? "unknown";
  const ipKey = hashIp(ip);
  const now = Date.now();
  const cur = rl.get(ipKey);
  if (!cur || now - cur.ts > 60_000) {
    rl.set(ipKey, { count: 1, ts: now });
  } else {
    cur.count += 1;
    if (cur.count > 60) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });
    }
  }

  // Persist click event (no PII)
  try {
    await prisma.clickEvent.create({
      data: {
        swapId,
        ipHash: ipKey,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });
  } catch {}

  const res = NextResponse.json({ ok: true });
  // Set last-touch cookie for 30d to support attribution window
  res.cookies.set("sb_last", swapId, {
    maxAge: constants.LAST_TOUCH_TTL_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  // Optional redirect support: if redirect=... present, redirect there
  const redirect = url.searchParams.get("redirect");
  if (redirect) {
    return NextResponse.redirect(redirect, { status: 302, headers: res.headers });
  }
  return res;
}

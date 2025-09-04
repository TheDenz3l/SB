import { createSignedToken } from "@/lib/crypto";
import { env, constants } from "@/lib/env";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export function generateUtmToken(swapId: string) {
  const exp = Math.floor(Date.now() / 1000) + constants.LAST_TOUCH_TTL_SECONDS;
  return createSignedToken({ swapId, exp }, env.WHOP_UTM_HMAC_SECRET);
}

export function hashIp(ip: string) {
  return crypto.createHash("sha256").update(`${env.IP_HASH_SALT}:${ip}`).digest("hex");
}

export function getClientIp(req: NextRequest): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  // NextRequest may expose ip via geo in some deployments; fallback null
  const anyReq = req as any;
  if (anyReq && typeof anyReq.ip === 'string' && anyReq.ip) return anyReq.ip as string;
  return null;
}

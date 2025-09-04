import crypto from "node:crypto";

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string): Buffer {
  const pad = 4 - (str.length % 4);
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + (pad < 4 ? "=".repeat(pad) : "");
  return Buffer.from(base64, "base64");
}

export function hmacSha256(input: string, secret: string): string {
  const sig = crypto.createHmac("sha256", secret).update(input).digest();
  return b64urlEncode(sig);
}

export function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export type SignedPayload<T = Record<string, unknown>> = T & { exp?: number };

export function createSignedToken<T extends Record<string, unknown>>(payload: SignedPayload<T>, secret: string): string {
  const json = JSON.stringify(payload);
  const body = b64urlEncode(Buffer.from(json));
  const sig = hmacSha256(body, secret);
  return `${body}.${sig}`;
}

export function parseAndVerifySignedToken<T extends Record<string, unknown>>(token: string, secret: string): { valid: boolean; payload?: SignedPayload<T>; reason?: string } {
  const [body, sig] = token.split(".");
  if (!body || !sig) return { valid: false, reason: "malformed" };
  const expected = hmacSha256(body, secret);
  if (!timingSafeEq(expected, sig)) return { valid: false, reason: "bad-signature" };
  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as SignedPayload<T>;
    if (payload.exp && payload.exp * 1000 < Date.now()) return { valid: false, reason: "expired" };
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "bad-payload" };
  }
}


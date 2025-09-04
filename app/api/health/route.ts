import { NextResponse } from "next/server";

export async function GET() {
  const required = [
    "NEXT_PUBLIC_WHOP_APP_ID",
    "WHOP_API_KEY",
    "WHOP_WEBHOOK_SECRET",
    "WHOP_UTM_HMAC_SECRET",
    "DATABASE_URL",
    "IP_HASH_SALT",
  ];
  const optional = [
    "NEXT_PUBLIC_WHOP_PARENT_ORIGIN",
    "NEXT_PUBLIC_BOOST_PLAN_ID_ONE",
    "NEXT_PUBLIC_BOOST_PLAN_ID_FIVE",
  ];

  const env: Record<string, unknown> = {};
  for (const k of [...required, ...optional]) {
    const v = process.env[k];
    env[k] = v ? (k.startsWith("NEXT_PUBLIC_") ? v : true) : false;
  }

  return NextResponse.json({
    ok: true,
    env,
    node: process.version,
    time: new Date().toISOString(),
  });
}


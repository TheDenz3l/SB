export const env = {
  NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID || "",
  WHOP_API_KEY: process.env.WHOP_API_KEY || "",
  WHOP_WEBHOOK_SECRET: process.env.WHOP_WEBHOOK_SECRET || "",
  WHOP_UTM_HMAC_SECRET: process.env.WHOP_UTM_HMAC_SECRET || "",
  IP_HASH_SALT: process.env.IP_HASH_SALT || "",
  BOOST_PLAN_ID_ONE: process.env.BOOST_PLAN_ID_ONE || "",
  BOOST_PLAN_ID_FIVE: process.env.BOOST_PLAN_ID_FIVE || "",
  CRON_SECRET: process.env.CRON_SECRET || "",
};

const isProd = process.env.NODE_ENV === "production";

function assert(name: keyof typeof env) {
  const val = env[name];
  if (!val) {
    const msg = `[env] Missing required env var: ${name}`;
    if (isProd) throw new Error(msg);
    // eslint-disable-next-line no-console
    console.warn(msg);
  }
}

// Validate required variables on import (server-side usage)
assert("NEXT_PUBLIC_WHOP_APP_ID");
assert("WHOP_API_KEY");
// For security-sensitive flows; allow missing in dev but warn
assert("WHOP_WEBHOOK_SECRET");
assert("WHOP_UTM_HMAC_SECRET");
assert("IP_HASH_SALT");
// Optional: boost plan IDs (used if awarding credits via webhook)
// In dev, we warn when missing instead of throwing.
if (!env.BOOST_PLAN_ID_ONE) console.warn("[env] Optional env var missing: BOOST_PLAN_ID_ONE");
if (!env.BOOST_PLAN_ID_FIVE) console.warn("[env] Optional env var missing: BOOST_PLAN_ID_FIVE");
if (!env.CRON_SECRET) console.warn("[env] Optional env var missing: CRON_SECRET (required for job routes)");

export const constants = {
  // 30d last-touch window in seconds
  LAST_TOUCH_TTL_SECONDS: 60 * 60 * 24 * 30,
};

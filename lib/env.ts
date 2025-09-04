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

// During Next.js build, modules run in a special context where many
// runtime envs are not available. We only hard-fail in real runtime.
const isProdRuntime = process.env.NODE_ENV === "production" && !!process.env.NEXT_RUNTIME;

function assert(name: keyof typeof env) {
  const val = env[name];
  if (!val) {
    const msg = `[env] Missing required env var: ${name}`;
    if (isProdRuntime) throw new Error(msg);
    // eslint-disable-next-line no-console
    console.warn(msg);
  }
}

// Do not hard-assert at import time; runtime routes should
// verify required vars before use to avoid breaking builds.
// Optional: boost plan IDs (used if awarding credits via webhook)
// In dev, we warn when missing instead of throwing.
if (!env.BOOST_PLAN_ID_ONE) console.warn("[env] Optional env var missing: BOOST_PLAN_ID_ONE");
if (!env.BOOST_PLAN_ID_FIVE) console.warn("[env] Optional env var missing: BOOST_PLAN_ID_FIVE");
if (!env.CRON_SECRET) console.warn("[env] Optional env var missing: CRON_SECRET (required for job routes)");

export const constants = {
  // 30d last-touch window in seconds
  LAST_TOUCH_TTL_SECONDS: 60 * 60 * 24 * 30,
};

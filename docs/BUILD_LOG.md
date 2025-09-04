# Swapboard Build Log

This document captures each implementation phase with scope, changes, and how to validate.

## Phase 1 — Data layer, Onboarding, Matches

Scope
- Add Prisma + SQLite (dev) and a minimal schema for `CreatorProfile`.
- Implement `/api/profile` to create/fetch creator profile (tags + size).
- Implement `/api/matches` to compute ranked partners via cosine(tag) * size-parity penalty, filter ≥ 0.55.
- Add onboarding page to collect title, tags, audience size.
- Wire Experience page to Whop iFrame context and gate on onboarding.
- Update Matches UI to fetch real matches.

Key changes
- `prisma/schema.prisma`: SQLite datasource + `CreatorProfile`.
- `lib/db.ts`: PrismaClient singleton.
- `app/api/profile/route.ts`: GET/POST for profile upsert.
- `app/api/matches/route.ts`: GET for matches with cosine + size penalty.
- `app/experiences/[experienceId]/onboard/page.tsx`: Onboarding form.
- `app/experiences/[experienceId]/page.tsx`: Context load, onboarding gate, pass `experienceId` to Matches.
- `components/app/Matches.tsx`: Fetch and render matches.
- `prisma/seed.js`: Seed sample CreatorProfiles.
- `package.json`: Added `@prisma/client`, `prisma` and scripts.
- `.env.example`: Added `DATABASE_URL`.

How to run
1) Install deps and set env
   - `cp .env.development .env.local` and ensure `DATABASE_URL="file:./dev.db"`.
   - Fill Whop env vars as described in README.
2) Generate client and migrate
   - `pnpm prisma:generate`
   - `pnpm prisma:migrate`
3) (Optional) Seed sample data
   - `pnpm db:seed`
4) Start dev
   - `pnpm dev` then open `/experiences/test-experience` via proxy.
   - Complete onboarding; Matches will populate from seeded profiles.

Notes
- Experience identity is derived client-side from Whop iFrame (`getTopLevelUrlData`) and passed to APIs as a query/body param for now. In Phase 3/4 we’ll harden this with server-side verification.
- Matching uses normalized tags and an exponential size penalty with α=0.6 as a good default.

Next (Phase 2)
- Proposals CRUD (compose/accept/decline), minimal persistence, and UI wiring.

## Phase 2 — Proposals system

Scope
- Add `Proposal` model and `ProposalStatus` enum to Prisma.
- Implement `/api/proposals`:
  - GET `?experienceId=...&box=inbox|sent` to list proposals.
  - POST to compose a proposal (idempotent within 14 days for same pair).
  - PATCH to accept/decline (only recipient can act).
- Wire Matches “Propose swap” button to POST create proposals with defaults.
- Wire Proposals tab to fetch inbox/sent and accept/decline.

Key changes
- `prisma/schema.prisma`: Added `Proposal` model, relations, indexes; `ProposalStatus` enum.
- `app/api/proposals/route.ts`: GET/POST/PATCH endpoints with basic validation.
- `components/app/Matches.tsx`: Propose action triggers POST; disables once proposed.
- `components/app/Proposals.tsx`: Fetches inbox/sent for current experience; shows details and handles accept/decline.
- `app/experiences/[experienceId]/page.tsx`: Passes `experienceId` to Proposals component.

How to run
1) Apply the new Prisma migration
   - `pnpm prisma:migrate`
2) Start dev and test flows
   - In Matches, click “Propose swap”.
   - In Proposals → Inbox (recipient account), Accept/Decline.

Notes
- Server does not yet enforce embed auth server-side; Phase 3/4 will introduce stricter validation.
- Proposal copy is generated via a deterministic template; can be upgraded to AI later.

## Phase 3 — Attribution & Clicks

Scope
- Add `Swap` model with a signed UTM token; created on accept.
- Add `ClickEvent` model; persist click with hashed IP and user agent.
- `/api/proposals`: On accept, ensure Swap exists and return tracking link.
- `/api/proposals` GET: Include `trackingUrl` for accepted proposals.
- `/api/click`: Verify signed token, set 30d last-touch cookie, store `ClickEvent`, basic IP rate limit, optional redirect.
- Utilities: HMAC helpers already exist; add `lib/attribution.ts` for token gen and IP hashing.

Key changes
- `prisma/schema.prisma`: Added `Swap` (1:1 with Proposal) and `ClickEvent`.
- `.env.example`: Added `IP_HASH_SALT`.
- `lib/env.ts`: Validates `IP_HASH_SALT`.
- `lib/attribution.ts`: `generateUtmToken`, `hashIp`, `getClientIp`.
- `app/api/proposals/route.ts`: Creates swap + token on accept; returns and exposes `trackingUrl`.
- `app/api/click/route.ts`: Persists clicks, rate limits, sets cookie, supports `redirect`.
- `components/app/Proposals.tsx`: Shows tracking URL with “Copy link” once accepted.

How to run
1) Migrate DB:
   - `pnpm prisma:migrate`
2) Test flows:
   - Send proposal, accept it; copy tracking link.
   - Visit the tracking link; it should set the cookie and (if `redirect` provided) redirect.
   - Verify `ClickEvent` rows exist in DB.

Notes
- Rate limiting is in-memory for dev; replace with a durable store in production.
- UTM token is signed with `WHOP_UTM_HMAC_SECRET` and expires in 30 days.

## Phase 4 — Webhooks & Billing

Scope
- Persist verified webhooks (`@whop/api` `makeWebhookValidator`): payment success/refund + membership signals.
- Create `Attribution` from webhook metadata `sb` token when present.
- Save `PaymentEvent` rows (positive for payments, negative for refunds), attributed to the receiving creator via swap → proposal.toId.
- Compute monthly success fee (5% of net receipts) limited to first 3 cycles per member and capped at $50/member.
- Generate monthly invoices (manual trigger for now) and expose history via API.
- Wire Billing UI to show summary and invoice history.

Key changes
- `prisma/schema.prisma`: Added `Attribution`, `PaymentEvent`, `Invoice`, enums; indexes; uniqueness for period.
- `app/api/webhooks/payment/route.ts`: Processes actions; upserts attribution from metadata; stores payment/refund events with creator linkage.
- `lib/billing.ts`: Success fee calculation with cycle window + cap; invoice close helper.
- `app/api/invoices/route.ts`: GET invoices by experience; POST to close previous month for a creator.
- `components/app/Billing.tsx`: Fetches summary/history and renders real data.

How to run
1) Migrate DB:
   - `pnpm prisma:migrate`
2) Configure webhook URL in Whop dashboard: `/api/webhooks/payment`
3) Send test events (from Whop) and verify `PaymentEvent` rows appear.
4) Close invoices for previous month:
   - `curl -X POST /api/invoices -H 'Content-Type: application/json' -d '{"experienceId":"<id>"}'`
5) Open Billing tab to see summary + history.

Notes
- We attempt to detect `sb` token from webhook `metadata` to create `Attribution`. Ensure your checkout flow carries this metadata for robust attribution.
- The per-member 3-cycle window is computed by months since the first paid event (firstPaidAt).

## Phase 5 — Boost Credits & Ranking

Scope
- Model Boost credits and expose them via API.
- Weight Matches results to prioritize creators with active boosts (7-day window).
- Enable purchase UI via Whop in-app purchase; grant credits on webhook using configured plan IDs.

Key changes
- `prisma/schema.prisma`: Added `BoostCredit` with `creatorId`, `credits`, `consumed`, `expiresAt`.
- `app/api/boosts/route.ts`: GET active credits; POST dev-only grant endpoint.
- `app/api/matches/route.ts`: Applies 1.25x weighting for partners with active credits and marks results as `boosted` for UI.
- `app/api/webhooks/payment/route.ts`: Detects planId on payment success and grants 1 or 5 credits if it matches env plan IDs.
- `components/app/Billing.tsx`: Shows active credits; “Buy 1/5 Boosts” uses `iframeSdk.inAppPurchase` with `NEXT_PUBLIC_BOOST_PLAN_ID_*`.

How to run
1) Migrate DB:
   - `pnpm prisma:migrate`
2) Configure env:
   - `NEXT_PUBLIC_BOOST_PLAN_ID_ONE`, `NEXT_PUBLIC_BOOST_PLAN_ID_FIVE` (client buttons)
   - `BOOST_PLAN_ID_ONE`, `BOOST_PLAN_ID_FIVE` (server webhook mapping)
3) Test credits
   - Dev grant: `POST /api/boosts { experienceId, credits: 1 }` then refresh Matches/Billing.
   - Purchase: Trigger in-app purchase; after webhook, credits should increment and Matches should prioritize boosted creators.

Notes
- Auto-outbound proposals and credit consumption will be added later; currently, boosts prioritize ranking for discovery.

## Phase 6 — Analytics wiring & polish

Scope
- Compute real KPIs: new paying members (30d), attributed revenue (net 30d), acceptance rate (sent), time to first swap.
- Weekly revenue chart: last 8 rolling 7-day windows.
- Top partners table: clicks, paid members, revenue over last 8 weeks, by partner.
- Wire Analytics page to fetch from API using Whop context.

Key changes
- `app/api/analytics/route.ts`: Aggregates `PaymentEvent`, `Attribution`, `ClickEvent`, `Proposal` to return KPIs, weekly revenue, and top partners for a creator.
- `components/app/Analytics.tsx`: Client component using `useIframeSdk()` to fetch and render analytics with formatted values.

How to run
1) Ensure webhooks and click logging are working (Phases 3–4).
2) Open Analytics tab inside the Experience.
3) Verify KPIs, weekly bars, and top partners reflect your latest data.

Notes
- Weekly windows are rolling 7-day periods ending today (UTC), not calendar weeks.
- Acceptance rate counts outcomes of sent proposals only (accepted / (accepted + declined)).

## Phase 7 — Ops: Cron + Idempotency + Boost Auto‑Outbound

Scope
- Add DB-backed idempotency keys for webhook processing and job runs.
- Monthly invoice close job route with job-run guard.
- Boost auto-outbound job that sends up to 25 proposals per Boost credit over 7 days and updates consumption.

Key changes
- `prisma/schema.prisma`: Added `BoostDispatch` (unique per credit+partner), `JobRun` (unique per job+key), `Idempotency` (unique key with expiry).
- `app/api/webhooks/payment/route.ts`: Uses `Idempotency` to dedupe events at DB-level.
- `app/api/jobs/close-invoices/route.ts`: Auth via `x-cron-secret`, runs previous-month close for all creators, idempotent via `JobRun`.
- `app/api/jobs/boost-outbound/route.ts`: Auth via `x-cron-secret`, scores matches server-side, excludes recent/duplicate partners, creates proposals, records `BoostDispatch`, and updates `BoostCredit.consumed`.
- `.env.example`: Added `CRON_SECRET`.
- `README.md`: Scheduler instructions and endpoints.

How to run
1) Migrate DB: `pnpm prisma:migrate`
2) Set `CRON_SECRET` in env.
3) Configure scheduler:
   - Monthly (UTC day 1): `POST /api/jobs/close-invoices` with `x-cron-secret`.
   - Hourly: `POST /api/jobs/boost-outbound` with `x-cron-secret`.

Notes
- Idempotency keys for webhooks use `action:id` (or derived); rows expire after ~7 days by default (adjust as needed).
- Boost consumption is derived from dispatch count: `consumed = floor(dispatches / 25)` per credit entry.

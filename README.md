# Swapboard — Whop App (Template-aligned)

This starter **matches the Whop Next.js app template paths**:
- **Discover path:** `/discover`
- **App path:** `/experiences/[experienceId]`

Local dev uses **whop-proxy**.

## Quickstart
```bash
pnpm i
cp .env.development .env.local   # fill with values from Whop dashboard
# Ensure a database URL for Prisma (dev defaults to SQLite)
# DATABASE_URL="file:./dev.db"
pnpm prisma:generate
pnpm prisma:migrate
# (optional) seed a few sample profiles
pnpm db:seed
pnpm dev
# Discover:           http://localhost:3000/discover
# Experience (iframe): http://localhost:3000/experiences/test-experience
```

## Whop dashboard setup
- Base URL: your dev/prod domain
- App path: `/experiences/[experienceId]`
- Discover path: `/discover`
- Webhook URL: `/api/webhooks/payment`
- Ensure your app uses the Whop proxy during local dev (`whop-proxy`) so embed context and authentication behave like production.

## What’s included
- Exact UI matching the approved desktop/mobile mocks
- Tabs: Matches • Proposals • Analytics • Billing
- Color tokens: #B9375D, #D35D5D, #E7D3D4, #EEEEEE
- API placeholders: `/api/click`, `/api/webhooks/payment`
- Whop SDK placeholders in `lib/whop.ts`
- Whop React iFrame provider mounted in `app/layout.tsx` via `WhopApp`
- Phase 1 implemented (see `docs/BUILD_LOG.md`): Prisma schema, onboarding, matches API/UI

## Next steps
- Wire Whop React iFrame SDK on Experience page for purchase/modal usage
- Implement attribution + billing

## Whop alignment checklist
- Paths: App path `/experiences/[experienceId]` and Discover path `/discover` match Whop app template.
- SDKs: Server SDK configured in `lib/whop.ts`; add React iFrame SDK on Experience page.
- Env vars: `.env.local` includes `NEXT_PUBLIC_WHOP_APP_ID`, `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_UTM_HMAC_SECRET`.
- Webhooks: Configure Whop to send payment events to `/api/webhooks/payment`; we verify signatures against `WHOP_WEBHOOK_SECRET`.
- Attribution: `/api/click` verifies signed `sb` tokens using `WHOP_UTM_HMAC_SECRET` and sets a 30-day last-touch cookie.
- Dev proxy: Use `pnpm dev` which runs `whop-proxy` wrapping `next dev`.
- Security: No secrets on client; validation and signature checks on server routes.
- Next config: `next.config.mjs` wrapped with `withWhopAppConfig` to align server action origins and import optimization.

## Scheduled jobs
- Monthly invoice close:
  - Route: `POST /api/jobs/close-invoices`
  - Header: `x-cron-secret: $CRON_SECRET`
  - Action: closes previous month invoices for all creators (idempotent)
- Boost auto-outbound:
  - Route: `POST /api/jobs/boost-outbound`
  - Header: `x-cron-secret: $CRON_SECRET`
  - Action: sends proposals to top matches while active Boost credits remain (idempotent per partner/credit)

Set `CRON_SECRET` in env and configure your scheduler (e.g., Vercel Cron) to call these endpoints.

See Whop’s Get Started documentation for exact SDK usage and webhook signature details.

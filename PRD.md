# Product Requirements Doc — Swapboard (Whop App)

**One-liner:** Match Whop creators with similar audiences and auto-generate cross-promo posts + tracking to acquire new paying members. Monetize via **5% success fee or $29 minimum (whichever is higher)** and optional **Boost Credits**.

## 1) Goals
- Find 3–5 high-fit partners quickly.
- Launch a cross-promo in minutes.
- Attribute paid members and $ clearly.

## 2) Users
- Creator/Admin, Moderator/Manager.

## 3) Metrics
- **NSM:** Attributed new paying members / creator / month.
- Secondary: proposal acceptance rate, $ from swaps, time to first swap.

## 4) Monetization
- Success fee: 5% of net receipts over first 3 billing cycles per referred member, cap $50/member. Monthly **amount due = max(minimum $29, success fee)**.
- Boost Credits: $20–$50 per boost, 7-day priority, up to 25 targeted proposals.

## 5) Scope (MVP)
- **Discover (public):** Hero, features, social proof, Install + Preview Matches.
- **Experience (gated):** Top tabs — Matches, Proposals, Analytics, Billing.
  - Matches: ranked partners (overlap + size parity), badges, propose.
  - Proposals: inbox & sent, accept/decline, statuses.
  - Analytics: KPI cards, weekly bar chart, top partners table.
  - Billing: summary (max(minimum, success fee)), invoice history, Boosts.

## 6) Flows
- Install → Onboard (tags, size).
- Match → Propose (window, offer, AI copy).
- Compose → Post (UTM link, draft or auto-post).
- Measure → Pay (monthly in arrears).

## 7) IA
- Tabs: Matches • Proposals • Analytics • Billing.

## 8) Design system & palette
- Primary: **#B9375D**; Secondary: **#D35D5D**; Muted: **#E7D3D4**; Base: **#EEEEEE**.
- Components: Card, Button, Badge, Tabs, Progress, Table.

## 9) Tech
- Next.js + Tailwind; app embedded via Whop iFrame.
- Server SDK for webhooks & billing aggregation.
- API endpoints: `/api/click`, `/api/webhooks/payment`.
- Env: `NEXT_PUBLIC_WHOP_APP_ID`, `WHOP_API_KEY`.

## 10) Matching
- Tag vector cosine + size ratio penalty; show score ≥ 0.55.

## 11) Billing rules
- Last-touch attribution window 30d; refund grace 7d.
- Per-member cap $50 enforced before invoice.
- Invoice monthly in arrears on day 1.

## 12) Risks & mitigations
- Spam: status & reputation, blocklist, rate limits.
- Misattribution: signed UTMs, webhook verification.
- UX friction: AI copy presets, auto-post on accept (toggle).

## 13) Rollout
- Week 1–2 MVP; Week 3 beta; Week 4 listing + Boosts; Week 5+ growth loops.

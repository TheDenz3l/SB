# Whop SDK Compatibility Notes

Goal: keep the app compatible across `@whop/react` + `@whop/iframe` versions while using React 18 and deploying on Vercel without type friction.

What we changed
- `lib/whop-compat.ts`: wraps the upstream SDK to read context directly instead of using React 19's `use()` API. This keeps us on Next 14 + React 18 without breaks.
- `types/whop-iframe-shim.d.ts`: widens `getTopLevelUrlData` to accept an optional options param, covering versions where the argument is required vs optional.
- `next.config.mjs`: optional `NEXT_IGNORE_TYPE_ERRORS=1` env flag to bypass third‑party type errors during Vercel builds, if needed.

Usage guidance
- Always call `iframeSdk.getTopLevelUrlData({})` from a client `useEffect`. It is safe across versions and avoids SSR.
- Read `experienceId` from the returned object and pass it to server APIs as a parameter.
- Never import `useIframeSdk` directly from `@whop/react`; always use `@/lib/whop-compat` so the hook works on React 18.

Why this approach
- The upstream SDK evolves quickly; publishing a local shim keeps the app resilient to API shape changes and differing type declarations while preserving a clean DX.


# CozyPaws: project notes for AI coding assistants

Next.js 15 (App Router) + React 19 dog store. Motion-heavy homepage (GSAP, Lenis),
and a cart → checkout flow built around "instant but never wrong about money".

## Structure
- `lib/types.ts`: shared domain + API types. Money is integer **cents** everywhere.
- `lib/catalog.ts`: product catalog (client snapshot). `lib/server/catalog.ts` = server's live view.
- `lib/pricing.ts`: `buildQuote`, `diffQuotes`, shipping rules (pure, unit-tested).
- `lib/cart-state.ts`: pure reducer: `confirmed` vs `pending`, seq numbers for races.
- `lib/cart.tsx`: provider; optimistic updates → `POST /api/cart` → confirm / rollback.
- `app/api/checkout/route.ts`: re-prices server-side; 409 `quote_changed` with a diff; idempotency key (`lib/server/idempotency.ts`).
- Payments: `lib/wallet-machine.ts` (state machine), `lib/wallet/` (injected viem + simulated drivers), `lib/server/payments.ts` (quote locks + on-chain verification on Base Sepolia). `lib/payments.ts` is client-safe constants only: never import viem into it.
- Shared state: `lib/server/kv.ts` (Upstash Redis, in-memory fallback). Demo state stays in its cookie on purpose.
- Field INP: `components/VitalsReporter.tsx` → `/api/vitals` → `/vitals`. Tag controls to measure with `data-inp`.
- Homepage cross-section refs: `lib/home-sections.tsx` (page owns them, sections attach/read them).
- `lib/server/demo.ts` + `components/DemoPanel.tsx`: cookie-driven latency / failure / price / stock demo.
- Styles: plain CSS per section in `app/styles/`; flow states in `app/styles/flow.css`.

## Rules
- TypeScript strict everywhere, no `.js`/`.jsx` in app, components or lib.
- The server is the source of truth for price and stock. The client may be optimistic but must reconcile.
- Never let the client send a price to be charged; send what was *shown* so the server can detect drift.
- Decorative motion must respect `prefers-reduced-motion` (`lib/motion.ts`, `gsap.matchMedia`).
- Use refs, never `document.querySelector`, to reach another component's element: add it to `lib/home-sections.tsx`. Inside a component, query only within its own root (`root.querySelectorAll`, `gsap.context(fn, root)`), never global selector strings in GSAP calls. Every listener and ScrollTrigger is removed in the effect's cleanup.
- No new UI libraries.
- Motion: use the tokens in `app/styles/base.css` (`--dur-*`, `--ease-*`), put hover effects behind `@media (hover: hover)`, and give every animation a reduced-motion fallback.
- Homepage: gate non-critical GSAP setup behind `useIdleReady`; pin with `pinType: "transform"` (no layout shift); give below-the-fold images `loading="lazy"`. Homepage-wide behaviour (navbar hide-on-scroll, scroll effects, microinteractions) lives in `app/styles/home-polish.css`, imported last so it layers on the section styles.
- Spacing between page sections uses `--section-space` (base.css): 64px on phones, ~112px on desktop, measured as the *visible* gap. New sections pad with it instead of their own numbers.
- Type: headings use `var(--font-display)` (Epilogue, weight 800) with the accent word in `.accent` (Times italic); body is Inter. Copy is lowercase. Pages use `var(--bg-color)` and end with `SiteFooter` (blue block). Muted text on the beige background is `#565e6b` or darker (4.5:1).
- Images in the flow use `components/SmartImage` (next/image + fade-in); always pass width, height and `sizes`.

## Commands
- `npm run dev` · `npm run build` · `npm run typecheck`
- `npm test` (Vitest) · `npm run test:e2e` (Playwright; builds must exist: `npm run build` first; it starts `tests/e2e/mock-chain.mjs` on :8545)
- Env: see `.env.example` (`MERCHANT_ADDRESS`, `BASE_SEPOLIA_RPC_URL`, Upstash / `KV_REST_API_*`).

## How to work
- Anything touching cart, checkout or payments: read the relevant `lib/` files and propose a plan first; wait for approval before editing.
- Done means `npm run typecheck`, `npm test` and `npm run test:e2e` pass. UI changes also get checked in the browser at phone and desktop widths, with reduced motion on.
- Money, stock or race-condition bugs get a failing test first (`tests/unit/` for pricing, cart state, idempotency, wallet; `tests/e2e/` for flows).
- Use the demo panel (latency / failure / price / stock) to exercise optimistic and 409 paths instead of hand-editing state.
- One concern per commit, with a message that says what changed and why. Work on a branch; never push to main.
- Keep this file current: when a change adds a convention or moves a file listed here, update it in the same commit.
- If a rule here blocks you, stop and ask instead of working around it.

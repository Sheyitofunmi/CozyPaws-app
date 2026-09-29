# CozyPaws

A dog store built with Next.js 15 and React 19 to answer two questions:

1. **How do you make a checkout feel instant without ever being wrong about money?**
2. **How much motion and personality can a store have before it gets slow or inaccessible?**

**[Live demo →](https://cozy-paws-beta.vercel.app)** · add [`?demo=1`](https://cozy-paws-beta.vercel.app/?demo=1) to get controls for slow networks, failed requests, and price and stock changes.

| Product-page LCP (throttled mobile) | Homepage layout shift | Image data for a full scroll | Automated tests |
| :---------------------------------: | :-------------------: | :--------------------------: | :-------------: |
|          **4.6s → 1.4s**            |    **CLS 1.9 → 0**    |      **1.65MB → 150KB**      | **83** (unit, e2e, axe) |

---

## Highlights

### Correct where money moves

- **Optimistic cart, server-owned truth.** Every tap updates the UI at once, then the server validates stock. A stock clash snaps the line back and says why ("only 1 left"), and a failed request rolls back. Out-of-order responses are ignored using sequence numbers.
- **No silent re-pricing.** The checkout sends what the customer _saw_. If the price moved, the server answers `409 quote_changed` with a per-line diff, and the customer confirms the new total themselves.
- **One order per click.** An `Idempotency-Key` stored in Redis means a double-click, a retry or a second serverless instance can't create two orders.
- **Real wallet checkout, verified on the server.** Any browser wallet pays in test USDC on Base Sepolia. The server reads the transfer on-chain (amount, recipient, sender, confirmations, quote expiry) before it confirms the order, and each transaction can only pay once. No wallet? A clearly labelled simulated one runs the same state machine.
- **Field INP, measured.** Search and the cart stepper report real interaction latency from visitors' browsers, summarised at [`/vitals`](https://cozy-paws-beta.vercel.app/vitals).

### Craft that stays fast and accessible

- **A homepage with real interaction.** Pets react to your cursor, a six-clip video reel crossfades with the next clip preloaded, the headline pins and scrolls sideways, and the photo cards can be grabbed and thrown. All of it is set up at idle time and pins with transforms, with zero layout shift.
- **Accessible by default.** Real modal dialogs (focus trap, `inert` background), live regions for toasts and errors, keyboard access to everything, 24px+ tap targets and no text under 12px. The axe scan reports no serious WCAG 2.1 AA issues on any page.
- **Reduced motion respected everywhere.** Decorative motion switches off. Functional feedback stays, just without the movement. The video only loads when you press play.
- **One design system.** Shared motion tokens, one type system (Epilogue headings with a Times-italic accent, Inter body), one background and one footer across every page, and a branded 404.

---

## Try it (2 minutes)

1. Open the [demo panel](https://cozy-paws-beta.vercel.app/?demo=1) and turn on **price bump**, then check out. You'll see _"Your total changed"_ with the diff instead of a silent charge.
2. Turn on **fail next request**, then tap **+** on a cart item. The row rolls back and says why.
3. Remove an item and press **Undo**. It returns to its old position, and focus follows.
4. Pick **crypto wallet** at checkout. With MetaMask (or any wallet) on Base Sepolia you pay real test USDC; without one, try the simulated wallet and reject the signature. Nothing is sent, and you can retry at the same price.
5. On the homepage, point at the pets, then grab a photo in _"a store built for good dogs"_ and throw it.

---

<details>
<summary><strong>Key decisions and trade-offs</strong></summary>

### 1. Optimistic cart, but the server owns price and stock

Every cart change updates the UI immediately, then `POST /api/cart` validates it against live stock.

- **Confirmed:** the pending value becomes the real one.
- **Out of stock:** the line drops back to what's available and the row and a toast explain why.
- **Network failure:** full rollback plus an error message. Nothing is persisted until the server agrees.

State is split into `confirmed` and `pending` in a pure reducer (`lib/cart-state.ts`). Rapid taps send **absolute** quantities with increasing sequence numbers, so responses that arrive out of order are ignored.

_Rejected:_ waiting for the server on every tap (slow), trusting the client (wrong totals), and React's `useOptimistic`. It's scoped to one transition, but this cart needs optimistic state that outlives any single request and survives several overlapping ones.

### 2. A stale-quote review instead of silently re-pricing

The checkout sends the lines and total the customer **saw**, never a price to charge. The server re-prices from its own catalog. If anything moved, it returns `409 quote_changed` with a per-line diff (`$49.99 → $57.49`), and the UI asks the customer to confirm the new total.

_Rejected:_ charging the new price silently (breaks trust), or failing with a generic error (loses the order).

### 3. Search with no network request

The catalog is local, so search filters on the client. `useDeferredValue` keeps typing responsive, and the URL updates with `router.replace` on a 250ms debounce, so links are shareable and history stays clean. With a server-side catalog I'd debounce the fetch and cancel stale requests with `AbortController`; here that would add complexity for nothing.

### 4. Wallet checkout: a state machine, then proof on-chain

One discriminated union and a pure reducer (`lib/wallet-machine.ts`), unit-tested, drives both a real and a simulated wallet (`lib/wallet/`). The price is locked with `POST /api/quote` **before** the signature, because a wallet user signs an exact amount, and the lock is stored server-side.

The real path uses **viem** directly, with wallets discovered over EIP-6963. I skipped wagmi: one chain, one token and one write call don't need its connectors, cache or React Query, and it would roughly double the dialog's bundle. The customer sends test USDC on Base Sepolia to `MERCHANT_ADDRESS`.

The client never tells the server "it's paid". Checkout sends the tx hash, and the server (`lib/server/payments.ts`) fetches the receipt and checks: it succeeded, it has 2 confirmations, it contains a USDC `Transfer` from the connected account to the merchant for **exactly** the locked total, and it was mined before the quote expired. The hash is then marked as spent, so one payment can't confirm two orders. Not mined yet? The API answers `409 payment_pending` and the client retries with the same idempotency key. Without `MERCHANT_ADDRESS`, only the simulated wallet is offered.

### 4b. Shared state for serverless

Idempotency keys, quote locks, spent tx hashes and INP samples live in Upstash Redis (`lib/server/kv.ts`), because separate serverless instances don't share memory. Idempotency claims the key atomically (`SET NX`), so concurrent duplicates wait for the first result, and a changed body under the same key is rejected (`422`). Without Redis credentials it falls back to memory, fine for local dev.

The demo panel's state stays in a per-visitor cookie on purpose: in Redis it would be shared, and one visitor's "price bump" would hit everyone.

### 4c. INP from real visits

`components/VitalsReporter.tsx` records page INP (web-vitals, with attribution) plus every interaction with elements tagged `data-inp="search"` or `"cart-stepper"`, measured with the Event Timing API. Samples are beaconed on page hide to `/api/vitals`, and `/vitals` shows p75, p95 and % good per control and device, plus the slowest visits broken down into input delay, processing and presentation.

### 5. Motion that doesn't cost performance

Pointer effects write CSS variables from one rAF-throttled listener (`useHeroPointer`), so React never re-renders on mouse move. GSAP setup waits for idle time (`useIdleReady`). Pinned sections use `pinType: "transform"`, and responsive GSAP code uses `gsap.matchMedia` with full clean-up, so resizing between desktop and mobile never leaves stale offsets.

</details>

<details>
<summary><strong>All the details</strong></summary>

**Shop and checkout**

- Category tiles double as the filter, and search, result count and sort live in the URL. Cards show a second photo on hover and turn into a quantity stepper once the item is in the cart.
- The product photo flies into the cart icon, the button says "added ✓", the badge bumps, and a sticky buy bar appears on phones.
- Removing an item collapses the row, and **Undo** puts it back in place with focus following.
- Validation rules are shared by client and server. Fields are checked on blur and re-checked as you fix them.
- Place order goes idle → placing → "order placed ✓" → receipt, and failures say why in text.
- `/order/confirmed` survives a refresh, and "back" never re-shows the filled form.
- A demo account (name and email, stored only in the browser) prefills checkout and lists past orders.
- "Saving…" only appears after 300ms, so fast networks never flicker.

**Homepage**

- The video reel is six 6s clips (~0.3–1.2MB each, H.264 with a VP9 fallback). They load only on screen, pause off screen, and fall back to an illustrated scene.
- The pinned headline's scroll length is measured from the text, so there are no empty frames.
- Photo polaroids use GSAP Draggable and inertia, and a drag never counts as a click. On phones they become a swipeable pile with a "next photo" button.
- The aisle directory lists real products with prices. It's a fanned row on desktop and a scroll-snap row with carousel dots below 1200px.

**Pages with a point of view**

- About: "the Biscuit test" (products stamped APPROVED or REJECTED), a timeline that draws itself as you scroll, and flip cards for the team dogs.
- Contact: live "open now" status in London time, fields that adapt to the topic, and a MapLibre map recoloured to the brand. The map loads only when near the viewport and doesn't hijack scrolling.

**Performance and quality**

- `next/image` everywhere, route skeletons, and images that fade in over a shimmer.
- Checked at 320–1920px with no horizontal scroll.
- Money is stored as integer cents and formatted only at the edge with `Intl.NumberFormat`.

</details>

<details>
<summary><strong>Testing</strong></summary>

| Layer         | Tool       | Covers                                                                                                                                                         |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Vitest     | pricing, quote diffs, cart reducer (rollback, stale responses, races), wallet state machine, on-chain transfer matching, idempotency (replay, concurrency, mismatch) |
| End-to-end    | Playwright | optimistic updates, stock rollback, network failure, double-submit → one order, price-change review, real-wallet payment against a local fake chain (underpay, wrong recipient, unmined, reused tx), field INP, focus traps, search, account, homepage interactions, resize regressions |
| Accessibility | axe-core   | no serious or critical WCAG 2.1 AA violations on every page, including checkout, the order confirmation and the 404                                           |

GitHub Actions runs typecheck, unit and e2e tests on every PR.

</details>

<details>
<summary><strong>Run it locally</strong></summary>

```bash
npm install
npm run dev            # http://localhost:3000 (demo controls show in dev)
npm run typecheck
npm test               # unit
npm run build && npm run test:e2e   # starts a fake Base Sepolia node, no network needed
```

Copy `.env.example` to `.env.local` to turn on real payments (`MERCHANT_ADDRESS`) and Redis. Test USDC comes from [faucet.circle.com](https://faucet.circle.com) and gas from any Base Sepolia faucet.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict, everywhere) · viem · Upstash Redis · web-vitals · GSAP (ScrollTrigger, Draggable, Inertia) · Lenis · MapLibre GL · plain per-section CSS · Vitest · Playwright · axe-core

```
app/
  api/cart/          validate one cart change against live stock
  api/checkout/      re-price, detect stale quotes, verify payment, idempotent orders
  api/vitals/ vitals/  field INP intake and report
  shop/ cart/ order/ account/ about/ contact/ not-found.tsx
  styles/            per-section CSS; base.css holds the design tokens
components/          cart, checkout, shop and homepage sections
lib/
  cart-state.ts pricing.ts wallet-machine.ts   pure, unit-tested logic
  cart.tsx account.ts wishlist.tsx             client state
  wallet/            real (viem, EIP-6963) and simulated wallet drivers
  home-sections.tsx  refs shared across homepage sections (no document.querySelector)
  hooks/             useDialog, useHeroPointer, useHeroReel, useIdleReady…
  server/            catalog view, demo cookie, Redis store, idempotency, on-chain checks
tests/unit/  tests/e2e/
```

</details>

## What I'd do next

- Watch the chain for payments instead of trusting the client to submit the hash, so an order still completes if the tab closes mid-confirmation.
- Alert when p75 INP on search or the stepper crosses 200ms, instead of checking `/vitals` by hand.
- Split the homepage into server components where the motion allows, to ship less client JavaScript.

<details>
<summary>Credits</summary>

Product and homepage photos are a mix of the project's own images and Unsplash photos (Unsplash License), by FLOUFFY, Brett Wharton, Pozva, Ethan Richardson, charlesdeluvio, Hayffield L, Jessica Bulling, Jordan Bigelow, Kobi Kadosh, Madalyn Cox, Ayla Verschueren, Dogfluence.com, Gabriella Louw, Mathew Coulton, 龙 赵, Jesper Brouwers, anotherxlife, Mollie Sivaram, Rafaëlla Waasdorp, Andy Powell, Mel Elías, Nahima Aparicio, Vlad D, Joe Caione, Chris Andrawes and Trac Vu. Hero videos are from Pexels (Pexels License) by Judas Isariot, Yaroslav Bilgovskiy, Dominik Gryzbon, K, My NATURE'AL life and Michał Robak. Map data © OpenStreetMap contributors, tiles by OpenFreeMap. The shop's address is made up, and pet-brand logos are fictional. CozyPaws is a demo store: no real payments are taken (wallet payments use testnet USDC).

</details>

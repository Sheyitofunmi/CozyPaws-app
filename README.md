# 🐾 CozyPaws — Everything Your Pets Love

CozyPaws is a playful, richly-animated **online pet store for dogs**, built with **Next.js 15 + React 19**. Toys, treats, cozy beds and everything a good dog could want — wrapped in a bold, tactile interface with buttery motion design, a working cart & checkout, and a searchable catalog.

> A design-forward demo store: the storefront, cart, search and checkout are fully interactive, but no real payments are processed and no email is sent.

---

## ✨ Highlights

- **Full storefront** — animated landing hero, product catalog, product detail pages, about, contact, and a cart/checkout flow.
- **Working cart** — add/remove items, quantity steppers, a slide-over drawer, and a live count badge. Persists across reloads and tabs via `localStorage` and a shared React context.
- **Real checkout plumbing** — the checkout form POSTs to a Next.js route handler that re-prices the order server-side from the catalog and returns an order confirmation.
- **Live search** — the header search sends you to `/shop?q=…`, which filters the catalog by name and category, with result counts and a friendly empty state.
- **One interaction language** — a unified "playful & bold" hover/active vocabulary across the whole site: links draw an orange underline, buttons lift and press, icon buttons pop, all respecting `prefers-reduced-motion`.
- **Motion design** — GSAP-powered scroll reveals, inertia-flung motion cards, a page-transition scribble, an elastic cursor bubble, a Ken Burns "Happy Dogs" reel, and a hover-wiggle system.

---

## 🗺️ Pages

| Route        | What's there                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `/`          | Landing page — CozyPaws hero, video hero, motion cards, dog reel, product categories, marquee, footer |
| `/shop`      | Product catalog with category-pill filters and search (`?q=` / `?category=`)                          |
| `/shop/[id]` | Product detail — gallery, rating, quantity picker, add-to-cart / buy-now, "you may also like"         |
| `/about`     | Brand story — stats, values, and the team (and their bosses)                                          |
| `/contact`   | Contact form (POSTs to `/api/contact`) with topic picker and validation                               |
| `/cart`      | Cart review + shipping form → checkout (POSTs to `/api/checkout`)                                     |

### API routes

- `POST /api/contact` — validates a message payload, returns a confirmation (no email sent).
- `POST /api/checkout` — validates shipping details, re-prices the cart from `lib/data.js`, applies free shipping over $50, returns a mock order ID.

---

## 🛠️ Tech Stack

- **Next.js 15** (App Router) & **React 19**
- **Plain, per-component CSS** imported through `app/globals.css` (no Tailwind — deliberately, to keep the hand-tuned animations intact)
- **GSAP** (+ ScrollTrigger, InertiaPlugin) for motion
- **Lenis** for smooth scrolling
- **next/font** — Inter + DM Serif Display

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) (this project is usually run on `3001`).

```bash
npm run build   # production build
npm run start   # serve the production build
```

### A note on the hero video

The landing page's video hero uses a standard HTML5 `<video>` element with the `src` left blank (rendering a solid dark background). Drop your own `.mp4` in `public/` and set the source in `components/VimeoHero.jsx`.

---

## 📁 Project Structure

```
app/
  layout.jsx            Root layout — fonts, <CartProvider>, shared <CartDrawer>
  page.jsx              Landing page
  icon.svg              Paw favicon
  shop/                 /shop and /shop/[id]
  about/  contact/  cart/
  api/contact/  api/checkout/
  styles/               Per-section CSS (globals.css imports them in order)
components/
  CozyHero, VimeoHero, MotionCards, Showreel, ServiceCards, DoubleMarquee, Footer …
  SiteHeader, SiteFooter, CartDrawer, ShopPage, ProductDetail, AboutPage, ContactPage, CartPage
  icons.jsx             Shared inline icons
lib/
  data.js               Products, categories, brands, socials
  cart.js               Cart context (items + drawer state, localStorage)
  useScrollReveal.js    GSAP reveal hook for [data-reveal] elements
public/assets/          Dog photos, brand SVGs, cursors, stickers
```

---

## 🎨 Interaction & Motion Details

- **Unified hovers** (`app/styles/interactions.css`) — text links draw an orange underline from the left; the active nav item keeps it; buttons lift with a soft shadow and press on `:active`; round icon buttons pop with a slight rotate. All motion is disabled under reduced-motion (color feedback stays).
- **Scroll reveals** (`lib/useScrollReveal.js`) — any element tagged `data-reveal` fades/slides in as it enters the viewport, with optional `data-reveal-delay`.
- **Motion cards** — track mouse velocity and fling with physics-based inertia on `mouseleave`, then snap back.
- **Page-transition scribble** — a full-screen GSAP mask that draws/undraws on logo click, then scrolls to top.
- **Elastic service cards**, **infinite double marquee** (no adjacent duplicate logos/colors), **custom cursor bubble**, and a **footer sticker proximity push**.

---

## 🖼️ Assets & Credits

Product and lifestyle photography is a mix of the project's own images in `public/assets/pets/` and a handful of hot-linked [Unsplash](https://unsplash.com) photos. Pet-brand logos in the marquee are fictional. CozyPaws is a demo project, not a real store.
# CozyPaws

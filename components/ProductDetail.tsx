"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORY_ACCENT, PRODUCTS } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import type { Category, Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useScrollReveal } from "@/lib/useScrollReveal";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  IconPlus,
  IconMinus,
  IconStar,
  IconArrowUpRight,
  IconTruck,
  IconHeart,
  IconShield,
} from "@/components/icons";

const CATEGORY_COPY: Record<Category, { blurb: string; features: string[] }> = {
  "food & treats": {
    blurb:
      "Wholesome, vet-approved nutrition your dog will do zoomies for. Made in small batches with real ingredients — nothing artificial, ever.",
    features: [
      "Real, human-grade ingredients",
      "No fillers, dyes or nasties",
      "Loved by picky eaters",
    ],
  },
  "toys & play": {
    blurb:
      "Built for the roughest games of tug and the longest afternoons of fetch. Tough, bouncy and endlessly re-squeakable.",
    features: [
      "Chew-tested by real power chewers",
      "Non-toxic, pet-safe materials",
      "Keeps busy brains happy",
    ],
  },
  "comfy beds": {
    blurb:
      "The coziest spot in the house. Orthopedic support and cloud-soft cushioning for dreamy naps and happy joints.",
    features: [
      "Supportive memory-foam base",
      "Machine-washable cover",
      "Cozy, den-like comfort",
    ],
  },
  "walk & travel": {
    blurb:
      "Adventure-ready gear that keeps tails wagging on every trail. Comfortable, secure and made to go the distance.",
    features: [
      "Padded, no-chafe fit",
      "Weatherproof and durable",
      "Easy on, easy off",
    ],
  },
  "grooming & care": {
    blurb:
      "Spa-day essentials that keep your best friend clean, fresh and cuddle-ready — gentle on skin, tough on tangles.",
    features: [
      "Gentle, natural formulas",
      "Vet & groomer recommended",
      "Kind to sensitive skin",
    ],
  },
};

const TRUST = [
  { icon: IconTruck, label: "Free delivery over $50" },
  { icon: IconHeart, label: "Picked by dog people" },
  { icon: IconShield, label: "30-day easy returns" },
];


export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, openCart, items } = useCart();
  const { has: isSaved, toggle: toggleSaved } = useWishlist();
  const [qty, setQty] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef);

  const saved = isSaved(product.id);

  const accent = CATEGORY_ACCENT[product.category];
  const copy = CATEGORY_COPY[product.category];
  const inCart = items.find((line) => line.id === product.id)?.qty ?? 0;
  // You can't pick more than the warehouse can still send you.
  const maxQty = Math.max(0, product.stock - inCart);
  const soldOutForYou = maxQty === 0;

  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  )
    .concat(PRODUCTS.filter((p) => p.category !== product.category))
    .slice(0, 4);

  const addToCart = () => {
    addItem(product.id, qty);
    setQty(1);
    openCart();
  };

  const buyNow = () => {
    addItem(product.id, qty);
    router.push("/cart");
  };

  return (
    <div className="cozy-page product-page" style={{ "--accent": accent } as CSSProperties} ref={pageRef}>
      <SiteHeader />

      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <span className="is-current">{product.name}</span>
      </nav>

      <section className="product-main">
        <div className="product-gallery" data-reveal>
          <span className="product-gallery__blob" aria-hidden="true" />
          <img src={product.img} alt={product.name} width={800} height={800} fetchPriority="high" />
          {product.badge && (
            <span className="product-gallery__badge">{product.badge}</span>
          )}
        </div>

        <div className="product-info" data-reveal data-reveal-delay="0.1">
          <span className="product-info__category">{product.category}</span>
          <h1 className="product-info__name">{product.name}</h1>

          <p className="product-info__price">{formatPrice(product.priceCents)}</p>
          <p className="product-info__blurb">{copy.blurb}</p>

          {copy.features.length > 0 && (
            <ul className="product-info__features">
              {copy.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}

          <div className="product-info__buy">
            <div className="product-qty" role="group" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <IconMinus />
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              >
                <IconPlus />
              </button>
            </div>
            <button
              type="button"
              className="cozy-btn-orange product-add"
              onClick={addToCart}
              disabled={soldOutForYou}
            >
              {soldOutForYou
                ? "all available stock is in your cart"
                : `add to cart · ${formatPrice(product.priceCents * qty)}`}
            </button>
            <button type="button" className="product-buy-now" onClick={buyNow} disabled={soldOutForYou}>
              buy now
            </button>
            <button
              className={`product-fav ${saved ? "is-saved" : ""}`}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={saved}
              onClick={() => toggleSaved(product.id)}
            >
              <IconStar fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          {product.stock <= 5 && (
            <p className="product-info__stock">
              Only {product.stock} left{inCart > 0 ? ` · ${inCart} in your cart` : ""}
            </p>
          )}

          <ul className="product-trust">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="product-related">
        <h2 className="product-related__title" data-reveal>
          you may also like
        </h2>
        <div className="product-related__grid">
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/shop/${item.id}`}
              className="related-card"
              data-reveal
              style={{ "--accent": CATEGORY_ACCENT[item.category] } as CSSProperties}
            >
              <div className="related-card__img">
                <img src={item.img} alt="" width={800} height={800} loading="lazy" />
                <span className="related-card__view">
                  <IconArrowUpRight />
                </span>
              </div>
              <p className="related-card__name">{item.name}</p>
              <p className="related-card__price">{formatPrice(item.priceCents)}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

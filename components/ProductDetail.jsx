"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS } from "@/lib/data";
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

const CATEGORY_ACCENT = {
  "food & treats": "var(--color-green)",
  "toys & play": "var(--color-darkblue)",
  "comfy beds": "var(--color-orange)",
  "walk & travel": "var(--color-maroon)",
  "grooming & care": "var(--color-pink)",
};

const CATEGORY_COPY = {
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
  { icon: IconHeart, label: "10,000+ happy dogs" },
  { icon: IconShield, label: "30-day easy returns" },
];

const formatPrice = (price) => `$${price.toFixed(2)}`;

export default function ProductDetail({ product }) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { has: isSaved, toggle: toggleSaved } = useWishlist();
  const [qty, setQty] = useState(1);
  useScrollReveal();

  const saved = isSaved(product.id);

  const accent = CATEGORY_ACCENT[product.category] || "var(--color-orange)";
  const copy = CATEGORY_COPY[product.category] || {
    blurb: "A CozyPaws favorite your dog will love.",
    features: [],
  };

  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  )
    .concat(PRODUCTS.filter((p) => p.category !== product.category))
    .slice(0, 4);

  const addToCart = () => {
    addItem(product.id, qty);
    openCart();
  };

  const buyNow = () => {
    addItem(product.id, qty);
    router.push("/cart");
  };

  return (
    <div className="cozy-page product-page" style={{ "--accent": accent }}>
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
          <img src={product.img} alt={product.name} />
          {product.badge && (
            <span className="product-gallery__badge">{product.badge}</span>
          )}
        </div>

        <div className="product-info" data-reveal data-reveal-delay="0.1">
          <span className="product-info__category">{product.category}</span>
          <h1 className="product-info__name">{product.name}</h1>

          <div className="product-info__rating">
            <span className="product-info__stars" aria-hidden="true">
              <IconStar />
              <IconStar />
              <IconStar />
              <IconStar />
              <IconStar />
            </span>
            <span>4.8 · 214 reviews</span>
          </div>

          <p className="product-info__price">{formatPrice(product.price)}</p>
          <p className="product-info__blurb">{copy.blurb}</p>

          {copy.features.length > 0 && (
            <ul className="product-info__features">
              {copy.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}

          <div className="product-info__buy">
            <div className="product-qty" aria-label="Quantity">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <IconMinus />
              </button>
              <span>{qty}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                <IconPlus />
              </button>
            </div>
            <button className="cozy-btn-orange product-add" onClick={addToCart}>
              add to cart · {formatPrice(product.price * qty)}
            </button>
            <button className="product-buy-now" onClick={buyNow}>
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
              style={{ "--accent": CATEGORY_ACCENT[item.category] }}
            >
              <div className="related-card__img">
                <img src={item.img} alt={item.name} loading="lazy" />
                <span className="related-card__view">
                  <IconArrowUpRight />
                </span>
              </div>
              <p className="related-card__name">{item.name}</p>
              <p className="related-card__price">{formatPrice(item.price)}</p>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

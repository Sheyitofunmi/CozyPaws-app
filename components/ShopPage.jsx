"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CARDS_DATA, PRODUCTS } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useScrollReveal } from "@/lib/useScrollReveal";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IconPlus, IconArrowUpRight, IconStar } from "@/components/icons";

const CATEGORIES = ["all", ...CARDS_DATA.map((card) => card.title)];

const CATEGORY_ACCENT = {
  "food & treats": "var(--color-green)",
  "toys & play": "var(--color-darkblue)",
  "comfy beds": "var(--color-orange)",
  "walk & travel": "var(--color-maroon)",
  "grooming & care": "var(--color-pink)",
};

const formatPrice = (price) => `$${price.toFixed(2)}`;

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : "all",
  );
  const { addItem, openCart } = useCart();
  const { has: isSaved, toggle: toggleSaved } = useWishlist();
  const query = (searchParams.get("q") || "").trim();
  useScrollReveal([activeCategory, query]);

  const visibleProducts = useMemo(() => {
    let list =
      activeCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((product) => product.category === activeCategory);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCategory, query]);

  const handleAdd = (id) => {
    addItem(id);
    openCart();
  };

  return (
    <div className="shop-page cozy-page">
      <SiteHeader />

      <section className="shop-hero">
        <span
          className="shop-hero__blob shop-hero__blob--1"
          aria-hidden="true"
        />
        <span
          className="shop-hero__blob shop-hero__blob--2"
          aria-hidden="true"
        />
        <img
          src="/assets/pets/paw-sticker.svg"
          alt=""
          aria-hidden="true"
          className="shop-hero__paw cozy-scale-in cozy-delay-300"
        />
        <span className="shop-hero__eyebrow cozy-fade-up cozy-delay-100">
          🐾 the good stuff
        </span>
        <h1 className="shop-hero__title cozy-fade-up cozy-delay-200">
          Everything Your Dog Loves
        </h1>
        <p className="shop-hero__subtitle cozy-fade-up cozy-delay-300">
          Toys, treats, cozy beds and more — picked by dogs, approved by humans.
        </p>
      </section>

      <nav
        className="shop-filters cozy-fade-up cozy-delay-400"
        aria-label="Product categories"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`shop-filter-pill ${
              category === activeCategory ? "is-active" : ""
            }`}
            style={
              category === activeCategory && CATEGORY_ACCENT[category]
                ? {
                    background: CATEGORY_ACCENT[category],
                    borderColor: CATEGORY_ACCENT[category],
                  }
                : undefined
            }
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      {query && (
        <div className="shop-search-status">
          <p>
            {visibleProducts.length} result
            {visibleProducts.length === 1 ? "" : "s"} for{" "}
            <strong>“{query}”</strong>
          </p>
          <Link href="/shop" className="shop-search-clear">
            clear search
          </Link>
        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="shop-empty">
          <img src="/assets/pets/paw-sticker.svg" alt="" aria-hidden="true" />
          <h2>No products found</h2>
          <p>
            We couldn&apos;t sniff out anything for that search. Try another
            term or browse everything.
          </p>
          <Link href="/shop" className="cozy-btn-orange">
            browse all products
          </Link>
        </div>
      ) : (
        <section className="shop-grid" aria-label="Products">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="shop-card"
              data-reveal
              style={{ "--accent": CATEGORY_ACCENT[product.category] }}
            >
              <Link
                href={`/shop/${product.id}`}
                className="shop-card__img-wrap"
                aria-label={product.name}
              >
                <img src={product.img} alt={product.name} loading="lazy" />
                {product.badge && (
                  <span className="shop-card__badge">{product.badge}</span>
                )}
                <span className="shop-card__view">
                  <IconArrowUpRight />
                </span>
              </Link>
              <button
                className={`shop-card__fav ${isSaved(product.id) ? "is-saved" : ""}`}
                aria-label={
                  isSaved(product.id)
                    ? `Remove ${product.name} from wishlist`
                    : `Save ${product.name} to wishlist`
                }
                aria-pressed={isSaved(product.id)}
                onClick={() => toggleSaved(product.id)}
              >
                <IconStar
                  fill={isSaved(product.id) ? "currentColor" : "none"}
                />
              </button>
              <div className="shop-card__info">
                <div>
                  <Link
                    href={`/shop/${product.id}`}
                    className="shop-card__name"
                  >
                    {product.name}
                  </Link>
                  <p className="shop-card__category">{product.category}</p>
                </div>
                <p className="shop-card__price">{formatPrice(product.price)}</p>
              </div>
              <button
                className="shop-card__add"
                onClick={() => handleAdd(product.id)}
              >
                <IconPlus className="shop-card__add-icon" /> add to cart
              </button>
            </article>
          ))}
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

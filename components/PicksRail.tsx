"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { CATEGORY_ACCENT, getProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import SmartImage from "@/components/SmartImage";
import { IconArrowRight } from "@/components/icons";

// Biscuit's current favourites, each with a one-line reason in his voice.
const PICKS: { id: string; note: string }[] = [
  { id: "rope-tug-bundle", note: "3 weeks of tug and still in one piece" },
  { id: "peanut-butter-bites", note: "full tail-helicopter, every time" },
  { id: "puzzle-feeder-pro", note: "finally, a dinner that fights back" },
  { id: "cloud-nine-bed", note: "won't get out of it" },
  { id: "fetch-ball-trio", note: "one for the park, two for the sofa" },
  { id: "adventure-harness", note: "no more pulling (mostly)" },
];

/** Homepage product rail: real products, one tap to add. */
export default function PicksRail() {
  const { addItem, openCart, items } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  return (
    <section className="picks" aria-labelledby="picks-title">
      <div className="picks__head">
        <h2 id="picks-title" className="story-title story-title--section">
          biscuit&apos;s <em>picks</em>
        </h2>
        <Link href="/shop?sort=popular" className="picks__all">
          shop everything <IconArrowRight />
        </Link>
      </div>
      <ul className="picks__rail" aria-label="Biscuit's picks">
        {PICKS.map(({ id, note }) => {
          const product = getProduct(id);
          if (!product) return null;
          const inCart = items.find((l) => l.id === id)?.qty ?? 0;
          const added = justAdded === id;
          return (
            <li
              key={id}
              className="pick"
              style={{ "--accent": CATEGORY_ACCENT[product.category] } as CSSProperties}
            >
              <Link href={`/shop/${id}`} className="pick__img img-slot" tabIndex={-1} aria-hidden="true">
                <SmartImage src={product.img} alt="" width={800} height={800} loading="lazy" sizes="300px" />
              </Link>
              <div className="pick__body">
                <Link href={`/shop/${id}`} className="pick__name">
                  {product.name}
                </Link>
                <span className="pick__price">{formatPrice(product.priceCents)}</span>
                <p className="pick__note">“{note}”</p>
                <button
                  type="button"
                  className="pick__add"
                  data-added={added || undefined}
                  disabled={inCart >= product.stock}
                  onClick={() => {
                    addItem(id);
                    setJustAdded(id);
                    window.setTimeout(() => setJustAdded((cur) => (cur === id ? null : cur)), 1600);
                    openCart();
                  }}
                >
                  {added ? "added ✓" : inCart > 0 ? `add another (${inCart} in cart)` : "add to cart"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

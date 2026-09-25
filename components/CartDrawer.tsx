"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getProduct, PRODUCTS } from "@/lib/catalog";
import { useDialog } from "@/lib/hooks/useDialog";
import { formatPrice } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import CartLineItem from "@/components/CartLineItem";
import { IconClose, IconPlus } from "@/components/icons";

export default function CartDrawer() {
  const { items, isOpen, closeCart, addItem, lastAdded } = useCart();

  // Highlight the row that was just added, then let it settle.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  useEffect(() => {
    if (!lastAdded) return;
    setHighlightId(lastAdded.id);
    const timer = window.setTimeout(() => setHighlightId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);
  const dialogRef = useRef<HTMLElement>(null);
  useDialog(dialogRef, isOpen, closeCart);

  const lines = items.flatMap(({ id, qty }) => {
    const product = getProduct(id);
    return product ? [{ product, qty }] : [];
  });
  const subtotalCents = lines.reduce((sum, l) => sum + l.product.priceCents * l.qty, 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const progress = Math.min(1, subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS);

  // "pairs well with": two in-stock items not in the cart, same category first.
  // Fills the empty drawer with something useful instead of whitespace.
  const inCart = new Set(items.map((i) => i.id));
  const anchor = lines[lines.length - 1]?.product;
  const suggestions = PRODUCTS.filter((p) => !inCart.has(p.id) && p.stock > 0)
    .sort((a, b) => Number(b.category === anchor?.category) - Number(a.category === anchor?.category))
    .slice(0, 2);

  return (
    <div className="drawer-root">
      <div
        className={`shop-cart-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        ref={dialogRef}
        className={`shop-cart ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        inert={!isOpen}
      >
        <div className="shop-cart__head">
          <h2 id="cart-drawer-title" className="shop-cart__title">
            your cart
          </h2>
          <button type="button" className="cozy-icon-btn" aria-label="Close cart" onClick={closeCart}>
            <IconClose className="cozy-icon" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="shop-cart__empty">
            <img src="/assets/pets/paw-sticker.svg" alt="" aria-hidden="true" />
            <p>Your cart is feeling a little lonely.</p>
            <Link href="/shop" className="cozy-btn-orange" onClick={closeCart}>
              start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="shop-cart__ship" aria-live="polite">
              <p>
                {remaining > 0
                  ? `${formatPrice(remaining)} away from free delivery`
                  : "You've unlocked free delivery 🎉"}
              </p>
              <div className="shop-cart__ship-bar" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>
            <ul className="shop-cart__list">
              {lines.map(({ product, qty }) => (
                <CartLineItem
                  key={product.id}
                  product={product}
                  qty={qty}
                  variant="drawer"
                  highlight={highlightId === product.id}
                />
              ))}
            </ul>
            {suggestions.length > 0 && (
              <section className="cart-suggest" aria-labelledby="cart-suggest-title">
                <h3 id="cart-suggest-title" className="cart-suggest__title">
                  pairs well with
                </h3>
                <ul>
                  {suggestions.map((p) => (
                    <li key={p.id} className="cart-suggest__item">
                      <img src={p.img} alt="" width={48} height={48} />
                      <div>
                        <Link href={`/shop/${p.id}`} onClick={closeCart} className="cart-suggest__name">
                          {p.name}
                        </Link>
                        <p className="cart-suggest__price">{formatPrice(p.priceCents)}</p>
                      </div>
                      <button
                        type="button"
                        className="cozy-icon-btn cart-suggest__add"
                        aria-label={`Add ${p.name} to cart`}
                        onClick={() => addItem(p.id)}
                      >
                        <IconPlus />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="shop-cart__foot">
              <div className="shop-cart__subtotal">
                <span>subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <Link href="/cart" className="cozy-btn-orange shop-cart__checkout" onClick={closeCart}>
                go to checkout
              </Link>
              <button type="button" className="shop-cart__keep" onClick={closeCart}>
                keep shopping
              </button>
              <p className="shop-cart__note">demo store: no real dogs will be charged.</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

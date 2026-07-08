"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { IconPlus, IconMinus, IconClose } from "@/components/icons";

const formatPrice = (price) => `$${price.toFixed(2)}`;

export default function CartDrawer() {
  const { items, setQty, removeItem, isOpen, closeCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const lines = items
    .map(({ id, qty }) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <>
      <div
        className={`shop-cart-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={closeCart}
      />
      <aside
        className={`shop-cart ${isOpen ? "is-open" : ""}`}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="shop-cart__head">
          <h2 className="shop-cart__title">your cart</h2>
          <button
            className="cozy-icon-btn"
            aria-label="Close cart"
            onClick={closeCart}
          >
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
            <ul className="shop-cart__list">
              {lines.map((line) => (
                <li key={line.id} className="shop-cart__line">
                  <img src={line.img} alt={line.name} />
                  <div className="shop-cart__line-info">
                    <p className="shop-cart__line-name">{line.name}</p>
                    <p className="shop-cart__line-price">
                      {formatPrice(line.price)}
                    </p>
                    <div className="shop-cart__qty">
                      <button
                        aria-label={`Decrease quantity of ${line.name}`}
                        onClick={() => setQty(line.id, line.qty - 1)}
                      >
                        <IconMinus />
                      </button>
                      <span>{line.qty}</span>
                      <button
                        aria-label={`Increase quantity of ${line.name}`}
                        onClick={() => setQty(line.id, line.qty + 1)}
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                  <button
                    className="shop-cart__remove"
                    aria-label={`Remove ${line.name}`}
                    onClick={() => removeItem(line.id)}
                  >
                    <IconClose />
                  </button>
                </li>
              ))}
            </ul>
            <div className="shop-cart__foot">
              <div className="shop-cart__subtotal">
                <span>subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/cart"
                className="cozy-btn-orange shop-cart__checkout"
                onClick={closeCart}
              >
                go to checkout
              </Link>
              <p className="shop-cart__note">
                demo store — no real dogs will be charged.
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

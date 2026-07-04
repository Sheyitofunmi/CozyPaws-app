"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { IconClose, IconStar, IconPlus } from "@/components/icons";

const formatPrice = (price) => `$${price.toFixed(2)}`;

export default function WishlistDrawer() {
  const { ids, remove, isOpen, closeWishlist } = useWishlist();
  const { addItem, openCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && closeWishlist();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeWishlist]);

  const items = ids
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  const moveToCart = (id) => {
    addItem(id);
    remove(id);
    closeWishlist();
    openCart();
  };

  return (
    <>
      <div
        className={`shop-cart-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={closeWishlist}
      />
      <aside
        className={`shop-cart ${isOpen ? "is-open" : ""}`}
        aria-label="Wishlist"
        aria-hidden={!isOpen}
      >
        <div className="shop-cart__head">
          <h2 className="shop-cart__title">your wishlist</h2>
          <button
            className="cozy-icon-btn"
            aria-label="Close wishlist"
            onClick={closeWishlist}
          >
            <IconClose className="cozy-icon" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="shop-cart__empty">
            <IconStar className="wl-empty-star" />
            <p>No favorites yet — tap the star on a product to save it.</p>
            <Link
              href="/shop"
              className="cozy-btn-orange"
              onClick={closeWishlist}
            >
              browse products
            </Link>
          </div>
        ) : (
          <ul className="shop-cart__list">
            {items.map((item) => (
              <li key={item.id} className="shop-cart__line">
                <Link
                  href={`/shop/${item.id}`}
                  onClick={closeWishlist}
                  aria-label={item.name}
                >
                  <img src={item.img} alt={item.name} />
                </Link>
                <div className="shop-cart__line-info">
                  <Link
                    href={`/shop/${item.id}`}
                    className="shop-cart__line-name"
                    onClick={closeWishlist}
                  >
                    {item.name}
                  </Link>
                  <p className="shop-cart__line-price">
                    {formatPrice(item.price)}
                  </p>
                  <button
                    className="wl-move-btn"
                    onClick={() => moveToCart(item.id)}
                  >
                    <IconPlus /> add to cart
                  </button>
                </div>
                <button
                  className="shop-cart__remove"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.id)}
                >
                  <IconClose />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </>
  );
}

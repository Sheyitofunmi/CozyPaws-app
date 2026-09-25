"use client";

import { useEffect, useRef } from "react";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useDelayedFlag } from "@/lib/hooks/useDelayedFlag";
import { formatPrice } from "@/lib/money";
import type { Product } from "@/lib/types";
import { IconClose, IconMinus, IconPlus } from "@/components/icons";

interface Props {
  product: Product;
  qty: number;
  variant: "drawer" | "page";
  /** Server-quoted unit price, when it differs from the catalog. */
  unitCents?: number;
  onNavigate?: () => void;
  /** Briefly highlight this row (it was just added). */
  highlight?: boolean;
}

/** One cart row, shared by the drawer and the cart page. */
export default function CartLineItem({ product, qty, variant, unitCents, onNavigate, highlight }: Props) {
  const rowRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (highlight) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlight]);
  const unit = unitCents ?? product.priceCents;
  const { setQty, removeItem, isPending } = useCart();
  // Only show "saving" if the server is slow: no flicker on fast networks.
  const showPending = useDelayedFlag(isPending(product.id), 300);
  const atStock = qty >= product.stock;

  const stepper = (
    <div className="shop-cart__qty" data-pending={showPending || undefined}>
      <button
        type="button"
        aria-label={`Decrease quantity of ${product.name}`}
        onClick={() => setQty(product.id, qty - 1)}
      >
        <IconMinus />
      </button>
      <span>{qty}</span>
      <button
        type="button"
        aria-label={`Increase quantity of ${product.name}`}
        disabled={atStock}
        onClick={() => setQty(product.id, qty + 1)}
      >
        <IconPlus />
      </button>
    </div>
  );

  const status = showPending ? (
    <span className="cart-line__status" role="status">saving…</span>
  ) : atStock ? (
    <span className="cart-line__status">max available</span>
  ) : null;

  if (variant === "drawer") {
    return (
      <li
        ref={rowRef}
        className="shop-cart__line"
        data-pending={showPending || undefined}
        data-just-added={highlight || undefined}
      >
        <img src={product.img} alt="" />
        <div className="shop-cart__line-info">
          <p className="shop-cart__line-name">{product.name}</p>
          <p className="shop-cart__line-price">{formatPrice(unit)}</p>
          <div className="cart-line__controls">
            {stepper}
            {status}
          </div>
        </div>
        <button
          type="button"
          className="shop-cart__remove"
          aria-label={`Remove ${product.name}`}
          onClick={() => removeItem(product.id)}
        >
          <IconClose />
        </button>
      </li>
    );
  }

  return (
    <li className="cart-line" data-pending={showPending || undefined}>
      <Link href={`/shop/${product.id}`} className="cart-line__img" onClick={onNavigate} tabIndex={-1}>
        <img src={product.img} alt="" />
      </Link>
      <div className="cart-line__body">
        <div className="cart-line__top">
          <div>
            <Link href={`/shop/${product.id}`} className="cart-line__name">
              {product.name}
            </Link>
            <p className="cart-line__category">{product.category}</p>
          </div>
          <button
            type="button"
            className="cart-line__remove"
            aria-label={`Remove ${product.name}`}
            onClick={() => removeItem(product.id)}
          >
            <IconClose />
          </button>
        </div>
        <div className="cart-line__bottom">
          <div className="cart-line__controls">
            {stepper}
            {status}
          </div>
          <p className="cart-line__price">{formatPrice(unit * qty)}</p>
        </div>
      </div>
    </li>
  );
}

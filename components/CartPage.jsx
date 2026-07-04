"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data";
import { useCart } from "@/lib/cart";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  IconPlus,
  IconMinus,
  IconClose,
  IconCheck,
  IconArrowRight,
  IconTruck,
} from "@/components/icons";

const SHIPPING = 4.99;
const FREE_SHIPPING_THRESHOLD = 50;
const formatPrice = (price) => `$${price.toFixed(2)}`;

const FIELDS = [
  { name: "name", label: "Full name", placeholder: "Jane Doe", span: 2 },
  { name: "email", label: "Email", placeholder: "you@example.com", span: 2 },
  { name: "address", label: "Address", placeholder: "Papaverhof 21", span: 2 },
  { name: "city", label: "City", placeholder: "Amsterdam", span: 1 },
  { name: "zip", label: "Postal code", placeholder: "1032 LX", span: 1 },
];

export default function CartPage() {
  const { items, setQty, removeItem, clearCart } = useCart();
  const [status, setStatus] = useState("idle"); // idle | placing | done
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState(null);

  const lines = items
    .map(({ id, qty }) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return product ? { ...product, qty } : null;
    })
    .filter(Boolean);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING;
  const total = subtotal + shipping;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const placeOrder = async (e) => {
    e.preventDefault();
    setStatus("placing");
    setErrors({});

    const form = e.currentTarget;
    const customer = Object.fromEntries(
      FIELDS.map(({ name }) => [name, form[name].value]),
    );

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: items.map(({ id, qty }) => ({ id, qty })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || { form: data.error || "Checkout failed." });
        setStatus("idle");
        return;
      }

      setOrder(data);
      setStatus("done");
      clearCart();
    } catch {
      setErrors({ form: "Network hiccup — please try again." });
      setStatus("idle");
    }
  };

  // ─── Order confirmation ───
  if (status === "done" && order) {
    return (
      <div className="cozy-page cart-page">
        <SiteHeader />
        <section className="cart-confirm">
          <span className="cart-confirm__check">
            <IconCheck />
          </span>
          <h1>Thank you! 🐾</h1>
          <p className="cart-confirm__msg">{order.message}</p>
          <div className="cart-confirm__summary">
            <div>
              <span>Order</span>
              <span>{order.orderId}</span>
            </div>
            <div>
              <span>Total paid</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          <Link href="/shop" className="cozy-btn-orange">
            keep shopping <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  // ─── Empty cart ───
  if (lines.length === 0) {
    return (
      <div className="cozy-page cart-page">
        <SiteHeader />
        <section className="cart-empty">
          <img src="/assets/pets/paw-sticker.svg" alt="" aria-hidden="true" />
          <h1>Your cart is empty</h1>
          <p>Let's find something your dog will love.</p>
          <Link href="/shop" className="cozy-btn-orange">
            start shopping <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="cozy-page cart-page">
      <SiteHeader />

      <section className="cart-main">
        <h1 className="cart-main__title">your cart</h1>

        <div className="cart-layout">
          {/* ─── Left: items + shipping ─── */}
          <div className="cart-left">
            <ul className="cart-lines">
              {lines.map((line) => (
                <li key={line.id} className="cart-line">
                  <Link href={`/shop/${line.id}`} className="cart-line__img">
                    <img src={line.img} alt={line.name} />
                  </Link>
                  <div className="cart-line__body">
                    <div className="cart-line__top">
                      <div>
                        <Link
                          href={`/shop/${line.id}`}
                          className="cart-line__name"
                        >
                          {line.name}
                        </Link>
                        <p className="cart-line__category">{line.category}</p>
                      </div>
                      <button
                        className="cart-line__remove"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => removeItem(line.id)}
                      >
                        <IconClose />
                      </button>
                    </div>
                    <div className="cart-line__bottom">
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
                      <p className="cart-line__price">
                        {formatPrice(line.price * line.qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form
              id="checkout-form"
              className="cart-shipping"
              onSubmit={placeOrder}
              noValidate
            >
              <h2 className="cart-shipping__title">shipping details</h2>
              <div className="cart-shipping__grid">
                {FIELDS.map(({ name, label, placeholder, span }) => (
                  <div
                    key={name}
                    className={`contact-field cart-field--span-${span}`}
                  >
                    <label htmlFor={`ck-${name}`}>{label}</label>
                    <input
                      id={`ck-${name}`}
                      name={name}
                      type={name === "email" ? "email" : "text"}
                      placeholder={placeholder}
                    />
                    {errors[name] && (
                      <span className="contact-error">{errors[name]}</span>
                    )}
                  </div>
                ))}
              </div>
              {errors.form && <p className="contact-error">{errors.form}</p>}
            </form>
          </div>

          {/* ─── Right: summary ─── */}
          <aside className="cart-summary">
            <h2 className="cart-summary__title">order summary</h2>

            {remainingForFree > 0 ? (
              <p className="cart-summary__ship-hint">
                <IconTruck />
                Add {formatPrice(remainingForFree)} more for free delivery
              </p>
            ) : (
              <p className="cart-summary__ship-hint is-free">
                <IconTruck />
                You've unlocked free delivery!
              </p>
            )}

            <div className="cart-summary__row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="cozy-btn-orange cart-summary__checkout"
              disabled={status === "placing"}
            >
              {status === "placing" ? "placing order…" : "place order"}
              <IconArrowRight className="cozy-btn-orange__icon" />
            </button>
            <p className="cart-summary__note">
              demo store — no real payment is taken.
            </p>
            <Link href="/shop" className="cart-summary__continue">
              ← continue shopping
            </Link>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

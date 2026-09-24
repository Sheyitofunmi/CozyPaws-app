"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { buildQuote, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import type {
  CartLine,
  CheckoutCustomer,
  CheckoutRequest,
  CheckoutResponse,
  LineChange,
  Quote,
} from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CartLineItem from "@/components/CartLineItem";
import { IconArrowRight, IconCheck, IconTruck } from "@/components/icons";

type FieldName = keyof CheckoutCustomer;
type FieldErrors = Partial<Record<FieldName | "items" | "form", string>>;

const FIELDS: { name: FieldName; label: string; placeholder: string; span: 1 | 2; autoComplete: string }[] = [
  { name: "name", label: "Full name", placeholder: "Jane Doe", span: 2, autoComplete: "name" },
  { name: "email", label: "Email", placeholder: "you@example.com", span: 2, autoComplete: "email" },
  { name: "address", label: "Address", placeholder: "12 Maple Street", span: 2, autoComplete: "street-address" },
  { name: "city", label: "City", placeholder: "London", span: 1, autoComplete: "address-level2" },
  { name: "zip", label: "Postal code", placeholder: "N1 7GU", span: 1, autoComplete: "postal-code" },
];

type Status = "idle" | "placing" | "review" | "done";

/** Stable signature of a quote, so a retry of the same order reuses its key. */
const signature = (q: Quote) =>
  q.lines.map((l) => `${l.id}:${l.qty}:${l.unitCents}`).join("|") + `=${q.totalCents}`;

const sameLines = (a: readonly CartLine[], b: readonly CartLine[]) =>
  a.length === b.length && a.every((l, i) => l.id === b[i]?.id && l.qty === b[i]?.qty);

function describeChange(change: LineChange): string {
  switch (change.kind) {
    case "price":
      return `${change.name}: ${formatPrice(change.fromCents)} → ${formatPrice(change.toCents)}`;
    case "qty":
      return `${change.name}: only ${change.toQty} available (you had ${change.fromQty})`;
    case "removed":
      return `${change.name}: no longer available, removed`;
  }
}

export default function CartPage() {
  const { items, hydrated, clearCart, replaceLines } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverQuote, setServerQuote] = useState<Quote | null>(null);
  const [changes, setChanges] = useState<LineChange[]>([]);
  const [order, setOrder] = useState<{ orderId: string; totalCents: number; message: string } | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const idempotency = useRef<{ sig: string; key: string } | null>(null);

  // The quote the customer is looking at. If the server has priced this exact
  // cart, show the server's numbers; otherwise the catalog's.
  const quote = useMemo<Quote>(() => {
    if (serverQuote && sameLines(serverQuote.lines, items)) return serverQuote;
    return buildQuote(items, getProduct);
  }, [items, serverQuote]);

  // Editing the cart after a review invalidates the review.
  useEffect(() => {
    if (status === "review" && serverQuote && !sameLines(serverQuote.lines, items)) {
      setStatus("idle");
      setChanges([]);
    }
  }, [items, serverQuote, status]);

  useEffect(() => {
    if (status === "review") reviewHeadingRef.current?.focus();
    if (status === "done") successHeadingRef.current?.focus();
  }, [status]);

  const unitFor = (id: string) => quote.lines.find((l) => l.id === id)?.unitCents;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - quote.subtotalCents);

  async function submitOrder(expected: Quote) {
    const form = formRef.current;
    if (!form || inFlight.current) return; // blocks double-clicks within the same frame
    inFlight.current = true;
    setStatus("placing");
    setErrors({});

    const data = new FormData(form);
    const customer = Object.fromEntries(
      FIELDS.map(({ name }) => [name, String(data.get(name) ?? "")]),
    ) as unknown as CheckoutCustomer;

    // Same order intent → same key, so a retry can never create a second order.
    const sig = signature(expected);
    if (idempotency.current?.sig !== sig) {
      idempotency.current = { sig, key: crypto.randomUUID() };
    }

    const body: CheckoutRequest = {
      customer,
      items: expected.lines.map(({ id, qty }) => ({ id, qty })),
      expected: { lines: expected.lines, totalCents: expected.totalCents },
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotency.current.key,
        },
        body: JSON.stringify(body),
      });
      const result = (await res.json()) as CheckoutResponse;

      if (result.ok) {
        setOrder({ orderId: result.orderId, totalCents: result.quote.totalCents, message: result.message });
        setStatus("done");
        clearCart();
        return;
      }

      switch (result.code) {
        case "validation": {
          setErrors(result.errors);
          setStatus("idle");
          // Move focus to the first problem so keyboard and screen-reader
          // users land exactly where they need to act.
          const firstInvalid = FIELDS.find(({ name }) => result.errors[name]);
          const field = firstInvalid && form.elements.namedItem(firstInvalid.name);
          if (field instanceof HTMLInputElement) field.focus();
          break;
        }
        case "quote_changed":
          setServerQuote(result.quote);
          setChanges(result.changes);
          replaceLines(result.quote.lines.map(({ id, qty }) => ({ id, qty })));
          setStatus("review");
          break;
        default:
          setErrors({ form: result.message });
          setStatus("idle");
      }
    } catch {
      setErrors({ form: "Network hiccup: your order wasn't placed. Please try again." });
      setStatus("idle");
    } finally {
      inFlight.current = false;
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitOrder(quote);
  };

  if (status === "done" && order) {
    return (
      <div className="cozy-page cart-page">
        <SiteHeader />
        <section className="cart-confirm" aria-labelledby="confirm-title">
          <span className="cart-confirm__check" aria-hidden="true">
            <IconCheck />
          </span>
          <h1 id="confirm-title" ref={successHeadingRef} tabIndex={-1}>
            Thank you! 🐾
          </h1>
          <p className="cart-confirm__msg">{order.message}</p>
          <div className="cart-confirm__summary">
            <div>
              <span>Order</span>
              <span>{order.orderId}</span>
            </div>
            <div>
              <span>Total paid</span>
              <span>{formatPrice(order.totalCents)}</span>
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

  if (hydrated && quote.lines.length === 0) {
    return (
      <div className="cozy-page cart-page">
        <SiteHeader />
        <section className="cart-empty">
          <img src="/assets/pets/paw-sticker.svg" alt="" aria-hidden="true" />
          <h1>Your cart is empty</h1>
          <p>Let&apos;s find something your dog will love.</p>
          <Link href="/shop" className="cozy-btn-orange">
            start shopping <IconArrowRight className="cozy-btn-orange__icon" />
          </Link>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const placing = status === "placing";

  return (
    <div className="cozy-page cart-page">
      <SiteHeader />

      <section className="cart-main" aria-busy={!hydrated}>
        <h1 className="cart-main__title">your cart</h1>

        <div className="cart-layout">
          <div className="cart-left">
            <ul className="cart-lines">
              {items.map(({ id, qty }) => {
                const product = getProduct(id);
                if (!product) return null;
                return (
                  <CartLineItem key={id} product={product} qty={qty} variant="page" unitCents={unitFor(id)} />
                );
              })}
            </ul>

            <form
              id="checkout-form"
              ref={formRef}
              className="cart-shipping"
              onSubmit={onSubmit}
              noValidate
              aria-labelledby="shipping-title"
            >
              <h2 id="shipping-title" className="cart-shipping__title">
                shipping details
              </h2>
              <div className="cart-shipping__grid">
                {FIELDS.map(({ name, label, placeholder, span, autoComplete }) => {
                  const error = errors[name];
                  return (
                    <div key={name} className={`contact-field cart-field--span-${span}`}>
                      <label htmlFor={`ck-${name}`}>{label}</label>
                      <input
                        id={`ck-${name}`}
                        name={name}
                        type={name === "email" ? "email" : "text"}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `ck-${name}-error` : undefined}
                      />
                      {error && (
                        <span id={`ck-${name}-error`} className="contact-error">
                          {error}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {(errors.form || errors.items) && (
                <p className="contact-error" role="alert">
                  {errors.form ?? errors.items}
                </p>
              )}
            </form>
          </div>

          <aside className="cart-summary" aria-labelledby="summary-title">
            <h2 id="summary-title" className="cart-summary__title">
              order summary
            </h2>

            <p className={`cart-summary__ship-hint ${remainingForFree === 0 ? "is-free" : ""}`}>
              <IconTruck />
              {remainingForFree > 0
                ? `Add ${formatPrice(remainingForFree)} more for free delivery`
                : "You've unlocked free delivery!"}
            </p>

            <div className="cart-summary__row">
              <span>Subtotal</span>
              <span>{formatPrice(quote.subtotalCents)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Shipping</span>
              <span>{quote.shippingCents === 0 ? "Free" : formatPrice(quote.shippingCents)}</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>{formatPrice(quote.totalCents)}</span>
            </div>

            {status === "review" ? (
              <div className="quote-review" role="region" aria-labelledby="review-title">
                <h3 id="review-title" ref={reviewHeadingRef} tabIndex={-1}>
                  Your total changed
                </h3>
                <p>Prices or stock moved while you were checking out. Nothing has been charged.</p>
                <ul>
                  {changes.map((c) => (
                    <li key={`${c.kind}-${c.id}`}>{describeChange(c)}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="cozy-btn-orange cart-summary__checkout"
                  onClick={() => void submitOrder(quote)}
                >
                  confirm new total · {formatPrice(quote.totalCents)}
                </button>
                <button
                  type="button"
                  className="quote-review__back"
                  onClick={() => {
                    setStatus("idle");
                    setChanges([]);
                  }}
                >
                  back to cart
                </button>
              </div>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                className="cozy-btn-orange cart-summary__checkout"
                disabled={placing || !hydrated}
                aria-disabled={placing || !hydrated}
              >
                {placing ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" /> placing order…
                  </>
                ) : (
                  <>
                    place order · {formatPrice(quote.totalCents)}
                    <IconArrowRight className="cozy-btn-orange__icon" />
                  </>
                )}
              </button>
            )}
            <p className="cart-summary__note">demo store: no real payment is taken.</p>
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

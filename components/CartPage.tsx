"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";
import { saveLastOrder } from "@/lib/last-order";
import { formatPrice } from "@/lib/money";
import { buildQuote, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { CUSTOMER_FIELDS, validateCustomer, validateField, type CustomerField } from "@/lib/validation";
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
import CheckoutSteps from "@/components/CheckoutSteps";
import { IconArrowRight, IconTruck } from "@/components/icons";

type FieldErrors = Partial<Record<CustomerField | "items" | "form", string>>;

interface FieldConfig {
  name: CustomerField;
  label: string;
  span: 1 | 2;
  autoComplete: string;
  inputMode?: "email" | "text";
  hint?: string;
}

// No example values as placeholders: grey "Jane Doe" text reads like a
// filled-in field and people skip it. Labels + a hint where it helps.
const FIELDS: FieldConfig[] = [
  { name: "name", label: "Full name", span: 2, autoComplete: "name" },
  {
    name: "email",
    label: "Email",
    span: 2,
    autoComplete: "email",
    inputMode: "email",
    hint: "for your receipt and tracking, nothing else",
  },
  { name: "address", label: "Address", span: 2, autoComplete: "street-address" },
  { name: "city", label: "City", span: 1, autoComplete: "address-level2" },
  { name: "zip", label: "Postal code", span: 1, autoComplete: "postal-code" },
];

type Status = "idle" | "placing" | "review";

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

const emptyCustomer: CheckoutCustomer = { name: "", email: "", address: "", city: "", zip: "" };

export default function CartPage() {
  const router = useRouter();
  const { items, hydrated, clearCart, replaceLines } = useCart();
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState<CheckoutCustomer>(emptyCustomer);
  const [touched, setTouched] = useState<Partial<Record<CustomerField, boolean>>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const [serverQuote, setServerQuote] = useState<Quote | null>(null);
  const [changes, setChanges] = useState<LineChange[]>([]);

  const formRef = useRef<HTMLFormElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const summaryButtonRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const idempotency = useRef<{ sig: string; key: string } | null>(null);
  const [summaryButtonVisible, setSummaryButtonVisible] = useState(true);

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
  }, [status]);

  // Mobile: the summary sits below the form, so a slim bar keeps
  // "place order" in reach until the real button scrolls into view.
  useEffect(() => {
    const target = summaryButtonRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setSummaryButtonVisible(entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hydrated, quote.lines.length]);

  const unitFor = (id: string) => quote.lines.find((l) => l.id === id)?.unitCents;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - quote.subtotalCents);

  /*
   * Validation timing ("reward early, punish late"):
   * - no errors while someone is still typing their first attempt,
   * - check a field when they leave it,
   * - once a field has been checked, re-check on every keystroke so the
   *   error disappears the moment it's fixed.
   */
  const onFieldChange = (field: CustomerField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  };

  const onFieldBlur = (field: CustomerField) => {
    if (!values[field]) return; // leaving an empty field untouched isn't an error yet
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, values[field]) }));
  };

  function focusField(field: CustomerField) {
    const el = formRef.current?.elements.namedItem(field);
    if (el instanceof HTMLInputElement) el.focus();
  }

  async function submitOrder(expected: Quote) {
    if (inFlight.current) return; // blocks double-clicks within the same frame

    // Check the form on the client first: no round trip to find a typo.
    const clientErrors = validateCustomer(values);
    const invalid = CUSTOMER_FIELDS.filter((f) => clientErrors[f]);
    if (invalid.length > 0) {
      setErrors(clientErrors);
      setTouched(Object.fromEntries(CUSTOMER_FIELDS.map((f) => [f, true])));
      setAnnouncement(`${invalid.length} field${invalid.length === 1 ? " needs" : "s need"} a look before we can place your order.`);
      focusField(invalid[0]!);
      return;
    }

    inFlight.current = true;
    setStatus("placing");
    setErrors({});
    setAnnouncement("");

    // Same order intent → same key, so a retry can never create a second order.
    const sig = signature(expected);
    if (idempotency.current?.sig !== sig) {
      idempotency.current = { sig, key: crypto.randomUUID() };
    }

    const body: CheckoutRequest = {
      customer: values,
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
        saveLastOrder({
          orderId: result.orderId,
          placedAt: new Date().toISOString(),
          quote: result.quote,
          customer: values,
        });
        clearCart();
        // replace(), not push(): "back" from the receipt shouldn't land on a checkout form.
        router.replace("/order/confirmed");
        return;
      }

      switch (result.code) {
        case "validation": {
          setErrors(result.errors);
          setStatus("idle");
          const first = CUSTOMER_FIELDS.find((f) => result.errors[f]);
          if (first) focusField(first);
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
  const itemCount = quote.lines.reduce((n, l) => n + l.qty, 0);

  return (
    <div className="cozy-page cart-page">
      <SiteHeader />

      <section className="cart-main" aria-busy={!hydrated}>
        <h1 className="cart-main__title">checkout</h1>
        <CheckoutSteps current="details" />

        <div className="cart-layout">
          <div className="cart-left">
            <h2 className="cart-left__title">
              your cart <span>· {itemCount} item{itemCount === 1 ? "" : "s"}</span>
            </h2>
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
                where should we send it?
              </h2>
              <p className="visually-hidden" role="status" aria-live="polite">
                {announcement}
              </p>
              <div className="cart-shipping__grid">
                {FIELDS.map(({ name, label, span, autoComplete, inputMode, hint }) => {
                  const error = errors[name];
                  const valid = touched[name] && !error && values[name].length > 0;
                  const describedBy = [hint && `ck-${name}-hint`, error && `ck-${name}-error`]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div
                      key={name}
                      className={`contact-field cart-field--span-${span}`}
                      data-valid={valid || undefined}
                    >
                      <label htmlFor={`ck-${name}`}>{label}</label>
                      <input
                        id={`ck-${name}`}
                        name={name}
                        type={name === "email" ? "email" : "text"}
                        inputMode={inputMode}
                        autoComplete={autoComplete}
                        autoCapitalize={name === "email" ? "none" : undefined}
                        spellCheck={name === "email" ? false : undefined}
                        enterKeyHint={name === "zip" ? "done" : "next"}
                        value={values[name]}
                        onChange={(e) => onFieldChange(name, e.target.value)}
                        onBlur={() => onFieldBlur(name)}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy || undefined}
                      />
                      {hint && !error && (
                        <span id={`ck-${name}-hint`} className="cart-field__hint">
                          {hint}
                        </span>
                      )}
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
                <p className="contact-error cart-form-error" role="alert">
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

            <div ref={summaryButtonRef}>
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
            </div>
            <p className="cart-summary__note">demo store: no real payment is taken.</p>
            <Link href="/shop" className="cart-summary__continue">
              ← continue shopping
            </Link>
          </aside>
        </div>
      </section>

      {/* Mobile-only sticky bar. Hidden from assistive tech: it duplicates the summary button. */}
      <div
        className="checkout-sticky"
        data-visible={(!summaryButtonVisible && status !== "review") || undefined}
        aria-hidden="true"
        inert={summaryButtonVisible || status === "review"}
      >
        <div className="checkout-sticky__total">
          <span>total</span>
          <strong>{formatPrice(quote.totalCents)}</strong>
        </div>
        <button
          type="submit"
          form="checkout-form"
          tabIndex={-1}
          className="cozy-btn-orange checkout-sticky__btn"
          disabled={placing || !hydrated}
        >
          {placing ? "placing…" : "place order"}
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}

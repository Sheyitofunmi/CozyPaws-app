"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { formatPrice } from "@/lib/money";
import { initials, signIn, signOut, useAccount } from "@/lib/account";
import { useWishlist } from "@/lib/wishlist";
import { IconArrowRight } from "@/components/icons";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AccountPage() {
  const { account, orders } = useAccount();
  const { count: wishlistCount, openWishlist } = useWishlist();
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [errors]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Tell us what to call you.";
    if (!isEmail(email)) next.email = "That email doesn't look right.";
    setErrors(next);
    if (Object.keys(next).length === 0) signIn(name, email);
  };

  return (
    <div className="cozy-page account-page">
      <SiteHeader />

      <section className="account-hero">
        <span className="story-eyebrow">🐾 your account</span>
        <h1 className="story-title">
          {account ? (
            <>
              hi, <em>{account.name.split(" ")[0]}</em>
            </>
          ) : (
            <>
              welcome to <em>the pack</em>
            </>
          )}
        </h1>
      </section>

      <div className="account-layout">
        {account ? (
          <section className="account-card" aria-labelledby="details-title">
            <span className="account-card__avatar" aria-hidden="true">
              {initials(account.name)}
            </span>
            <h2 id="details-title" className="account-card__title">
              {account.name}
            </h2>
            <p className="account-card__email">{account.email}</p>
            {account.address ? (
              <p className="account-card__address">
                Delivers to {account.address.address}, {account.address.city} {account.address.zip}
              </p>
            ) : (
              <p className="account-card__address">Your address is saved after your first order.</p>
            )}
            <div className="account-card__actions">
              <button type="button" className="account-link-btn" onClick={openWishlist}>
                wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </button>
              <button type="button" className="account-link-btn account-link-btn--quiet" onClick={signOut}>
                sign out
              </button>
            </div>
          </section>
        ) : (
          <section className="account-card" aria-labelledby="signin-title">
            <h2 id="signin-title" className="account-card__title">
              Sign in
            </h2>
            <p className="account-card__lede">
              We&apos;ll remember your details so checkout is quicker next time, and keep your orders in one place.
            </p>
            <form ref={formRef} className="account-form" onSubmit={onSubmit} noValidate>
              <div className="contact-field">
                <label htmlFor="acc-name">Your name</label>
                <input
                  id="acc-name"
                  name="name"
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "acc-name-error" : undefined}
                />
                {errors.name && (
                  <span className="contact-error" id="acc-name-error">
                    {errors.name}
                  </span>
                )}
              </div>
              <div className="contact-field">
                <label htmlFor="acc-email">Email</label>
                <input
                  id="acc-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "acc-email-error" : undefined}
                />
                {errors.email && (
                  <span className="contact-error" id="acc-email-error">
                    {errors.email}
                  </span>
                )}
              </div>
              <button type="submit" className="cozy-btn-orange">
                sign in <IconArrowRight className="cozy-btn-orange__icon" />
              </button>
              <p className="account-form__note">
                Demo store: there are no passwords. Your details stay in this browser and never leave it.
              </p>
            </form>
          </section>
        )}

        <section className="account-orders" id="orders" aria-labelledby="orders-title">
          <h2 id="orders-title" className="account-orders__title">
            your <em>orders</em>
          </h2>
          {orders.length === 0 ? (
            <div className="account-empty">
              <p>No orders yet on this device.</p>
              <Link href="/shop" className="account-link-btn">
                start shopping
              </Link>
            </div>
          ) : (
            <ol className="order-list">
              {orders.map((order) => {
                const items = order.quote.lines.reduce((n, l) => n + l.qty, 0);
                return (
                  <li key={order.orderId} className="order-row">
                    <div>
                      <p className="order-row__id">{order.orderId}</p>
                      <p className="order-row__meta">
                        {dateFmt.format(new Date(order.placedAt))} · {items} item{items === 1 ? "" : "s"} ·{" "}
                        {order.payment?.method === "wallet" ? "paid with wallet (simulated)" : "card (demo)"}
                      </p>
                      <p className="order-row__items">{order.quote.lines.map((l) => l.name).join(", ")}</p>
                    </div>
                    <p className="order-row__total">{formatPrice(order.quote.totalCents)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

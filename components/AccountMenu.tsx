"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { initials, signOut, useAccount } from "@/lib/account";
import { IconStar, IconCart, IconTruck, IconClose, IconArrowRight } from "@/components/icons";

/**
 * Header account button. A disclosure (button + panel of links), not an
 * ARIA menu: every item is a normal link or button, reachable with Tab.
 * Signed out it offers sign-in; signed in it shows who you are, your
 * orders, wishlist and cart. The account itself is a demo (see lib/account).
 */
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  const { account, orders } = useAccount();
  const { openWishlist, count: wishlistCount } = useWishlist();
  const { openCart, count: cartCount } = useCart();

  // Close on outside click, Escape (focus back to the button) or navigation.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  // Move focus into the panel when it opens from the keyboard.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // On phones the panel is fixed to the viewport; line it up under the button.
    const bottom = triggerRef.current?.getBoundingClientRect().bottom;
    if (open && bottom !== undefined) panelRef.current?.style.setProperty("--menu-top", `${Math.round(bottom + 10)}px`);
    if (open) panelRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="account-menu__trigger"
        data-signed-in={account ? "" : undefined}
        aria-label={account ? `Account: ${account.name}` : "Account: signed out"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {account ? (
          <span className="account-menu__initials" aria-hidden="true">
            {initials(account.name)}
          </span>
        ) : (
          <img src="/assets/pets/paw-sticker.svg" alt="" className="account-menu__paw" />
        )}
      </button>

      <div
        ref={panelRef}
        id={panelId}
        className="account-menu__dropdown"
        hidden={!open}
      >
        <div className="account-menu__head">
          <span className="account-menu__avatar" aria-hidden="true">
            {account ? initials(account.name) : <img src="/assets/pets/paw-sticker.svg" alt="" />}
          </span>
          <div className="account-menu__who">
            <p className="account-menu__hi">{account ? `Hi, ${account.name.split(" ")[0]}` : "Hey there"}</p>
            <span className="account-menu__sub" title={account?.email}>{account ? account.email : "You're browsing as a guest"}</span>
          </div>
        </div>

        {!account && (
          <Link href="/account" className="account-menu__signin" onClick={() => setOpen(false)}>
            Sign in or create an account <IconArrowRight />
          </Link>
        )}

        <Link href="/account#orders" className="account-menu__item" onClick={() => setOpen(false)}>
          <IconTruck className="account-menu__icon" />
          Your orders
          {orders.length > 0 && <span className="account-menu__count">{orders.length}</span>}
        </Link>
        <button type="button" className="account-menu__item" onClick={run(openWishlist)}>
          <IconStar className="account-menu__icon" />
          Wishlist
          {wishlistCount > 0 && <span className="account-menu__count">{wishlistCount}</span>}
        </button>
        <button type="button" className="account-menu__item" onClick={run(openCart)}>
          <IconCart className="account-menu__icon" />
          Cart
          {cartCount > 0 && <span className="account-menu__count">{cartCount}</span>}
        </button>

        {account && (
          <>
            <div className="account-menu__divider" />
            <Link href="/account" className="account-menu__item" onClick={() => setOpen(false)}>
              <span className="account-menu__icon account-menu__icon--text" aria-hidden="true">
                ⚙
              </span>
              Account details
            </Link>
            <button
              type="button"
              className="account-menu__item account-menu__signout"
              onClick={run(() => {
                signOut();
                triggerRef.current?.focus();
              })}
            >
              <IconClose className="account-menu__icon" />
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

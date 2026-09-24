"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/**
 * Announces cart corrections (stock limits, network failures).
 * Always mounted so the live region exists before the message arrives;
 * screen readers only announce changes to regions already in the DOM.
 */
export default function CartToast() {
  const { notice, dismissNotice } = useCart();

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  return (
    <div className="cart-toast-region" role="status" aria-live="polite">
      {notice && (
        <div key={notice.id} className={`cart-toast cart-toast--${notice.tone}`}>
          <p>{notice.message}</p>
          <button type="button" onClick={dismissNotice} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

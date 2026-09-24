"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "./catalog";
import {
  cartReducer,
  initialCartState,
  selectQty,
  selectVisibleLines,
  type CartAction,
  type CartState,
} from "./cart-state";
import type { CartLine, CartUpdateResponse } from "./types";

const STORAGE_KEY = "cozypaws-cart";

export interface CartNotice {
  id: number;
  message: string;
  tone: "info" | "error";
}

interface CartContextValue {
  /** Optimistic lines: what the user should see right now. */
  items: CartLine[];
  count: number;
  hydrated: boolean;
  addItem: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  /** Adopt lines the server has already priced (e.g. after a quote change). */
  replaceLines: (lines: CartLine[]) => void;
  isPending: (id: string) => boolean;
  notice: CartNotice | null;
  dismissNotice: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Drops products we no longer sell and clamps to known stock. */
function sanitize(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  const out: CartLine[] = [];
  for (const raw of lines) {
    if (typeof raw !== "object" || raw === null) continue;
    const { id, qty } = raw as Record<string, unknown>;
    if (typeof id !== "string" || typeof qty !== "number") continue;
    const product = getProduct(id);
    if (!product) continue;
    const clamped = Math.min(Math.floor(qty), product.stock);
    if (clamped > 0) out.push({ id, qty: clamped });
  }
  return out;
}

function readStoredCart(): CartLine[] {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(initialCartState);
  // A synchronous mirror of state, so rapid clicks in the same frame compute
  // the next quantity from the latest value rather than a stale render.
  const stateRef = useRef<CartState>(initialCartState);
  const seqRef = useRef(0);
  const noticeSeq = useRef(0);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<CartNotice | null>(null);

  const dispatch = useCallback((action: CartAction) => {
    stateRef.current = cartReducer(stateRef.current, action);
    setState(stateRef.current);
  }, []);

  const notify = useCallback((message: string, tone: CartNotice["tone"]) => {
    noticeSeq.current += 1;
    setNotice({ id: noticeSeq.current, message, tone });
  }, []);

  // Server renders an empty cart; hydrate from storage after mount so the
  // first client render matches the server HTML.
  useEffect(() => {
    dispatch({ type: "hydrate", lines: readStoredCart() });
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) dispatch({ type: "hydrate", lines: readStoredCart() });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  // Persist only what the server confirmed, never in-flight guesses.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.confirmed));
    } catch {
      /* storage full or blocked: the cart still works for this session */
    }
  }, [state.confirmed, hydrated]);

  const updateQty = useCallback(
    async (id: string, rawQty: number) => {
      const product = getProduct(id);
      if (!product) return;
      const qty = Math.max(0, Math.min(99, Math.floor(rawQty)));
      if (qty === selectQty(stateRef.current, id)) return;

      seqRef.current += 1;
      const seq = seqRef.current;
      dispatch({ type: "request", id, qty, seq }); // optimistic: UI updates now

      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, qty }),
        });
        const data = (await res.json()) as CartUpdateResponse;
        if (data.ok) {
          dispatch({ type: "confirm", id, qty: data.line.qty, seq });
          return;
        }
        if (data.code === "insufficient_stock" || data.code === "unknown_product") {
          dispatch({ type: "reject", id, seq, available: data.available ?? 0 });
          notify(data.message, "info");
        } else {
          dispatch({ type: "reject", id, seq });
          notify(data.message, "error");
        }
      } catch {
        dispatch({ type: "reject", id, seq });
        notify("Network hiccup: your cart wasn't changed. Try again.", "error");
      }
    },
    [dispatch, notify],
  );

  const addItem = useCallback(
    (id: string, qty = 1) => {
      void updateQty(id, selectQty(stateRef.current, id) + qty);
    },
    [updateQty],
  );

  const setQty = useCallback(
    (id: string, qty: number) => void updateQty(id, qty),
    [updateQty],
  );
  const removeItem = useCallback((id: string) => void updateQty(id, 0), [updateQty]);
  const clearCart = useCallback(() => dispatch({ type: "clear" }), [dispatch]);
  const replaceLines = useCallback(
    (lines: CartLine[]) => dispatch({ type: "replace", lines }),
    [dispatch],
  );
  const isPending = useCallback((id: string) => id in state.pending, [state.pending]);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const items = useMemo(() => selectVisibleLines(state), [state]);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const value: CartContextValue = {
    items,
    count,
    hydrated,
    addItem,
    setQty,
    removeItem,
    clearCart,
    replaceLines,
    isPending,
    notice,
    dismissNotice,
    isOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

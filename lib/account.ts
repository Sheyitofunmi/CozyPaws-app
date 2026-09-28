"use client";

import { useSyncExternalStore } from "react";
import type { CheckoutCustomer } from "./types";
import type { PlacedOrder } from "./last-order";

/*
 * Demo account. There's no auth backend in this project, so "signing in"
 * stores a name, email and (after checkout) a delivery address in this
 * browser's localStorage, and every placed order is kept in a short history.
 * The UI says so; nothing here pretends to be real authentication.
 */

export interface Account {
  name: string;
  email: string;
  address?: Pick<CheckoutCustomer, "address" | "city" | "zip">;
}

const ACCOUNT_KEY = "cozypaws-account-v2";
const ORDERS_KEY = "cozypaws-orders";
const MAX_ORDERS = 10;
const EVENT = "cozypaws-account-change";

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the account just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && typeof v.email === "string";
}

// useSyncExternalStore needs a stable snapshot: cache by the raw string.
let cachedAccountRaw: string | null | undefined;
let cachedAccount: Account | null = null;
function getAccount(): Account | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ACCOUNT_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedAccountRaw) {
    cachedAccountRaw = raw;
    const parsed = raw ? read<unknown>(ACCOUNT_KEY) : null;
    cachedAccount = isAccount(parsed) ? parsed : null;
  }
  return cachedAccount;
}

let cachedOrdersRaw: string | null | undefined;
let cachedOrders: PlacedOrder[] = [];
function getOrders(): PlacedOrder[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ORDERS_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedOrdersRaw) {
    cachedOrdersRaw = raw;
    const parsed = raw ? read<unknown>(ORDERS_KEY) : null;
    cachedOrders = Array.isArray(parsed)
      ? parsed.filter((o): o is PlacedOrder => !!o && typeof o === "object" && typeof (o as PlacedOrder).orderId === "string")
      : [];
  }
  return cachedOrders;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === ACCOUNT_KEY || e.key === ORDERS_KEY) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: PlacedOrder[] = [];

export function useAccount() {
  // Server snapshot is "signed out": the real state appears after hydration.
  const account = useSyncExternalStore(subscribe, getAccount, () => null);
  const orders = useSyncExternalStore(subscribe, getOrders, () => EMPTY);
  return { account, orders, signIn, signOut, saveAddress };
}

export function signIn(name: string, email: string) {
  const current = getAccount();
  write(ACCOUNT_KEY, { ...current, name: name.trim(), email: email.trim().toLowerCase() });
}

export function signOut() {
  write(ACCOUNT_KEY, null);
}

export function saveAddress(address: Account["address"]) {
  const current = getAccount();
  if (current) write(ACCOUNT_KEY, { ...current, address });
}

/** Called after every successful checkout (signed in or not). */
export function recordOrder(order: PlacedOrder) {
  const next = [order, ...getOrders().filter((o) => o.orderId !== order.orderId)].slice(0, MAX_ORDERS);
  write(ORDERS_KEY, next);
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "🐾"
  );
}

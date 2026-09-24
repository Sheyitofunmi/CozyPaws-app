import { NextResponse, type NextRequest } from "next/server";
import { buildQuote, diffQuotes } from "@/lib/pricing";
import { getServerProduct } from "@/lib/server/catalog";
import { readDemo, sleep } from "@/lib/server/demo";
import type { CheckoutCustomer, CheckoutRequest, CheckoutResponse } from "@/lib/types";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/*
 * Idempotency: the client sends an Idempotency-Key per order attempt, so a
 * double-click or a retry after a flaky network returns the SAME order instead
 * of creating two. This in-memory map is fine for a demo; in production it
 * would live in a shared store (Redis/DB) with a TTL, because serverless
 * instances don't share memory.
 */
const completedOrders = new Map<string, CheckoutResponse>();

export async function POST(req: NextRequest) {
  const demo = readDemo(req);
  await sleep(demo.latencyMs);

  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const previous = completedOrders.get(idempotencyKey);
    if (previous) {
      return NextResponse.json(previous, { headers: { "idempotent-replay": "true" } });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  if (!isCheckoutRequest(body)) {
    return NextResponse.json<CheckoutResponse>(
      { ok: false, code: "invalid_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const errors = validateCustomer(body.customer);
  if (body.items.length === 0) errors.items = "Your cart is empty.";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json<CheckoutResponse>(
      { ok: false, code: "validation", errors },
      { status: 422 },
    );
  }

  // Re-price from the server's catalog. The client never tells us a price;
  // it only tells us what it *showed*, so we can detect a stale quote.
  const quote = buildQuote(body.items, (id) => getServerProduct(id, demo));
  if (quote.lines.length === 0) {
    return NextResponse.json<CheckoutResponse>(
      { ok: false, code: "empty_cart", message: "Nothing in your cart is available any more." },
      { status: 409 },
    );
  }

  const changes = diffQuotes(body.expected.lines, quote);
  if (changes.length > 0 || quote.totalCents !== body.expected.totalCents) {
    // Never silently charge a different amount: hand the new quote back for review.
    return NextResponse.json<CheckoutResponse>(
      { ok: false, code: "quote_changed", quote, changes },
      { status: 409 },
    );
  }

  const orderId = `CP-${Date.now().toString(36).toUpperCase()}`;
  const response: CheckoutResponse = {
    ok: true,
    orderId,
    quote,
    message: `Order ${orderId} confirmed! A (pretend) confirmation email is on its way.`,
  };
  if (idempotencyKey) completedOrders.set(idempotencyKey, response);
  return NextResponse.json(response);
}

function validateCustomer(c: CheckoutCustomer) {
  const errors: Partial<Record<keyof CheckoutCustomer | "items", string>> = {};
  if (c.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!isEmail(c.email.trim())) errors.email = "Enter a valid email.";
  if (c.address.trim().length < 5) errors.address = "Enter a delivery address.";
  if (c.city.trim().length < 2) errors.city = "Enter your city.";
  if (c.zip.trim().length < 3) errors.zip = "Enter a postal code.";
  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCheckoutRequest(value: unknown): value is CheckoutRequest {
  if (!isRecord(value)) return false;
  const { customer, items, expected } = value;
  return (
    isRecord(customer) &&
    ["name", "email", "address", "city", "zip"].every((k) => typeof customer[k] === "string") &&
    Array.isArray(items) &&
    items.every((i) => isRecord(i) && typeof i.id === "string" && Number.isInteger(i.qty)) &&
    isRecord(expected) &&
    Array.isArray(expected.lines) &&
    typeof expected.totalCents === "number"
  );
}

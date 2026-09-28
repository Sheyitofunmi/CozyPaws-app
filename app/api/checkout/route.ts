import { NextResponse, type NextRequest } from "next/server";
import { buildQuote, diffQuotes } from "@/lib/pricing";
import { getServerProduct } from "@/lib/server/catalog";
import { readDemo, sleep } from "@/lib/server/demo";
import { withIdempotency } from "@/lib/server/idempotency";
import { verifyOnchainPayment } from "@/lib/server/payments";
import { isAddress, isTxHash } from "@/lib/payments";
import type { CheckoutRequest, CheckoutResponse, Payment, Quote } from "@/lib/types";
import { validateCustomer, type CustomerErrors } from "@/lib/validation";

/*
 * POST /api/checkout
 *
 * Idempotency: the client sends an Idempotency-Key per order attempt, so a
 * double-click or a retry after a flaky network returns the SAME order instead
 * of creating two. The record lives in the shared KV store (Upstash Redis in
 * production), claimed atomically, so it holds across serverless instances.
 */
export async function POST(req: NextRequest) {
  const demo = readDemo(req);
  await sleep(demo.latencyMs);

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
  const request = body;

  const result = await withIdempotency<{ status: number; body: CheckoutResponse }>(
    req.headers.get("idempotency-key"),
    request,
    async () => {
      const outcome = await placeOrder(request, demo);
      // Only a placed order is remembered; a failure frees the key for a retry.
      return { response: outcome, keep: outcome.body.ok };
    },
  );

  switch (result.kind) {
    case "fresh":
      return NextResponse.json(result.response.body, { status: result.response.status });
    case "replay":
      return NextResponse.json(result.response.body, {
        status: result.response.status,
        headers: { "idempotent-replay": "true" },
      });
    case "in_progress":
      return NextResponse.json<CheckoutResponse>(
        { ok: false, code: "in_progress", message: "This order is already being placed. One moment…" },
        { status: 409, headers: { "Retry-After": "1" } },
      );
    case "mismatch":
      return NextResponse.json<CheckoutResponse>(
        { ok: false, code: "idempotency_mismatch", message: "This order key was already used for a different order." },
        { status: 422 },
      );
  }
}

async function placeOrder(
  body: CheckoutRequest,
  demo: ReturnType<typeof readDemo>,
): Promise<{ status: number; body: CheckoutResponse }> {
  const errors: CustomerErrors & { items?: string } = validateCustomer(body.customer);
  if (body.items.length === 0) errors.items = "Your cart is empty.";
  if (Object.keys(errors).length > 0) {
    return { status: 422, body: { ok: false, code: "validation", errors } };
  }

  const payment: Payment = body.payment ?? { method: "card" };

  let quote: Quote;
  if (payment.method === "wallet" && payment.network === "base-sepolia") {
    // Real money moved: honour the quote we locked before the signature, and
    // only after checking the chain ourselves.
    const verified = await verifyOnchainPayment({
      quoteId: payment.quoteId,
      items: body.items,
      account: payment.account,
      txHash: payment.txHash as `0x${string}`,
    });
    if (!verified.ok) {
      return {
        status: verified.code === "payment_pending" ? 409 : 402,
        body: { ok: false, code: verified.code, message: verified.message },
      };
    }
    quote = verified.quote;
  } else {
    // Re-price from the server's catalog. The client never tells us a price;
    // it only tells us what it *showed*, so we can detect a stale quote.
    quote = buildQuote(body.items, (id) => getServerProduct(id, demo));
    if (quote.lines.length === 0) {
      return {
        status: 409,
        body: { ok: false, code: "empty_cart", message: "Nothing in your cart is available any more." },
      };
    }
    const changes = diffQuotes(body.expected.lines, quote);
    if (changes.length > 0 || quote.totalCents !== body.expected.totalCents) {
      // Never silently charge a different amount: hand the new quote back for review.
      return { status: 409, body: { ok: false, code: "quote_changed", quote, changes } };
    }
  }

  const orderId = `CP-${Date.now().toString(36).toUpperCase()}`;
  return {
    status: 200,
    body: {
      ok: true,
      orderId,
      quote,
      payment,
      message: `Order ${orderId} confirmed! A (pretend) confirmation email is on its way.`,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPayment(p: unknown): p is Payment {
  if (!isRecord(p)) return false;
  if (p.method === "card") return true;
  if (p.method !== "wallet" || !isAddress(p.account) || !isTxHash(p.txHash)) return false;
  if (p.network === "simulated") return true;
  return p.network === "base-sepolia" && typeof p.quoteId === "string" && p.quoteId.length <= 64;
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
    typeof expected.totalCents === "number" &&
    (value.payment === undefined || isPayment(value.payment))
  );
}

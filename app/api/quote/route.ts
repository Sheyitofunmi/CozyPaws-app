import { NextResponse, type NextRequest } from "next/server";
import { buildQuote, diffQuotes } from "@/lib/pricing";
import { getServerProduct } from "@/lib/server/catalog";
import { readDemo, sleep } from "@/lib/server/demo";
import { lockQuote } from "@/lib/server/payments";
import type { QuoteResponse } from "@/lib/types";

/**
 * Locks a price before asking for a wallet signature.
 *
 * With a card, a price change can still be shown after "place order". With a
 * wallet, the user signs an exact amount, so the quote has to be settled
 * BEFORE the signature, never after money has moved.
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
  const items =
    typeof body === "object" && body !== null && Array.isArray((body as { items?: unknown }).items)
      ? ((body as { items: unknown[] }).items.filter(
          (i): i is { id: string; qty: number } =>
            typeof i === "object" && i !== null &&
            typeof (i as { id?: unknown }).id === "string" &&
            Number.isInteger((i as { qty?: unknown }).qty),
        ))
      : null;
  if (!items) {
    return NextResponse.json<QuoteResponse>(
      { ok: false, code: "invalid_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const quote = buildQuote(items, (id) => getServerProduct(id, demo));
  if (quote.lines.length === 0) {
    return NextResponse.json<QuoteResponse>(
      { ok: false, code: "empty_cart", message: "Nothing in your cart is available any more." },
      { status: 409 },
    );
  }

  const expected = (body as { expected?: { lines?: unknown } }).expected;
  const changes = Array.isArray(expected?.lines)
    ? diffQuotes(expected.lines as Parameters<typeof diffQuotes>[0], quote)
    : [];
  // The lock is what a wallet payment is checked against later: the server,
  // not the browser, remembers the amount the customer agreed to sign.
  const lock = await lockQuote(items, quote);
  return NextResponse.json<QuoteResponse>({ ok: true, quote, changes, lock });
}

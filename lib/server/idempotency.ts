import "server-only";
import { createHash } from "node:crypto";
import { kv } from "./kv";

/*
 * Idempotency for POST /api/checkout, backed by the shared KV store so it
 * holds across serverless instances.
 *
 *   1. The first request with a key CLAIMS it atomically (SET NX) as "pending".
 *   2. A duplicate that arrives while the first is still running waits briefly
 *      for its result instead of placing a second order.
 *   3. A successful result is stored for 24h and replayed for any retry.
 *   4. A failed attempt releases the key, so the customer can fix the problem
 *      (e.g. confirm a new total) and retry with the same key.
 *   5. Reusing a key with a DIFFERENT body is refused: that's a client bug,
 *      not a retry.
 */

type Record<T> =
  | { state: "pending"; fingerprint: string }
  | { state: "done"; fingerprint: string; response: T };

export type IdempotentResult<T> =
  | { kind: "fresh"; response: T }
  | { kind: "replay"; response: T }
  | { kind: "in_progress" }
  | { kind: "mismatch" };

const PENDING_TTL_S = 60;
const DONE_TTL_S = 60 * 60 * 24;
const WAIT_MS = 5_000;
const POLL_MS = 150;

export const fingerprintOf = (body: unknown) =>
  createHash("sha256").update(JSON.stringify(body)).digest("hex");

export async function withIdempotency<T>(
  key: string | null,
  body: unknown,
  run: () => Promise<{ response: T; keep: boolean }>,
): Promise<IdempotentResult<T>> {
  if (!key) return { kind: "fresh", response: (await run()).response };

  const storeKey = `idem:checkout:${key}`;
  const fingerprint = fingerprintOf(body);

  const claimed = await kv.setIfAbsent(storeKey, { state: "pending", fingerprint }, PENDING_TTL_S);
  if (!claimed) return awaitExisting<T>(storeKey, fingerprint);

  try {
    const { response, keep } = await run();
    if (keep) await kv.set(storeKey, { state: "done", fingerprint, response }, DONE_TTL_S);
    else await kv.del(storeKey);
    return { kind: "fresh", response };
  } catch (err) {
    await kv.del(storeKey);
    throw err;
  }
}

async function awaitExisting<T>(storeKey: string, fingerprint: string): Promise<IdempotentResult<T>> {
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    const existing = await kv.get<Record<T>>(storeKey);
    if (!existing) return { kind: "in_progress" }; // released after a failure: let the client retry
    if (existing.fingerprint !== fingerprint) return { kind: "mismatch" };
    if (existing.state === "done") return { kind: "replay", response: existing.response };
    if (Date.now() > deadline) return { kind: "in_progress" };
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

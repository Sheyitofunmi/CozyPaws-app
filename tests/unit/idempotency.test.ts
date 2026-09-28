import { describe, expect, it } from "vitest";
import { withIdempotency } from "@/lib/server/idempotency";

const order = { items: [{ id: "a", qty: 1 }] };
let n = 0;
const key = () => `test-${Date.now()}-${n++}`;

describe("withIdempotency (in-memory KV)", () => {
  it("runs once and replays the stored result for a retry", async () => {
    const k = key();
    let runs = 0;
    const run = async () => ({ response: { orderId: `o${++runs}` }, keep: true });
    const first = await withIdempotency(k, order, run);
    const retry = await withIdempotency(k, order, run);
    expect(first).toEqual({ kind: "fresh", response: { orderId: "o1" } });
    expect(retry).toEqual({ kind: "replay", response: { orderId: "o1" } });
    expect(runs).toBe(1);
  });

  it("two concurrent requests with one key place ONE order", async () => {
    const k = key();
    let runs = 0;
    const slow = async () => {
      runs++;
      await new Promise((r) => setTimeout(r, 200));
      return { response: { orderId: "only" }, keep: true };
    };
    const [a, b] = await Promise.all([withIdempotency(k, order, slow), withIdempotency(k, order, slow)]);
    expect(runs).toBe(1);
    expect([a.kind, b.kind].sort()).toEqual(["fresh", "replay"]);
  });

  it("a failed attempt frees the key so the customer can retry", async () => {
    const k = key();
    await withIdempotency(k, order, async () => ({ response: { ok: false }, keep: false }));
    const again = await withIdempotency(k, order, async () => ({ response: { ok: true }, keep: true }));
    expect(again).toEqual({ kind: "fresh", response: { ok: true } });
  });

  it("refuses to reuse a key for a different order", async () => {
    const k = key();
    await withIdempotency(k, order, async () => ({ response: 1, keep: true }));
    const other = await withIdempotency(k, { items: [{ id: "b", qty: 2 }] }, async () => ({ response: 2, keep: true }));
    expect(other).toEqual({ kind: "mismatch" });
  });
});

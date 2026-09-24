import { describe, expect, it } from "vitest";
import { cartReducer, initialCartState, selectVisibleLines, type CartState } from "@/lib/cart-state";

const run = (...actions: Parameters<typeof cartReducer>[1][]): CartState =>
  actions.reduce(cartReducer, initialCartState);

describe("cartReducer", () => {
  it("shows optimistic changes before the server confirms", () => {
    const state = run({ type: "request", id: "a", qty: 2, seq: 1 });
    expect(selectVisibleLines(state)).toEqual([{ id: "a", qty: 2 }]);
    expect(state.confirmed).toEqual([]);
  });

  it("promotes a confirmed change", () => {
    const state = run(
      { type: "request", id: "a", qty: 2, seq: 1 },
      { type: "confirm", id: "a", qty: 2, seq: 1 },
    );
    expect(state.confirmed).toEqual([{ id: "a", qty: 2 }]);
    expect(state.pending).toEqual({});
  });

  it("rolls back on a network failure", () => {
    const state = run(
      { type: "hydrate", lines: [{ id: "a", qty: 1 }] },
      { type: "request", id: "a", qty: 2, seq: 1 },
      { type: "reject", id: "a", seq: 1 },
    );
    expect(selectVisibleLines(state)).toEqual([{ id: "a", qty: 1 }]);
  });

  it("clamps to available stock on a stock rejection", () => {
    const state = run(
      { type: "request", id: "a", qty: 5, seq: 1 },
      { type: "reject", id: "a", seq: 1, available: 2 },
    );
    expect(selectVisibleLines(state)).toEqual([{ id: "a", qty: 2 }]);
  });

  it("ignores stale responses that arrive out of order", () => {
    const state = run(
      { type: "request", id: "a", qty: 2, seq: 1 },
      { type: "request", id: "a", qty: 3, seq: 2 },
      { type: "confirm", id: "a", qty: 3, seq: 2 }, // newer lands first
      { type: "confirm", id: "a", qty: 2, seq: 1 }, // older arrives late: ignored
    );
    expect(state.confirmed).toEqual([{ id: "a", qty: 3 }]);
    expect(selectVisibleLines(state)).toEqual([{ id: "a", qty: 3 }]);
  });

  it("keeps a newer pending value when an older request settles", () => {
    const state = run(
      { type: "request", id: "a", qty: 2, seq: 1 },
      { type: "request", id: "a", qty: 3, seq: 2 },
      { type: "confirm", id: "a", qty: 2, seq: 1 },
    );
    expect(selectVisibleLines(state)).toEqual([{ id: "a", qty: 3 }]);
    expect(state.pending.a).toEqual({ qty: 3, seq: 2 });
  });
});

import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, erc20Abi, type Log } from "viem";
import { findPaymentTransfer } from "@/lib/server/payments";
import { USDC_ADDRESS, centsToUnits, unitsToCents } from "@/lib/payments";

const CUSTOMER = "0x1111111111111111111111111111111111111111";
const MERCHANT = "0x2222222222222222222222222222222222222222";
const OTHER = "0x3333333333333333333333333333333333333333";

function transferLog(token: string, from: string, to: string, value: bigint): Log {
  return {
    address: token as `0x${string}`,
    topics: encodeEventTopics({ abi: erc20Abi, eventName: "Transfer", args: { from: from as `0x${string}`, to: to as `0x${string}` } }) as Log["topics"],
    data: encodeAbiParameters([{ type: "uint256" }], [value]),
    blockHash: null,
    blockNumber: null,
    logIndex: null,
    transactionHash: null,
    transactionIndex: null,
    removed: false,
  };
}

const expectPaid = (logs: Log[], cents = 5_498) =>
  findPaymentTransfer(logs, { token: USDC_ADDRESS, from: CUSTOMER, to: MERCHANT, amount: centsToUnits(cents) });

describe("cents ↔ USDC units", () => {
  it("is exact: one cent is 10,000 units (6 decimals)", () => {
    expect(centsToUnits(5_498)).toBe(54_980_000n);
    expect(unitsToCents(54_980_000n)).toBe(5_498);
    expect(unitsToCents(54_989_999n)).toBe(5_498); // dust rounds down, never up
  });
});

describe("findPaymentTransfer", () => {
  it("accepts an exact USDC transfer from the customer to the store", () => {
    expect(expectPaid([transferLog(USDC_ADDRESS, CUSTOMER, MERCHANT, 54_980_000n)])).toBe(true);
  });

  it("finds the transfer among other logs, and ignores address casing", () => {
    const logs = [
      transferLog(OTHER, CUSTOMER, MERCHANT, 1n),
      transferLog(USDC_ADDRESS.toLowerCase(), CUSTOMER.toUpperCase().replace("0X", "0x"), MERCHANT, 54_980_000n),
    ];
    expect(expectPaid(logs)).toBe(true);
  });

  it("rejects a short payment, an overpayment, the wrong recipient or the wrong sender", () => {
    expect(expectPaid([transferLog(USDC_ADDRESS, CUSTOMER, MERCHANT, 54_970_000n)])).toBe(false);
    expect(expectPaid([transferLog(USDC_ADDRESS, CUSTOMER, MERCHANT, 54_990_000n)])).toBe(false);
    expect(expectPaid([transferLog(USDC_ADDRESS, CUSTOMER, OTHER, 54_980_000n)])).toBe(false);
    expect(expectPaid([transferLog(USDC_ADDRESS, OTHER, MERCHANT, 54_980_000n)])).toBe(false);
  });

  it("ignores a look-alike Transfer event from a different token contract", () => {
    expect(expectPaid([transferLog(OTHER, CUSTOMER, MERCHANT, 54_980_000n)])).toBe(false);
  });
});

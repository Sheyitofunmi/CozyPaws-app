import "server-only";
import { randomUUID } from "node:crypto";
import { createPublicClient, erc20Abi, getAddress, http, parseEventLogs } from "viem";
import {
  ONCHAIN_CONFIRMATIONS,
  PAY_CHAIN_ID,
  PAY_CHAIN_NAME,
  PAY_EXPLORER,
  QUOTE_LOCK_SECONDS,
  USDC_ADDRESS,
  USDC_DECIMALS,
  centsToUnits,
  isAddress,
  type PaymentsConfig,
} from "@/lib/payments";
import { baseSepolia } from "@/lib/chain";
import type { CartLine, Quote, QuoteLock } from "@/lib/types";
import { kv } from "./kv";

/*
 * Real wallet payments (Base Sepolia, test USDC).
 *
 * The rule: never fulfil because the browser SAYS it paid. The server checks
 * the chain itself:
 *   - the transaction succeeded and has enough confirmations,
 *   - it contains a USDC Transfer from the customer's address to OUR address
 *     for exactly the amount of a quote WE locked,
 *   - it was mined before that lock expired,
 *   - and the hash hasn't already paid for another order.
 */

export function merchantAddress(): `0x${string}` | null {
  const raw = process.env.MERCHANT_ADDRESS;
  // The zero address is the .env.example placeholder: treat it as "not set".
  if (!isAddress(raw) || /^0x0{40}$/i.test(raw)) return null;
  return getAddress(raw);
}

export function paymentsConfig(): PaymentsConfig {
  const payTo = merchantAddress();
  if (!payTo) return { onchain: false };
  return {
    onchain: true,
    chainId: PAY_CHAIN_ID,
    chainName: PAY_CHAIN_NAME,
    token: { address: USDC_ADDRESS, symbol: "USDC", decimals: USDC_DECIMALS },
    payTo,
    confirmations: ONCHAIN_CONFIRMATIONS,
    explorer: PAY_EXPLORER,
  };
}

const makeClient = () =>
  createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL || undefined),
    // viem caches the block number for 4s by default; confirmations need the real head.
    cacheTime: 0,
  });
let client: ReturnType<typeof makeClient> | undefined;
const chain = () => (client ??= makeClient());

// ─── Quote locks ────────────────────────────────────────────────────────────

interface LockedQuote {
  items: CartLine[];
  quote: Quote;
  expiresAt: number;
}

const lockKey = (id: string) => `quote:${id}`;

export async function lockQuote(items: CartLine[], quote: Quote): Promise<QuoteLock> {
  const quoteId = randomUUID();
  const expiresAt = Date.now() + QUOTE_LOCK_SECONDS * 1000;
  // Keep the record a little past expiry so a slow confirmation can still be
  // matched and explained, rather than looking like an unknown quote.
  await kv.set(lockKey(quoteId), { items, quote, expiresAt } satisfies LockedQuote, QUOTE_LOCK_SECONDS + 3600);
  return { quoteId, expiresAt };
}

export const readLockedQuote = (quoteId: string) => kv.get<LockedQuote>(lockKey(quoteId));

const sameItems = (a: CartLine[], b: CartLine[]) => {
  const key = (l: CartLine[]) =>
    [...l].filter((x) => x.qty > 0).sort((x, y) => x.id.localeCompare(y.id)).map((x) => `${x.id}:${x.qty}`).join(",");
  return key(a) === key(b);
};

// ─── Verification ─────────────────────────────────────────────────────────

/**
 * Pure check on a receipt's logs: is there a Transfer of exactly `amount` of
 * `token` from `from` to `to`? Any other token contract emitting a look-alike
 * Transfer event is ignored. Unit-tested in tests/unit/payments.test.ts.
 */
export function findPaymentTransfer(
  logs: Parameters<typeof parseEventLogs>[0]["logs"],
  expect: { token: string; from: string; to: string; amount: bigint },
): boolean {
  const token = getAddress(expect.token);
  const from = getAddress(expect.from);
  const to = getAddress(expect.to);
  return parseEventLogs({ abi: erc20Abi, eventName: "Transfer", logs }).some(
    (t) =>
      getAddress(t.address) === token &&
      getAddress(t.args.from) === from &&
      getAddress(t.args.to) === to &&
      t.args.value === expect.amount,
  );
}

export type VerifyResult =
  | { ok: true; quote: Quote }
  | { ok: false; code: "payment_invalid" | "payment_pending"; message: string };

const fail = (message: string): VerifyResult => ({ ok: false, code: "payment_invalid", message });

export async function verifyOnchainPayment(args: {
  quoteId: string;
  items: CartLine[];
  account: string;
  txHash: `0x${string}`;
}): Promise<VerifyResult> {
  const payTo = merchantAddress();
  if (!payTo) return fail("Wallet payments aren't enabled on this store.");
  if (!isAddress(args.account)) return fail("That wallet address isn't valid.");

  const locked = await readLockedQuote(args.quoteId);
  if (!locked) return fail("We couldn't find the price you locked. Please start the wallet payment again.");
  if (!sameItems(locked.items, args.items)) return fail("Your cart changed after the price was locked.");

  const rpc = chain();
  let receipt;
  try {
    receipt = await rpc.getTransactionReceipt({ hash: args.txHash });
  } catch {
    return { ok: false, code: "payment_pending", message: "Your payment hasn't been mined yet." };
  }
  if (receipt.status !== "success") return fail("That transaction failed on-chain, so no money moved.");

  const latest = await rpc.getBlockNumber();
  const confirmations = Number(latest - receipt.blockNumber) + 1;
  if (confirmations < ONCHAIN_CONFIRMATIONS) {
    return {
      ok: false,
      code: "payment_pending",
      message: `Waiting for confirmations (${confirmations} of ${ONCHAIN_CONFIRMATIONS}).`,
    };
  }

  const paid = findPaymentTransfer(receipt.logs, {
    token: USDC_ADDRESS,
    from: args.account,
    to: payTo,
    amount: centsToUnits(locked.quote.totalCents),
  });
  if (!paid) {
    return fail("That transaction doesn't pay this order: the token, amount or recipient doesn't match.");
  }

  const block = await rpc.getBlock({ blockNumber: receipt.blockNumber });
  if (Number(block.timestamp) * 1000 > locked.expiresAt) {
    return fail("The payment arrived after your locked price expired. Contact us and we'll sort it out.");
  }

  // One transaction pays for one order, ever.
  const claimed = await kv.setIfAbsent(`tx:${args.txHash.toLowerCase()}`, args.quoteId, 60 * 60 * 24 * 90);
  if (!claimed) {
    const owner = await kv.get<string>(`tx:${args.txHash.toLowerCase()}`);
    if (owner !== args.quoteId) return fail("That transaction has already paid for another order.");
  }

  return { ok: true, quote: locked.quote };
}

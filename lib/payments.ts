import type { Cents } from "./types";

/*
 * On-chain payment settings shared by the browser and the server.
 *
 * Payments are in test USDC on Base Sepolia. USDC has 6 decimals, so one cent
 * is exactly 10^4 base units: prices convert with no floating point and no
 * exchange rate, and the amount the customer signs is the amount we verify.
 */
export const PAY_CHAIN_ID = 84532; // Base Sepolia
export const PAY_CHAIN_NAME = "Base Sepolia";
export const PAY_EXPLORER = "https://sepolia.basescan.org";

/** Circle's test USDC on Base Sepolia (faucet: faucet.circle.com). */
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;
export const UNITS_PER_CENT = 10n ** BigInt(USDC_DECIMALS - 2);

/** How many blocks must sit on top of the payment before we fulfil. */
export const ONCHAIN_CONFIRMATIONS = 2;

/** A locked wallet quote is honoured for this long. */
export const QUOTE_LOCK_SECONDS = 15 * 60;

export const centsToUnits = (cents: Cents): bigint => BigInt(cents) * UNITS_PER_CENT;
export const unitsToCents = (units: bigint): Cents => Number(units / UNITS_PER_CENT);

/** What the browser needs to know to offer a real wallet (GET /api/payments/config). */
export type PaymentsConfig =
  | { onchain: false }
  | {
      onchain: true;
      chainId: number;
      chainName: string;
      token: { address: `0x${string}`; symbol: "USDC"; decimals: number };
      payTo: `0x${string}`;
      confirmations: number;
      explorer: string;
    };

export const isAddress = (v: unknown): v is `0x${string}` =>
  typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);

export const isTxHash = (v: unknown): v is `0x${string}` =>
  typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);

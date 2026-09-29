import type { WalletAccount } from "../wallet-machine";

/*
 * One interface for every wallet the checkout can talk to, so the dialog and
 * the state machine don't care whether money is real:
 *   - simulated.ts: the demo wallet (always available, labelled "simulated")
 *   - injected.ts:  a browser wallet (MetaMask, Rabby, Coinbase…) paying test
 *                   USDC on Base Sepolia, via viem
 */
export interface WalletOption {
  id: string;
  name: string;
  note: string;
  /** data: URI from the wallet's EIP-6963 announcement. */
  icon?: string;
  kind: "simulated" | "injected";
}

export interface PayRequest {
  /** Order total in cents; the driver converts to token units. */
  amountCents: number;
  payTo: `0x${string}`;
}

export interface ConnectedWallet {
  account: WalletAccount;
  /** Resolves with the tx hash once broadcast; throws WalletRejectedError if the user says no. */
  pay(request: PayRequest): Promise<`0x${string}`>;
  /** Reports confirmations as they arrive; resolves once `required` is reached. */
  watch(txHash: `0x${string}`, required: number, onConfirmations: (n: number) => void, signal: AbortSignal): Promise<void>;
}

/** The user declined in their wallet: nothing was sent. */
export class WalletRejectedError extends Error {
  constructor() {
    super("Signature rejected");
    this.name = "WalletRejectedError";
  }
}

/** Something the customer can act on, e.g. "switch to Base Sepolia" or "you need test ETH for gas". */
export class WalletUserError extends Error {
  name = "WalletUserError";
}

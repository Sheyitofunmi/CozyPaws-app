import { NETWORK_FEE_CENTS } from "../wallet-machine";
import type { ConnectedWallet, WalletOption } from "./types";

/*
 * A pretend wallet so the checkout states can be shown without a browser
 * extension or real funds. Everything here is fake and labelled as such in
 * the UI. The real counterpart is ./injected.ts.
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function randomHex(bytes: number): `0x${string}` {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return `0x${Array.from(values, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Reads the demo-panel cookie (see components/DemoPanel.tsx) for a low balance. */
function demoLowBalance(): boolean {
  const raw = document.cookie.split("; ").find((c) => c.startsWith("cp-demo="));
  if (!raw) return false;
  try {
    return JSON.parse(decodeURIComponent(raw.slice("cp-demo=".length))).walletLow === true;
  } catch {
    return false;
  }
}

export const SIM_WALLETS: WalletOption[] = [
  { id: "sim-pawprint", name: "Pawprint Wallet", note: "simulated · browser extension", kind: "simulated" },
  { id: "sim-kennel", name: "Kennel Key", note: "simulated · hardware wallet", kind: "simulated" },
];

export const CONFIRMATION_INTERVAL_MS = 1100;

export async function connectSimulated(option: WalletOption): Promise<ConnectedWallet> {
  await sleep(900);
  return {
    account: {
      walletName: option.name,
      address: randomHex(20),
      balanceCents: demoLowBalance() ? 2_500 : 250_000,
      network: "simulated",
      feeCents: NETWORK_FEE_CENTS,
    },
    async pay() {
      await sleep(700);
      return randomHex(32);
    },
    async watch(_hash, required, onConfirmations, signal) {
      for (let n = 1; n <= required; n++) {
        await sleep(CONFIRMATION_INTERVAL_MS);
        if (signal.aborted) return;
        onConfirmations(n);
      }
    },
  };
}

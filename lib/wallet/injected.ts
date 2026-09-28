import {
  BaseError,
  UserRejectedRequestError,
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  http,
  type EIP1193Provider,
} from "viem";
import { PAY_CHAIN_ID, USDC_ADDRESS, centsToUnits, unitsToCents } from "../payments";
import { baseSepolia } from "../chain";
import { WalletRejectedError, WalletUserError, type ConnectedWallet, type WalletOption } from "./types";

/*
 * Real browser wallets (MetaMask, Rabby, Coinbase Wallet…) paying test USDC
 * on Base Sepolia with viem.
 *
 * Wallets are discovered with EIP-6963 (each extension announces itself, so
 * two installed wallets don't fight over window.ethereum), falling back to
 * window.ethereum for older ones.
 */

interface Announced {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EIP1193Provider;
}

const providers = new Map<string, Announced>();

/** Asks installed wallets to announce themselves; resolves after a short wait. */
export async function discoverInjected(): Promise<WalletOption[]> {
  if (typeof window === "undefined") return [];
  const onAnnounce = (e: Event) => {
    const detail = (e as CustomEvent<Announced>).detail;
    if (detail?.info?.uuid && detail.provider) providers.set(detail.info.uuid, detail);
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((r) => setTimeout(r, 250));
  window.removeEventListener("eip6963:announceProvider", onAnnounce);

  const legacy = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (providers.size === 0 && legacy) {
    providers.set("legacy", {
      info: { uuid: "legacy", name: "Browser wallet", icon: "", rdns: "legacy" },
      provider: legacy,
    });
  }

  return [...providers.values()].map(({ info }) => ({
    id: info.uuid,
    name: info.name,
    note: "Base Sepolia · test USDC",
    icon: info.icon || undefined,
    kind: "injected" as const,
  }));
}

const publicClient = createPublicClient({ chain: baseSepolia, transport: http(), cacheTime: 0 });

const isRejection = (err: unknown) =>
  err instanceof UserRejectedRequestError ||
  (err instanceof BaseError && err.walk((e) => e instanceof UserRejectedRequestError) !== null) ||
  (typeof err === "object" && err !== null && (err as { code?: number }).code === 4001);

function explain(err: unknown): never {
  if (isRejection(err)) throw new WalletRejectedError();
  const text = err instanceof BaseError ? err.shortMessage : err instanceof Error ? err.message : String(err);
  if (/insufficient funds/i.test(text)) {
    throw new WalletUserError("Your wallet needs a little Base Sepolia test ETH to pay the network fee.");
  }
  throw new WalletUserError(text || "Your wallet couldn't complete that.");
}

async function ensureChain(wallet: ReturnType<typeof createWalletClient>) {
  if ((await wallet.getChainId()) === PAY_CHAIN_ID) return;
  try {
    await wallet.switchChain({ id: PAY_CHAIN_ID });
  } catch (err) {
    // 4902: the wallet doesn't know the chain yet, so offer to add it.
    if ((err as { code?: number })?.code === 4902 || /unrecognized chain/i.test(String(err))) {
      await wallet.addChain({ chain: baseSepolia });
      return;
    }
    explain(err);
  }
}

export async function connectInjected(option: WalletOption): Promise<ConnectedWallet> {
  const found = providers.get(option.id);
  if (!found) throw new WalletUserError("That wallet isn't available any more. Refresh and try again.");

  const wallet = createWalletClient({ chain: baseSepolia, transport: custom(found.provider) });
  let address: `0x${string}`;
  try {
    [address] = (await wallet.requestAddresses()) as [`0x${string}`];
    await ensureChain(wallet);
  } catch (err) {
    explain(err);
  }

  const balance = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  return {
    account: {
      walletName: option.name,
      address,
      balanceCents: unitsToCents(balance),
      network: "base-sepolia",
      // Gas is paid separately in test ETH, not out of the USDC amount.
      feeCents: 0,
    },
    async pay({ amountCents, payTo }) {
      try {
        await ensureChain(wallet);
        return await wallet.writeContract({
          account: address,
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "transfer",
          args: [payTo, centsToUnits(amountCents)],
        });
      } catch (err) {
        explain(err);
      }
    },
    async watch(txHash, required, onConfirmations, signal) {
      let seen = 0;
      while (!signal.aborted) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
          if (receipt.status !== "success") throw new WalletUserError("The payment failed on-chain. Nothing was taken.");
          const latest = await publicClient.getBlockNumber();
          const confirmations = Number(latest - receipt.blockNumber) + 1;
          if (confirmations > seen) {
            seen = Math.min(confirmations, required);
            onConfirmations(seen);
          }
          if (seen >= required) return;
        } catch (err) {
          if (err instanceof WalletUserError) throw err;
          // Not mined yet: keep polling.
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    },
  };
}

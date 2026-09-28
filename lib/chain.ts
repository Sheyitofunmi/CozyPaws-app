import { defineChain } from "viem";
import { PAY_CHAIN_ID, PAY_CHAIN_NAME, PAY_EXPLORER } from "./payments";

/**
 * Defined here rather than imported from "viem/chains": that entry point pulls
 * in every chain viem knows (and a noisy dynamic import) just to get this one.
 */
export const baseSepolia = defineChain({
  id: PAY_CHAIN_ID,
  name: PAY_CHAIN_NAME,
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: PAY_EXPLORER } },
  testnet: true,
});

import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const CHAIN_PORT = 8545;

/** The store's payout address in tests (see tests/e2e/wallet-onchain.spec.ts). */
export const TEST_MERCHANT = "0x2222222222222222222222222222222222222222";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Lets sandboxes point at a preinstalled Chromium instead of downloading one.
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  webServer: [
    {
      // A fake Base Sepolia node, so real-wallet payments can be tested offline.
      command: `node tests/e2e/mock-chain.mjs`,
      url: `http://localhost:${CHAIN_PORT}`,
      env: { MOCK_CHAIN_PORT: String(CHAIN_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: { MERCHANT_ADDRESS: TEST_MERCHANT, BASE_SEPOLIA_RPC_URL: `http://localhost:${CHAIN_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

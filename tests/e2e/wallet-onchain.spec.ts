import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { fillShipping } from "./helpers";

/*
 * The real-wallet path end to end, offline: viem in the browser talks to a
 * fake EIP-1193 wallet (announced over EIP-6963), both it and the server read
 * a fake Base Sepolia node (tests/e2e/mock-chain.mjs), and the server verifies
 * the USDC transfer on that "chain" before it confirms the order.
 */

const CHAIN = "http://localhost:8545";
const CUSTOMER = "0x1111111111111111111111111111111111111111";
const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const MERCHANT = "0x2222222222222222222222222222222222222222";

async function installFakeWallet(page: Page) {
  // The browser's viem reads go to the public Base Sepolia RPC: send them to the fake node.
  await page.route("https://sepolia.base.org/**", async (route) => {
    const res = await route.fetch({ url: CHAIN });
    await route.fulfill({ response: res });
  });
  await page.addInitScript(
    ({ chain, customer }) => {
      const rpc = async (method: string, params: unknown[] = []) => {
        const res = await fetch(chain, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        return (await res.json()).result;
      };
      const w = window as unknown as { __rejectNext?: boolean };
      const provider = {
        async request({ method, params }: { method: string; params?: unknown[] }) {
          switch (method) {
            case "eth_requestAccounts":
            case "eth_accounts":
              return [customer];
            case "eth_chainId":
              return "0x14a34";
            case "wallet_switchEthereumChain":
            case "wallet_addEthereumChain":
              return null;
            case "eth_sendTransaction": {
              if (w.__rejectNext) {
                w.__rejectNext = false;
                throw Object.assign(new Error("User rejected the request."), { code: 4001 });
              }
              const tx = (params as { from: string; to: string; data: string }[])[0]!;
              return rpc("cp_sendTransfer", [{ from: tx.from, token: tx.to, data: tx.data }]);
            }
            default:
              return rpc(method, params);
          }
        },
        on() {},
        removeListener() {},
      };
      const detail = Object.freeze({
        info: { uuid: "test-wallet", name: "Test Wallet", icon: "", rdns: "dev.cozypaws.test" },
        provider,
      });
      const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail }));
      window.addEventListener("eip6963:requestProvider", announce);
      announce();
    },
    { chain: CHAIN, customer: CUSTOMER },
  );
}

async function openWallet(page: Page) {
  await page.goto("/shop/cozy-dog-house");
  await page.getByRole("button", { name: /add to cart/ }).click();
  await page.getByRole("link", { name: "go to checkout" }).click();
  await fillShipping(page);
  await page.getByRole("radio", { name: /crypto wallet/ }).check();
  await page.getByRole("button", { name: /pay with wallet/ }).first().click();
}

test.describe("real wallet on Base Sepolia (fake chain)", () => {
  test("pays in USDC, waits for confirmations, and the server verifies it", async ({ page }) => {
    await installFakeWallet(page);
    await openWallet(page);

    await page.getByRole("button", { name: /Test Wallet/ }).click();
    await expect(page.getByRole("heading", { name: "review payment" })).toBeVisible();
    // Exactly the order total ($49.99 + $4.99 shipping): gas is paid separately in test ETH.
    await expect(page.getByRole("dialog")).toContainText("you'll send$54.98 USDC");
    await expect(page.getByRole("dialog")).toContainText("base sepolia testnet");

    await page.getByRole("button", { name: "confirm in wallet" }).click();
    await expect(page.getByText(/waiting for confirmations/)).toBeVisible();
    await expect(page).toHaveURL(/\/order\/confirmed$/, { timeout: 20_000 });
    await expect(page.getByText(/verified on-chain before we confirmed your order/)).toBeVisible();
  });

  test("declining in the wallet sends nothing and offers a retry", async ({ page }) => {
    await installFakeWallet(page);
    await openWallet(page);
    await page.getByRole("button", { name: /Test Wallet/ }).click();
    await expect(page.getByRole("heading", { name: "review payment" })).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __rejectNext: boolean }).__rejectNext = true));
    await page.getByRole("button", { name: "confirm in wallet" }).click();
    await expect(page.getByRole("heading", { name: "signature rejected" })).toBeVisible();
    await expect(page.getByRole("button", { name: "try again" })).toBeVisible();
  });
});

// ─── Server-side verification, straight at the API ─────────────────────────

const order = {
  customer: { name: "Jane Doe", email: "jane@example.com", address: "12 Maple Street", city: "London", zip: "N1 7GU" },
  items: [{ id: "cozy-dog-house", qty: 1 }],
};

async function lockQuote(request: APIRequestContext) {
  const res = await (await request.post("/api/quote", { data: { items: order.items } })).json();
  return res as { quote: { lines: unknown[]; totalCents: number }; lock: { quoteId: string } };
}

/** Sends a USDC transfer on the fake chain and waits until it has 2 confirmations. */
async function pay(request: APIRequestContext, cents: number, to = MERCHANT): Promise<string> {
  const data = `0xa9059cbb${to.slice(2).padStart(64, "0")}${(BigInt(cents) * 10_000n).toString(16).padStart(64, "0")}`;
  const res = await request.post(CHAIN, {
    data: { jsonrpc: "2.0", id: 1, method: "cp_sendTransfer", params: [{ from: CUSTOMER, token: USDC, data }] },
  });
  const hash = (await res.json()).result as string;
  await new Promise((r) => setTimeout(r, 1_600));
  return hash;
}

const checkout = (request: APIRequestContext, q: Awaited<ReturnType<typeof lockQuote>>, txHash: string, key: string) =>
  request.post("/api/checkout", {
    headers: { "Idempotency-Key": key },
    data: {
      ...order,
      expected: { lines: q.quote.lines, totalCents: q.quote.totalCents },
      payment: { method: "wallet", network: "base-sepolia", account: CUSTOMER, txHash, quoteId: q.lock.quoteId },
    },
  });

test.describe("on-chain verification", () => {
  test("underpaying or paying someone else is refused", async ({ request }) => {
    const q = await lockQuote(request);
    const short = await checkout(request, q, await pay(request, q.quote.totalCents - 1), `short-${Date.now()}`);
    expect(short.status()).toBe(402);
    const elsewhere = await checkout(
      request,
      q,
      await pay(request, q.quote.totalCents, "0x3333333333333333333333333333333333333333"),
      `elsewhere-${Date.now()}`,
    );
    expect(elsewhere.status()).toBe(402);
  });

  test("a transaction that isn't mined yet is 'pending', not paid", async ({ request }) => {
    const q = await lockQuote(request);
    const res = await checkout(request, q, `0x${"cd".repeat(32)}`, `pending-${Date.now()}`);
    expect(res.status()).toBe(409);
    expect((await res.json()).code).toBe("payment_pending");
  });

  test("one transaction can only ever pay for one order", async ({ request }) => {
    const first = await lockQuote(request);
    const tx = await pay(request, first.quote.totalCents);
    const ok = await checkout(request, first, tx, `first-${Date.now()}`);
    expect(ok.status()).toBe(200);

    const second = await lockQuote(request);
    const reused = await checkout(request, second, tx, `second-${Date.now()}`);
    expect(reused.status()).toBe(402);
    expect((await reused.json()).message).toMatch(/already paid/);
  });
});

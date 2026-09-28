import { expect, test } from "@playwright/test";

const order = {
  customer: { name: "Jane Doe", email: "jane@example.com", address: "12 Maple Street", city: "London", zip: "N1 7GU" },
  items: [{ id: "cozy-dog-house", qty: 1 }],
};

test.describe("server-side payment checks", () => {
  test("one idempotency key can't be reused for a different order", async ({ request }) => {
    const quote = await (await request.post("/api/quote", { data: { items: order.items } })).json();
    const body = { ...order, expected: { lines: quote.quote.lines, totalCents: quote.quote.totalCents } };
    const headers = { "Idempotency-Key": `e2e-${Date.now()}` };
    const first = await request.post("/api/checkout", { data: body, headers });
    expect(first.ok()).toBe(true);
    const replay = await request.post("/api/checkout", { data: body, headers });
    expect(replay.headers()["idempotent-replay"]).toBe("true");
    expect((await replay.json()).orderId).toBe((await first.json()).orderId);

    const other = await request.post("/api/checkout", {
      data: { ...body, customer: { ...order.customer, name: "Someone Else" } },
      headers,
    });
    expect(other.status()).toBe(422);
    expect((await other.json()).code).toBe("idempotency_mismatch");
  });
});

test("field INP samples are collected and summarised at /vitals", async ({ page, request }) => {
  const res = await request.post("/api/vitals", {
    data: [
      { bucket: "cart-stepper", value: 48, path: "/shop", device: "mobile", at: 0 },
      { bucket: "page", value: 180, inputDelay: 10, processing: 60, presentation: 110, target: "#shop-search-input", path: "/shop", device: "desktop", at: 0 },
      { bucket: "nonsense", value: -1 },
    ],
  });
  expect(res.status()).toBe(204);
  await page.goto("/vitals");
  await expect(page.getByRole("heading", { name: /how fast it feels/ })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("cart stepper");
  await expect(page.getByText("#shop-search-input")).toBeVisible();
});

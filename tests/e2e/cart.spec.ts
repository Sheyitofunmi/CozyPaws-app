import { expect, test } from "@playwright/test";
import { cartDialog, setDemo } from "./helpers";

test.describe("optimistic cart", () => {
  test("updates instantly, before the server answers", async ({ page, context, baseURL }) => {
    await setDemo(context, baseURL!, { latencyMs: 3000 });
    await page.goto("/shop/cloud-nine-bed");

    const confirmed = page.waitForResponse("**/api/cart");
    await page.getByRole("button", { name: /add to cart/ }).click();

    // The count updates immediately, while the request is still in flight.
    await expect(page.getByRole("button", { name: "Open cart" })).toContainText("1", { timeout: 500 });
    // The drawer opens once the image has flown into the cart icon.
    await expect(cartDialog(page).getByText("cloud nine bed")).toBeVisible();

    // Slow network: the "saving…" hint appears after the 300ms threshold.
    await expect(cartDialog(page).getByText("saving…")).toBeVisible();
    await confirmed;
    await expect(cartDialog(page).getByText("saving…")).toBeHidden();
  });

  test("rolls back to live stock when someone else bought it", async ({ page, context, baseURL }) => {
    await setDemo(context, baseURL!, { stockDrop: { id: "cozy-dog-house", stock: 1 } });
    await page.goto("/shop/cozy-dog-house");

    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: /add to cart/ }).click();

    const status = page.locator(".cart-toast-region");
    await expect(status).toContainText("Only 1 left");
    await expect(cartDialog(page).locator(".shop-cart__qty span")).toHaveText("1");
  });

  test("rolls back completely when the request fails", async ({ page, context, baseURL }) => {
    await setDemo(context, baseURL!, { failNextCart: true });
    await page.goto("/shop/everyday-leash");
    await page.getByRole("button", { name: /add to cart/ }).click();

    await expect(page.locator(".cart-toast-region")).toContainText("Couldn't reach the store");
    await expect(cartDialog(page).getByText("Your cart is feeling a little lonely.")).toBeVisible();
  });

  test("rapid clicks settle on the last value", async ({ page, context, baseURL }) => {
    await setDemo(context, baseURL!, { latencyMs: 400 });
    await page.goto("/shop/peanut-butter-bites");
    await page.getByRole("button", { name: /add to cart/ }).click();

    const plus = cartDialog(page).getByRole("button", { name: "Increase quantity of peanut butter bites" });
    for (let i = 0; i < 4; i++) await plus.click();

    await expect(cartDialog(page).locator(".shop-cart__qty span")).toHaveText("5");
    await page.waitForTimeout(1200); // let every response land, in any order
    await expect(cartDialog(page).locator(".shop-cart__qty span")).toHaveText("5");
    await page.reload();
    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(cartDialog(page).locator(".shop-cart__qty span")).toHaveText("5");
  });
});

test.describe("add to cart feedback", () => {
  test("button confirms, badge counts, drawer highlights the new line", async ({ page }) => {
    await page.goto("/shop/cloud-nine-bed");
    const add = page.getByRole("button", { name: /add to cart/ });
    await add.click();

    await expect(page.locator(".product-add")).toHaveClass(/is-added/);
    await expect(page.getByRole("button", { name: "Open cart, 1 item" })).toBeAttached();
    await expect(cartDialog(page).locator("[data-just-added]")).toContainText("cloud nine bed");
    await expect(cartDialog(page).getByRole("heading", { name: "pairs well with" })).toBeVisible();
  });

  test("mobile: sticky buy bar appears once the buy button scrolls away", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/shop/cloud-nine-bed");
    await page.waitForLoadState("networkidle"); // hydrated, so the observer is attached
    const bar = page.locator(".product-sticky");
    await expect(bar).not.toHaveAttribute("data-visible");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(bar).toHaveAttribute("data-visible", { timeout: 10_000 });
    await bar.getByRole("button", { name: "add to cart" }).click();
    await expect(cartDialog(page).getByText("cloud nine bed")).toBeVisible();
    await context.close();
  });
});

test("fly-to-cart: a copy of the photo flies, then the drawer opens", async ({ page }) => {
  await page.goto("/shop/cloud-nine-bed");
  await page.waitForLoadState("networkidle");
  const flying = page.locator("body > div[aria-hidden=true][style*='position: fixed']");
  await page.getByRole("button", { name: /add to cart/ }).click();
  await expect(flying).toHaveCount(1);
  await expect(cartDialog(page)).toBeVisible();
  await expect(flying).toHaveCount(0); // cleaned up after landing
});

test("fly-to-cart is skipped with reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/shop/cloud-nine-bed");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /add to cart/ }).click();
  await expect(cartDialog(page)).toBeVisible({ timeout: 500 });
  await expect(page.locator("body > div[aria-hidden=true][style*='position: fixed']")).toHaveCount(0);
  await context.close();
});

import { expect, test } from "@playwright/test";

test.describe("everything your dog needs (aisles)", () => {
  test("every line is a real product link, with a count per aisle", async ({ page }) => {
    await page.goto("/");
    const toys = page.locator(".aisle", { has: page.getByRole("heading", { name: "toys & play" }) });
    await expect(toys.locator(".aisle__count")).toHaveText("4 products");
    await expect(toys.locator(".aisle__item")).toHaveCount(4);
    await toys.getByRole("link", { name: /puzzle feeder pro/ }).click();
    await expect(page).toHaveURL(/\/shop\/puzzle-feeder-pro$/);
  });

  test("phones: the aisles are a swipe row that never widens the page", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/");
    const row = page.locator(".aisles");
    await row.scrollIntoViewIfNeeded();
    const { scrollWidth, clientWidth } = await row.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(scrollWidth).toBeGreaterThan(clientWidth * 3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await context.close();
  });
});

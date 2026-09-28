import { expect, test } from "@playwright/test";

test.describe("a store built for good dogs", () => {
  test("each photo links to its shop category, and a drag doesn't count as a click", async ({ page }) => {
    await page.goto("/");
    const deck = page.locator(".mc-deck");
    await expect(deck.getByRole("link", { name: /comfy beds/ })).toHaveAttribute("href", "/shop?category=comfy+beds");

    // Drag a photo: it springs back and we stay on the homepage.
    await page.waitForTimeout(2500); // intro + idle-gated setup
    await deck.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(1500); // entrance fan-out
    const card = page.locator(".mc-card--3");
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2 - i * 25, box.y + box.height / 2 - i * 6);
    await page.mouse.up();
    await expect(deck).toHaveClass(/has-thrown/);
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(async () => Math.round((await card.boundingBox())!.x - box.x)).toBe(0);

    await page.locator(".mc-card--5 .mc-card__link").click();
    await expect(page).toHaveURL(/category=grooming\+%26\+care/);
  });

  test("phones: the photos are a pile, and 'next photo' deals the next one", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator(".mc-deck").scrollIntoViewIfNeeded();
    const top = page.locator(".mc-card.is-top .mc-card__label");
    await expect(top).toHaveText(/food & treats/, { timeout: 10_000 });
    await page.getByRole("button", { name: /next photo/ }).click();
    await expect(top).toHaveText(/toys & play/);
    await context.close();
  });
});

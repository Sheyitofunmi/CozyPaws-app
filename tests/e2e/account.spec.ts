import { expect, test } from "@playwright/test";
import { fillShipping } from "./helpers";

test.describe("account", () => {
  test("the header menu opens, closes on Escape and returns focus", async ({ page }) => {
    await page.goto("/shop");
    const trigger = page.getByRole("button", { name: /^Account:/ }).first();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /sign in or create an account/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("signing in prefills checkout and orders show up on the account page", async ({ page }) => {
    await page.goto("/account");
    await page.getByRole("button", { name: /sign in/ }).click();
    await expect(page.getByLabel("Your name")).toBeFocused();

    await page.getByLabel("Your name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByRole("button", { name: /sign in/ }).click();
    await expect(page.locator(".account-card")).toContainText("jane@example.com");
    await expect(page.getByText("No orders yet on this device.")).toBeVisible();

    await page.goto("/shop/cozy-dog-house");
    await page.getByRole("button", { name: /add to cart/ }).click();
    await page.getByRole("link", { name: "go to checkout" }).click();
    await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
    await expect(page.getByLabel("Email")).toHaveValue("jane@example.com");
    await fillShipping(page);
    await page.getByRole("button", { name: /place order/ }).click();
    await expect(page.getByRole("heading", { name: /Thank you, Jane/ })).toBeVisible();

    await page.goto("/account#orders");
    await expect(page.locator(".order-row")).toHaveCount(1);
    await expect(page.locator(".order-row")).toContainText("cozy dog house");
    // Address from the order is saved for next time.
    await expect(page.locator(".account-card")).toContainText("12 Maple Street");
  });
});

test("picks arrows scroll the rail and disable at the ends", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const prev = page.getByRole("button", { name: "Previous picks" });
  const next = page.getByRole("button", { name: "More picks" });
  await prev.scrollIntoViewIfNeeded();
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(prev).toBeEnabled();
  expect(await page.locator("#picks-rail").evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

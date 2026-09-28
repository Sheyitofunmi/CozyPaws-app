import { expect, test } from "@playwright/test";
import { cartDialog } from "./helpers";

test.describe("shop page", () => {
  test("sorting lives in the URL and reorders the grid", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("sort").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    const prices = await page.locator(".shop-card__price").allTextContents();
    const cents = prices.map((p) => Number(p.replace(/[^0-9]/g, "")));
    expect(cents).toEqual([...cents].sort((a, b) => a - b));

    await page.reload();
    await expect(page.getByLabel("sort")).toHaveValue("price-asc");
    // Merchandising cards only show in the default view.
    await expect(page.locator(".merch-card")).toHaveCount(0);
  });

  test("a card turns into a quantity stepper once the item is in the cart", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    const card = page.locator(".shop-card", { hasText: "fetch ball trio" });
    await card.getByRole("button", { name: "add to cart" }).click();
    await expect(cartDialog(page)).toBeVisible();
    await page.keyboard.press("Escape");

    await card.getByRole("button", { name: "Add one more fetch ball trio" }).click();
    await expect(card.locator(".shop-card__stepper-qty")).toContainText("2 in cart");
    await card.getByRole("button", { name: "Remove one fetch ball trio" }).click();
    await expect(card.locator(".shop-card__stepper-qty")).toContainText("1 in cart");
  });

  test("the dinner kit adds all three items", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /add all three/ }).click();
    const drawer = cartDialog(page);
    await expect(drawer.locator(".shop-cart__line")).toHaveCount(3);
    await expect(drawer).toContainText("ceramic slow bowl");
    await expect(drawer).toContainText("superfood kibble");
    await expect(drawer).toContainText("peanut butter bites");
  });
});

test.describe("homepage selling sections", () => {
  test("Biscuit's picks add real products to the cart", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const picks = page.getByRole("list", { name: "Biscuit's picks" });
    await picks.scrollIntoViewIfNeeded();
    await expect(picks.getByRole("listitem")).toHaveCount(6);
    await picks.getByRole("listitem").first().getByRole("button", { name: "add to cart" }).click();
    await expect(cartDialog(page)).toContainText("rope tug bundle");
  });

  test("service cards link to their category in the shop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "shop comfy beds" })).toHaveAttribute(
      "href",
      "/shop?category=comfy+beds",
    );
  });

  test("newsletter validates the email, then confirms", async ({ page }) => {
    await page.goto("/");
    const form = page.locator(".newsletter");
    await form.scrollIntoViewIfNeeded();
    await form.getByLabel("Email address").fill("not-an-email");
    await form.getByRole("button", { name: "sign me up" }).click();
    await expect(form.getByText("That email doesn't look right.")).toBeVisible();
    await expect(form.getByLabel("Email address")).toBeFocused();

    await form.getByLabel("Email address").fill("jane@example.com");
    await form.getByRole("button", { name: "sign me up" }).click();
    await expect(form.getByRole("status")).toContainText("You're in the pack!");
  });
});

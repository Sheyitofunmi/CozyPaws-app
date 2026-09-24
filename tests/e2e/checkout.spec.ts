import { expect, test } from "@playwright/test";
import { fillShipping, setDemo } from "./helpers";

test.describe("checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shop/cozy-dog-house");
    await page.getByRole("button", { name: /add to cart/ }).click();
    await page.getByRole("link", { name: "go to checkout" }).click();
    await expect(page.getByRole("heading", { name: "your cart", level: 1 })).toBeVisible();
  });

  test("a price change is shown for review, never charged silently", async ({ page, context, baseURL }) => {
    await fillShipping(page);
    await setDemo(context, baseURL!, { priceBump: { id: "cozy-dog-house", percent: 15 } });

    await page.getByRole("button", { name: /place order · \$54\.98/ }).click();

    const review = page.getByRole("region", { name: "Your total changed" });
    await expect(review).toBeVisible();
    await expect(review).toContainText("$49.99 → $57.49");
    await expect(page.getByRole("heading", { name: "Your total changed" })).toBeFocused();

    await review.getByRole("button", { name: /confirm new total · \$57\.49/ }).click();
    await expect(page.getByRole("heading", { name: /Thank you/ })).toBeVisible();
    await expect(page.getByText("$57.49")).toBeVisible();
  });

  test("double-clicking place order creates exactly one order", async ({ page, context, baseURL }) => {
    await setDemo(context, baseURL!, { latencyMs: 600 });
    await fillShipping(page);
    let requests = 0;
    page.on("request", (req) => {
      if (req.url().endsWith("/api/checkout")) requests += 1;
    });

    await page.getByRole("button", { name: /place order/ }).dblclick();
    await expect(page.getByRole("heading", { name: /Thank you/ })).toBeVisible();
    expect(requests).toBe(1);
  });

  test("validation errors are announced and focus the first bad field", async ({ page }) => {
    await page.getByLabel("Full name").fill("Jane Doe");
    await page.getByRole("button", { name: /place order/ }).click();

    const email = page.getByLabel("Email");
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter a valid email.")).toBeVisible();
  });
});

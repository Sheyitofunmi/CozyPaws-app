import { expect, test } from "@playwright/test";

// The map's tiles come from the internet; tests serve a tiny local style so
// they run offline and only check our behaviour (lazy load, list ↔ map).
const STYLE = { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: {} }] };

test.describe("contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://tiles.openfreemap.org/**", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify(STYLE) }),
    );
  });

  test("shows whether the team is in, in London time", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator(".open-badge")).toHaveText(/^(open now|closed) · /);
  });

  test("topic-specific fields appear, and are validated", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "My order" }).click();
    const order = page.getByLabel("Order number");
    await expect(order).toBeVisible();

    await page.getByLabel("Your name").fill("Jane Doe");
    await page.getByLabel("Email").fill("jane@example.com");
    await page.getByLabel("Message").fill("My leash hasn't arrived yet.");
    await order.fill("12345");
    await page.getByRole("button", { name: "send message" }).click();
    await expect(page.getByText("Order numbers start with CP-")).toBeVisible();
    await expect(order).toBeFocused();

    await order.fill("CP-M1ABCD");
    await page.getByRole("button", { name: "send message" }).click();
    await expect(page.getByRole("status").filter({ hasText: "CP-M1ABCD" })).toBeVisible();

    // Wholesale swaps in a company field instead.
    await page.getByRole("button", { name: "send another" }).click();
    await page.getByRole("button", { name: "Wholesale" }).click();
    await expect(page.getByLabel("Shop or company name")).toBeVisible();
    await expect(page.getByLabel("Order number")).toHaveCount(0);
  });

  test("the map loads only when it's near the screen, and the list drives it", async ({ page }) => {
    let mapRequested = false;
    page.on("request", (r) => {
      if (r.url().includes("tiles.openfreemap.org")) mapRequested = true;
    });
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    expect(mapRequested).toBe(false);

    await page.locator("#visit").scrollIntoViewIfNeeded();
    await expect(page.locator(".contact-map")).toHaveAttribute("data-state", "ready");
    await expect(page.locator(".maplibregl-marker")).toHaveCount(4);

    await page.getByRole("button", { name: /Highbury Fields/ }).click();
    await expect(page.getByRole("button", { name: /Highbury Fields/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: /directions to Highbury Fields/ })).toHaveAttribute(
      "href",
      /destination=51\.5497,-0\.1012/,
    );
  });

  test("if the map can't load, the page says so and keeps the directions", async ({ page }) => {
    await page.unroute("https://tiles.openfreemap.org/**");
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
    await page.goto("/contact");
    await page.locator("#visit").scrollIntoViewIfNeeded();
    await expect(page.getByText("The map couldn't load")).toBeVisible();
    await expect(page.getByRole("link", { name: /directions to the shop/ })).toBeVisible();
  });
});

test.describe("about page", () => {
  test("team cards flip to show the dog's stats (keyboard too)", async ({ page }) => {
    await page.goto("/about");
    const card = page.getByRole("button", { name: /Maya & Biscuit/ });
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("aria-pressed", "true");
    await expect(card.getByText("chief destroyer")).toBeVisible();
  });

  test("the Biscuit test links approved products to the shop", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: /rope tug bundle/ }).click();
    await expect(page).toHaveURL(/\/shop\/rope-tug-bundle$/);
  });
});

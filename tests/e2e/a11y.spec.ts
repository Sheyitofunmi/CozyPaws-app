import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { cartDialog } from "./helpers";

test("cart drawer is a real modal dialog", async ({ page }) => {
  await page.goto("/shop");
  const trigger = page.getByRole("button", { name: "Open cart" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = cartDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close cart" })).toBeFocused();

  // Focus stays trapped inside.
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const path of ["/shop", "/shop/cozy-dog-house", "/cart"]) {
  test(`no serious axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
  });
}

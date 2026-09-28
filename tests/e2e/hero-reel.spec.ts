import { expect, test } from "@playwright/test";

const reelVideos = (page: import("@playwright/test").Page) => page.locator(".hero-reel__video");

test.describe("video hero reel", () => {
  test("plays when scrolled into view, and the clip buttons jump", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2500); // intro settles
    await page.locator(".vimeo-hero").evaluate((el) => el.scrollIntoView());
    await expect(page.locator(".hero-reel.is-started")).toHaveCount(1, { timeout: 10_000 });

    await page.getByRole("button", { name: /Clip 3 of 6/ }).click();
    await expect(page.getByRole("button", { name: /Clip 3 of 6/ })).toHaveAttribute("aria-current", "true");
    const active = page.locator(".hero-reel__video.is-active");
    await expect(active).toHaveAttribute("src", /beach-trot/);
    await expect.poll(() => active.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.2);

    await page.getByRole("button", { name: "Pause dog videos" }).click();
    await expect.poll(() => active.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("reduced motion: nothing downloads until the visitor presses play", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const clipRequests: string[] = [];
    page.on("request", (r) => r.url().includes("/hero-reel/") && clipRequests.push(r.url()));
    await page.goto("/");
    await page.locator(".vimeo-hero").evaluate((el) => el.scrollIntoView());
    await page.waitForTimeout(1500);
    expect(clipRequests).toHaveLength(0);
    await expect(reelVideos(page).first()).not.toHaveAttribute("src", /./);

    await page.getByRole("button", { name: "Play dog videos" }).click();
    await expect(page.locator(".hero-reel.is-started")).toHaveCount(1, { timeout: 10_000 });
  });
});

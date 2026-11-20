import { test } from "@playwright/test";
import path from "path";

test.describe("Capture Prompt 17-A Screenshots", () => {
  const storeSlug = "lome-glow";
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("Capture Desktop & Mobile 17-A", async ({ page }) => {
    // 1. Desktop View
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(artifactDir, "prompt-17a-desktop-products-list.png"),
      fullPage: false,
    });

    // 2. Mobile View (iPhone 13 - 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/${storeSlug}/produits`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(artifactDir, "prompt-17a-mobile-iphone13.png"),
      fullPage: false,
    });

    // 3. Performance Produit
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits/performance`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(artifactDir, "prompt-17a-product-performance.png"),
      fullPage: false,
    });

    // 4. Import / Export
    await page.goto(`/app/${storeSlug}/produits/import-export`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(artifactDir, "prompt-17a-import-export.png"),
      fullPage: false,
    });
  });
});

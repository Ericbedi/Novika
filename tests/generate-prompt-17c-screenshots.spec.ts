import { test } from "@playwright/test";
import * as path from "path";

test.describe("Génération des captures d'écran officielles Prompt 17 - Phase 17-C & 17-D", () => {
  const outputDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";
  const storeSlug = "lome-glow";

  test("génère la capture desktop complète (1440px) avec toutes les sections", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_owner_01",
          email: "owner@novika.com",
          role: "owner",
          createdAt: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
      {
        name: "novika_active_role",
        value: "owner",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // Déplier les sections pour la visibilité
    const editSeoBtn = page.locator("#btn-edit-seo");
    if (await editSeoBtn.isVisible()) await editSeoBtn.click();
    const extraPriceBtn = page.locator("button:has-text('Prix d\\'affichage supplémentaires')");
    if (await extraPriceBtn.isVisible()) await extraPriceBtn.click();
    const stockDetailsBtn = page.locator("button:has-text('Plus de détails (SKU, code-barres, rupture)')");
    if (await stockDetailsBtn.isVisible()) await stockDetailsBtn.click();
    const variantsToggle = page.locator("#toggle-has-variants");
    if (await variantsToggle.isVisible()) await variantsToggle.click();

    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(outputDir, "prompt-17c-desktop-product-form.png"),
      fullPage: true,
    });
    console.log("Desktop full page capture saved!");
  });

  test("génère la capture mobile iPhone 13 (390px)", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_owner_01",
          email: "owner@novika.com",
          role: "owner",
          createdAt: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
      {
        name: "novika_active_role",
        value: "owner",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(outputDir, "prompt-17c-mobile-iphone13.png"),
      fullPage: false,
    });
    console.log("Mobile iPhone 13 capture saved!");
  });

  test("génère la capture vue closeuse restreinte (coûts masqués)", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_closer_01",
          email: "closer@novika.com",
          role: "closer",
          createdAt: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
      {
        name: "novika_active_role",
        value: "closer",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits/nouveau?role=closer`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(outputDir, "prompt-17c-closer-restricted.png"),
      fullPage: false,
    });
    console.log("Closer restricted capture saved!");
  });
});

import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACTS_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

test.describe("Prompt 17-M : Aperçu mobile iPhone 15 Pro Max par défaut & Responsive 360, 390, 430 px", () => {
  test("1. Écran 360 px (Android petit écran) : Aucun défilement horizontal, texte >= 16px, boutons >= 44px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality", {
      waitUntil: "networkidle",
    });

    // 1. Zéro défilement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // 2. Boutons d'action >= 44 px de haut (norme tactile Apple HIG)
    const addToCartBtn = page.locator('[data-testid="btn-add-to-cart"]');
    const buyNowBtn = page.locator('[data-testid="btn-buy-now"]');
    await expect(addToCartBtn).toBeVisible();
    await expect(buyNowBtn).toBeVisible();

    const addBox = await addToCartBtn.boundingBox();
    const buyBox = await buyNowBtn.boundingBox();
    expect(addBox?.height).toBeGreaterThanOrEqual(44);
    expect(buyBox?.height).toBeGreaterThanOrEqual(44);

    // 3. Inputs >= 16 px (évite le zoom automatique iOS Safari)
    const inputs = page.locator("input[type='text'], input[type='tel']");
    const count = await inputs.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const fontSizeStr = await inputs.nth(i).evaluate((el) => window.getComputedStyle(el).fontSize);
        const fontSizeNum = parseFloat(fontSizeStr);
        expect(fontSizeNum).toBeGreaterThanOrEqual(16);
      }
    }

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17m-android-360px.png"),
    });
  });

  test("2. Écran 390 px (iPhone 13) : Rendu fluide, zéro défilement, barre sticky safe-area", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality", {
      waitUntil: "networkidle",
    });

    // Zéro défilement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Barre sticky mobile
    const stickyBar = page.locator("#sticky-mobile-cta");
    await expect(stickyBar).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17m-iphone13-390px.png"),
    });
  });

  test("3. Écran 430 px (iPhone 15 Pro Max) : Rendu vitrine pleine largeur sans débordement", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality", {
      waitUntil: "networkidle",
    });

    // Zéro défilement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Bloc Bénéfices visible
    await expect(page.locator('[data-testid="product-benefits-block"]')).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17m-iphone15-promax-430px.png"),
    });
  });

  test("4. Éditeur de Thème : Sélecteur d'appareil, iPhone 15 Pro Max par défaut, bascule d'orientation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("http://localhost:3000/app/lome-glow/boutique-en-ligne", {
      waitUntil: "networkidle",
    });

    // 1. Barre du sélecteur d'appareil
    const selectorBar = page.locator('[data-testid="preview-device-selector-bar"]');
    await expect(selectorBar).toBeVisible();

    // 2. Par défaut : iPhone 15 Pro Max
    const selectDevice = page.locator('[data-testid="select-preview-device"]');
    await expect(selectDevice).toHaveValue("iphone-15-pro-max");

    // 3. Badge dimensions 430 × 932 px
    const dimensionsBadge = page.locator('[data-testid="preview-dimensions-badge"]');
    await expect(dimensionsBadge).toContainText("430 × 932 px");

    // 4. Cadre avec Dynamic Island
    await expect(page.locator('[data-testid="device-dynamic-island"]')).toBeVisible();

    // 5. Bascule vers iPhone 13
    await selectDevice.selectOption("iphone-13");
    await expect(dimensionsBadge).toContainText("390 × 844 px");
    await expect(page.locator('[data-testid="device-notch"]')).toBeVisible();

    // 6. Bascule Orientation Paysage
    const toggleOrientationBtn = page.locator('[data-testid="btn-toggle-orientation"]');
    await expect(toggleOrientationBtn).toBeVisible();
    await toggleOrientationBtn.click();
    await expect(dimensionsBadge).toContainText("844 × 390 px");

    // 7. Bouton ouvrir à cette taille
    const openBtn = page.locator('[data-testid="btn-open-preview-window"]');
    await expect(openBtn).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17m-theme-editor-preview.png"),
      fullPage: true,
    });
  });

  test("5. « Afficher en tant que client » : Ouvre la modale d'aperçu iPhone 15 Pro Max", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto("http://localhost:3000/app/lome-glow/produits", {
      waitUntil: "networkidle",
    });

    // Bouton Afficher en tant que client
    const viewAsCustomerBtn = page.locator('[data-testid="btn-view-as-customer"]');
    await expect(viewAsCustomerBtn).toBeVisible();
    await viewAsCustomerBtn.click();

    // Modale ouverte
    const previewModal = page.locator('[data-testid="client-preview-modal"]');
    await expect(previewModal).toBeVisible();

    // Iframe de la vitrine
    const iframe = page.locator('[data-testid="client-preview-iframe"]');
    await expect(iframe).toBeVisible();

    // Sélecteur d'appareil présent dans la modale
    const modalDeviceSelect = previewModal.locator('[data-testid="select-preview-device"]');
    await expect(modalDeviceSelect).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17m-client-preview-modal.png"),
    });

    // Fermeture de la modale
    const closeBtn = page.locator('[data-testid="btn-close-client-preview"]');
    await closeBtn.click();
    await expect(previewModal).toHaveCount(0);
  });
});

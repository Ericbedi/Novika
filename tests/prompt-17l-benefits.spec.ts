import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACTS_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

test.describe("Prompt 17-L : Bénéfices du produit, formules & rupture de stock", () => {
  test("1. Vitrine : affiche le bloc « Bénéfices du produit » et le sélecteur simple (− 1 +)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality", {
      waitUntil: "networkidle",
    });

    // 1. Bloc Bénéfices présent
    const benefitsBlock = page.locator('[data-testid="product-benefits-block"]');
    await expect(benefitsBlock).toBeVisible();
    await expect(benefitsBlock).toContainText("Pourquoi vous allez l'aimer");
    await expect(benefitsBlock).toContainText("Énergie propre et soutenue");
    await expect(benefitsBlock).toContainText("100% Ingrédients d'origine naturelle");

    // 2. Formules automatiques masquées : sélecteur simple (− 1 +) présent
    await expect(page.locator("text=Sélectionnez votre formule")).toHaveCount(0);
    await expect(page.locator("text=Pack Duo (-15 %)")).toHaveCount(0);
    await expect(page.locator("text=Pack Famille (-25 %)")).toHaveCount(0);
    await expect(page.locator("text=Quantité :")).toBeVisible();

    // 3. Boutons d'action normaux (en stock)
    await expect(page.locator('[data-testid="btn-add-to-cart"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-buy-now"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-out-of-stock-single"]')).toHaveCount(0);

    // Capture d'écran vitrine desktop
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17l-storefront-benefits.png"),
      fullPage: true,
    });
  });

  test("2. Vitrine : affiche UN SEUL bouton « Rupture de stock » pleine largeur si stock épuisé", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/the-detox-ventre-plat", {
      waitUntil: "networkidle",
    });

    // 1. Bouton unique de rupture de stock
    const singleOutOfStockBtn = page.locator('[data-testid="btn-out-of-stock-single"]');
    await expect(singleOutOfStockBtn).toBeVisible();
    await expect(singleOutOfStockBtn).toBeDisabled();
    await expect(singleOutOfStockBtn).toContainText("Rupture de stock");

    // 2. Pas de double bouton ni de boutons d'achat normaux
    await expect(page.locator('[data-testid="btn-add-to-cart"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="btn-buy-now"]')).toHaveCount(0);

    // Capture d'écran rupture de stock
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17l-storefront-out-of-stock.png"),
    });
  });

  test("3. Mobile iPhone 13 : Rendu fluide et ergonomique", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality", {
      waitUntil: "networkidle",
    });

    const benefitsBlock = page.locator('[data-testid="product-benefits-block"]');
    await expect(benefitsBlock).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17l-mobile-iphone13.png"),
    });
  });

  test("4. Formulaire Produit : Carte Bénéfices et toggle des offres", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("http://localhost:3000/app/lome-glow/produits/prod_01/modifier", {
      waitUntil: "networkidle",
    });

    // Carte Bénéfices du produit
    const benefitsCard = page.locator('[data-testid="card-product-benefits"]');
    await expect(benefitsCard).toBeVisible();
    await expect(page.locator('[data-testid="btn-ai-generate-benefits"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-add-benefit"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-benefits-title"]')).toHaveValue(
      "Pourquoi vous allez l'aimer"
    );

    // Toggle Offres groupées
    const toggleOffers = page.locator('[data-testid="toggle-show-quantity-offers"]');
    await expect(toggleOffers).toBeVisible();
    await expect(toggleOffers).not.toBeChecked();

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "prompt-17l-product-editor-benefits.png"),
      fullPage: true,
    });
  });
});

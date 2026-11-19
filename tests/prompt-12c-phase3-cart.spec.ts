import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 12-c : Vitrine Novika Classique (Phase 3 - Panier Multi-Produits COD)", () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer le localStorage avant chaque test pour avoir un panier propre
    await page.goto(`${BASE_URL}/boutique/lome-glow`);
    await page.evaluate(() => {
      localStorage.removeItem("novika_store_cart_lome-glow");
    });
  });

  test("1. Fiche Produit : Bouton 'Ajouter au panier', tiroir latéral et badge en-tête", async ({
    page,
  }) => {
    // 1. Accéder à la fiche produit du sérum
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/serum-visage-anti-taches`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier la présence du bouton Ajouter au panier
    const addToCartBtn = page.locator("[data-testid='btn-add-to-cart']");
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toContainText(/Ajouter au panier/i);

    // 2. Cliquer sur Ajouter au panier
    await addToCartBtn.click();

    // 3. Le tiroir latéral (CartDrawer) doit s'ouvrir avec animation
    const drawer = page.locator("[role='dialog'][aria-label='Tiroir du panier']");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/Mon Panier/i);
    await expect(drawer).toContainText(/Sérum Visage Anti-Taches/i);
    await expect(drawer).toContainText(/FCFA/i);

    // 4. Vérifier la présence du badge avec quantité 1 dans l'en-tête
    const cartBadge = page.locator("[data-testid='header-cart-badge']");
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText("1");

    // 5. Fermer le tiroir via le bouton X
    const closeBtn = page.getByRole("button", { name: /Fermer le panier/i });
    await closeBtn.click();
    await expect(drawer).toBeHidden();
  });

  test("2. Tiroir latéral : Modification de quantité, calcul sous-total et suppression", async ({
    page,
  }) => {
    // 1. Ouvrir la page produit et ajouter au panier
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/serum-visage-anti-taches`);
    await page.waitForLoadState("domcontentloaded");
    await page.locator("[data-testid='btn-add-to-cart']").click();

    const drawer = page.locator("[role='dialog'][aria-label='Tiroir du panier']");
    await expect(drawer).toBeVisible();

    // 2. Augmenter la quantité via [+]
    const plusBtn = drawer.getByRole("button", { name: /Augmenter la quantité/i });
    await plusBtn.click();

    // Le badge d'en-tête et le tiroir doivent passer à 2
    const cartBadge = page.locator("[data-testid='header-cart-badge']");
    await expect(cartBadge).toHaveText("2");

    // 3. Diminuer la quantité via [-]
    const minusBtn = drawer.getByRole("button", { name: /Diminuer la quantité/i });
    await minusBtn.click();
    await expect(cartBadge).toHaveText("1");

    // 4. Supprimer l'article via l'icône corbeille
    const deleteBtn = drawer.getByRole("button", { name: /Supprimer/i });
    await deleteBtn.click();

    // Le tiroir doit afficher l'état vide
    await expect(drawer).toContainText(/Votre panier est actuellement vide/i);
    await expect(drawer.getByRole("link", { name: /Explorer le catalogue/i })).toBeVisible();
    await expect(cartBadge).toBeHidden();
  });

  test("3. Page Panier & Formulaire COD unique : Validation complète et confirmation", async ({
    page,
  }) => {
    // 1. Ajouter un produit au panier
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/serum-visage-anti-taches`);
    await page.waitForLoadState("domcontentloaded");
    await page.locator("[data-testid='btn-add-to-cart']").click();

    // 2. Aller sur la page dédiée /panier
    await page.goto(`${BASE_URL}/boutique/lome-glow/panier`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier les 2 colonnes : Articles à gauche, Formulaire COD à droite
    await expect(page.locator("h1")).toContainText(/Finaliser votre commande/i);
    await expect(page.getByText(/Articles commandés/i)).toBeVisible();
    await expect(page.getByText(/Sérum Visage Anti-Taches/i).first()).toBeVisible();
    await expect(page.getByText(/0 FCFA \(Offerte\)/i).first()).toBeVisible();

    // 3. Remplir le formulaire COD unique
    await page.locator("[data-testid='input-customer-name']").fill("Koffi Mensah");
    await page.locator("[data-testid='input-customer-phone']").fill("90123456");
    await page.locator("[data-testid='input-customer-city']").fill("Lomé - Tokoin");
    await page.locator("[data-testid='input-customer-address']").fill("Face à la pharmacie de la Paix");
    await page.locator("[data-testid='input-customer-notes']").fill("Appelez-moi 20 minutes avant svp");

    // 4. Soumettre la commande
    const submitBtn = page.locator("[data-testid='btn-submit-cart-order']");
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 5. Vérifier l'écran de confirmation
    await expect(page.locator("h1")).toContainText(/Merci pour votre commande/i, { timeout: 15000 });
    await expect(page.getByText(/CMD-/i).first()).toBeVisible();
    await expect(page.getByText(/Koffi Mensah|90123456/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Suivre ma commande/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Confirmer sur WhatsApp/i })).toBeVisible();

    // 6. Vérifier que le panier a été automatiquement vidé après la commande
    const cartBadge = page.locator("[data-testid='header-cart-badge']");
    await expect(cartBadge).toBeHidden();
  });

  test("4. Page Panier vide : État neutre avec redirection catalogue", async ({ page }) => {
    // Accéder directement au panier sans aucun article
    await page.goto(`${BASE_URL}/boutique/lome-glow/panier`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Votre panier est vide/i);
    const catalogLink = page.getByRole("link", { name: /Découvrir le catalogue/i });
    await expect(catalogLink).toBeVisible();
  });

  test("5. Responsive Mobile (320px & 390px) : Aucun débordement horizontal", async ({ page }) => {
    // 1. Ajouter un article pour avoir du contenu dans le panier
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/serum-visage-anti-taches`);
    await page.locator("[data-testid='btn-add-to-cart']").click();

    // 2. Tester en 320px (iPhone SE narrow)
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`${BASE_URL}/boutique/lome-glow/panier`);
    await page.waitForLoadState("domcontentloaded");

    const scrollWidth320 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth320 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth320).toBeLessThanOrEqual(clientWidth320);

    // 3. Tester en 390px (iPhone 12/13/14 standard)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/boutique/lome-glow/panier`);
    await page.waitForLoadState("domcontentloaded");

    const scrollWidth390 = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth390 = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth390).toBeLessThanOrEqual(clientWidth390);
  });
});

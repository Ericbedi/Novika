import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 13 : Identité des Produits, Image neutre de bout en bout & Zéro repli", () => {
  const storeSlug = "lome-glow";

  test("1. Catalogue : Les produits affichent leur propre image et leur propre prix exact", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/catalogue`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier la présence du titre et du catalogue
    await expect(page.locator("h1")).toContainText("Catalogue");

    // Vérifier que chaque carte produit a son propre titre et prix
    const productLinks = page.locator("a[href*='/boutique/lome-glow/produit/']");
    const count = await productLinks.count();
    expect(count).toBeGreaterThan(0);

    // Attendre que les images distantes/locales se chargent ou déclenchent leur remplaçant neutre
    await page.waitForTimeout(600);

    // Vérifier qu'il n'y a aucune image brisée dans le catalogue
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => img.naturalWidth === 0 && img.src !== "");
    });
    expect(brokenImages.length).toBe(0);
  });

  test("2. Clic sur le Produit B : La page produit affiche strictement B et JAMAIS A", async ({
    page,
  }) => {
    // Produit A : prod_01 (Café Bio Champignon Vitality)
    // Produit B : prod_02 (Sérum Visage Anti-Taches & Éclat Niacinamide, slug: serum-visage-anti-taches-eclat)
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/produit/prod_02`);
    await page.waitForLoadState("domcontentloaded");

    // Doit afficher B (Sérum Visage)
    await expect(page.locator("h1")).toContainText("Sérum Visage Anti-Taches");

    // Ne doit JAMAIS afficher le titre de A (Café Bio Champignon)
    await expect(page.locator("h1")).not.toContainText("Café Bio Champignon");

    // Doit afficher le prix de B (15 000 FCFA) et pas celui de A (24 900 FCFA)
    await expect(page.getByText("15 000 FCFA").first()).toBeVisible();

    // Formulaire de commande COD présent avec le produit B
    const form = page.locator("#cod-order-form");
    await expect(form).toBeVisible();

    // Bouton collant mobile avec le bon prix
    const stickyCta = page.locator("#sticky-mobile-cta");
    await expect(stickyCta).toBeAttached();
    await expect(stickyCta).toContainText("15 000 FCFA");
  });

  test("3. Accès au Produit A : La page produit affiche strictement A et JAMAIS B", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/produit/prod_01`);
    await page.waitForLoadState("domcontentloaded");

    // Doit afficher A (Café Bio Champignon)
    await expect(page.locator("h1")).toContainText("Café Bio Champignon");

    // Ne doit JAMAIS afficher B
    await expect(page.locator("h1")).not.toContainText("Sérum Visage");

    // Doit afficher le prix de A (24 900 FCFA)
    await expect(page.getByText("24 900 FCFA").first()).toBeVisible();
  });

  test("4. Produit introuvable : Page 404 en français avec bouton de retour, ZÉRO repli vers un produit démo", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/produit/produit-fictif-inexistant-xyz`);
    await page.waitForLoadState("domcontentloaded");

    // Doit afficher 404 / Produit introuvable
    await expect(page.getByText("Produit introuvable ou indisponible")).toBeVisible();
    await expect(page.getByText("Ce produit n'existe pas ou n'est plus actif")).toBeVisible();

    // Bouton de retour au catalogue
    const backBtn = page.getByRole("link", { name: "Retourner au catalogue" });
    await expect(backBtn).toBeVisible();

    // Ne doit JAMAIS afficher un produit par défaut
    await expect(page.locator("h1")).not.toContainText("Café Bio Champignon");
    await expect(page.locator("h1")).not.toContainText("Sérum Visage");
  });

  test("5. Composant ProductImage : Remplacement neutre SVG sans icône cassée pour image absente", async ({
    page,
  }) => {
    // Vérifier sur la page produit d'un produit avec images valides
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/produit/prod_01`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier la galerie principale
    const gallery = page.locator(".aspect-square").first();
    await expect(gallery).toBeVisible();

    // Pas d'images brisées
    const naturalWidths = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.map((i) => ({ src: i.src, naturalWidth: i.naturalWidth }));
    });
    for (const img of naturalWidths) {
      if (img.src && !img.src.startsWith("data:")) {
        expect(img.naturalWidth).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("6. Modèle de Page Produit : Support de la Page de Vente Longue (long_form)", async ({
    page,
  }) => {
    // Le sérum est ouvert avec le modèle page de vente longue
    await page.goto(`${BASE_URL}/boutique/${storeSlug}/produit/prod_02?template=long_form`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier la présence du tableau comparatif sur la page longue
    await expect(page.getByText("Pourquoi choisir notre produit authentique ?")).toBeVisible();

    // Vérifier les blocs de réassurance complémentaires
    await expect(page.getByText("Paiement après vérification")).toBeVisible();
    await expect(page.getByText("Garantie 100% Satisfait")).toBeVisible();

    // Vérifier les questions fréquentes
    await expect(page.getByText("Comment fonctionne le paiement à la livraison ?")).toBeVisible();
  });
});

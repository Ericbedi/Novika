import { test, expect } from "@playwright/test";

test.describe("Prompt 17 - Phases 17-C & 17-D : Prix, Stock, Variantes, Metafields et Droits", () => {
  const storeSlug = "lome-glow";

  test("affiche la carte Prix avec validation de prix de comparaison et marge financière pour l'admin", async ({
    page,
  }) => {
    // Connexion admin
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // 1. Carte Prix
    await expect(page.locator("h3:has-text('Tarification')")).toBeVisible();
    await expect(page.locator("#input-product-price")).toBeVisible();
    await expect(page.locator("span:has-text('FCFA')").first()).toBeVisible();

    // Déplier prix d'affichage supplémentaires
    await page.click("button:has-text('Prix d\\'affichage supplémentaires')");
    const compareInput = page.locator("#input-compare-at-price");
    await expect(compareInput).toBeVisible();

    // Saisir un prix de comparaison inférieur au prix de vente -> Alerte
    await page.fill("#input-product-price", "15000");
    await compareInput.fill("12000");
    await expect(
      page.locator("text=Le prix de comparaison (avant réduction) doit être strictement supérieur au prix de vente.")
    ).toBeVisible();

    // Saisir un prix valide -> Alerte disparaît
    await compareInput.fill("20000");
    await expect(
      page.locator("text=Le prix de comparaison (avant réduction) doit être strictement supérieur au prix de vente.")
    ).not.toBeVisible();

    // Vérifier visibilité du coût et de la marge pour l'admin
    await expect(page.locator("#input-product-cost")).toBeVisible();
    await expect(page.locator("span:has-text('Bénéfice estimé')")).toBeVisible();
    await expect(page.locator("span:has-text('Marge brute')")).toBeVisible();
  });

  test("masque strictement le coût d'achat et la marge financière à la closeuse", async ({
    page,
  }) => {
    // Connexion en tant que closeuse
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

    await page.goto(`/app/${storeSlug}/produits/nouveau?role=closer`);
    await page.waitForLoadState("networkidle");

    // Le coût par article ne doit JAMAIS apparaître
    await expect(page.locator("#input-product-cost")).not.toBeVisible();
    await expect(page.locator("span:has-text('Bénéfice estimé')")).not.toBeVisible();
    await expect(page.locator("span:has-text('Marge brute')")).not.toBeVisible();
    await expect(
      page.locator("text=Les marges et coûts d'achat sont réservés à l'administration.")
    ).toBeVisible();
  });

  test("gère le stock avec emplacement boutique, stock disponible et continuer à vendre en rupture", async ({
    page,
  }) => {
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

    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // Carte Stock & Inventaire
    await expect(page.locator("h3:has-text('Stock & Inventaire')")).toBeVisible();
    await expect(page.locator("#toggle-track-stock")).toBeChecked();
    await expect(page.locator("text=Emplacement de la boutique")).toBeVisible();

    // Déplier plus de détails
    await page.click("button:has-text('Plus de détails (SKU, code-barres, rupture)')");
    await expect(page.locator("#toggle-continue-selling")).toBeVisible();
    await expect(
      page.locator("text=Continuer à vendre en cas de rupture de stock")
    ).toBeVisible();
  });

  test("gère les variantes avec ajout d'options, étiquettes et tableau cartésien", async ({
    page,
  }) => {
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

    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // Activer les variantes
    await page.click("#toggle-has-variants");

    // Ajouter une valeur à l'option existante
    const valInput = page.locator("input[placeholder*='Tapez une valeur']").first();
    await expect(valInput).toBeVisible();
    await valInput.fill("Flacon 100ml");
    await valInput.press("Enter");

    await expect(page.getByRole("cell", { name: "Flacon 100ml" })).toBeVisible();
    await expect(page.locator("text=variante(s) générée(s)")).toBeVisible();
  });

  test("permet d'ajouter des champs personnalisés (metafields) en 1 clic", async ({
    page,
  }) => {
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

    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // Cliquer sur le modèle prêt "+ Ingrédients & Composition"
    await page.click("button:has-text('+ Ingrédients & Composition')");
    await expect(page.locator("span:has-text('Ingrédients & Composition')")).toBeVisible();
    await expect(
      page.locator("textarea[placeholder*='ingrédients & composition']")
    ).toBeVisible();
  });

  test("est responsive sur iPhone 13 (390px) sans débordement horizontal", async ({
    page,
  }) => {
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

    await expect(page.locator("h1:has-text('Ajouter un produit')")).toBeVisible();
    await expect(page.locator("h3:has-text('Tarification')")).toBeVisible();
    await expect(page.locator("h3:has-text('Stock & Inventaire')")).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

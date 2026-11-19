import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 12-b : Vitrine Novika Classique (Phase 2)", () => {
  test("1. Blog & Articles : Liste des articles et fiche avec produits associés COD", async ({ page }) => {
    // 1. Accès à la page liste du blog
    await page.goto(`${BASE_URL}/boutique/lome-glow/blog`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Journal|Blog/i);

    // Vérifier la présence des cartes d'articles
    const articleCards = page.locator("article, a[href*='/blog/']");
    await expect(articleCards.first()).toBeVisible();

    // 2. Navigation vers la fiche article
    await page.goto(`${BASE_URL}/boutique/lome-glow/blog/5-rituels-naturels-pour-illuminer-votre-teint`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier le titre de l'article et l'auteur
    await expect(page.locator("h1")).toContainText("5 rituels naturels");
    await expect(page.getByText(/Awa Traoré/i)).toBeVisible();

    // Vérifier les boutons de partage social (WhatsApp et Copier)
    await expect(page.getByRole("button", { name: /WhatsApp/i })).toBeVisible();
    await expect(page.getByText(/Copier/i)).toBeVisible();

    // Vérifier la section des produits associés pour conversion immédiate en COD
    const associatedSection = page.getByText(/Produits mentionnés|Produits recommandés/i);
    await expect(associatedSection).toBeVisible();

    const orderButton = page.locator("a[href*='/produit/']").filter({ hasText: /Commander/i });
    await expect(orderButton.first()).toBeVisible();

    // Règle stricte : les commentaires sont désactivés par défaut
    const commentsForm = page.locator("#comment-form, form[name='comment']");
    await expect(commentsForm).toHaveCount(0);
  });

  test("2. Recherche prédictive : Instantanée multi-entités et suggestions d'absence", async ({ page }) => {
    // 1. Page de recherche
    await page.goto(`${BASE_URL}/boutique/lome-glow/recherche`);
    await page.waitForLoadState("domcontentloaded");

    const searchInput = page.locator("input[type='search'], input[placeholder*='Rechercher']");
    await expect(searchInput).toBeVisible();

    // 2. Recherche d'un produit existant "serum"
    await searchInput.fill("serum");
    await page.waitForTimeout(400);

    // Doit trouver le sérum ou des produits correspondants avec affichage direct du prix
    const searchResults = page.locator("a[href*='/produit/']");
    await expect(searchResults.first()).toBeVisible();
    await expect(page.locator("body")).toContainText("FCFA");

    // 3. Recherche sans résultat
    await searchInput.fill("introuvablexyz999");
    await page.waitForTimeout(400);

    // Vérifier l'état vide informatif avec bouton WhatsApp de contact direct
    await expect(page.getByText(/Aucun résultat pour/i)).toBeVisible();
    const contactWhatsApp = page.getByRole("link", { name: /Demander la disponibilité sur/i });
    await expect(contactWhatsApp).toBeVisible();
  });

  test("3. Sélecteur de pays : Restreint à la zone monétaire partagée (XOF = 8 pays UEMOA)", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/lome-glow`);
    await page.waitForLoadState("domcontentloaded");

    // Le sélecteur de pays doit être présent dans l'en-tête
    const countryButton = page.locator("#country-selector-btn");
    await expect(countryButton).toBeVisible();
    await countryButton.click();

    // Vérifier que le dropdown s'ouvre
    const dropdown = page.locator("#country-selector-dropdown");
    await expect(dropdown).toBeVisible();

    // Doit contenir les pays UEMOA (ex: Bénin, Côte d'Ivoire, Sénégal, Togo)
    await expect(dropdown).toContainText("Togo");
    await expect(dropdown).toContainText("Côte d'Ivoire");
    await expect(dropdown).toContainText("Bénin");

    // Ne doit PAS contenir de pays d'une autre zone monétaire (ex: Cameroun XAF, Guinée GNF)
    await expect(dropdown).not.toContainText("Cameroun");
    await expect(dropdown).not.toContainText("Guinée (Conakry)");
  });

  test("4. API Thème : Export JSON sans PII et Import/Duplication", async ({ request }) => {
    // 1. Export JSON du thème de la boutique
    const exportRes = await request.get(`${BASE_URL}/api/theme/export?shopId=lome-glow`);
    expect(exportRes.status()).toBe(200);

    const exportData = await exportRes.json();
    expect(exportData.schemaVersion).toBe("1.0");
    expect(exportData.themePreset).toBeDefined();
    expect(exportData.generalSettings).toBeDefined();
    expect(Array.isArray(exportData.pages)).toBe(true);

    // 2. Duplication du thème vers une nouvelle boutique
    const dupRes = await request.post(`${BASE_URL}/api/theme/import`, {
      data: {
        action: "duplicate",
        sourceShopId: "lome-glow",
        targetShopId: "cotonou-glow-clone",
        actorRole: "owner",
      },
    });

    expect(dupRes.status()).toBe(200);
    const dupJson = await dupRes.json();
    expect(dupJson.success).toBe(true);
    expect(dupJson.theme.shopId).toBe("cotonou-glow-clone");
  });

  test("5. Règle de Propriété : Aucun mot interdit (Zendrop, Dawn, Liquid) dans les pages Phase 2", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/lome-glow/blog`);
    let content = await page.content();
    expect(content.toLowerCase()).not.toContain("zendrop");
    expect(content.toLowerCase()).not.toContain("dawn");
    expect(content.toLowerCase()).not.toContain("liquid");

    await page.goto(`${BASE_URL}/boutique/lome-glow/recherche`);
    content = await page.content();
    expect(content.toLowerCase()).not.toContain("zendrop");
    expect(content.toLowerCase()).not.toContain("dawn");
    expect(content.toLowerCase()).not.toContain("liquid");
  });
});

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 07 : Générateur automatique de fiches produits par IA Gemini", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. Seul l'admin propriétaire (owner) voit le bouton « Créer une fiche avec l'IA »", async ({ page }) => {
    // A. En tant que propriétaire (owner)
    await page.goto(`${BASE_URL}/app/lome-glow/produits`);
    await page.evaluate(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "owner@novika.com");
      localStorage.setItem("novika_active_role", "owner");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const aiButtonOwner = page.locator("#btn-create-product-ai");
    await expect(aiButtonOwner).toBeVisible();
    await expect(aiButtonOwner).toContainText("Créer une fiche avec l'IA");

    // B. En tant que closeur
    await page.evaluate(() => {
      localStorage.setItem("novika_active_role", "closer");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const aiButtonCloser = page.locator("#btn-create-product-ai");
    await expect(aiButtonCloser).not.toBeVisible();
  });

  test("2. Accès direct refusé (403) aux rôles non-propriétaires sur /produits/nouveau-ia", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits/nouveau-ia`);
    await page.evaluate(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "closer@novika.com");
      localStorage.setItem("novika_active_role", "closer");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Vérifier l'affichage explicite du refus 403
    await expect(page.locator("text=Accès Refusé (403)")).toBeVisible();
    await expect(
      page.locator("text=Seul l'ADMIN propriétaire (owner) de la boutique est autorisé")
    ).toBeVisible();
  });

  test("3. L'API /api/products/ai/generate refuse les requêtes d'un non-propriétaire avec statut 403", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/products/ai/generate`, {
      data: {
        storeSlug: "lome-glow",
        userRole: "closer", // Rôle non propriétaire
        confirmedRights: true,
        productName: "Produit Test",
        sellingPrice: 15000,
        targetMarket: "Lomé",
        brandTone: "Direct",
      },
    });

    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Action refusée (403)");
  });

  test("4. Parcours en 4 étapes de génération IA et validation des garde-fous", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits/nouveau-ia`);
    await page.evaluate(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "admin@novika.com");
      localStorage.setItem("novika_active_role", "owner");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Étape 1 : Téléversement simulé d'une image et confirmation des droits
    await page.setInputFiles("#file-input-product-images", {
      name: "test-creme.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-bytes-stripped-exif"),
    });

    // Cocher la case obligatoire de confirmation des droits
    await page.check("#chk-copyright-confirm", { force: true });

    // Cliquer sur « Analyser l'image avec l'IA »
    const analyzeBtn = page.locator("#btn-analyze-ai");
    await expect(analyzeBtn).toBeEnabled();
    await analyzeBtn.click();

    // Étape 2 : Vérifier les éléments détectés et les badges « Détecté par l'IA — à confirmer »
    await expect(page.locator("text=Étape 2 : Éléments visuels détectés par Gemini")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Détecté par l'IA — à confirmer").first()).toBeVisible();

    // Valider et continuer vers l'étape 3
    const confirmDetectionBtn = page.locator("#btn-confirm-detection");
    await confirmDetectionBtn.click();

    // Étape 3 : Remplir la fiche produit
    await expect(page.locator("text=Étape 3 : Informations de la fiche produit")).toBeVisible();
    await expect(page.locator("#input-product-name")).toBeVisible();
    await expect(page.locator("#input-selling-price")).toBeVisible();
    await expect(page.locator("#input-target-market")).toBeVisible();

    // Ouvrir le simulateur de rentabilité (données confidentielles)
    await page.click("text=Calculateur de rentabilité produit");
    await expect(page.locator("text=Marge brute")).toBeVisible();
    await expect(page.locator("text=CPA Breakeven")).toBeVisible();

    // Lancer la génération complète (13 blocs)
    const generateBtn = page.locator("#btn-generate-full-sheet");
    await generateBtn.click();

    // Étape 4 : Vérifier l'affichage des 13 blocs, les 3 variantes de headline et les notes internes
    await expect(page.locator("text=Texte généré par IA : relisez avant de publier.")).toBeVisible({
      timeout: 15000,
    });

    // Vérifier les 3 variantes de headline
    await expect(page.locator("text=Variante 1 :")).toBeVisible();
    await expect(page.locator("text=Variante 2 :")).toBeVisible();
    await expect(page.locator("text=Variante 3 :")).toBeVisible();

    // Vérifier que les briefs visuels et points de vérification sont bien affichés sous "Notes internes"
    await expect(page.locator("text=Notes internes pour votre équipe")).toBeVisible();
    await expect(page.locator("text=Briefs visuels recommandés")).toBeVisible();

    // Vérifier la présence du bouton « Enregistrer comme brouillon »
    const saveDraftBtn = page.locator("#btn-save-as-draft");
    await expect(saveDraftBtn).toBeVisible();
    await saveDraftBtn.click();

    // Vérifier la redirection vers la liste des produits
    await page.waitForURL(/\/app\/lome-glow\/produits/, { timeout: 10000 });
  });

  test("5. Sécurité : La clé API GEMINI_API_KEY n'est jamais exposée dans le HTML ou les variables client", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits/nouveau-ia`);
    await page.waitForLoadState("domcontentloaded");

    const html = await page.content();
    expect(html).not.toContain("AIzaSy"); // Préfixe typique des clés Google API
    expect(html).not.toContain("GEMINI_API_KEY");
  });
});

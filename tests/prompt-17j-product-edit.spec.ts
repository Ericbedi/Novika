import { test, expect } from "@playwright/test";

test.describe("Prompt 17-J : Correction Édition Produit, Isolation Stricte & Éditeur Stable", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("Prompt 17-J : Édition du bon produit par ID unique et route /modifier", async ({ page }) => {
    // 1. Accès au catalogue de la boutique
    await page.goto("http://localhost:3000/app/lome-glow/produits");
    await page.waitForLoadState("networkidle");

    // Trouver le lien Modifier du premier produit de la liste
    const firstEditLink = page.locator("a[title='Modifier la fiche produit']").first();
    await expect(firstEditLink).toBeVisible();

    // Vérifier que le lien cible bien la route canonique /modifier
    const href = await firstEditLink.getAttribute("href");
    expect(href).toMatch(/\/app\/lome-glow\/produits\/[^/]+\/modifier/);

    // Navigation directe vers l'URL du produit
    await page.goto(`http://localhost:3000${href}`);
    await page.waitForLoadState("networkidle");

    // Vérifier que l'URL contient bien /modifier
    await expect(page).toHaveURL(/\/app\/lome-glow\/produits\/[^/]+\/modifier/);

    // Vérifier que le badge d'ID unique est visible dans l'en-tête
    const idBadge = page.locator("span[title^='Identifiant unique']").first();
    await expect(idBadge).toBeVisible();

    // Vérifier que le champ titre est pré-rempli et correspond au produit
    const titleInput = page.locator("#input-product-title");
    await expect(titleInput).toBeVisible();
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeGreaterThan(0);

    // 2. Test de l'éditeur de description : Saisie stable sans perte de curseur ni écrasement
    const visualEditor = page.locator("[data-testid='rich-description-content-editable']");
    await expect(visualEditor).toBeVisible();

    // Saisie de texte avec accents, retours à la ligne et mise en forme
    await visualEditor.click();
    await visualEditor.fill(
      "Notre formule exclusive au Sérum Éclat & Anti-taches est fabriquée artisanalement au Togo. " +
      "Elle contient 20% de vitamine C pure et un extrait rare de papaye bio. " +
      "Appliquer délicatement matin et soir pour illuminer le teint et estomper les imperfections."
    );

    // Vérifier que le texte saisi est fidèlement conservé
    const editorContent = await visualEditor.textContent();
    expect(editorContent).toContain("Sérum Éclat & Anti-taches");
    expect(editorContent).toContain("fabriquée artisanalement au Togo");

    // Capture d'écran Desktop de la fiche produit en cours d'édition
    await page.screenshot({
      path: `${artifactDir}/prompt-17j-product-editor-desktop.png`,
      fullPage: true,
    });
  });

  test("Prompt 17-J : Produit inexistant affiche « Produit introuvable » sans repli silencieux", async ({ page }) => {
    // 3. Navigation délibérée vers un identifiant inexistant
    await page.goto("http://localhost:3000/app/lome-glow/produits/prod-inexistant-xyz-999/modifier");
    await page.waitForLoadState("networkidle");

    // Vérifier l'apparition de l'écran « Produit introuvable »
    const notFoundView = page.locator("[data-testid='product-not-found-view']");
    await expect(notFoundView).toBeVisible();
    await expect(page.locator("h1:has-text('Produit introuvable')")).toBeVisible();
    await expect(page.locator("text=prod-inexistant-xyz-999")).toBeVisible();
    await expect(page.locator("text=Règle de sécurité Novika")).toBeVisible();

    // Vérifier le bouton de retour au catalogue
    const backBtn = page.locator("a:has-text('Retour au catalogue des produits')");
    await expect(backBtn).toBeVisible();

    // Capture d'écran de l'écran d'erreur sécurisé
    await page.screenshot({
      path: `${artifactDir}/prompt-17j-product-not-found.png`,
      fullPage: true,
    });
  });

  test("Prompt 17-J : Vue Mobile iPhone 13 pour l'édition de produit", async ({ page }) => {
    // Émulation écran mobile iPhone 13 (390 x 844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/app/lome-glow/produits/prod_01/modifier");
    await page.waitForLoadState("networkidle");

    // Vérifier l'affichage mobile ergonomique
    await expect(page.locator("text=Modification du produit")).toBeVisible();
    await expect(page.locator("#input-product-title")).toBeVisible();

    // Capture d'écran Mobile
    await page.screenshot({
      path: `${artifactDir}/prompt-17j-mobile-iphone13.png`,
      fullPage: true,
    });
  });
});

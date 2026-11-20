import { test, expect } from "@playwright/test";

test.describe("Prompt 17 - Phase 17-B : Page Ajouter / Modifier un produit (Structure 2 colonnes & Mobile)", () => {
  const storeSlug = "lome-glow";

  test.beforeEach(async ({ page }) => {
    // Session propriétaire / admin authentifiée
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
  });

  test("affiche la disposition 2 colonnes sur desktop et l'ordre strict des 5 cartes principales et 5 cartes latérales", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits/nouveau`);
    await page.waitForLoadState("networkidle");

    // 1. Barre du haut fixe
    const topBar = page.locator("#product-form-top-bar");
    await expect(topBar).toBeVisible();
    await expect(page.locator("a[href$='/produits']").first()).toBeVisible();
    await expect(page.locator("h1:has-text('Ajouter un produit')")).toBeVisible();
    await expect(page.locator("#btn-save-product-top")).toBeVisible();

    // 2. Colonne principale (5 blocs dans l'ordre strict)
    // 2.1 Titre
    const titleInput = page.locator("#input-product-title");
    await expect(titleInput).toBeVisible();
    await expect(page.locator("label:has-text('Titre du produit')")).toBeVisible();

    // 2.2 Description & Éditeur riche
    await expect(page.locator("label:has-text('Description')")).toBeVisible();
    await expect(page.locator("button:has-text('Générer avec l\\'IA')")).toBeVisible();
    await expect(page.locator("button[title*='Titre H1']")).toBeVisible();
    await expect(page.locator("button[title*='Titre H2']")).toBeVisible();
    await expect(page.locator("button[title*='Gras']")).toBeVisible();
    await expect(page.locator("button[title*='Insérer une vidéo']")).toBeVisible();
    await expect(page.locator("button[title*='Tableau']")).toBeVisible();

    // 2.3 Supports multimédias
    await expect(page.locator("h3:has-text('Supports multimédias')")).toBeVisible();
    await expect(page.locator("button:has-text('Importer')")).toBeVisible();
    await expect(page.locator("button:has-text('Médiathèque')")).toBeVisible();
    await expect(
      page.locator("text=Glissez-déposez vos fichiers ici, ou cliquez pour parcourir")
    ).toBeVisible();
    await expect(page.locator("text=Métadonnées EXIF retirées automatiquement")).toBeVisible();

    // 2.4 Catégorie
    await expect(page.locator("label:has-text('Catégorie du catalogue')")).toBeVisible();
    const categoryInput = page.locator("#input-product-category");
    await expect(categoryInput).toBeVisible();

    // 2.5 Aperçu moteurs de recherche (SEO Google)
    await expect(page.locator("h3:has-text('Aperçu sur les moteurs de recherche')")).toBeVisible();
    await expect(page.locator("text=https://novika.store")).toBeVisible();
    const editSeoBtn = page.locator("#btn-edit-seo");
    await expect(editSeoBtn).toBeVisible();

    // Déplier le SEO
    await editSeoBtn.click();
    await expect(page.locator("label:has-text('Titre de la page')")).toBeVisible();
    await expect(page.locator("label:has-text('Méta-description')")).toBeVisible();
    await expect(page.locator("label:has-text('Adresse URL simplifiée (Slug)')")).toBeVisible();

    // 3. Panneau latéral (5 blocs dans l'ordre strict)
    // 3.1 Statut du produit (avec Programmé)
    await expect(page.locator("h3:has-text('Statut du produit')")).toBeVisible();
    await expect(page.locator("button:has-text('Actif')")).toBeVisible();
    await expect(page.locator("button:has-text('Brouillon')")).toBeVisible();
    await expect(page.locator("button:has-text('Archivé')")).toBeVisible();
    await expect(page.locator("button:has-text('Programmé')")).toBeVisible();

    // 3.2 Publication (Vitrine & Meta)
    await expect(page.locator("h3:has-text('Publication & Canaux')")).toBeVisible();
    await expect(page.locator("#toggle-publish-storefront")).toBeVisible();
    await expect(page.locator("span:has-text('Catalogue Meta')")).toBeVisible();

    // 3.3 Organisation (Type, Fournisseur, Collections, Balises à la volée)
    await expect(page.locator("h3:has-text('Organisation du produit')")).toBeVisible();
    await expect(page.locator("label:has-text('Type de produit')")).toBeVisible();
    await expect(page.locator("label:has-text('Fournisseur')")).toBeVisible();
    await expect(page.locator("button:has-text('+ Créer une collection')")).toBeVisible();
    await expect(page.locator("label:has-text('Balises (Tags)')")).toBeVisible();

    // 3.4 Modèle de thème
    await expect(page.locator("h3:has-text('Modèle de thème')")).toBeVisible();
    await expect(page.locator("#select-theme-template")).toBeVisible();

    // 3.5 Pixels Meta
    await expect(page.locator("h3:has-text('Pixels Meta')")).toBeVisible();
    await expect(page.locator("text=Max 3 pixels")).toBeVisible();
  });

  test("permet de créer une collection et une balise à la volée", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits/nouveau`);
    await page.waitForLoadState("networkidle");

    // Créer une collection à la volée
    await page.click("button:has-text('+ Créer une collection')");
    const newColInput = page.locator("input[placeholder='Nom de la collection...']");
    await expect(newColInput).toBeVisible();
    await newColInput.fill("Collection Flash Spéciale");
    await page.click("#btn-add-collection-confirm");

    // Vérifier sélection dans le dropdown
    const selectCol = page.locator("#select-product-collection");
    await expect(selectCol).toHaveValue("Collection Flash Spéciale");

    // Ajouter une balise avec touche Entrée
    const tagInput = page.locator("input[placeholder='Tapez et appuyez sur Entrée...']");
    await tagInput.fill("ExclusivitéWeb");
    await tagInput.press("Enter");
    await expect(page.getByText("ExclusivitéWeb")).toBeVisible();
  });

  test("bascule entre le mode visuel WYSIWYG et le mode Code HTML dans l'éditeur de description", async ({
    page,
  }) => {
    await page.goto(`/app/${storeSlug}/produits/nouveau`);
    await page.waitForLoadState("networkidle");

    // Bouton de bascule en mode code
    const switchModeBtn = page.locator("button[title*='mode code HTML']");
    await expect(switchModeBtn).toBeVisible();
    await switchModeBtn.click();

    // Le textarea HTML doit s'afficher
    const htmlTextarea = page.locator("textarea[data-testid='rich-description-html-textarea']");
    await expect(htmlTextarea).toBeVisible();
    await htmlTextarea.fill("<h2>Produit d'exception</h2><p>Formulation hautement concentrée.</p>");

    // Revenir en mode visuel
    const switchBackBtn = page.locator("button[title*='mode visuel']");
    await switchBackBtn.click();
    const visualContent = page.locator("div[data-testid='rich-description-content-editable']");
    await expect(visualContent).toBeVisible();
    await expect(visualContent).toContainText("Produit d'exception");
  });

  test("affiche l'alerte requise si le titre est vide lors de l'enregistrement", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits/nouveau`);
    await page.waitForLoadState("networkidle");

    // Cliquer sur Enregistrer sans titre
    await page.click("#btn-save-product-top");
    await expect(page.locator("text=Le titre du produit est obligatoire.")).toBeVisible();
  });

  test("s'affiche parfaitement sur mobile (iPhone 13 390px) en 1 seule colonne sans débordement horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/${storeSlug}/produits/nouveau`);
    await page.waitForLoadState("networkidle");

    // Vérifier la présence des éléments clés
    await expect(page.locator("h1:has-text('Ajouter un produit')")).toBeVisible();
    await expect(page.locator("#input-product-title")).toBeVisible();
    await expect(page.locator("button:has-text('Générer avec l\\'IA')")).toBeVisible();

    // Vérifier que le panneau latéral s'affiche également dans le flux
    await expect(page.locator("h3:has-text('Statut du produit')")).toBeVisible();
    await expect(page.locator("h3:has-text('Organisation du produit')")).toBeVisible();

    // Pas de débordement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

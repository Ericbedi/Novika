import { test, expect } from "@playwright/test";

test.describe("Prompt 17 - Phase 17-A : Accueil Produits", () => {
  const storeSlug = "lome-glow";

  test("affiche la barre du haut avec tous les boutons d'action", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    // Titre de la page
    const title = page.locator("h1");
    await expect(title).toContainText("Produits");

    // Boutons de la barre supérieure
    const clientViewBtn = page.locator("a:has-text('Afficher en tant que client')");
    await expect(clientViewBtn).toBeVisible();
    await expect(clientViewBtn).toHaveAttribute("target", "_blank");

    const importBtn = page.locator("#btn-import-csv");
    await expect(importBtn).toBeVisible();

    const exportBtn = page.locator("#btn-export-csv");
    await expect(exportBtn).toBeVisible();

    const addProductBtn = page.locator("#btn-add-product-main");
    await expect(addProductBtn).toBeVisible();
  });

  test("affiche le sous-menu officiel Produits (5 onglets)", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    // Vérifier les 5 onglets demandés dans Prompt 17 dans la zone principale
    const main = page.locator("main");
    await expect(main.locator("a[href$='/produits']").first()).toBeVisible();
    await expect(main.locator("a[href$='/produits/collections']")).toBeVisible();
    await expect(main.locator("a[href$='/produits/stock']")).toBeVisible();
    await expect(main.locator("a[href$='/produits/import-export']")).toBeVisible();
    await expect(main.locator("a[href$='/produits/performance']")).toBeVisible();
  });

  test("affiche le bandeau des 3 indicateurs avec sélecteur de période", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    // Les 3 cartes d'indicateurs
    await expect(page.locator("text=Taux de vente moyen")).toBeVisible();
    await expect(page.locator("text=Jours de stock restants")).toBeVisible();
    await expect(page.locator("text=Analyse ABC")).toBeVisible();

    // Sélecteur de période
    await expect(page.locator("button:has-text('30 j')")).toBeVisible();
    await expect(page.locator("button:has-text('7 j')")).toBeVisible();
    await expect(page.locator("button:has-text(\"Aujourd'hui\")")).toBeVisible();

    // Clic sur une période
    await page.locator("button:has-text('7 j')").click();
    await expect(page.locator("text=Taux de vente moyen")).toBeVisible();
  });

  test("permet de filtrer par vues rapides et recherche multi-critères", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    // Vues rapides
    await expect(page.locator("#tab-view-all")).toBeVisible();
    await expect(page.locator("#tab-view-active")).toBeVisible();
    await expect(page.locator("#tab-view-draft")).toBeVisible();
    await expect(page.locator("#tab-view-archived")).toBeVisible();
    await expect(page.locator("#tab-view-out_of_stock")).toBeVisible();
    await expect(page.locator("#tab-view-low_stock")).toBeVisible();
    await expect(page.locator("#tab-view-trash")).toBeVisible();

    // Recherche
    const searchInput = page.locator("#input-product-search");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("sérum");
    await page.waitForTimeout(300);
  });

  test("affiche le choix des colonnes optionnelles", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    const colBtn = page.locator("#btn-columns-picker");
    await expect(colBtn).toBeVisible();
    await colBtn.click();

    // Vérifier les options dans le menu
    await expect(page.locator("label:has-text('Fournisseur')")).toBeVisible();
    await expect(page.locator("label:has-text('Collections')")).toBeVisible();
    await expect(page.locator("label:has-text('Dernière modification')")).toBeVisible();
  });

  test("affiche la barre d'actions groupées avec activation du suivi de stock", async ({ page }) => {
    await page.goto(`/app/${storeSlug}/produits`);

    // Cocher le premier produit
    const firstCheckbox = page.locator("input[id^='checkbox-product-']").first();
    await firstCheckbox.check();

    // La barre flottante apparaît
    const batchBar = page.locator("#batch-bar");
    await expect(batchBar).toBeVisible();

    // Vérifier les actions
    await expect(batchBar.locator("button:has-text('Modifier le statut')")).toBeVisible();
    await expect(batchBar.locator("button:has-text('Ajouter à une collection')")).toBeVisible();
    await expect(batchBar.locator("button:has-text('Ajouter une balise')")).toBeVisible();
    await expect(batchBar.locator("#btn-batch-enable-stock")).toBeVisible();

    // Cliquer sur Activer le suivi de stock
    await batchBar.locator("#btn-batch-enable-stock").click();
    await expect(page.locator("text=Activer le suivi de stock ?")).toBeVisible();
    await expect(page.locator("button:has-text('Annuler')").last()).toBeVisible();
    await page.locator("button:has-text('Annuler')").last().click();
  });

  test("responsive mobile iPhone 13 (390px)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/app/${storeSlug}/produits`);

    // Titre et contenu visibles sans débordement
    await expect(page.locator("h1")).toContainText("Produits");
    await expect(page.locator("a:has-text('Afficher en tant que client')")).toBeVisible();
  });
});

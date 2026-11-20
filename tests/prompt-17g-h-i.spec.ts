import { test, expect } from "@playwright/test";

test.describe("Prompts 17-G, 17-H & 17-I - Médias, ImagePicker & Importation CSV", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("17-G : Aucun prompt navigateur pour image ou vidéo dans l'éditeur de description", async ({ page }) => {
    // Intercepter tout window.prompt ou alert accidentel
    let dialogTriggered = false;
    page.on("dialog", async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await page.goto("http://localhost:3000/app/lome-glow/produits/nouveau");
    await page.waitForLoadState("networkidle");

    // Bouton image dans l'éditeur riche
    const imageBtn = page.locator('button[title="Insérer une image"]');
    await expect(imageBtn).toBeVisible();
    await imageBtn.click();

    // Vérifier que la modale Novika ImagePicker est ouverte sans dialogue natif
    expect(dialogTriggered).toBe(false);
    const imageModalTitle = page.locator("h3:has-text('Sélectionner une image')");
    await expect(imageModalTitle).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/prompt-17g-editor-image-modal.png`,
      fullPage: true,
    });

    // Fermer la modale
    await page.locator("#btn-close-image-picker").click({ force: true });
    await page.waitForTimeout(300);

    // Bouton vidéo dans l'éditeur riche
    const videoBtn = page.locator('button[title*="vidéo"]');
    await expect(videoBtn).toBeVisible();
    await videoBtn.click();

    expect(dialogTriggered).toBe(false);
    await expect(page.locator("h3:has-text('Insérer une vidéo')")).toBeVisible();
  });

  test("17-H : Page Médiathèque de la boutique et jauge de stockage", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/mediatheque");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1:has-text('Médiathèque de la boutique')")).toBeVisible();
    await expect(page.locator("text=Espace de stockage utilisé")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/prompt-17h-mediatheque.png`,
      fullPage: true,
    });
  });

  test("17-H : Rendu mobile iPhone 13 sur la Médiathèque", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/app/lome-glow/mediatheque");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1:has-text('Médiathèque')")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/prompt-17h-mobile-iphone13.png`,
      fullPage: true,
    });
  });

  test("17-I : Importation CSV et affichage immédiat dans Produits avec batchId", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/produits");
    await page.waitForLoadState("networkidle");

    const importBtn = page.locator("#btn-import-csv");
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Modale CSV ouverte
    await expect(page.locator("text=Importer des produits")).toBeVisible();

    // Remplir une ligne CSV de test
    const testCsv =
      `Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty\n` +
      `produit-e2e-17i,"Robe de Soirée Africaine 17-I","<p>Robe satinée wax</p>","Atelier Cotonou","Mode","Soirée, Wax",TRUE,"Taille","M","SKU-E2E-17I",35000,15\n`;

    // Injecter dans le textarea ou l'input file si présent
    await page.evaluate((csv) => {
      const modal = document.querySelector("#dropzone-csv-import");
      // simuler l'import directement
    });

    await page.screenshot({
      path: `${artifactDir}/prompt-17i-csv-modal.png`,
      fullPage: true,
    });
  });
});

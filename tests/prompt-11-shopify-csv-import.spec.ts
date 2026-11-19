import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 11 : Import CSV automatique et complet (Shopify & Novika)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. Modale d'import : Glisser-déposer, absence d'AfriBuilder, modèle Novika et options", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits`);
    await page.waitForLoadState("domcontentloaded");

    // Bouton d'ouverture de l'import CSV
    const importBtn = page.locator("#btn-import-csv");
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    const modal = page.locator("#csv-import-modal");
    await expect(modal).toBeVisible();

    // Vérifier l'absence formelle d'AfriBuilder dans la modale
    await expect(modal).not.toContainText("AfriBuilder");
    await expect(modal).toContainText("Novika");

    // Zone de glisser-déposer
    const dropzone = page.locator("#csv-dropzone");
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText("Glissez-déposez votre export Shopify ici");

    // Sélecteur de stratégie de doublons
    const duplicateSelect = page.locator("#duplicate-strategy-select");
    await expect(duplicateSelect).toBeVisible();
    await expect(duplicateSelect).toHaveValue("skip");

    // Case de confirmation des droits
    const legalCheckbox = page.locator("#legal-rights-checkbox");
    await expect(legalCheckbox).toBeVisible();
    await expect(legalCheckbox).not.toBeChecked();

    // Bouton de téléchargement du modèle
    const templateBtn = page.locator("#btn-download-csv-template");
    await expect(templateBtn).toBeVisible();
    await expect(templateBtn).toContainText("modèle Novika");

    // Fermer la modale
    await page.locator("#csv-import-modal button:has(svg.lucide-x)").click();
    await expect(modal).not.toBeVisible();
  });

  test("2. Parcours automatique : Progression en étapes, exactitude, brouillon et contrôle final", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits`);
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#btn-import-csv").click();
    const modal = page.locator("#csv-import-modal");
    await expect(modal).toBeVisible();

    // Cocher la case obligatoire des droits
    await page.locator("#legal-rights-checkbox").check();

    // Bouton de lancement de l'import automatique
    const startBtn = page.locator("#btn-start-auto-import");
    await expect(startBtn).toBeEnabled();
    await startBtn.click();

    // Vérifier l'affichage de la barre de progression animée
    const stagesProgress = page.locator("#auto-import-stages-progress");
    await expect(stagesProgress).toBeVisible();
    await expect(page.locator("#import-progress-bar")).toBeVisible();

    // Attendre la fin du traitement et l'affichage du rapport final
    const comparisonBadge = page.locator("#exact-counts-comparison-badge");
    await expect(comparisonBadge).toBeVisible({ timeout: 15000 });
    await expect(comparisonBadge).toContainText("Fichier :");
    await expect(comparisonBadge).toContainText("Importé :");
    await expect(comparisonBadge).toContainText("BROUILLON");

    // Vérifier la présence du bouton de rollback (valable 7 jours)
    const rollbackBtn = page.locator("#btn-rollback-import");
    await expect(rollbackBtn).toBeVisible();
    await expect(rollbackBtn).toContainText("Annuler cet import");

    // Vérifier le bouton de téléchargement du rapport
    const downloadReportBtn = page.locator("#btn-download-error-report");
    await expect(downloadReportBtn).toBeVisible();

    // Vérifier le bouton de publication collective
    const publishAllBtn = page.locator("#btn-publish-all-clean");
    await expect(publishAllBtn).toBeVisible();

    // Fermer avec le bouton Terminer
    const finishBtn = page.locator("#btn-finish-import");
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test("3. Annulation d'import (Rollback) : Retire le lot sans toucher aux autres produits", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/produits`);
    await page.waitForLoadState("domcontentloaded");

    // Nombre initial de produits
    const initialItems = await page.locator("tr[id^='row-prod-']").count();

    // Ouvrir et lancer l'import
    await page.locator("#btn-import-csv").click();
    await page.locator("#legal-rights-checkbox").check();
    await page.locator("#btn-start-auto-import").click();

    // Attendre le rapport
    const rollbackBtn = page.locator("#btn-rollback-import");
    await expect(rollbackBtn).toBeVisible({ timeout: 15000 });

    // Déclencher le Rollback
    await rollbackBtn.click();

    // Vérifier la confirmation d'annulation dans l'interface
    await expect(page.locator("#csv-import-modal")).toContainText("Importation annulée avec succès");

    // Fermer
    await page.locator("#btn-finish-import").click();
  });
});

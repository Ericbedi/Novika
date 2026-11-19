import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

const FORBIDDEN_DEMO_STRINGS = [
  "Lomé Glow",
  "Afiwa Mensah",
  "Koffi Amegah",
  "Fatou Diop",
  "12 500",
  "98.4",
  "4.9 / 5",
  "4.9/5",
  "342 avis",
  "Soins Visage Purifiants",
  "Beurres & Baumes",
  "Savons Noirs",
  "Café Bio Champignon",
  "+228 90 12 34 56",
  "AfriBuilder",
];

test.describe("Prompt 08 : Vitrine isolée, zéro contenu de démo & Mode Édition Admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    page.on("dialog", (dialog) => dialog.accept());
  });

  test("1. Rendu d'une boutique non configurée (/boutique/kelio) : Page en préparation sans AUCUNE chaîne de démonstration", async ({
    page,
  }) => {
    // Visiteur public non connecté
    await page.goto(`${BASE_URL}/boutique/kelio`);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // 1. Vérifier la présence de la page neutre en préparation
    await expect(page.locator("text=Cette boutique est en cours de préparation")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Kelio").first()).toBeVisible();

    // 2. Vérifier l'absence TOTALE de chaque chaîne de démonstration interdite
    const pageContent = await page.content();
    for (const forbidden of FORBIDDEN_DEMO_STRINGS) {
      expect(pageContent).not.toContain(forbidden);
    }
  });

  test("2. Un visiteur public ne voit JAMAIS les outils d'édition ni la barre admin", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/kelio`);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Aucun crayon d'édition
    await expect(page.locator("text=Modifier la Bannière")).not.toBeVisible();
    await expect(page.locator("text=Modifier la Réassurance")).not.toBeVisible();
    // Aucun cadre pointillé "+ Ajouter"
    await expect(page.locator("text=+ Ajouter")).not.toBeVisible();
    // Aucune barre d'administration flottante
    await expect(page.locator("#btn-toggle-edit-mode")).not.toBeVisible();
    await expect(page.locator("#btn-back-to-dashboard")).not.toBeVisible();
  });

  test("3. L'admin propriétaire connecté voit la barre d'administration et peut activer le mode édition", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/kelio`);
    await page.evaluate(() => {
      localStorage.setItem("novika_user_verified", "true");
      localStorage.setItem("novika_user_email", "owner@kelio.com");
      localStorage.setItem("novika_active_role", "owner");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // La barre flottante d'administration est visible pour le propriétaire
    const adminBarToggle = page.locator("#btn-toggle-edit-mode");
    await expect(adminBarToggle).toBeVisible({ timeout: 10000 });
    await expect(adminBarToggle).toContainText("Activer Mode Édition");

    // Revenir au tableau de bord est présent
    const backToDashboard = page.locator("#btn-back-to-dashboard");
    await expect(backToDashboard).toBeVisible();

    // Activer le mode édition
    await adminBarToggle.click({ force: true });
    await expect(adminBarToggle).toContainText("Mode Édition Actif");

    // Les cadres pointillés "+ Ajouter" apparaissent pour les sections vides
    await expect(page.locator("text=+ Ajouter une Bannière d'Accueil (Hero)")).toBeVisible();

    // Cliquer sur le cadre pointillé ouvre le panneau latéral d'édition
    await page.click("text=+ Ajouter une Bannière d'Accueil (Hero)", { force: true });
    await expect(page.locator("text=Bannière d'accueil (Hero)").first()).toBeVisible();
    await expect(page.locator("text=Titre d'accroche (Headline) *")).toBeVisible();
  });

  test("4. Le pied de page affiche Novika via brand.ts et plus jamais AfriBuilder", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/kelio`);
    await page.waitForLoadState("domcontentloaded");

    // Vérifier la mention de plateforme Novika
    const footerText = await page.locator("footer").innerText();
    expect(footerText).toContain("Hébergé et sécurisé par la plateforme Novika");
    expect(footerText).not.toContain("AfriBuilder");
  });

  test("5. Le titre de l'onglet du navigateur reflète le nom réel de la boutique", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/kelio`);
    await page.waitForLoadState("domcontentloaded");

    const pageTitle = await page.title();
    expect(pageTitle).toContain("Kelio");
    expect(pageTitle).not.toContain("AfriBuilder");
  });
});

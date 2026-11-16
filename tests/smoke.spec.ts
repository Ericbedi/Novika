import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Novika Smoke Tests (Test de fumée de production)", () => {
  test("1. Page d'accueil accessible avec statut 200", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });

  test("2. Page de connexion avec nouveau design mobile adaptée aux couleurs de marque", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/connexion`);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/Propulsez votre commerce/i)).toBeVisible();
    await expect(page.getByText(/en Afrique/i)).toBeVisible();
    await expect(page.getByPlaceholder("Adresse e-mail")).toBeVisible();
    await expect(page.getByPlaceholder("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: /Se connecter/i })).toBeVisible();
    await expect(page.getByText(/Continuer avec Google/i)).toBeVisible();
  });

  test("3. Page d'inscription avec sélecteur 54 pays d'Afrique", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/inscription`);
    expect(res?.status()).toBe(200);
    const countrySelect = page.locator("#signup-country-select");
    await expect(countrySelect).toBeVisible();
    await countrySelect.click();
    await expect(page.getByPlaceholder(/Rechercher un pays/i)).toBeVisible();
  });

  test("4. Page de demande d'accès avec recherche de pays", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/acces`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("#access-country-select")).toBeVisible();
  });

  test("5. Tableau de bord marchand et corridors COD", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/app/lome-glow`);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/Lomé Glow/i).first()).toBeVisible();
  });

  test("6. Vitrine en ligne et catalogue de produits", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/boutique/lome-glow`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });
});

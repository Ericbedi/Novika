import { test, expect } from "@playwright/test";

test("dashboard loads with ivory/linen/charcoal palette, rotating globe, and interactive chart", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/app/lome-glow");

  // Vérifier le logo et le sélecteur de boutique
  await expect(page.getByText("AfriBuilder").first()).toBeVisible();
  await expect(page.getByText("Lomé Glow Cosmétiques").first()).toBeVisible();

  // Vérifier la barre de statut statique des corridors COD
  await expect(page.getByText("Corridors COD Afrique de l'Ouest :")).toBeVisible();
  await expect(page.getByText("TG · Lomé")).toBeVisible();

  // Vérifier le Globe 3D et le texte télémétrique
  await expect(page.getByText("Réseau COD Afrique de l'Ouest · En direct")).toBeVisible();
  await expect(page.getByText("Afrique · Hub COD")).toBeVisible();

  // Vérifier le sélecteur de date au niveau de Commandes & Livraisons en temps réel
  await expect(page.getByText("7 derniers jours")).toBeVisible();

  // Vérifier les 5 cartes de KPI
  await expect(page.getByText("Visiteurs", { exact: true })).toBeVisible();
  await expect(page.getByText("Ventes totales", { exact: true })).toBeVisible();
  await expect(page.getByText("Ventes livrées", { exact: true })).toBeVisible();
  await expect(page.getByText("Commandes reçues").first()).toBeVisible();
  await expect(page.getByText("Taux de conversion", { exact: true })).toBeVisible();

  // Vérifier le graphique interactif Budget, coûts, bénéfice & livraisons
  await expect(page.getByText("Budget, coûts, bénéfice & livraisons")).toBeVisible();
  await expect(page.getByText("Tout afficher")).toBeVisible();
  await expect(page.getByText("Tout masquer")).toBeVisible();
  await expect(page.getByText("Budget pub")).toBeVisible();
  await expect(page.getByText("Bénéfice du jour").first()).toBeVisible();

  // Scroll fluide vers le bas pour déclencher les animations de scroll
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
  await page.waitForTimeout(400);

  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "smooth" }));
  await page.waitForTimeout(400);

  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: "smooth" }));
  await page.waitForTimeout(400);

  // Remonter en haut
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(500);

  // Capture d'écran Desktop complète
  await page.screenshot({ path: "test-results/dashboard-desktop-ivory-charcoal.png", fullPage: true });

  // Test en vue Mobile avec le Globe
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/dashboard-mobile-ivory-charcoal.png", fullPage: true });
});

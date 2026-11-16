import { test, expect } from "@playwright/test";

test.describe("Extension Calendrier & Analyse Weekly : Détection d'Over-scaling vs Scaling Sain", () => {
  test("1. Affiche le calendrier hebdomadaire et détecte l'alerte Over-scaling sur la Semaine 46", async ({
    page,
  }) => {
    // Naviguer vers la page Performance Produit & Scaling
    await page.goto("http://localhost:3000/app/lom-wax/performance-produit");
    await page.locator("#btn-scaling-calendar-trigger").waitFor({ state: "visible", timeout: 20000 });

    // 1. Vérifier la présence du calendrier dans la barre d'action supérieure
    const calendarTrigger = page.locator("#btn-scaling-calendar-trigger");
    await expect(calendarTrigger).toBeVisible();
    await expect(calendarTrigger).toContainText("Semaine 46");

    // 2. Vérifier la bannière d'alerte Over-scaling visible en S46
    const overscalingAlert = page.locator("#banner-overscaling-alert");
    await expect(overscalingAlert).toBeVisible();
    await expect(overscalingAlert).toContainText("Over-scaling");
    await expect(overscalingAlert).toContainText("355 $");
    await expect(overscalingAlert).toHaveText(/12[\s\u202f\u00a0]*400/);

    // 3. Vérifier les KPIs synchronisés avec la capture utilisateur
    await expect(page.locator("text=355 $").first()).toBeVisible();
    await expect(page.locator("text=110").first()).toBeVisible();
    await expect(page.locator("text=32").first()).toBeVisible();
    await expect(page.locator("text=29.1 %").first()).toBeVisible();
    await expect(page.locator("text=11.09 $").first()).toBeVisible();
    await expect(page.locator("#banner-overscaling-alert")).toHaveText(/12[\s\u202f\u00a0]*400/);

    // 4. Capture d'écran de l'alerte d'overscaling et du calendrier
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/scaling-01-overscaling-alert-and-calendar.png",
      fullPage: false,
    });
  });

  test("2. Ouvre le popover calendrier, navigue vers la Semaine 44 et valide le statut Scaling Rentable", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/app/lom-wax/performance-produit");
    await page.locator("#btn-scaling-calendar-trigger").waitFor({ state: "visible", timeout: 20000 });

    // Ouvrir le popover calendrier
    await page.click("#btn-scaling-calendar-trigger");
    const calendarPopover = page.locator("#popover-scaling-calendar");
    await expect(calendarPopover).toBeVisible();

    // Vérifier que les 4 semaines sont listées
    await expect(page.locator("#btn-select-week-46")).toBeVisible();
    await expect(page.locator("#btn-select-week-45")).toBeVisible();
    await expect(page.locator("#btn-select-week-44")).toBeVisible();
    await expect(page.locator("#btn-select-week-43")).toBeVisible();

    // Sélectionner la Semaine 44
    await page.click("#btn-select-week-44");
    await expect(calendarPopover).not.toBeVisible();

    // Vérifier la mise à jour de la période
    await expect(page.locator("#btn-scaling-calendar-trigger")).toContainText("Semaine 44");

    // Vérifier la bannière verte de Scaling Sain & Rentable
    const healthyBanner = page.locator("#banner-healthy-scaling");
    await expect(healthyBanner).toBeVisible();
    await expect(healthyBanner).toContainText("Scaling Sain & Rentable");

    // Vérifier que les KPIs reflètent S44 (Spend 210 $, Profit +142 000 FCFA)
    await expect(page.locator("text=210 $").first()).toBeVisible();
    await expect(page.locator("text=142").first()).toBeVisible();

    // Capture d'écran du statut scaling sain sur S44
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/scaling-02-healthy-scaling-s44.png",
      fullPage: false,
    });
  });

  test("3. Affiche la matrice complète de comparaison Weekly (Scaling vs Over-scaling)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/app/lom-wax/performance-produit");
    await page.locator("#btn-scaling-calendar-trigger").waitFor({ state: "visible", timeout: 20000 });

    // Basculer en mode Comparatif Weekly
    await page.click("#btn-toggle-weekly-comparison");
    const comparisonSection = page.locator("#section-weekly-comparison");
    await expect(comparisonSection).toBeVisible();

    // Vérifier la présence du tableau comparatif
    const comparisonTable = page.locator("#table-weekly-comparison");
    await expect(comparisonTable).toBeVisible();
    await expect(comparisonTable).toContainText("Semaine 46");
    await expect(comparisonTable).toContainText("Semaine 45");
    await expect(comparisonTable).toContainText("Semaine 44");
    await expect(comparisonTable).toContainText("Semaine 43");

    // Vérifier les diagnostics
    await expect(comparisonTable).toContainText("Over-scaling");
    await expect(comparisonTable).toContainText("Scaling Sain & Rentable");

    // Capture d'écran de la matrice de comparaison weekly
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/scaling-03-weekly-comparison-matrix.png",
      fullPage: false,
    });
  });

  test("4. Vérifie la responsivité mobile (390px) et l'absence de débordement horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/app/lom-wax/performance-produit");
    await page.locator("#btn-scaling-calendar-trigger").waitFor({ state: "visible", timeout: 20000 });

    // Vérifier la présence du calendrier sur mobile
    await expect(page.locator("#btn-scaling-calendar-trigger")).toBeVisible();
    await expect(page.locator("#banner-overscaling-alert")).toBeVisible();

    // Ouvrir le mode comparatif weekly sur mobile
    await page.click("#btn-toggle-weekly-comparison");
    const mobileCards = page.locator("#mobile-weekly-comparison-cards");
    await expect(mobileCards).toBeVisible();

    // Vérifier que le document ne déborde pas horizontalement
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Capture d'écran mobile
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/scaling-04-mobile-responsive-390px.png",
      fullPage: false,
    });
  });
});

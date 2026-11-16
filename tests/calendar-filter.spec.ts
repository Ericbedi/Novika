import { test, expect } from "@playwright/test";

test.describe("Calendar Option in Filter - Commandes", () => {
  const BASE_STORE = "http://localhost:3000/app/lome-glow/commandes";

  test("Calendrier au niveau des filtres de commandes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_STORE);

    // Vérifier la présence du bouton calendrier dans la barre de filtre
    const calendarBtn = page.getByRole("button", { name: "Toutes les dates" }).first();
    await expect(calendarBtn).toBeVisible();

    // 1. Capture d'écran état normal avec le bouton calendrier à côté de Filtres
    await page.screenshot({ path: "test-results/commandes-calendar-button.png" });

    // 2. Ouvrir le Popover Calendrier
    await calendarBtn.click();
    await expect(page.getByText("Filtrer par date")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aujourd'hui (15/11)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hier (14/11)" })).toBeVisible();
    await expect(page.getByText("Période personnalisée")).toBeVisible();

    // Capture d'écran avec le popover calendrier ouvert
    await page.screenshot({ path: "test-results/commandes-calendar-popover.png" });

    // 3. Tester le filtre "Aujourd'hui"
    await page.getByRole("button", { name: "Aujourd'hui (15/11)" }).click();
    await expect(page.getByRole("button", { name: "Aujourd'hui" }).first()).toBeVisible();

    // 4. Ouvrir le tiroir Filtres avancés
    await page.getByRole("button", { name: "Filtres" }).click();
    await expect(page.getByText("Période / Date")).toBeVisible();
    await expect(page.getByText("Réinitialiser tous les filtres")).toBeVisible();

    // Capture d'écran avec tiroir de filtres et calendrier
    await page.screenshot({ path: "test-results/commandes-filters-drawer-calendar.png" });

    // 5. Réinitialiser
    await page.getByText("Réinitialiser tous les filtres").click();
    await expect(page.getByRole("button", { name: "Toutes les dates" }).first()).toBeVisible();
  });
});

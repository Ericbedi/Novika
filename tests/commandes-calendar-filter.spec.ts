import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000/app/lome-glow/commandes";

test.describe("Option de calendrier au niveau du filtre des Commandes", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("afribuilder_active_role", "owner");
    });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("affiche l'option de calendrier au niveau de la barre de filtres", async ({ page }) => {
    // Vérifier l'en-tête et les onglets
    await expect(page.getByRole("heading", { name: "Commandes" })).toBeVisible();
    await expect(page.getByText("7 commandes enregistrées")).toBeVisible();

    // Vérifier la barre de recherche
    const searchInput = page.getByPlaceholder("Rechercher par nom client, téléphone, ville, produit ou N° commande...");
    await expect(searchInput).toBeVisible();

    // Vérifier le bouton de calendrier au niveau du filtre
    const calendarBtn = page.locator("button:has-text('Période :'), button:has-text('Tout le temps')").first();
    await expect(calendarBtn).toBeVisible();

    // Vérifier le bouton Filtres
    const filtresBtn = page.locator("button:has-text('Filtres')").first();
    await expect(filtresBtn).toBeVisible();

    // Screenshot initial
    await page.screenshot({
      path: "tests/screenshots/cmd-01-calendar-filter-bar.png",
      fullPage: false,
    });
  });

  test("ouvre le sélecteur de calendrier et sélectionne un preset rapide (Aujourd'hui)", async ({ page }) => {
    const calendarBtn = page.locator("button:has-text('Période :'), button:has-text('Tout le temps')").first();
    await calendarBtn.click();

    // Le popover calendrier s'ouvre avec la sélection rapide et le calendrier
    await expect(page.getByText("Sélection rapide")).toBeVisible();
    await expect(page.getByText("Plage de dates personnalisée")).toBeVisible();

    // Screenshot du calendrier ouvert
    await page.screenshot({
      path: "tests/screenshots/cmd-02-calendar-picker-open.png",
      fullPage: false,
    });

    // Cliquer sur le preset 'Aujourd'hui'
    const todayOption = page.locator("label:has-text('Aujourd\\'hui')").first();
    await todayOption.click();

    // Le tag de filtre actif s'affiche avec la date
    await expect(page.getByText(/Période : Aujourd'hui/i).first()).toBeVisible();

    // Les commandes affichées sont celles du 15/11/2026 (aujourd'hui)
    // 2 commandes aujourd'hui : CMD-10482 (Awa Traoré) et CMD-10481 (Koffi Mensah)
    await expect(page.getByText("CMD-10482").first()).toBeVisible();
    await expect(page.getByText("CMD-10481").first()).toBeVisible();

    // Screenshot avec filtre Aujourd'hui actif
    await page.screenshot({
      path: "tests/screenshots/cmd-03-calendar-filter-today.png",
      fullPage: false,
    });
  });

  test("ouvre le tiroir de filtres et synchronise le choix de date", async ({ page }) => {
    // Cliquer sur 'Filtres'
    const filtresBtn = page.locator("button:has-text('Filtres')").first();
    await filtresBtn.click();

    // Vérifier la présence de l'option calendrier dans le tiroir
    await expect(page.getByText("Période / Calendrier")).toBeVisible();

    // Cliquer sur le raccourci 'Hier' dans le tiroir
    const hierBtn = page.getByRole("button", { name: "Hier", exact: true });
    await hierBtn.click();

    // Vérifier que le tag actif 'Période : Hier' apparaît
    await expect(page.getByText(/Période : Hier/i).first()).toBeVisible();

    // Commandes d'hier (14/11/2026) : CMD-10480 (Fatou Diop) et CMD-10478 (Ibrahim Koné)
    await expect(page.getByText("CMD-10480").first()).toBeVisible();
    await expect(page.getByText("CMD-10478").first()).toBeVisible();
    // Les commandes d'aujourd'hui ne doivent plus apparaître
    await expect(page.getByText("CMD-10482")).not.toBeVisible();

    // Screenshot du tiroir de filtres avec option calendrier
    await page.screenshot({
      path: "tests/screenshots/cmd-04-filters-drawer-calendar.png",
      fullPage: false,
    });

    // Réinitialiser tout
    const resetBtn = page.locator("button:has-text('Réinitialiser tout')").first();
    await resetBtn.click();

    // Toutes les commandes réapparaissent
    await expect(page.getByText("CMD-10482").first()).toBeVisible();
  });
});

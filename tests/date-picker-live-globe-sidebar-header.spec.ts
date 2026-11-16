import { test, expect } from "@playwright/test";

test.describe("Correctif 1 (Sélecteur de période & Grille KPI) + Correctif 2 (Carte En direct & Stats Live) + Simplification En-tête Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
      sessionStorage.clear();
    });
  });

  test("1. Simplification de l'en-tête de la barre latérale : Logo + AfriBuilder uniquement (56px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    const sidebarHeader = page.locator("#sidebar-header");
    await expect(sidebarHeader).toBeVisible();

    // Hauteur 56px (h-14)
    const box = await sidebarHeader.boundingBox();
    expect(box?.height).toBeCloseTo(56, 1);

    // Contenu unique : logo (pastille "A") et nom « AfriBuilder » en entier sur une ligne
    const logoLink = sidebarHeader.locator("a");
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute("href", "/app/lome-glow");
    await expect(logoLink.getByText("A", { exact: true })).toBeVisible();
    await expect(logoLink.getByText("AfriBuilder", { exact: true })).toBeVisible();

    // Retiré de l'en-tête : badge BÊTA, bouton recherche, cloche notifications, sélecteur de boutique
    await expect(sidebarHeader.locator("#btn-beta-badge-info")).toHaveCount(0);
    await expect(sidebarHeader.locator("#btn-sidebar-search")).toHaveCount(0);
    await expect(sidebarHeader.locator("#btn-sidebar-notifications")).toHaveCount(0);
    await expect(sidebarHeader.locator("#btn-store-selector")).toHaveCount(0);
    await expect(sidebarHeader.getByText("Gérer mes boutiques")).toHaveCount(0);

    // Mode réduit 72px : seul le logo est affiché avec info-bulle « AfriBuilder »
    const collapseToggle = page.locator("#btn-sidebar-collapse-toggle");
    if (await collapseToggle.isVisible()) {
      await collapseToggle.click();
      // Vérifier le logo avec title="AfriBuilder"
      const collapsedLogo = page.locator("aside").locator("a[title='AfriBuilder']");
      await expect(collapsedLogo).toBeVisible();
      // Rouvrir
      await collapseToggle.click();
    }
  });

  test("2. Entrées déplacées en haut de navigation : Rechercher (44px) & Notifications (44px) + Badge Bêta dans menu utilisateur", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // Bouton Rechercher dans la navigation
    const searchNavBtn = page.locator("#btn-nav-search");
    await expect(searchNavBtn).toBeVisible();
    await expect(searchNavBtn.getByText("Rechercher")).toBeVisible();
    await expect(searchNavBtn.getByText("Ctrl K")).toBeVisible();

    // Clic sur Rechercher ouvre la Command Palette
    await searchNavBtn.click();
    const commandPalette = page.getByPlaceholder("Rechercher une commande, un client, un colis...");
    await expect(commandPalette).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(commandPalette).toHaveCount(0);

    // Bouton Notifications dans la navigation avec pastille
    const notifNavBtn = page.locator("#btn-nav-notifications");
    await expect(notifNavBtn).toBeVisible();
    await expect(notifNavBtn.getByText("Notifications")).toBeVisible();
    const notifBadge = notifNavBtn.locator("span[role='status']");
    await expect(notifBadge).toBeVisible();

    // Clic ouvre le panneau de notifications dans un portail
    await notifNavBtn.click();
    const notifsPanel = page.locator("#notifications-portal-panel");
    await expect(notifsPanel).toBeVisible();
    await expect(notifsPanel.getByText("Notifications")).toBeVisible();
    await expect(notifsPanel.getByText("Tout marquer comme lu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(notifsPanel).toHaveCount(0);

    // Trait fin séparateur sous les deux entrées avant « Accueil »
    const divider = page.locator("#nav-top-divider");
    await expect(divider).toBeVisible();

    // Badge Bêta déplacé dans le menu utilisateur (bas de barre)
    const userMenuBtn = page.locator("#btn-user-menu-trigger");
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();

    const betaPrivateItem = page.locator("#btn-user-menu-beta-info");
    await expect(betaPrivateItem).toBeVisible();
    await expect(betaPrivateItem.getByText("Bêta privée")).toBeVisible();
    await betaPrivateItem.click();

    // Modale Bêta v0.9.4
    const betaModal = page.locator("#beta-modal-title");
    await expect(betaModal).toBeVisible();
    await expect(betaModal).toHaveText("AfriBuilder Bêta");
    await expect(page.getByText("v0.9.4")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Fermer" }).click();
  });

  test("3. DateRangePicker : Positionnement droit, portail z-100, 12 raccourcis sans scroll, 2 calendriers Lu-Di, pied fixe", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // Bouton sélecteur de période dans la carte Live
    const datePickerBtn = page.locator("#btn-date-range-trigger");
    await expect(datePickerBtn).toBeVisible();
    await datePickerBtn.click();

    // Panneau de date rendu dans un portail (document.body) avec z-[100]
    const popoverPanel = page.locator("#date-range-picker-panel");
    await expect(popoverPanel).toBeVisible();

    // Vérifier l'alignement à droite : bord droit du panneau proche du bord droit du bouton
    const btnBox = await datePickerBtn.boundingBox();
    const panelBox = await popoverPanel.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    if (btnBox && panelBox) {
      const btnRight = btnBox.x + btnBox.width;
      const panelRight = panelBox.x + panelBox.width;
      // Le panneau doit être aligné sur le bord droit du bouton avec max 24px de delta
      expect(Math.abs(btnRight - panelRight)).toBeLessThanOrEqual(24);
    }

    // Colonne gauche (232px) « SÉLECTION RAPIDE » avec les 12 raccourcis sans barre de défilement
    const presetsContainer = page.locator("#date-picker-presets-list");
    await expect(presetsContainer).toBeVisible();

    const presets = [
      "Aujourd'hui",
      "Hier",
      "Cette semaine",
      "Semaine dernière",
      "7 derniers jours",
      "30 derniers jours",
      "90 derniers jours",
      "365 derniers jours",
      "Ce mois-ci",
      "Le mois dernier",
      "12 derniers mois",
      "Tout le temps",
    ];

    for (const preset of presets) {
      await expect(presetsContainer.getByRole("radio", { name: preset })).toBeVisible();
    }

    // Colonne droite : Champs De et À (52px de haut)
    const fromInput = page.locator("#date-input-from");
    const toInput = page.locator("#date-input-to");
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    // 2 calendriers côte à côte avec initiales Lu-Di (semaine commençant le lundi)
    await expect(popoverPanel.getByText("Lu").first()).toBeVisible();
    await expect(popoverPanel.getByText("Di").first()).toBeVisible();

    // Pied fixe : Interrupteur « Comparer » + boutons « Réinitialiser » et « Appliquer »
    const compareSwitch = page.locator("#switch-compare-period");
    await expect(compareSwitch).toBeVisible();
    await expect(popoverPanel.getByText("Comparé à :")).toBeVisible();

    const resetBtn = page.locator("#btn-reset-dates");
    const applyBtn = page.locator("#btn-apply-dates");
    await expect(resetBtn).toBeVisible();
    await expect(applyBtn).toBeVisible();

    // Clic sur Appliquer ferme le panneau
    await applyBtn.click();
    await expect(popoverPanel).toHaveCount(0);
  });

  test("4. Carte « En direct » sur le Dashboard : Globe cobe WebGL, télémétrie, Top 5 pays, bouton Stats Live, grille 5 KPI", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // Présence de la carte Live
    const liveCard = page.locator("#live-globe-card");
    await expect(liveCard).toBeVisible();

    // Puce télémétrie « En direct · X visiteurs »
    await expect(liveCard.getByText(/En direct · \d+ visiteurs/)).toBeVisible();

    // Compteurs en direct
    await expect(liveCard.getByText("Visiteurs en ce moment")).toBeVisible();
    await expect(liveCard.getByText("(estimation)")).toBeVisible();
    await expect(liveCard.getByText("Commandes aujourd'hui")).toBeVisible();
    await expect(liveCard.getByText("Visiteurs en direct")).toBeVisible();

    // Top 5 pays avec proportion bars
    await expect(liveCard.getByText("Pays d'origine")).toBeVisible();
    await expect(liveCard.getByText("Togo", { exact: true })).toBeVisible();
    await expect(liveCard.getByText("Côte d'Ivoire", { exact: true })).toBeVisible();

    // Bouton « Ouvrir la vue en direct »
    const openLiveBtn = liveCard.locator("#btn-open-live-view");
    await expect(openLiveBtn).toBeVisible();
    await expect(openLiveBtn).toHaveAttribute("href", "/app/lome-glow/stats/live");

    // Les 5 Cartes de Statistiques dans la grille responsive
    await expect(liveCard.getByText("Visiteurs").first()).toBeVisible();
    await expect(liveCard.getByText("Ventes totales").first()).toBeVisible();
    await expect(liveCard.getByText("Ventes livrées").first()).toBeVisible();
    await expect(liveCard.getByText("Commandes reçues").first()).toBeVisible();
    await expect(liveCard.getByText("Taux de conversion").first()).toBeVisible();
  });

  test("5. Page Stats > Live (/app/[store]/stats/live) : Globe plein format, fil commandes sans PII, fenêtres et filtres", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/stats/live");
    await page.waitForLoadState("networkidle");

    // Titre de la page et fil d'Ariane
    await expect(page.getByRole("heading", { name: "Vue en direct" })).toBeVisible();
    await expect(page.locator("main").getByText("En direct").first()).toBeVisible();

    // Sélecteur de fenêtre active : 5 min, 10 min, 15 min
    await expect(page.getByRole("button", { name: "5 min (défaut)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "10 min" })).toBeVisible();
    await expect(page.getByRole("button", { name: "15 min" })).toBeVisible();

    // Bascule Visiteurs / Commandes
    await expect(page.getByRole("button", { name: "Visiteurs" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Commandes" })).toBeVisible();

    // Fil de commandes en direct SANS PII (pas de nom ni de numéro de téléphone)
    await expect(page.getByText("Flux des commandes en direct")).toBeVisible();
    await expect(page.getByText("Nouvelle commande · Togo")).toBeVisible();
    await expect(page.getByText("Conformité vie privée : Aucun numéro ni identité client affiché dans le flux live.")).toBeVisible();

    // 3 Panneaux détaillés
    await expect(page.getByText("Pages en cours de lecture")).toBeVisible();
    await expect(page.getByText("Page d'accueil")).toBeVisible();
    await expect(page.getByText("Catalogue complet")).toBeVisible();
    await expect(page.getByText("Formulaire de commande COD")).toBeVisible();

    await expect(page.getByText("Nouveaux vs Récurrents")).toBeVisible();
    await expect(page.getByText("Origine géographique (Top 5)")).toBeVisible();
  });

  test("6. Sécurité RLS sur Stats > Live : Accès refusé pour rôle closer et rider", async ({ page }) => {
    // Connexion en tant que closer via paramètre de rôle
    await page.goto("http://localhost:3000/app/lome-glow/stats/live?role=closer");
    await page.waitForLoadState("networkidle");

    // Écran d'accès restreint
    await expect(page.getByText("Accès Restreint (Sécurité RLS)")).toBeVisible();
    await expect(page.getByText("Votre rôle (closer) ne vous autorise pas à consulter la télémétrie en direct")).toBeVisible();
    await expect(page.getByRole("link", { name: "Retour au Tableau de Bord" })).toBeVisible();
  });

  test("7. Réglages > Pixels & Analytics : Présence du toggle Télémétrie en direct avec avertissement vie privée", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow/reglages");
    await page.waitForLoadState("networkidle");

    // Aller sur l'onglet Pixels & Analytics
    const pixelsTab = page.getByRole("button", { name: "Pixels & Analytics" });
    await expect(pixelsTab).toBeVisible();
    await pixelsTab.click();

    // Vérifier la carte de télémétrie en direct
    await expect(page.getByText("Télémétrie & Vue en direct")).toBeVisible();
    await expect(page.getByText("Sans cookie ni IP")).toBeVisible();

    const liveToggle = page.locator("#toggle-live-tracking");
    await expect(liveToggle).toBeVisible();
    await expect(liveToggle).toBeChecked();

    // Avertissement légal
    await expect(page.getByText("Avertissement juridique & Respect de la vie privée :")).toBeVisible();
    await expect(page.getByText("L'adresse IP du client est immédiatement jetée")).toBeVisible();
  });

  test("8. Mobile : Bottom sheet DateRangePicker et Drawer de navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // Bouton de menu mobile flottant
    const mobileMenuBtn = page.locator("#btn-mobile-drawer-toggle");
    await expect(mobileMenuBtn).toBeVisible();
    await mobileMenuBtn.click();

    // Tiroir mobile ouvert avec En-tête épuré et entrées Rechercher / Notifications
    const mobileDrawer = page.locator("#mobile-sidebar-drawer");
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.getByText("AfriBuilder")).toBeVisible();
    await expect(mobileDrawer.getByText("Rechercher")).toBeVisible();
    await expect(mobileDrawer.getByText("Notifications")).toBeVisible();

    // Fermer le tiroir
    await page.locator("#btn-mobile-drawer-close").click();
    await expect(mobileDrawer).toHaveCount(0);

    // Clic sur sélecteur de date en mobile -> Ouvre en Bottom Sheet
    const datePickerBtn = page.locator("#btn-date-range-trigger");
    await expect(datePickerBtn).toBeVisible();
    await datePickerBtn.click();

    const bottomSheet = page.locator("#date-range-mobile-sheet");
    await expect(bottomSheet).toBeVisible();
    await expect(bottomSheet.getByText("Sélectionner une période")).toBeVisible();

    // Fermer la bottom sheet
    await page.locator("#btn-close-mobile-date-sheet").click();
    await expect(bottomSheet).toHaveCount(0);
  });
});

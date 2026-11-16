import { test, expect } from "@playwright/test";

test.describe("Suppression Header Global, Réorganisation Sidebar & Infinite Marquee Vitrine", () => {
  test.beforeEach(async ({ page }) => {
    // Initialisation en tant que owner et compte vérifié
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
      sessionStorage.clear();
    });
  });

  test("1. Suppression du Header Global : Plus de <header> dans le tableau de bord", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // Vérifier qu'aucun élément <header> global n'est présent dans le dashboard
    const headers = page.locator("header");
    await expect(headers).toHaveCount(0);

    // Vérifier que le contenu principal est bien visible
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // Vérifier la présence du titre ou fil d'Ariane de la page
    await expect(page.getByText("Lomé Glow Cosmétiques").first()).toBeVisible();
  });

  test("2. Ligne 1 Haut de Barre Latérale : Logo, Badge BÊTA, Recherche & Notifications", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // Logo AfriBuilder
    const logoInitial = page.locator("aside").getByText("A", { exact: true }).first();
    await expect(logoInitial).toBeVisible();

    // Bouton Recherche (navigation 44px)
    const searchBtn = page.locator("#btn-nav-search");
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Command Palette ouverte
    const commandPaletteInput = page.getByPlaceholder("Rechercher une commande, un client, un colis...");
    await expect(commandPaletteInput).toBeVisible();
    await page.keyboard.press("Escape");

    // Raccourci Ctrl+K / Cmd+K
    await page.keyboard.press("Control+KeyK");
    await expect(commandPaletteInput).toBeVisible();
    await page.keyboard.press("Escape");

    // Bouton Notifications (navigation 44px avec pastille)
    const notifsBtn = page.locator("#btn-nav-notifications");
    await expect(notifsBtn).toBeVisible();
    await notifsBtn.click();

    // Panneau de notifications ouvert
    await expect(page.getByText("Notifications").first()).toBeVisible();
    await expect(page.getByText("Tout marquer comme lu")).toBeVisible();
    await expect(page.getByText("Nouvelle commande #CMD-10482")).toBeVisible();
    await page.keyboard.press("Escape");

    // Badge BÊTA cliquable dans menu utilisateur
    const userMenuBtn = page.locator("#btn-user-menu-trigger");
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();

    const betaBadge = page.locator("#btn-user-menu-beta-info");
    await expect(betaBadge).toBeVisible();
    await betaBadge.click();

    // Modale Bêta v0.9.4 ouverte
    const betaModalTitle = page.locator("#beta-modal-title");
    await expect(betaModalTitle).toBeVisible();
    await expect(betaModalTitle).toHaveText("AfriBuilder Bêta");
    await expect(page.getByText("v0.9.4")).toBeVisible();
    // Fermer la modale via son bouton fermer
    const closeBetaBtn = page.getByRole("dialog").getByRole("button", { name: "Fermer" });
    await closeBetaBtn.click();
    await expect(betaModalTitle).toHaveCount(0);
  });

  test("3. Ligne 2 Sélecteur de Boutique : Retrait strict de 'Gérer mes boutiques' du dropdown", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    const storeSelectorBtn = page.locator("#btn-store-selector");
    await expect(storeSelectorBtn).toBeVisible();
    await storeSelectorBtn.click();

    const dropdown = page.locator("#store-selector-dropdown");
    await expect(dropdown).toBeVisible();

    // Vérifier la présence des boutiques
    await expect(dropdown.getByText("Lomé Glow Cosmétiques")).toBeVisible();
    await expect(dropdown.getByText("Abidjan Prestige Mode")).toBeVisible();
    await expect(dropdown.getByText("+ Créer une boutique")).toBeVisible();

    // VÉRIFICATION CRITIQUE : "Gérer mes boutiques" doit être ABSENT du dropdown
    await expect(dropdown.getByText("Gérer mes boutiques")).toHaveCount(0);
  });

  test("4. Zone Bas Fixe : Ordre strict (Voir vitrine, Gérer boutiques, Réglages, Bloc utilisateur)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // 1. Voir la vitrine (ouvre dans nouvel onglet)
    const storefrontLink = page.locator("#sidebar-link-storefront");
    await expect(storefrontLink).toBeVisible();
    await expect(storefrontLink).toHaveAttribute("target", "_blank");
    await expect(storefrontLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(storefrontLink).toHaveAttribute("href", "/boutique/lome-glow");

    // 2. Gérer mes boutiques
    const manageStoresLink = page.locator("#sidebar-link-manage-stores");
    await expect(manageStoresLink).toBeVisible();
    await expect(manageStoresLink).toHaveAttribute("href", "/app/lome-glow/reglages/boutiques");

    // 3. Réglages
    const settingsLink = page.locator("#sidebar-link-settings");
    await expect(settingsLink).toBeVisible();
    await expect(settingsLink).toHaveAttribute("href", "/app/lome-glow/reglages");

    // 4. Bloc utilisateur (menu vers le haut)
    const userMenuBtn = page.locator("#btn-user-menu-trigger");
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();

    const userPopover = page.locator("#user-menu-popover");
    await expect(userPopover).toBeVisible();
    await expect(userPopover.getByText("Mon profil")).toBeVisible();
    await expect(userPopover.getByText("Donner mon avis")).toBeVisible();
    await expect(userPopover.getByText("Aide et support")).toBeVisible();
    await expect(userPopover.getByText("Déconnexion")).toBeVisible();
  });

  test("5. Restriction de Rôles : Closer ne voit pas 'Gérer mes boutiques' et reçoit un 403 sur URL directe", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "closer");
      localStorage.setItem("afribuilder_user_verified", "true");
    });

    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // 'Gérer mes boutiques' doit être invisible dans la sidebar
    await expect(page.locator("#sidebar-link-manage-stores")).toHaveCount(0);

    // Accès direct à l'URL protégée /reglages/boutiques
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Doit afficher la page d'accès refusé (403)
    await expect(page.getByText("403 · Accès Refusé")).toBeVisible();
    await expect(page.getByText("Gestion des boutiques non autorisée")).toBeVisible();
  });

  test("6. Page 'Gérer mes boutiques' : Duplication, Archivage et Suppression sécurisée", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Titre et synthèses
    await expect(page.getByRole("heading", { name: "Gérer mes boutiques" })).toBeVisible();
    await expect(page.getByText("Total Boutiques")).toBeVisible();
    await expect(page.getByText("Pays Desservis")).toBeVisible();

    // Vérifier la présence de la boutique principale
    const lomeStoreCard = page.locator("div").filter({ hasText: /^Lomé Glow Cosmétiques/ }).first();
    await expect(lomeStoreCard).toBeVisible();

    // Tester la modale de duplication
    const duplicateBtn = page.getByRole("button", { name: "Dupliquer" }).first();
    await duplicateBtn.click();
    await expect(page.getByText("Dupliquer la boutique")).toBeVisible();
    await expect(page.getByText("Éléments dupliqués automatiquement :")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Tester la modale d'archivage
    const archiveBtn = page.getByRole("button", { name: "Archiver" }).first();
    await archiveBtn.click();
    await expect(page.getByText("Archiver la boutique ?")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Tester la modale de suppression sécurisée
    const deleteBtn = page.getByTitle("Supprimer la boutique avec délai de sécurité").first();
    await deleteBtn.click();
    await expect(page.getByText("Suppression sécurisée de boutique")).toBeVisible();
    await expect(page.getByText("Délai d'annulation de 14 jours activé")).toBeVisible();
    await expect(page.getByText("1. Saisissez exactement le nom de la boutique pour confirmer")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
  });

  test("7. Vitrine Infinite Marquee : Zéro lien, boucle fluide, contrôles Pause/Play et Fermer", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow");
    await page.waitForLoadState("networkidle");

    const banner = page.locator('aside[aria-label="Garanties et avis clients"]');
    await expect(banner).toBeVisible();

    // VÉRIFICATION CRITIQUE : ZÉRO LIEN DANS LA BANDE DÉFILANTE
    const linksInsideBanner = banner.locator(".animate-marquee a");
    await expect(linksInsideBanner).toHaveCount(0);

    // Vérifier les contrôles fixes à droite
    const pausePlayBtn = banner.getByRole("button", { name: /Mettre en pause|Reprendre/ });
    await expect(pausePlayBtn).toBeVisible();

    // Clic pour mettre en pause
    await pausePlayBtn.click();
    await expect(banner.getByRole("button", { name: "Reprendre le défilement du bandeau" })).toBeVisible();

    // Reprendre la lecture
    await pausePlayBtn.click();
    await expect(banner.getByRole("button", { name: "Mettre en pause le défilement du bandeau" })).toBeVisible();

    // Bouton fermer
    const closeBtn = banner.getByRole("button", { name: "Fermer le bandeau d'annonces" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Le bandeau doit être masqué
    await expect(banner).toHaveCount(0);
  });

  test("8. Mobile : Bouton flottant 44px ouvrant le tiroir, zéro barre supérieure", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // Aucune barre supérieure
    const headers = page.locator("header");
    await expect(headers).toHaveCount(0);

    // Bouton rond flottant 44px
    const floatingBtn = page.locator("#btn-mobile-drawer-toggle");
    await expect(floatingBtn).toBeVisible();

    // Clic pour ouvrir le tiroir
    await floatingBtn.click();

    // Le tiroir mobile doit s'ouvrir
    const mobileDrawer = page.locator("div.fixed.inset-y-0.left-0");
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.getByText("AfriBuilder")).toBeVisible();
    await expect(mobileDrawer.getByText("Boutique active")).toBeVisible();
    await expect(mobileDrawer.getByText("Voir la vitrine")).toBeVisible();
  });
});

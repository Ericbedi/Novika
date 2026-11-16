import { test, expect } from "@playwright/test";

test.describe("Section Équipe, Rôles, Tarifs et Reversements COD", () => {
  const BASE_URL = "http://localhost:3000/app/lome-glow";

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
    });
  });

  test("1. Réglages > Équipe et Rôles RLS", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/reglages`);

    // Aller sur l'onglet Équipe
    const teamTab = page.getByRole("button", { name: /Équipe/i });
    await expect(teamTab).toBeVisible();
    await teamTab.click();

    // Vérifier les 5 rôles et les politiques de sécurité RLS
    await expect(page.getByText("Politiques de Sécurité RLS actives :")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tous (9)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Closeuses (3)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Livreurs (2)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agences (2)" })).toBeVisible();

    // Filtrer par agences
    await page.getByRole("button", { name: "Agences (2)" }).click();
    await expect(page.getByText("Flash Colis Express")).toBeVisible();

    // Revenir sur Tous
    await page.getByRole("button", { name: "Tous (9)" }).click();

    // Vérifier bouton inviter un collaborateur
    const inviteBtn = page.getByRole("button", { name: "Inviter un collaborateur" });
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();
    await expect(page.getByText("Inviter un nouveau collaborateur par lien")).toBeVisible();
    await expect(page.getByRole("button", { name: "Générer l'invitation" })).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Screenshot Réglages Équipe
    await page.screenshot({ path: "test-results/equipe-01-reglages-team.png", fullPage: true });
  });

  test("2. Page Reversements d'espèces (Finances)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/finances/reversements`);

    // Vérifier les KPI de reversement
    await expect(page.getByRole("heading", { name: "Reversements des Espèces" })).toBeVisible();
    await expect(page.getByText("Total Espèces Encaissées")).toBeVisible();
    await expect(page.getByText("Frais de Livraison Déduits")).toBeVisible();
    await expect(page.getByText("Net Reversé au Propriétaire")).toBeVisible();
    await expect(page.getByText("En Attente de Confirmation", { exact: true })).toBeVisible();

    // Vérifier le tableau des reversements
    await expect(page.getByText("REV-2026-084")).toBeVisible();
    await expect(page.getByText("Flash Colis Express")).toBeVisible();

    // Ouvrir la modale de confirmation propriétaire
    const confirmBtn = page.getByRole("button", { name: "Confirmer réception" }).first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(page.getByText(/Confirmer le reversement/i)).toBeVisible();
    await expect(page.getByText(/Moyen de paiement reçu/i)).toBeVisible();

    // Capture d'écran modale confirmation reversement
    await page.screenshot({ path: "test-results/equipe-02-reversements-modal.png" });

    // Valider
    await page.getByRole("button", { name: "Valider l'encaissement" }).click();
    await expect(page.getByText(/validé avec succès/i)).toBeVisible();

    // Screenshot page reversements après validation
    await page.screenshot({ path: "test-results/equipe-03-reversements-list.png", fullPage: true });
  });

  test("3. Page Tarifs de Livraison par pays & agence", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/livraisons/tarifs`);

    // Vérifier la grille tarifaire
    await expect(page.getByRole("heading", { name: /Tarifs de Livraison/i })).toBeVisible();
    await expect(page.getByText("Lomé Moto VIP Logistique")).toBeVisible();
    await expect(page.getByText("Flash Colis Express").first()).toBeVisible();
    await expect(page.getByText("Livraison Standard :").first()).toBeVisible();

    // Filtre par pays CI
    await page.getByRole("button", { name: "Côte d'Ivoire" }).click();
    await expect(page.getByText("Abidjan (Intra-muros)")).toBeVisible();

    // Revenir à Tous
    await page.getByRole("button", { name: /Tous les pays/i }).click();

    // Screenshot Tarifs
    await page.screenshot({ path: "test-results/equipe-04-tarifs-livraison.png", fullPage: true });
  });

  test("4. Expérience Closeuse (RLS, commandes assignées, interdiction Livrée)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/commandes`);

    // Passer en rôle Closeuse via le tester de rôle dans la sidebar
    const closerRoleBtn = page.getByRole("button", { name: "Closeuse" }).first();
    await expect(closerRoleBtn).toBeVisible();
    await closerRoleBtn.click();

    // Vérifier la bannière Closeuse
    await expect(page.getByText(/Vue Closeuse active/i)).toBeVisible();

    // Screenshot Commandes Mode Closeuse
    await page.screenshot({ path: "test-results/equipe-05-mode-closeuse.png" });

    // Ouvrir le détail d'une commande via le lien d'action
    const detailBtn = page.getByTitle("Voir le détail de la commande").first();
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    // Vérifier que la closeuse a la mention Lecture seule sur les assignations et UTM masquées
    await expect(page.getByText("Lecture seule (RLS)")).toBeVisible();
    await expect(page.getByText("Données UTM masquées")).toBeVisible();

    // Tenter de changer le statut
    await page.getByRole("button", { name: "Changer le statut" }).click();
    await expect(page.getByText("Modifier le statut")).toBeVisible();
    await expect(page.getByText(/Le statut « Livrée » ne peut être validé que par le livreur/i)).toBeVisible();

    // Screenshot Commande Détail Closeuse
    await page.screenshot({ path: "test-results/equipe-06-commande-detail-closeuse.png" });
  });

  test("5. Expérience Livreur Mobile First (Total espèces à reverser & cartes tactiles)", async ({ page }) => {
    // 1. Définir le rôle Livreur
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/livraisons`);
    const riderRoleBtn = page.getByRole("button", { name: "Livreur" }).first();
    await expect(riderRoleBtn).toBeVisible();
    await riderRoleBtn.click();

    // 2. Basculer en vue mobile (iPhone 14 style)
    await page.setViewportSize({ width: 412, height: 915 });

    // Vérifier le bandeau coursier et le Total Espèces Encaissées à Reverser
    await expect(page.getByText("Total Espèces Encaissées à Reverser")).toBeVisible();
    await expect(page.getByText("Koffi Moto-Course")).toBeVisible();

    // Vérifier les gros boutons d'appel et WhatsApp
    await expect(page.getByRole("link", { name: "WhatsApp" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Appeler" }).first()).toBeVisible();

    // Screenshot Livreur Mobile
    await page.screenshot({ path: "test-results/equipe-07-livreur-mobile.png", fullPage: true });

    // Cliquer sur "Livrée (Cash Reçu)" pour valider un colis
    const deliverCashBtn = page.getByRole("button", { name: "Livrée (Cash Reçu)" }).first();
    if (await deliverCashBtn.isVisible()) {
      await deliverCashBtn.click();
      await expect(page.getByText(/Colis marqué LIVRÉ/i)).toBeVisible();
    }

    // Capture après encaissement
    await page.screenshot({ path: "test-results/equipe-08-livreur-cash-remis.png", fullPage: true });
  });

  test("6. Expérience Agence de livraison (Dispatch & KPIs)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/livraisons`);

    // Passer en rôle Agence
    const agencyRoleBtn = page.getByRole("button", { name: "Agence" }).first();
    await expect(agencyRoleBtn).toBeVisible();
    await agencyRoleBtn.click();

    // Vérifier la bannière Agence et les KPIs
    await expect(page.getByText("Espace Agence Partenaire — Flash Colis Express")).toBeVisible();
    await expect(page.getByText("Taux de livraison")).toBeVisible();
    await expect(page.getByText("88.5%")).toBeVisible();
    await expect(page.getByRole("link", { name: "Mes Reversements" })).toBeVisible();

    // Screenshot Agence Logistique
    await page.screenshot({ path: "test-results/equipe-09-agence-hub.png", fullPage: true });

    // Rétablir le mode proprio pour les prochains tests
    await page.getByRole("button", { name: "Proprio" }).first().click();
  });
});

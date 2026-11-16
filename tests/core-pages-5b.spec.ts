import { test, expect } from "@playwright/test";

test.describe("Prompt 5.B - Pages Cœur E-commerce COD", () => {
  const BASE_STORE = "http://localhost:3000/app/lome-glow";

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
    });
  });

  test("1. Page Liste des Commandes (/commandes)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/commandes`);

    // Titre et boutons
    await expect(page.getByRole("heading", { name: "Commandes", exact: true })).toBeVisible();
    await expect(page.getByText("Nouvelle commande")).toBeVisible();
    await expect(page.getByText("Exporter (CSV)")).toBeVisible();

    // Onglets de statut
    await expect(page.getByText("Toutes").first()).toBeVisible();
    await expect(page.getByText("À traiter").first()).toBeVisible();
    await expect(page.getByText("Livrées").first()).toBeVisible();

    // Barre de recherche
    await expect(page.getByPlaceholder("Rechercher par nom client, téléphone, ville, produit ou N° commande...")).toBeVisible();

    // Commandes dans le tableau
    await expect(page.getByText("CMD-10482").first()).toBeVisible();
    await expect(page.getByText("Awa Traoré").first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-01-commandes.png", fullPage: true });
  });

  test("2. Page Détail Commande (/commandes/[number])", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/commandes/CMD-10482`);

    // En-tête et commande
    await expect(page.getByText("Commande #CMD-10482")).toBeVisible();
    await expect(page.getByText("Client & Contact")).toBeVisible();
    await expect(page.getByText("Awa Traoré").first()).toBeVisible();

    // Articles et montants en FCFA
    await expect(page.getByText("Articles commandés (1)")).toBeVisible();
    await expect(page.getByText(/24\s*900/).first()).toBeVisible();
    await expect(page.getByText(/26\s*900/).first()).toBeVisible(); // Total à encaisser

    // Closeuse et livreur assignés
    await expect(page.getByText("Closeuse responsable")).toBeVisible();
    await expect(page.getByText("Livreur assigné")).toBeVisible();

    // Historique des statuts horodaté et notes
    await expect(page.getByText("Historique des statuts horodaté")).toBeVisible();
    await expect(page.getByText("Notes Internes de Closing")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-02-commande-detail.png", fullPage: true });
  });

  test("3. Page Créer une Commande Manuelle (/commandes/nouvelle)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/commandes/nouvelle`);

    await expect(page.getByText("Créer une commande manuelle")).toBeVisible();
    await expect(page.getByText("Coordonnées du Client")).toBeVisible();
    await expect(page.getByPlaceholder("Ex: Awa Traoré")).toBeVisible();

    // Lignes de produits dynamiques
    await expect(page.getByText("Articles Commandés")).toBeVisible();
    await expect(page.getByText("Ajouter un article")).toBeVisible();

    // Calcul Total COD et boutons
    await expect(page.getByText("Calcul Total COD")).toBeVisible();
    await expect(page.getByText("Enregistrer la commande")).toBeVisible();
    await expect(page.getByText("Enregistrer et contacter sur WhatsApp")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-03-nouvelle-commande.png", fullPage: true });
  });

  test("4. Page Produits (/produits)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/produits`);

    await expect(page.getByRole("heading", { name: "Produits", exact: true })).toBeVisible();
    await expect(page.getByText("Nouveau produit")).toBeVisible();

    // Filtres
    await expect(page.getByText("Tous (6)")).toBeVisible();
    await expect(page.getByText("En stock (5)")).toBeVisible();
    await expect(page.getByText("Rupture (1)")).toBeVisible();

    // Produits avec prix de revient et marge
    await expect(page.getByText("Café Bio Champignon Vitality (Pack 2 boîtes)").first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Prix de Revient" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Marge Brute" })).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-04-produits.png", fullPage: true });
  });

  test("5. Page Modifier Produit (/produits/prod_01)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/produits/prod_01`);

    // Formulaire complet
    await expect(page.getByText("Informations Principales")).toBeVisible();
    await expect(page.getByText("Tarification & Rentabilité COD")).toBeVisible();
    await expect(page.getByText("Prix de revient unitaire")).toBeVisible();
    await expect(page.getByText("Variantes (Tailles, Couleurs, Parfums)")).toBeVisible();
    await expect(page.getByText("Offres de Quantité (Packs COD)")).toBeVisible();
    await expect(page.getByText("Éléments de Page Produit")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-05-produit-edit.png", fullPage: true });
  });

  test("6. Page Finances (/finances)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/finances`);

    await expect(page.getByText("Finances & Résultat Net")).toBeVisible();

    // Carte principale résultat net avec formule
    await expect(page.getByText("Encaissé − Coûts = Résultat net")).toBeVisible();
    await expect(page.getByText("1 053 000 FCFA").first()).toBeVisible();

    // Tableau détail du calcul
    await expect(page.getByText("Détail du Calcul de Rentabilité")).toBeVisible();
    await expect(page.getByText("Chiffre d'affaires Encaissé (COD)")).toBeVisible();

    // Section Dépenses
    await expect(page.getByText("Gestion des Dépenses Réelles")).toBeVisible();
    await expect(page.getByText("Ajouter une dépense")).toBeVisible();

    // Livre de compte et règle des retraits
    await expect(page.getByText("Livre de Compte & Flux de Trésorerie")).toBeVisible();
    await expect(page.getByText("Règle comptable COD essentielle :")).toBeVisible();
    await expect(page.getByText("Hors résultat net").first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-06-finances.png", fullPage: true });
  });

  test("7. Page Stats & Rapports (/statistiques)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/statistiques`);

    await expect(page.getByText("Statistiques & Rapports")).toBeVisible();

    // Onglet 1 : Rapports de ventes
    await expect(page.getByText("Ventes Brutes")).toBeVisible();
    await expect(page.getByText("Remises Offertes")).toBeVisible();
    await expect(page.getByText("Retours / Rejets")).toBeVisible();
    await expect(page.getByText("Ventes Nettes", { exact: true })).toBeVisible();
    await expect(page.getByText("Panier Moyen (AOV)")).toBeVisible();
    await expect(page.getByText("Tableau des Campagnes & Tracking UTM")).toBeVisible();

    // Onglet 2 : Rapport de closing
    await page.getByRole("button", { name: "Rapport de closing" }).click();
    await expect(page.getByText("Aïcha Diallo")).toBeVisible();
    await expect(page.getByText("Esther Lawson")).toBeVisible();
    await expect(page.getByText("97%")).toBeVisible();

    // Onglet 3 : Live
    await page.getByRole("button", { name: /Live/ }).click();
    await expect(page.getByText("Activité en Temps Réel")).toBeVisible();
    await expect(page.getByText("Visiteurs Actuels sur la Boutique")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-07-statistiques.png", fullPage: true });
  });

  test("8. Page Réglages (/reglages)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/reglages`);

    await expect(page.getByText("Réglages & Équipe")).toBeVisible();

    // Onglet Général
    await expect(page.getByText("Informations de la Boutique")).toBeVisible();

    // Onglet WhatsApp
    await page.getByRole("button", { name: "WhatsApp" }).click();
    await expect(page.getByText("Paramètres WhatsApp & Modèles de Closing")).toBeVisible();

    // Onglet Pixels & Analytics
    await page.getByRole("button", { name: "Pixels & Analytics" }).click();
    await expect(page.getByText("Meta Pixel & Conversions API (CAPI)")).toBeVisible();
    await expect(page.getByText("TikTok Pixel", { exact: true })).toBeVisible();

    // Onglet Équipe
    await page.getByRole("button", { name: /Équipe/ }).click();
    await expect(page.getByText("Membres & Rôles de l'Équipe")).toBeVisible();
    await expect(page.getByRole("main").getByText("Propriétaire", { exact: true })).toBeVisible();
    await expect(page.getByText("Closeuse WhatsApp").first()).toBeVisible();
    await expect(page.getByText("Livreur").first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5b-08-reglages.png", fullPage: true });
  });
});

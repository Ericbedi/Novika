import { test, expect } from "@playwright/test";

test.describe("Prompt 5.C - Pages Complémentaires E-commerce COD", () => {
  const BASE_STORE = "http://localhost:3000/app/lome-glow";

  test("1. Page Livraisons & Flotte de Livreurs (/livraisons)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/livraisons`);

    // Titres et en-tête
    await expect(page.getByRole("heading", { name: "Livraisons & Tournées" })).toBeVisible();
    await expect(page.getByText("Tournées & Livraisons (7)")).toBeVisible();
    await expect(page.getByText("Livreurs & Tarifs (4)")).toBeVisible();

    // Livreurs & courses
    await expect(page.getByRole("heading", { name: "Mamadou Express" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Koffi Moto-Course" })).toBeVisible();
    await expect(page.getByText("CMD-10482").first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-01-livraisons.png", fullPage: true });
  });

  test("2. Page Relances & Récupération (/commandes/relances)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/commandes/relances`);

    // Titres et KPIs
    await expect(page.getByRole("heading", { name: "Commandes à Relancer" })).toBeVisible();
    await expect(page.getByText("Toutes (4)")).toBeVisible();
    await expect(page.getByText("Injoignables (2)")).toBeVisible();
    await expect(page.getByText("« Je vous reviens » (1)")).toBeVisible();

    // Liste des clients à relancer
    await expect(page.getByText("Mariam Sanogo")).toBeVisible();
    await expect(page.getByText("Kossi Amégan")).toBeVisible();

    // Template WhatsApp
    await page.getByRole("button", { name: "WhatsApp (Modèles)" }).first().click();
    await expect(page.getByText("Modèle WhatsApp pour")).toBeVisible();
    await expect(page.getByText("1. Injoignable")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-02-relances.png", fullPage: true });
  });

  test("3. Page Commandes Abandonnées (/commandes/abandonnees)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/commandes/abandonnees`);

    // En-tête et métriques
    await expect(page.getByRole("heading", { name: "Commandes Abandonnées" })).toBeVisible();
    await expect(page.getByText("Potentiel à Récupérer")).toBeVisible();

    // Commandes abandonnées
    await expect(page.getByText("Clarisse Yao")).toBeVisible();
    await expect(page.getByText("Ablavi Dogbé")).toBeVisible();

    // Bouton de conversion
    await expect(page.getByRole("button", { name: "Convertir en commande" }).first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-03-commandes-abandonnees.png", fullPage: true });
  });

  test("4. Page Clients & Carnet d'Adresses (/clients)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/clients`);

    // En-tête et stats
    await expect(page.getByRole("heading", { name: "Clients & Carnet d'Adresses" })).toBeVisible();
    await expect(page.getByText("Tous (6)")).toBeVisible();
    await expect(page.getByText("VIP (2)")).toBeVisible();

    // Tableau de clients
    await expect(page.getByText("Awa Traoré").first()).toBeVisible();
    await expect(page.getByText("Koffi Mensah").first()).toBeVisible();

    // Modal Nouveau Client
    await page.getByRole("button", { name: "Nouveau client" }).click();
    await expect(page.getByText("Ajouter un client au carnet")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-04-clients.png", fullPage: true });
  });

  test("5. Page Fiche Client Détail (/clients/cst_01)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/clients/cst_01`);

    // Nom et badges
    await expect(page.getByRole("heading", { name: "Awa Traoré" })).toBeVisible();
    await expect(page.getByText(/Client VIP/)).toBeVisible();

    // Coordonnées et notes
    await expect(page.getByText("Total Dépensé (Espèces)")).toBeVisible();
    await expect(page.getByText("Coordonnées & Localisation")).toBeVisible();
    await expect(page.getByText("Notes Internes de la Boutique & Closing")).toBeVisible();

    // Historique des commandes COD
    await expect(page.getByText(/Historique des Commandes COD/)).toBeVisible();
    await expect(page.getByText("CMD-10482")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-05-client-detail.png", fullPage: true });
  });

  test("6. Page Boutique en Ligne & Vitrine COD (/boutique-en-ligne)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/boutique-en-ligne`);

    // En-tête et aperçu
    await expect(page.getByRole("heading", { name: "Boutique en Ligne" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir la boutique" })).toBeVisible();

    // Onglets de configuration
    await expect(page.getByRole("button", { name: "Formulaire de commande" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vendre plus (Codes & Upsells)" })).toBeVisible();

    // Prévisualisation interactive
    await expect(page.getByRole("button", { name: "Aperçu Mobile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aperçu Desktop" })).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-06-boutique-en-ligne.png", fullPage: true });
  });

  test("7. Page Gestion des Stocks (/produits/stock)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/produits/stock`);

    // En-tête et KPIs
    await expect(page.getByRole("heading", { name: "Gestion des Stocks" })).toBeVisible();
    await expect(page.getByText("Total Pièces Disponibles")).toBeVisible();
    await expect(page.getByText("Alertes Seuil Bas")).toBeVisible();

    // Tableau de stocks
    await expect(page.getByText("Café Bio Champignon Vitality (Pack 2 boîtes)").first()).toBeVisible();

    // Modal d'ajustement
    await page.getByRole("button", { name: "Ajuster" }).first().click();
    await expect(page.getByText(/Ajuster le stock :/)).toBeVisible();
    await expect(page.getByText("Motif de l'ajustement")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-07-stock.png", fullPage: true });
  });

  test("8. Page Collections & Catégories (/produits/collections)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_STORE}/produits/collections`);

    // En-tête
    await expect(page.getByRole("heading", { name: "Collections & Catégories" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nouvelle collection" })).toBeVisible();

    // Cartes de collections
    await expect(page.getByText("Bien-être & Vitalité")).toBeVisible();
    await expect(page.getByText("Soins du Visage")).toBeVisible();

    // Modal Nouvelle Collection
    await page.getByRole("button", { name: "Nouvelle collection" }).click();
    await expect(page.getByText("Créer une collection")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/5c-08-collections.png", fullPage: true });
  });
});

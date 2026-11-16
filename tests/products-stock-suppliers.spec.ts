import { test, expect } from "@playwright/test";

test.describe("Module Produits, Stock, Fournisseurs, Achats Fournisseurs, Collections", () => {
  const BASE_URL = "http://localhost:3000/app/alpha-beauty";

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("afribuilder_active_role")) {
        localStorage.setItem("afribuilder_active_role", "owner");
      }
    });
  });

  test("1. Liste des Produits : 5 Onglets, Indicateurs ABC, Vitesse, Stock dispo & Filtres", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits`);

    // 1. Vérifier la barre des 5 onglets de navigation
    await expect(page.getByRole("link", { name: /Produits/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Stock/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Fournisseurs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Achats fournisseurs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Collections/i }).first()).toBeVisible();

    // 2. Vérifier les 3 indicateurs en haut
    await expect(page.getByText("Vitesse de Vente Moyenne")).toBeVisible();
    await expect(page.getByText("Jours de Stock Restants", { exact: true })).toBeVisible();
    await expect(page.getByText("Analyse ABC du Catalogue")).toBeVisible();
    await expect(page.getByText("Classe A").first()).toBeVisible();
    await expect(page.getByText("Classe B").first()).toBeVisible();
    await expect(page.getByText("Classe C").first()).toBeVisible();

    // 3. Vérifier les boutons d'action
    const importBtn = page.getByRole("button", { name: /Importer depuis un lien/i });
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toBeDisabled();

    await expect(page.getByRole("link", { name: /Nouveau produit/i })).toBeVisible();

    // 4. Vérifier les colonnes du tableau
    await expect(page.getByRole("columnheader", { name: "Produit" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Statut" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Stock Dispo" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Jours Restants" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Classe ABC" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Coût / Marge" })).toBeVisible();

    // 5. Vérifier la présence du badge "Réappro en cours"
    await expect(page.getByText("Réappro en cours").first()).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-01-products-list.png", fullPage: true });
  });

  test("2. Fiche Produit Style Shopify : 2 Colonnes, Marge Directe, Variantes, SEO & Barre Collante", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits/prod_01`);

    // Vérifier les 2 colonnes
    await expect(page.getByText("Titre du produit")).toBeVisible();
    await expect(page.getByText("Description (Éditeur riche)")).toBeVisible();
    await expect(page.getByText("Médias du produit")).toBeVisible();
    await expect(page.getByText("Principale", { exact: true })).toBeVisible();

    // Tarification et marge en direct
    await expect(page.getByText("Tarification")).toBeVisible();
    await expect(page.getByText("Marge brute estimée par article :")).toBeVisible();
    await expect(page.getByText("+16 400 FCFA")).toBeVisible();
    await expect(page.getByText(/Marge : 65\./i)).toBeVisible();

    // Facturer la taxe & Inventaire
    await expect(page.getByText("Facturer la taxe sur ce produit")).toBeVisible();
    await expect(page.getByText("Suivre la quantité en stock")).toBeVisible();
    await expect(page.getByText("C'est un produit physique")).toBeVisible();

    // Variantes & Offres de quantité
    await expect(page.locator('input[value*="Pack Découverte"]')).toBeVisible();
    await expect(page.locator('input[value*="Pack Double Énergie"]')).toBeVisible();
    await expect(page.getByText("Offres de Quantité COD")).toBeVisible();

    // SEO Google Preview
    await expect(page.getByText("Aperçu Moteur de Recherche (SEO)")).toBeVisible();

    // Colonne latérale
    await expect(page.getByText("Statut du produit")).toBeVisible();
    await expect(page.getByText("Canaux de vente")).toBeVisible();
    await expect(page.getByText("Performance COD")).toBeVisible();
    await expect(page.getByText("Organisation")).toBeVisible();

    // Modifier le titre pour déclencher la barre collante "Modifications non enregistrées"
    const titleInput = page.locator('input[placeholder*="Café Bio Champignon"]');
    await titleInput.fill("Café Bio Champignon Vitality (Formule Renforcée)");

    // Vérifier l'apparition de la barre collante en bas
    const stickyBar = page.getByText("Modifications non enregistrées");
    await expect(stickyBar).toBeVisible();

    // Cliquer sur Enregistrer dans la barre collante
    const saveStickyBtn = page.getByRole("button", { name: "Enregistrer" }).last();
    await saveStickyBtn.click({ force: true });

    // Vérifier le toast de confirmation
    await expect(page.getByText("Fiche produit enregistrée avec succès !")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-02-shopify-product-form.png", fullPage: true });
  });

  test("3. Onglet Stock : Règles Métier, Bloc « À renouveler », Vélocité & Ajustement", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits/stock`);

    // 1. Vérifier les KPI de stock
    await expect(page.getByText("Stock Physique")).toBeVisible();
    await expect(page.getByText("Stock Réservé")).toBeVisible();
    await expect(page.getByText("Stock Disponible", { exact: true })).toBeVisible();
    await expect(page.getByText("= Physique − Réservé")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "En Transit" }).first()).toBeVisible();

    // 2. Vérifier le sélecteur de vélocité
    await expect(page.getByRole("button", { name: "7 jours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "14 jours" })).toBeVisible();
    await expect(page.getByRole("button", { name: "30 jours" })).toBeVisible();

    // 3. Vérifier le bloc « À renouveler »
    await expect(page.getByText("Articles prioritaires à renouveler")).toBeVisible();
    await expect(page.getByText("Thé Détox Ventre Plat 28 Jours").first()).toBeVisible();
    await expect(page.getByText("Masseur Cervical Chauffant EMS Intelligent").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Créer un bon de commande/i }).first()).toBeVisible();

    // 4. Vérifier le tableau par lieu
    await expect(page.getByRole("columnheader", { name: "Lieu de Stock" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Disponible" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Jours Restants" })).toBeVisible();

    // 5. Ouvrir la modale d'ajustement
    const adjustBtn = page.getByRole("button", { name: "Ajuster" }).first();
    await adjustBtn.click();

    await expect(page.getByText("Ajuster le stock")).toBeVisible();
    await expect(page.getByText("Motif obligatoire de l'ajustement")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrée (+ en stock)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sortie (- du stock)" })).toBeVisible();

    // Valider un ajustement
    await page.getByRole("button", { name: "Confirmer le mouvement" }).click();

    // Vérifier l'onglet Historique des Mouvements
    await page.getByRole("button", { name: /Historique des Mouvements/i }).click();
    await expect(page.getByText("Journal d'audit des mouvements de stock")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-03-stock-management.png", fullPage: true });
  });

  test("4. Onglet Fournisseurs : Scorecard, WhatsApp Direct & Produits Fournis", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits/fournisseurs`);

    // 1. Vérifier la liste des fournisseurs
    await expect(page.getByText("Guangzhou Beauty & Health Supply Co.").first()).toBeVisible();
    await expect(page.getByText("Laboratoires Phytopharm Abidjan").first()).toBeVisible();
    await expect(page.getByText("Lomé Fast Distribution & Tech").first()).toBeVisible();

    // 2. Vérifier le bouton WhatsApp direct
    const whatsappBtn = page.getByRole("link", { name: /WhatsApp direct/i });
    await expect(whatsappBtn).toBeVisible();
    await expect(whatsappBtn).toHaveAttribute("href", /https:\/\/wa\.me\//);

    // 3. Vérifier la Scorecard de performance
    await expect(page.getByText("Tableau de Bord & Performance Réelle")).toBeVisible();
    await expect(page.getByText("Délai Annoncé")).toBeVisible();
    await expect(page.getByText("Délai Réel Moyen")).toBeVisible();
    await expect(page.getByText("Taux de Défauts", { exact: true })).toBeVisible();

    // 4. Vérifier les articles fournis avec prix d'achat en FCFA
    await expect(page.getByText("Articles Fournis")).toBeVisible();
    await expect(page.getByText("Prix d'Achat Unitaire")).toBeVisible();
    await expect(page.getByText("4 500 FCFA")).toBeVisible();

    // 5. Vérifier la modale Nouveau fournisseur
    const newSupplierBtn = page.getByRole("button", { name: "Nouveau fournisseur" });
    await newSupplierBtn.click();
    await expect(page.getByText("Nom de l'entreprise fournisseur")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-04-suppliers.png", fullPage: true });
  });

  test("5. Onglet Achats Fournisseurs : Frais d'Approche Prorata, Modal Réception & PUMP", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits/achats`);

    // 1. Vérifier les indicateurs
    await expect(page.getByText("Commandes en Transit / Cours")).toBeVisible();
    await expect(page.getByText("Total Frais d'Approche", { exact: true })).toBeVisible();
    await expect(page.getByText("Règle de Réception & PUMP")).toBeVisible();

    // 2. Vérifier les bons de commande existants
    await expect(page.getByText("PO-2026-042").first()).toBeVisible();
    await expect(page.getByText("Expédié (En transit)").first()).toBeVisible();

    // 3. Vérifier le détail et la répartition prorata des frais d'approche
    await expect(page.getByText("Fret maritime / aérien :")).toBeVisible();
    await expect(page.getByText("Droits de douane & taxes portuaires :")).toBeVisible();
    await expect(page.getByText("Commission transitaire / agent d'achat :")).toBeVisible();
    await expect(page.getByText("Part Frais Approche")).toBeVisible();
    await expect(page.getByText("Coût Unitaire Rendu (PUMP)")).toBeVisible();

    // 4. Tester la modale de réception
    const receiveBtn = page.getByRole("button", { name: "Réceptionner le bon" });
    await expect(receiveBtn).toBeVisible();
    await receiveBtn.click();

    await expect(page.getByText("Déclarez les unités conformes et signalez les éventuels défauts")).toBeVisible();
    await expect(page.getByText("Unités conformes reçues").first()).toBeVisible();
    await expect(page.getByText("Unités défectueuses / cassées").first()).toBeVisible();
    await expect(page.getByText("Stock physique augmenté des unités conformes.")).toBeVisible();

    // Valider la réception
    await page.getByRole("button", { name: "Valider la réception" }).click();

    // Vérifier le toast de confirmation
    await expect(page.getByText(/Réception confirmée/i)).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-05-purchase-orders.png", fullPage: true });
  });

  test("6. Onglet Collections : Manuelles & Automatiques avec Règles", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/produits/collections`);

    // 1. Vérifier les badges Manuel vs Automatique
    await expect(page.getByText("Manuelle").first()).toBeVisible();
    await expect(page.getByText("Automatique (Règles)").first()).toBeVisible();

    // 2. Vérifier les collections existantes
    await expect(page.getByText("Bien-être & Vitalité")).toBeVisible();
    await expect(page.getByText("Best-Sellers (Classe A)")).toBeVisible();
    await expect(page.getByText("Condition appliquée :").first()).toBeVisible();

    // 3. Ouvrir la modale Nouvelle collection
    const newColBtn = page.getByRole("button", { name: "Nouvelle collection" });
    await newColBtn.click();
    await expect(page.getByText("Titre de la collection")).toBeVisible();
    await expect(page.getByRole("button", { name: "Automatisée (Selon des règles)" })).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-06-collections.png", fullPage: true });
  });

  test("7. Permissions et Sécurité RLS : Rôle Closeuse (Coûts et Fournisseurs Masqués)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Initialiser le rôle closeuse
    await page.goto(`${BASE_URL}/produits`);
    const closerRoleBtn = page.getByRole("button", { name: "Closeuse" }).first();
    await expect(closerRoleBtn).toBeVisible();
    await closerRoleBtn.click();

    // 1. Vérifier que la closeuse voit les onglets Produits, Stock et Collections, mais PAS Fournisseurs ni Achats
    await expect(page.getByRole("link", { name: /Produits/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Stock/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Collections/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Fournisseurs/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Achats fournisseurs/i })).toHaveCount(0);

    // 2. Vérifier que les colonnes Coût de revient et Marge sont masquées
    await expect(page.getByRole("columnheader", { name: "Coût / Marge" })).toHaveCount(0);

    // 3. Fixer explicitement dans localStorage et naviguer vers Fournisseurs
    await page.evaluate(() => localStorage.setItem("afribuilder_active_role", "closer"));
    await page.goto(`${BASE_URL}/produits/fournisseurs`);
    await expect(page.getByText("Accès Restreint par Politique RLS")).toBeVisible();
    await expect(page.getByText("Les fiches fournisseurs, contrats d'approvisionnement et prix d'achat unitaires sont réservés aux administrateurs")).toBeVisible();

    // 4. Naviguer vers Achats
    await page.goto(`${BASE_URL}/produits/achats`);
    await expect(page.getByText("Accès Restreint par Politique RLS")).toBeVisible();

    // Capture d'écran
    await page.screenshot({ path: "test-results/prod-07-closer-rls-restricted.png", fullPage: true });
  });
});

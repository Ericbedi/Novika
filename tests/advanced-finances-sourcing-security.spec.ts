import { test, expect } from "@playwright/test";

test.describe("Extension Finances Avancées, Sourcing, Point & Sécurité", () => {
  const BASE_URL = "http://localhost:3000/app/lome-glow";
  const ARTIFACT_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
    });
  });

  test("1. DateRangePicker Universel : Pill Button, 12 Choix Rapides & Comparaison A/B", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}`);

    // Vérifier la présence du bouton sélecteur pill dans le Globe / Command Center
    const pickerBtn = page.getByRole("button", { name: /30 derniers jours|7 derniers jours/i }).first();
    await expect(pickerBtn).toBeVisible();

    // Ouvrir le DateRangePicker
    await pickerBtn.click();
    await expect(page.getByText("Sélection rapide")).toBeVisible();
    await expect(page.getByText("Plage de dates personnalisée")).toBeVisible();
    await expect(page.getByText("Comparé à :")).toBeVisible();

    // Tester la sélection d'un preset rapide (ex: 7 derniers jours)
    await page.getByText("7 derniers jours").first().click();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-01-daterangepicker-open.png` });
  });

  test("2. Caisses & Comptes : Trésorerie Consolidée, Création & Modal de Réconciliation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/finances/caisse`);

    // Vérifier les compteurs de trésorerie
    await expect(page.getByText("Trésorerie Totale")).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "Mobile Money" }).first()).toBeVisible();
    await expect(page.locator("span").filter({ hasText: "Cash Livreurs (Transit)" }).first()).toBeVisible();

    // Vérifier les comptes
    await expect(page.getByText("Wave Business (Côte d'Ivoire)")).toBeVisible();
    await expect(page.getByText("Compte Bancaire Ecobank Courant")).toBeVisible();

    // Tester la modale de réconciliation
    const reconcileBtn = page.getByRole("button", { name: "Réconcilier" }).first();
    await expect(reconcileBtn).toBeVisible();
    await reconcileBtn.click();

    await expect(page.getByText(/Réconciliation :/i)).toBeVisible();
    await expect(page.getByText("Solde théorique système :")).toBeVisible();
    await expect(page.getByText("Écart constaté :")).toBeVisible();

    // Valider la réconciliation
    await page.getByRole("button", { name: "Valider la réconciliation" }).click();
    await expect(page.getByText(/Réconciliation validée/i)).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-02-caisse-reconciliation.png` });
  });

  test("3. Dépenses & Transferts : Seuil d'Approbation & Contre-passation d'Annulation (Reversal)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/finances/depenses`);

    // Vérifier le tableau des dépenses
    await expect(page.getByText("Cartons d'emballage renforcés 3 couches")).toBeVisible();
    await expect(page.getByText("Publicité Meta").first()).toBeVisible();

    // Vérifier la présence du badge d'approbation et bouton d'annulation reversal
    await expect(page.getByText("Approuvé").first()).toBeVisible();
    const reversalBtn = page.getByRole("button", { name: "Annuler (Reversal)" }).first();
    await expect(reversalBtn).toBeVisible();

    // Basculer sur l'onglet Transferts
    await page.getByRole("button", { name: /Transferts/i }).first().click();
    await expect(page.getByText("Compte Source")).toBeVisible();
    await expect(page.getByText("Compte Destination")).toBeVisible();

    // Basculer sur l'onglet Charges récurrentes
    await page.getByRole("button", { name: /Charges récurrentes/i }).first().click();
    await expect(page.getByText("Loyer bureau & stock Abidjan")).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-03-depenses-transferts.png` });
  });

  test("4. Publicités : Calcul Automatique du CPA Réel & ROAS Net par Plateforme", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/finances/publicite`);

    // Vérifier les 4 métriques synthétiques
    await expect(page.getByText("Budget Pub Dépensé")).toBeVisible();
    await expect(page.getByText("Commandes Livrées", { exact: true })).toBeVisible();
    await expect(page.getByText("CPA Réel Moyen")).toBeVisible();
    await expect(page.getByText("ROAS Net Livré")).toBeVisible();

    // Vérifier la décomposition par plateforme
    await expect(page.getByText("Performance & Part par Plateforme Publicitaire")).toBeVisible();
    await expect(page.getByText("Meta Ads").first()).toBeVisible();
    await expect(page.getByText("TikTok Ads").first()).toBeVisible();

    // Vérifier la présence du bouton Exporter CSV
    await expect(page.getByRole("button", { name: "Exporter (CSV)" })).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-04-publicites-cpa-reel.png` });
  });

  test("5. Sourcing : 5 Compteurs KPI, Devises Étrangères CNY/USD & Recalcul PUMP", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/sourcing`);

    // Vérifier les 5 compteurs de Sourcing
    await expect(page.getByText("En stock", { exact: true })).toBeVisible();
    await expect(page.getByText("En attente du fournisseur", { exact: true })).toBeVisible();
    await expect(page.getByText("Commandés", { exact: true })).toBeVisible();
    await expect(page.getByText("Expédiés", { exact: true })).toBeVisible();
    await expect(page.getByText("Coût total", { exact: true })).toBeVisible();

    // Vérifier le bouton Sourcer un produit
    await expect(page.getByRole("button", { name: "Sourcer un produit" })).toBeVisible();

    // Vérifier les métadonnées de sourcing international (devises et agents)
    await expect(page.getByText("Devise Fournisseur & Taux")).toBeVisible();
    await expect(page.getByText("Agent de Sourcing Partenaire")).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-05-sourcing-kpis.png` });
  });

  test("6. Point Livreurs & Closeuses : Plafond Cash-in-hand, Reversement 2 Étapes & Bonus", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/point`);

    // 1. Point Livreurs : Vérifier l'alerte de plafond dépassé
    await expect(page.getByText(/Plafond d'espèces dépassé/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mamadou Express" })).toBeVisible();

    // Tester la modale Faire le point / Reversement
    const pointBtn = page.getByRole("button", { name: "Faire le point" }).first();
    await expect(pointBtn).toBeVisible();
    await pointBtn.click();

    await expect(page.getByText(/Point & Reversement :/i)).toBeVisible();
    await expect(page.getByText("Espèces théoriques à reverser :")).toBeVisible();

    // Valider le reversement
    await page.getByRole("button", { name: "Confirmer la réception des fonds" }).click();
    await expect(page.getByText(/Reversement de .* validé/i)).toBeVisible();

    // 2. Basculer sur Point Closeuses
    await page.getByRole("button", { name: /Point Closeuses/i }).click();
    await expect(page.getByText("Aïcha Diallo")).toBeVisible();
    await expect(page.getByText(/Commissions Cumulées/i).first()).toBeVisible();
    await expect(page.getByText(/Objectif Mensuel/i).first()).toBeVisible();
    await expect(page.getByText(/Palier 1/i).first()).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-06-point-livreurs-closeuses.png` });
  });

  test("7. Livre des Comptes : Cascade Financière Complète COD & Entonnoir de Commande", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/finances/livre-des-comptes`);

    // Vérifier les niveaux de la cascade financière
    await expect(page.getByText("Chiffre d'Affaires Brut Encaissé")).toBeVisible();
    await expect(page.getByText("Coût des Marchandises Vendues (COGS / PUMP)")).toBeVisible();
    await expect(page.getByText("= Marge Brute Commerciale")).toBeVisible();
    await expect(page.getByText("= Marge Nette sur Coûts Variables")).toBeVisible();
    await expect(page.getByText("RÉSULTAT NET RÉEL EN POCHE")).toBeVisible();

    // Vérifier l'entonnoir de commande
    await expect(page.getByText("Entonnoir de Conversion des Commandes COD")).toBeVisible();
    await expect(page.getByText("Confirmées par closeuses")).toBeVisible();
    await expect(page.getByText("Encaissées 100% en espèces")).toBeVisible();

    // Vérifier le tableau 12 mois glissants
    await expect(page.getByText("Évolution sur 12 Mois Glissants")).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-07-livre-des-comptes-cascade.png` });
  });

  test("8. Journal d'Activité & Invitations : Piste d'Audit Append-Only & Rôles Scellés", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/reglages/activite`);

    // Vérifier le badge Append-Only
    await expect(page.getByText("Journal Immuable (Append-Only)")).toBeVisible();

    // Vérifier les entrées de log avec IP et User-Agent
    await expect(page.getByText("Tentative d'accès non autorisé bloquée (RLS)")).toBeVisible();
    await expect(page.getByText("IP : 154.72.164.22 (Lomé, Togo)").first()).toBeVisible();

    // Basculer sur les alertes de sécurité
    await page.getByRole("button", { name: /Alertes Sécurité/i }).click();
    await expect(page.getByText("Alerte Sécurité : Export massif de contacts clients bloqué")).toBeVisible();

    // Basculer sur les invitations sécurisées
    await page.getByRole("button", { name: /Invitations Sécurisées/i }).click();
    await expect(page.getByText("Gestion des Jetons d'Invitation à Usage Unique")).toBeVisible();
    await expect(page.getByText("Actif (72h)").first()).toBeVisible();

    // Ouvrir la modale d'invitation
    await page.getByRole("button", { name: "Inviter un membre" }).click();
    await expect(page.getByText("Rôle strictement figé *")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();

    await page.screenshot({ path: `${ARTIFACT_DIR}/ext-08-journal-activite-invitations.png` });
  });
});

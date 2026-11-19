import { test, expect } from "@playwright/test";

test.describe("Prompt 14-A : Résilience et intégrité de la page Produits", () => {
  test.beforeEach(async ({ page }) => {
    // Session administrateur propriétaire pour l'espace vendeur
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_admin_01",
          email: "admin@novika.com",
          role: "owner",
          createdAt: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
      {
        name: "novika_active_role",
        value: "owner",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("1. Admin connecté ouvre Produits (/produits) : Liste affichée, onglets actifs, aucun crash", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const response = await page.goto("/app/lome-glow/produits", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Vérifier l'absence absolue de l'écran d'erreur
    const errorBanner = page.locator("text=Une erreur inattendue est survenue");
    await expect(errorBanner).toHaveCount(0);

    // Titre principal et en-tête
    const heading = page.getByRole("heading", { name: "Produits", exact: true });
    await expect(heading).toBeVisible();

    // Barre de navigation 5 onglets (Produits, Stock, Fournisseurs, Achats, Collections)
    await expect(page.getByRole("link", { name: /Produits/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Stock/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Fournisseurs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Achats fournisseurs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Collections/i }).first()).toBeVisible();

    // 3 Indicateurs clés (KPI)
    await expect(page.getByText("Vitesse de Vente Moyenne")).toBeVisible();
    await expect(page.getByText("Jours de Stock Restants", { exact: true })).toBeVisible();
    await expect(page.getByText("Analyse ABC du Catalogue")).toBeVisible();

    // Tableau des produits et éléments
    await expect(page.getByText("Café Bio Champignon Vitality").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Nouveau produit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Importer (CSV)" })).toBeVisible();
  });

  test("2. Ouverture de la fiche produit en édition (/produits/[id]) : Formulaire complet fonctionnel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const response = await page.goto("/app/lome-glow/produits/prod_01", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Vérifier l'absence d'écran d'erreur
    await expect(page.locator("text=Une erreur inattendue est survenue")).toHaveCount(0);

    // Vérifier les champs du formulaire pré-remplis
    const titleInput = page.locator("input#input-product-name, input[placeholder*='Titre du produit'], input[value*='Café Bio']").first();
    await expect(titleInput).toBeVisible();

    // Section rentabilité COD et prix
    await expect(page.getByRole("heading", { name: "Tarification" })).toBeVisible();
    await expect(page.getByText("Prix de vente *")).toBeVisible();
    await expect(page.getByText("Coût par article (PUMP)")).toBeVisible();

    // Section médias et inventaire
    await expect(page.getByRole("heading", { name: "Médias du produit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inventaire & Stock" })).toBeVisible();

    // Bouton de retour vers la liste des produits
    const backBtn = page.getByRole("link", { name: /Retour/i }).first();
    await expect(backBtn).toBeVisible();
  });

  test("3. Affichage résilient d'un catalogue vide : État zéro produit clair et bouton d'action", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Initialiser le localStorage pour un catalogue vierge
    await page.addInitScript(() => {
      localStorage.setItem("novika_store_products_cotonou-tech", JSON.stringify([]));
    });

    const response = await page.goto("/app/cotonou-tech/produits", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Aucun crash
    await expect(page.locator("text=Une erreur inattendue est survenue")).toHaveCount(0);

    // Message rassurant d'état vide
    await expect(page.getByText("Votre catalogue est vide")).toBeVisible();
    await expect(page.getByText("Vous démarrez avec une boutique vierge")).toBeVisible();

    // Bouton pour créer son premier produit
    const addFirstBtn = page.getByRole("link", { name: /Ajouter mon premier produit/i });
    await expect(addFirstBtn).toBeVisible();
    await addFirstBtn.click();

    // Arrivée sur /produits/nouveau
    await expect(page).toHaveURL(/\/app\/cotonou-tech\/produits\/nouveau/);
    await expect(page.locator("text=Une erreur inattendue est survenue")).toHaveCount(0);
  });

  test("4. API de journalisation serveur /api/logs/client-error : Enregistrement structuré du contexte", async ({ request }) => {
    const testIncidentId = `ERR-TEST-${Date.now().toString(36).toUpperCase()}`;

    const res = await request.post("/api/logs/client-error", {
      data: {
        incidentId: testIncidentId,
        message: "Test unitaire de capture d'erreur",
        route: "/app/lome-glow/produits",
        store: "lome-glow",
        userId: "usr_test_admin",
        timestamp: new Date().toISOString(),
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.incidentId).toBe(testIncidentId);
  });
});

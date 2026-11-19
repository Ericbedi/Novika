import { test, expect } from "@playwright/test";

test.describe("Prompt 14-B : Gestion de la corbeille, suppression en lot et suppression définitive", () => {
  const storeSlug = "lome-glow";

  test.beforeEach(async ({ page }) => {
    // Session propriétaire (owner) par défaut
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_owner_01",
          email: "owner@novika.com",
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

  test("1. Onglets de filtrage : Tous, Actifs, Brouillons, Archivés et Corbeille affichés avec compteurs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const response = await page.goto(`/app/${storeSlug}/produits`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Vérifier les 5 sous-onglets
    await expect(page.locator("#btn-tab-all")).toBeVisible();
    await expect(page.locator("#btn-tab-active")).toBeVisible();
    await expect(page.locator("#btn-tab-draft")).toBeVisible();
    await expect(page.locator("#btn-tab-archived")).toBeVisible();
    await expect(page.locator("#btn-tab-trash")).toBeVisible();

    // Cliquer sur l'onglet Corbeille
    await page.locator("#btn-tab-trash").click();

    // Vérifier la bannière d'explication de la corbeille (30 jours)
    await expect(page.getByText("Articles dans la corbeille (Rétention 30 jours)")).toBeVisible();
  });

  test("2. Soft delete : Déplacer un produit dans la corbeille et annuler via le Toast Undo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`/app/${storeSlug}/produits`, { waitUntil: "networkidle" });

    // Trouver le bouton supprimer du premier produit
    const deleteBtn = page.locator("[id^='btn-delete-prod_']").first();
    await expect(deleteBtn).toBeVisible();

    // Cliquer sur supprimer -> Déplacer dans la corbeille
    await deleteBtn.click();

    // Vérifier que le Toast Undo apparaît avec le bouton "Annuler"
    const undoToast = page.locator("#toast-undo-trash");
    await expect(undoToast).toBeVisible();
    await expect(page.locator("#btn-undo-trash")).toBeVisible();

    // Cliquer sur "Annuler" pour restaurer immédiatement
    await page.locator("#btn-undo-trash").click();

    // Le produit est restauré et le toast d'annulation confirme
    await expect(page.getByText("Suppression annulée : produit(s) restauré(s).")).toBeVisible();
  });

  test("3. Fiche produit : Zone dangereuse en rouge tout en bas avec bouton 'Supprimer ce produit'", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`/app/${storeSlug}/produits/prod_01`, { waitUntil: "networkidle" });

    // Faire défiler jusqu'en bas
    const dangerZone = page.locator("#danger-zone-delete");
    await expect(dangerZone).toBeVisible();

    // Vérifier le texte et le bouton
    await expect(dangerZone.getByText("Zone dangereuse")).toBeVisible();
    await expect(page.locator("#btn-delete-product")).toBeVisible();
  });

  test("4. Vitrine publique : Le produit en corbeille affiche une 404 en français", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Placer un produit test dans la corbeille via localStorage
    await page.addInitScript(() => {
      const trashed = [
        {
          id: "prod_trashed_test",
          name: "Produit En Corbeille Test",
          slug: "produit-corbeille-test",
          salePrice: 15000,
          costPrice: 5000,
          stock: 10,
          productStatus: "active",
          deletedAt: new Date().toISOString(),
          variants: [],
          quantityOffers: [],
          badgesConfig: { badges: [] },
          images: ["/products/mushroom-coffee.png"],
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("novika_store_products_lome-glow", JSON.stringify(trashed));
    });

    // Visiter l'URL publique de la fiche du produit supprimé
    await page.goto(`/boutique/lome-glow/produit/produit-corbeille-test`, { waitUntil: "networkidle" });

    // Doit afficher l'écran 404 en français
    await expect(page.getByText("Produit introuvable ou indisponible")).toBeVisible();
    await expect(page.getByText("Ce produit n'existe pas ou n'est plus actif dans le catalogue")).toBeVisible();
    await expect(page.getByRole("link", { name: "Retourner au catalogue" })).toBeVisible();
  });

  test("5. Barre d'actions groupées : Sélection multiple et barre flottante (Publier, Dépublier, Archiver, Supprimer)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`/app/${storeSlug}/produits`, { waitUntil: "networkidle" });

    // Cocher "Tout sélectionner"
    const selectAllCheckbox = page.locator("#checkbox-select-all");
    await selectAllCheckbox.click();

    // La barre d'actions flottante doit apparaître au bas de l'écran
    const batchBar = page.locator("#batch-bar");
    await expect(batchBar).toBeVisible();

    // Vérifier les boutons d'actions en lot
    await expect(page.locator("#btn-batch-publish")).toBeVisible();
    await expect(page.locator("#btn-batch-unpublish")).toBeVisible();
    await expect(page.locator("#btn-batch-archive")).toBeVisible();
    await expect(page.locator("#btn-batch-trash")).toBeVisible();
  });

  test("6. Protection commandes existantes : Hard delete bloqué si commandes en cours", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Configurer un produit en corbeille avec une commande en cours
    await page.addInitScript(() => {
      const trashed = [
        {
          id: "prod_01",
          name: "Café Bio Champignon Vitality",
          slug: "cafe-bio-champignon",
          salePrice: 24900,
          costPrice: 8000,
          stock: 15,
          productStatus: "active",
          deletedAt: new Date().toISOString(),
          variants: [],
          quantityOffers: [],
          badgesConfig: { badges: [] },
          images: ["/products/mushroom-coffee.png"],
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("novika_store_products_lome-glow", JSON.stringify(trashed));

      // Commande en cours pour prod_01
      const orders = [
        {
          id: "ord_pending_01",
          orderNumber: "CMD-9901",
          customerName: "Jean Kouassi",
          status: "pending",
          items: [{ productId: "prod_01", productName: "Café Bio", unitPrice: 24900, quantity: 1 }],
          totalAmount: 24900,
          createdAt: "Aujourd'hui",
        },
      ];
      localStorage.setItem("novika_store_orders_lome-glow", JSON.stringify(orders));
    });

    await page.goto(`/app/${storeSlug}/produits`, { waitUntil: "networkidle" });

    // Ouvrir l'onglet Corbeille
    await page.locator("#btn-tab-trash").click();

    // Cliquer sur "Supprimer définitivement"
    const hardDeleteBtn = page.locator("#btn-hard-delete-prod_01");
    await expect(hardDeleteBtn).toBeVisible();
    await hardDeleteBtn.click();

    // Vérifier la modale et le message bloquant
    const modal = page.locator("#modal-hard-delete");
    await expect(modal).toBeVisible();
    await expect(page.getByText("Suppression impossible : commandes en cours")).toBeVisible();
    await expect(page.getByText("commande(s) en cours contiennent ce produit")).toBeVisible();

    // Le bouton de confirmation finale doit être absent ou inopérant
    await expect(page.locator("#btn-confirm-hard-delete")).toHaveCount(0);
  });
});

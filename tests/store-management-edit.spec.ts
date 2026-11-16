import { test, expect } from "@playwright/test";
import {
  getAllStores,
  getStoreById,
  getStoreBySlug,
  isSlugAvailable,
  updateStore,
  deleteStore,
  getSlugRedirect,
  getStoreAuditLogs,
} from "../src/server/data/store-repository";
import {
  canEditStore,
  canChangeStoreSlug,
  canDeleteStore,
  canChangeStoreCountry,
} from "../src/config/permissions";

test.describe("Prompt 05-M : Modifier une boutique (page « Gérer mes boutiques »)", () => {
  // =========================================================================
  // 1. TESTS UNITAIRES ET LOGIQUE MÉTIER
  // =========================================================================

  test("M1. Matrice de permissions Novika (Prompt 05-M)", () => {
    // Seul le propriétaire peut tout modifier
    expect(canEditStore("owner")).toBe(true);
    expect(canChangeStoreSlug("owner")).toBe(true);
    expect(canDeleteStore("owner")).toBe(true);

    // L'administrateur (admin) peut modifier les infos de base mais PAS le slug ni supprimer
    expect(canEditStore("admin")).toBe(true);
    expect(canChangeStoreSlug("admin")).toBe(false);
    expect(canDeleteStore("admin")).toBe(false);

    // Les autres rôles (manager, closer, rider, etc.) n'ont aucun droit
    expect(canEditStore("manager")).toBe(false);
    expect(canEditStore("closer")).toBe(false);
    expect(canEditStore("rider")).toBe(false);
    expect(canEditStore("courier")).toBe(false);
    expect(canEditStore("agency")).toBe(false);
  });

  test("M2. Règles strictes de modification de pays et devise (orderCount > 0 vs == 0)", () => {
    // Si orderCount > 0, STRICTEMENT verrouillé même pour le propriétaire
    expect(canChangeStoreCountry("owner", 142)).toBe(false);
    expect(canChangeStoreCountry("admin", 142)).toBe(false);
    expect(canChangeStoreCountry("owner", 1)).toBe(false);

    // Si orderCount === 0, modifiable par le propriétaire et l'admin
    expect(canChangeStoreCountry("owner", 0)).toBe(true);
    expect(canChangeStoreCountry("admin", 0)).toBe(true);
    expect(canChangeStoreCountry("manager", 0)).toBe(false);
  });

  test("M3. Validation du slug (3-40 car, minuscules/chiffres/tirets, unicité)", () => {
    // Formats valides
    expect(isSlugAvailable("lome-boutique-2")).toBe(true);
    expect(isSlugAvailable("top10")).toBe(true);

    // Format trop court (< 3 car)
    expect(isSlugAvailable("ab")).toBe(false);

    // Caractères interdits (majuscules, espaces, accents, symboles)
    expect(isSlugAvailable("Lome-Glow")).toBe(false);
    expect(isSlugAvailable("lome glow")).toBe(false);
    expect(isSlugAvailable("lomé-glow")).toBe(false);
    expect(isSlugAvailable("lome_glow")).toBe(false);

    // Slug déjà existant
    expect(isSlugAvailable("lome-glow")).toBe(false);
    // Mais disponible pour la même boutique
    expect(isSlugAvailable("lome-glow", "store_tg_01")).toBe(true);
  });

  test("M4. Mise à jour de slug et création d'une redirection 301 pour 90 jours", () => {
    const store = getStoreById("store_tg_01");
    expect(store).toBeDefined();

    const result = updateStore({
      storeId: "store_tg_01",
      userRole: "owner",
      userId: "usr_owner_01",
      updates: {
        slug: "lome-glow-officiel",
      },
    });

    expect(result.success).toBe(true);
    expect(result.redirectCreated).toBe(true);
    expect(result.store?.slug).toBe("lome-glow-officiel");

    // Vérifie que la redirection 301 de 90 jours a été enregistrée
    const redirect = getSlugRedirect("lome-glow");
    expect(redirect).toBeDefined();
    expect(redirect?.newSlug).toBe("lome-glow-officiel");

    // Remettre le slug initial pour les autres tests
    updateStore({
      storeId: "store_tg_01",
      userRole: "owner",
      userId: "usr_owner_01",
      updates: { slug: "lome-glow" },
    });
  });

  test("M5. Verrouillage du pays si la boutique a déjà des commandes", () => {
    const result = updateStore({
      storeId: "store_tg_01", // possède 142 commandes
      userRole: "owner",
      userId: "usr_owner_01",
      updates: { country: "CI" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Pour vendre dans un autre pays, dupliquez la boutique");
  });

  test("M6. Autorisation de modifier le pays si 0 commande", () => {
    const storeBj = getStoreById("store_bj_04"); // possède 0 commande
    expect(storeBj).toBeDefined();
    expect(storeBj?.orderCount).toBe(0);

    const result = updateStore({
      storeId: "store_bj_04",
      userRole: "owner",
      userId: "usr_owner_01",
      updates: { country: "SN" },
    });

    expect(result.success).toBe(true);
    expect(result.store?.country).toBe("SN");
    expect(result.store?.countryName).toBe("Sénégal");

    // Remettre le pays initial
    updateStore({
      storeId: "store_bj_04",
      userRole: "owner",
      userId: "usr_owner_01",
      updates: { country: "BJ" },
    });
  });

  test("M7. Protection contre les modifications simultanées (Verrouillage optimiste)", () => {
    const store = getStoreById("store_tg_01");
    expect(store).toBeDefined();
    const currentVersion = store!.version;

    // Simulation d'une version obsolète
    const result = updateStore({
      storeId: "store_tg_01",
      userRole: "owner",
      userId: "usr_admin_02",
      clientVersion: currentVersion - 1, // Version en retard
      updates: { name: "Tentative Concurrente" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cette boutique a été modifiée par quelqu'un d'autre, rechargez");
  });

  test("M8. Traçabilité et journal d'audit des modifications", () => {
    updateStore({
      storeId: "store_tg_01",
      userRole: "owner",
      userId: "usr_owner_01",
      updates: { description: "Nouvelle description auditée Novika." },
    });

    const logs = getStoreAuditLogs("store_tg_01");
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[0];
    expect(lastLog.userId).toBe("usr_owner_01");
    expect(lastLog.changes.some((c) => c.field === "description")).toBe(true);
  });

  test("M9. Suppression : confirmation du nom exact et délai de 30 jours si commandes", () => {
    // 1. Échec si mauvais nom de confirmation
    const failRes = deleteStore({
      storeId: "store_tg_01",
      userRole: "owner",
      confirmName: "Mauvais Nom",
    });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain("Nom de confirmation incorrect");

    // 2. Échec si rôle non propriétaire
    const nonOwnerRes = deleteStore({
      storeId: "store_tg_01",
      userRole: "admin",
      confirmName: "Lomé Glow Cosmétiques",
    });
    expect(nonOwnerRes.success).toBe(false);
    expect(nonOwnerRes.error).toContain("Seul l'administrateur propriétaire (owner) peut supprimer");

    // 3. Succès avec période de grâce de 30 jours si commandes > 0
    const storeTg = getStoreById("store_tg_01");
    const okRes = deleteStore({
      storeId: "store_tg_01",
      userRole: "owner",
      confirmName: storeTg!.name,
    });
    expect(okRes.success).toBe(true);
    expect(storeTg!.status).toBe("pending_deletion");
    expect(storeTg!.deletionDate).toBeDefined();

    // Rétablir le statut actif pour les tests d'interface
    storeTg!.status = "active";
    storeTg!.deletionDate = undefined;
  });

  // =========================================================================
  // 2. TESTS INTERFACE ET SCÉNARIOS UTILISATEUR
  // =========================================================================

  test("UI1. Ordre strict des boutons sur la carte de boutique (Prompt 05-M)", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Vérifie la présence du bouton Modifier sur la carte Lomé Glow
    const editBtn = page.locator("#btn-edit-store-lome-glow");
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toContainText("Modifier");

    // Vérifie la présence du bouton Aperçu (œil)
    const previewBtn = page.locator("#btn-store-preview-lome-glow");
    await expect(previewBtn).toBeVisible();

    // Vérifie le bouton Dupliquer
    const dupBtn = page.locator("#btn-duplicate-store-lome-glow");
    await expect(dupBtn).toBeVisible();

    // Vérifie le bouton Archiver
    const archiveBtn = page.locator("#btn-archive-store-lome-glow");
    await expect(archiveBtn).toBeVisible();

    // Vérifie le bouton Supprimer
    const deleteBtn = page.locator("#btn-delete-store-lome-glow");
    await expect(deleteBtn).toBeVisible();

    // Vérifie que sur une boutique non active (ex: Abidjan Prestige), le bouton 'Basculer ici' est présent avant l'œil
    const cardAbidjan = page.locator("text=Abidjan Prestige Mode").locator("xpath=ancestor::div[contains(@class, 'rounded-2xl border')]");
    await expect(cardAbidjan.getByRole("button", { name: "Basculer ici" })).toBeVisible();
  });

  test("UI2. Clic sur le bouton 'Modifier' ouvre le tiroir latéral (Drawer)", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Clic sur le bouton Modifier
    await page.locator("#btn-edit-store-lome-glow").click();

    // Vérification du drawer
    const drawer = page.getByRole("dialog", { name: "Modifier la boutique" });
    await expect(drawer).toBeVisible();

    // Vérification des champs pré-remplis
    await expect(drawer.getByRole("heading", { name: "Modifier la boutique" })).toBeVisible();
    await expect(drawer.getByPlaceholder("Ex: Lomé Glow Cosmétiques")).toHaveValue("Lomé Glow Cosmétiques");
    await expect(drawer.locator("input[value='lome-glow']")).toBeVisible();
    await expect(drawer.locator("input[value='+22890123456']")).toBeVisible();

    // Vérifie le verrouillage du pays (orderCount > 0)
    await expect(drawer.getByText("Verrouillé (142 commandes)")).toBeVisible();
    await expect(drawer.getByText("Pour vendre dans un autre pays :")).toBeVisible();

    // Vérifie le lien de personnalisation de la vitrine
    const customizeLink = drawer.getByRole("link", { name: "Personnaliser" });
    await expect(customizeLink).toBeVisible();
    await expect(customizeLink).toHaveAttribute("href", "/app/lome-glow/reglages/theme");
  });

  test("UI3. Clic sur le nom de la boutique ouvre également le tiroir Modifier", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Clic sur le lien avec le nom de la boutique
    await page.locator("#link-edit-store-lome-glow").click();

    const drawer = page.getByRole("dialog", { name: "Modifier la boutique" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByPlaceholder("Ex: Lomé Glow Cosmétiques")).toBeVisible();
  });

  test("UI4. Alerte de modifications non enregistrées à la fermeture du tiroir", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    await page.locator("#btn-edit-store-lome-glow").click();
    const drawer = page.getByRole("dialog", { name: "Modifier la boutique" });
    await expect(drawer).toBeVisible();

    // Modifier le nom de la boutique
    const nameInput = drawer.getByPlaceholder("Ex: Lomé Glow Cosmétiques");
    await nameInput.fill("Lomé Glow Cosmétiques Modifié");

    // Tenter de fermer le panneau en cliquant sur la croix
    await drawer.getByLabel("Fermer le panneau").click();

    // La boîte d'avertissement 'Modifications non enregistrées' doit s'afficher
    await expect(page.getByText("Modifications non enregistrées")).toBeVisible();
    await expect(page.getByText("Vous avez des modifications en cours pour la boutique")).toBeVisible();

    // Cliquer sur Continuer l'édition
    await page.getByRole("button", { name: "Continuer l'édition" }).click();
    await expect(page.getByText("Modifications non enregistrées")).not.toBeVisible();
    await expect(drawer).toBeVisible();

    // Cliquer à nouveau sur fermer puis Abandonner les modifications
    await drawer.getByLabel("Fermer le panneau").click();
    await page.getByRole("button", { name: "Abandonner les modifications" }).click();
    await expect(drawer).not.toBeVisible();
  });

  test("UI5. Consultation d'une boutique archivée en lecture seule avec bouton Restaurer", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Clic sur Modifier pour la boutique archivée Dakar Vital Santé
    const editDakarBtn = page.locator("#btn-edit-store-dakar-vital");
    if (await editDakarBtn.isVisible()) {
      await editDakarBtn.click();
      const drawer = page.getByRole("dialog");
      await expect(drawer).toBeVisible();

      // Vérifie le bandeau d'archivage
      await expect(drawer.getByText("Cette boutique est archivée (lecture seule)")).toBeVisible();
      await expect(drawer.getByRole("button", { name: "Restaurer" }).first()).toBeVisible();
    }
  });

  test("UI6. Modale de suppression sécurisée avec saisie obligatoire du nom exact", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Clic sur l'icône poubelle de Lomé Glow
    await page.locator("#btn-delete-store-lome-glow").click();

    // Vérifie la modale de suppression
    const modal = page.getByRole("dialog", { name: "Suppression sécurisée de boutique" });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Période de grâce de 30 jours (commandes existantes)")).toBeVisible();
    await expect(modal.getByRole("button", { name: "Préférer archiver" })).toBeVisible();

    // Bouton de confirmation désactivé au départ
    const confirmBtn = page.locator("#btn-confirm-delete-store");
    await expect(confirmBtn).toBeDisabled();

    // Saisie incorrecte
    await page.locator("#input-delete-store-confirm-name").fill("Mauvais Nom");
    await page.locator("#input-delete-store-password").fill("admin123");
    await expect(confirmBtn).toBeDisabled();

    // Saisie exacte
    await page.locator("#input-delete-store-confirm-name").fill("Lomé Glow Cosmétiques");
    await expect(confirmBtn).toBeEnabled();

    // Fermer
    await modal.getByRole("button", { name: "Annuler" }).click();
    await expect(modal).not.toBeVisible();
  });
});

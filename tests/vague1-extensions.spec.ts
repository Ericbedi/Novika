import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Vague 1 Extensions : K1 à K6 & Porte de Sécurité", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("afribuilder_active_role", "owner");
    });
  });

  test("K1: Page de suivi client sécurisée avec minimisation PII et lien WhatsApp", async ({ page }) => {
    // 1. Accès au jeton de suivi valide
    const validUrl = `${BASE_URL}/suivi/tok_secure_awa_traore_abidjan_20261115_valid`;
    await page.goto(validUrl);
    await page.waitForSelector("text=Lomé Glow Cosmétique", { timeout: 15000 });

    // Vérifier l'en-tête de la boutique et le numéro de commande
    await expect(page.getByText("Lomé Glow Cosmétique")).toBeVisible();
    await expect(page.getByText("CMD-10482")).toBeVisible();

    // Vérifier la frise chronologique
    await expect(page.getByText("Reçue").first()).toBeVisible();
    await expect(page.getByText("En livraison").first()).toBeVisible();
    await expect(page.getByText("Livrée").first()).toBeVisible();

    // Vérification de la minimisation stricte PII (K1)
    await expect(page.getByText("Awa T.")).toBeVisible(); // Nom masqué
    await expect(page.getByText(/\+225.*••.*02/)).toBeVisible(); // Téléphone masqué
    await expect(page.getByText("Abidjan (Cocody Angré)")).toBeVisible(); // Ville/commune
    // L'adresse de rue précise ne doit JAMAIS apparaître publiquement
    await expect(page.getByText("Près du Nouveau CHU, Villa 45")).not.toBeVisible();

    // Vérifier le bouton de contact WhatsApp
    const waBtn = page.getByRole("link", { name: /Contacter la boutique sur WhatsApp/i });
    await expect(waBtn).toBeVisible();
    expect(await waBtn.getAttribute("href")).toContain("wa.me");

    // Screenshot page de suivi client valide
    await page.screenshot({ path: "tests/screenshots/v1-01-public-tracking-valid.png" });

    // 2. Vérification d'un jeton expiré (Sécurité K1)
    const expiredUrl = `${BASE_URL}/suivi/tok_expired_sample_token_30days_passed`;
    await page.goto(expiredUrl);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Lien de suivi non disponible")).toBeVisible();
    await expect(page.getByText(/a expiré par mesure de confidentialité/i)).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/v1-02-public-tracking-expired.png" });
  });

  test("K1 & K2: Partage de lien de suivi et Preuve de livraison sur la commande", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/CMD-10482`);
    await page.waitForSelector("h1:has-text('Commande #')", { timeout: 15000 });

    // 1. Bouton "Lien de suivi client" et modal de partage
    const trackingBtn = page.getByRole("button", { name: "Lien de suivi client" });
    await expect(trackingBtn).toBeVisible();
    await trackingBtn.click();

    await expect(page.getByText("Lien public de suivi (Expire après 30 jours)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copier le message" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Envoyer sur WhatsApp" })).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/v1-03-seller-tracking-modal.png" });

    // Fermer la modale
    await page.getByRole("button", { name: "Fermer" }).click();

    // 2. Preuve de livraison (K2) dans le changement de statut
    const statusBtn = page.getByRole("button", { name: "Changer le statut" });
    await statusBtn.click();

    // Sélectionner statut Livrée
    const statusSelect = page.locator("#status-select");
    await statusSelect.selectOption("delivered");

    // Vérifier l'affichage du bloc Preuve de livraison obligatoire
    await expect(page.getByText("Preuve de livraison obligatoire (K2)")).toBeVisible();
    await expect(page.getByText("Code de confirmation client (4 chiffres) :")).toBeVisible();

    // Test saisie d'un code erroné (doit déclencher une alerte / incrémenter les tentatives)
    const codeInput = page.getByPlaceholder("Ex: 4821");
    await codeInput.fill("0000");

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("incorrect");
      await dialog.accept();
    });

    const updateBtn = page.getByRole("button", { name: "Mettre à jour" });
    await updateBtn.click();

    // Saisie du code valide (4821)
    await codeInput.fill("4821");
    // Cocher le consentement de géolocalisation livreur
    await page.locator("input[type='checkbox']").first().check();

    await page.screenshot({ path: "tests/screenshots/v1-04-delivery-proof-code.png" });

    await updateBtn.click();
    await expect(page.getByText(/Statut mis à jour : Livrée/i)).toBeVisible();
  });

  test("K3: Création de commande rapide par conversation WhatsApp et modèles", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/commandes/rapide`);
    await page.waitForSelector("h1:has-text('Nouvelle commande rapide')", { timeout: 15000 });

    await expect(page.getByRole("heading", { name: /Nouvelle commande rapide/i })).toBeVisible();

    // 1. Cliquer sur l'exemple Abidjan
    const sampleBtn = page.getByRole("button", { name: "Exemple Abidjan (Café Vitality)" });
    await sampleBtn.click();
    await page.waitForTimeout(300);

    // 2. Extraire avec l'IA
    const extractBtn = page.getByRole("button", { name: /Extraire avec l'IA/i });
    await extractBtn.click();

    // Vérifier l'affichage du brouillon extrait
    await expect(page.getByText("2. Brouillon extrait à vérifier")).toBeVisible();
    await expect(page.getByTestId("quick-customer-name")).toHaveValue("Awa Traoré");
    await expect(page.getByTestId("quick-customer-phone")).toHaveValue("+2250748291102");
    await expect(page.getByTestId("quick-city")).toHaveValue("Abidjan (Cocody Angré)");

    // Vérifier la présence du bouton de validation humaine
    await expect(page.getByRole("button", { name: /Valider et créer la commande officielle/i })).toBeVisible();

    // Vérifier les modèles de réponses rapides
    await expect(page.getByText("Modèles de réponses rapides")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copier" })).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/v1-05-quick-order-whatsapp-draft.png" });

    // 3. Test de barrière contre injection de prompt
    const injectSampleBtn = page.getByRole("button", { name: "Test de sécurité (Tentative d'injection)" });
    await injectSampleBtn.click();
    await page.waitForTimeout(300);
    await extractBtn.click();

    // Le nom Salif Koné est extrait sainement sans exécuter de commande SQL
    await expect(page.getByTestId("quick-customer-name")).toHaveValue("Salif Koné");
    await page.screenshot({ path: "tests/screenshots/v1-06-quick-order-injection-neutralized.png" });
  });

  test("K4: Mobile PWA, Mode données réduites & File hors-ligne", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/reglages/mobile`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Application Mobile & Hors-Ligne/i })).toBeVisible();

    // 1. Basculer le mode données réduites
    const lowDataToggle = page.locator("input[type='checkbox']").first();
    await lowDataToggle.check({ force: true });

    // 2. Simuler une livraison hors-ligne
    const simOfflineBtn = page.getByRole("button", { name: "+ Simuler livraison hors-ligne" });
    await simOfflineBtn.click();

    // Vérifier l'apparition de l'action dans la file
    await expect(page.getByText("Actions locales en file d'attente (1)")).toBeVisible();
    await expect(page.getByText(/Commande #CMD-10482/i)).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/v1-07-mobile-offline-queue.png" });

    // 3. Synchroniser avec le serveur
    const syncBtn = page.getByRole("button", { name: /Synchroniser \(1\)/i });
    await syncBtn.click();

    await expect(page.getByText(/synchronisée\(s\) avec succès avec le serveur/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/v1-08-mobile-offline-synced.png" });
  });

  test("K5: 5 Thèmes de vitrine validés et basculement 1-clic", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/boutique-en-ligne`);
    await page.waitForLoadState("networkidle");

    // Vérifier les 5 thèmes prédéfinis
    await expect(page.getByText("Bannière Hero Impact").first()).toBeVisible();
    await expect(page.getByText("Galerie Visuelle").first()).toBeVisible();
    await expect(page.getByText("Éditorial & Storytelling").first()).toBeVisible();
    await expect(page.getByText("Vitrine Express COD").first()).toBeVisible();
    await expect(page.getByText("Minimaliste Moderne").first()).toBeVisible();

    // Cliquer sur le thème Vitrine Express COD
    const expressThemeBtn = page.locator("button:has-text('Vitrine Express COD')").first();
    await expressThemeBtn.click();

    // Vérifier la mise à jour de la palette
    await expect(page.getByText("Police : Montserrat")).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/v1-09-storefront-themes-catalog.png" });
  });

  test("K6: Facturation sur commandes livrées, Quotas & Mobile Money", async ({ page }) => {
    await page.goto(`${BASE_URL}/app/lome-glow/reglages/facturation`);
    await page.waitForLoadState("networkidle");

    // 1. Vérifier la bannière fondamentale
    await expect(page.getByText(/Vous êtes facturé uniquement sur les commandes LIVRÉES/i)).toBeVisible();

    // 2. Vérifier les jauges d'usage
    await expect(page.getByText("18 / 20")).toBeVisible(); // 18 livrées sur 20 offertes
    await expect(page.getByText(/35 reçues, 0 FCFA facturé sur les rejets/i)).toBeVisible();

    // 3. Toggle Mensuel / Annuel (-20%)
    const annualBtn = page.getByRole("button", { name: /Facturation Annuelle/i });
    await annualBtn.click();
    await expect(page.getByText("11 900 XOF")).toBeVisible(); // Starter avec remise 20%

    // 4. Souscription via Mobile Money
    const upgradeStarterBtn = page.locator("button:has-text('Choisir cette formule')").first();
    await upgradeStarterBtn.click();

    // Vérifier la modale Mobile Money
    await expect(page.getByText(/Sélectionnez votre moyen de paiement/i)).toBeVisible();
    await expect(page.getByText("Wave")).toBeVisible();
    await expect(page.getByText("Orange Money")).toBeVisible();
    await expect(page.getByText("MTN MoMo")).toBeVisible();
    await expect(page.getByText("Moov Money")).toBeVisible();

    // Sélectionner MTN MoMo
    await page.locator("button:has-text('MTN MoMo')").click();

    await page.screenshot({ path: "tests/screenshots/v1-10-billing-mobile-money-modal.png" });

    // Confirmer le paiement
    const payBtn = page.getByRole("button", { name: "Confirmer le paiement Mobile Money" });
    await payBtn.click();

    await expect(page.getByText(/Abonnement Starter Croissance activé avec succès via MTN/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/v1-11-billing-upgraded-success.png" });
  });
});

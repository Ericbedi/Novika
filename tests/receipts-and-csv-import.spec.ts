import { test, expect } from "@playwright/test";

test.describe("Vérification E2E : Reçus de livraison dédiés, Import CSV & Icône d'œil", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
      sessionStorage.clear();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 1 : Icône d'œil (Produits, Boutique, Menu latéral, Fiche produit)
  // --------------------------------------------------------------------------
  test("1. Icônes d'œil et aperçu privé sécurisé", async ({ page }) => {
    // A. Menu latéral : Bouton œil sur la ligne Boutique & suppression de 'Voir la vitrine'
    await page.goto("http://localhost:3000/app/lome-glow/produits");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // L'ancien bouton "Voir la vitrine" au bas de la barre latérale n'existe plus
    const oldShowcaseLink = page.locator("a:has-text('Voir la vitrine')");
    await expect(oldShowcaseLink).toHaveCount(0);

    // La petite icône d'œil sur la ligne Boutique est présente
    const sidebarEye = page.locator("#btn-sidebar-store-preview");
    await expect(sidebarEye).toBeVisible();

    // B. Table des produits : Boutons œil sur chaque ligne
    const productEye = page.locator("#btn-product-preview-prod_01");
    await expect(productEye).toBeVisible();
    await expect(productEye).toHaveAttribute("title", /Voir sur la boutique/);

    // C. Colonne Visible avec Switch
    const visibilityToggle = page.locator("#toggle-visibility-prod_01");
    await expect(visibilityToggle).toBeVisible();

    // D. Fiche produit : Bouton d'en-tête "Voir sur la boutique" avec œil
    await page.goto("http://localhost:3000/app/lome-glow/produits/prod_01");
    await page.waitForSelector("#btn-product-view-public", { state: "visible" });

    const productHeaderEye = page.locator("#btn-product-view-public");
    await expect(productHeaderEye).toBeVisible();
    await expect(productHeaderEye).toContainText("Voir sur la boutique");

    // E. Aperçu privé d'un produit (route /apercu/produit/id)
    await page.goto("http://localhost:3000/boutique/lome-glow/apercu/produit/prod_01");
    const previewBanner = page.locator("#preview-mode-banner");
    await expect(previewBanner).toBeVisible();
    await expect(previewBanner).toContainText("Aperçu privé");
    await expect(previewBanner).toContainText("Expire dans");
  });

  // --------------------------------------------------------------------------
  // TEST 2 : Assistant d'importation CSV en 5 étapes
  // --------------------------------------------------------------------------
  test("2. Import CSV produits : Modale 5 étapes, Modèle et Test à blanc", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/produits");
    await page.waitForSelector("#btn-import-csv", { state: "visible" });

    // Ouvrir la modale d'import CSV
    await page.click("#btn-import-csv");
    const modal = page.locator("#csv-import-modal");
    await expect(modal).toBeVisible();

    // Étape 1 : Fichier & Téléchargement du modèle
    await expect(modal).toContainText("Étape 1 sur 5");
    const downloadTemplateBtn = page.locator("#btn-download-csv-template");
    await expect(downloadTemplateBtn).toBeVisible();

    // Étape 2 : Passer au mappage (fichier de test chargé par défaut)
    const nextBtn = page.locator("#btn-csv-next-step");
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Vérifier l'étape 2 (Mappage colonnes)
    await expect(modal).toContainText("Étape 2 sur 5");
    await expect(page.locator("#select-map-title")).toBeVisible();
    await page.click("#btn-csv-next-step");

    // Étape 3 : Options d'importation
    await expect(modal).toContainText("Étape 3 sur 5");
    await expect(page.locator("#import-mode-create_and_update")).toBeVisible();
    await page.click("#btn-csv-next-step");

    // Étape 4 : Test à blanc (Dry Run obligatoire sans écriture)
    await expect(modal).toContainText("Étape 4 sur 5");
    await expect(page.locator("#dry-run-summary")).toBeVisible();
    await expect(page.locator("#dry-run-create-count")).toBeVisible();

    // Étape 5 : Lancer l'import réel
    await page.click("#btn-run-import-confirm");
    await page.waitForSelector("#import-progress-bar", { state: "visible" });
    await expect(page.locator("#import-progress-bar")).toBeVisible();

    // Attendre la fin de l'import et le rapport final
    await page.waitForSelector("#btn-finish-import", { state: "visible", timeout: 10000 });
    await expect(modal).toContainText("Importation terminée avec succès");
    await expect(page.locator("#btn-rollback-import")).toBeVisible();

    // Fermer l'assistant
    await page.click("#btn-finish-import");
    await expect(modal).toHaveCount(0);
  });

  // --------------------------------------------------------------------------
  // TEST 3 : Onglet "Contenu du reçu" dans la fiche produit
  // --------------------------------------------------------------------------
  test("3. Fiche produit : Onglet Contenu du reçu, limite 140 car WhatsApp & Aide IA", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/produits/prod_01");
    await page.waitForSelector("#tab-product-receipt-content", { state: "visible" });

    // Basculer sur l'onglet Contenu du reçu
    await page.click("#tab-product-receipt-content");
    const receiptPane = page.locator("#receipt-content-tab-pane");
    await expect(receiptPane).toBeVisible();

    // Vérifier les champs spécifiques
    const usageInput = page.locator("#receipt-usage-input");
    await expect(usageInput).toBeVisible();
    await expect(page.locator("#receipt-warranty-input")).toBeVisible();
    await expect(page.locator("#receipt-returns-input")).toBeVisible();
    await expect(page.locator("#receipt-precautions-input")).toBeVisible();
    await expect(page.locator("#receipt-care-input")).toBeVisible();
    await expect(page.locator("#receipt-thankyou-input")).toBeVisible();

    // Champ Ligne WhatsApp courte avec compteur de 140 caractères
    const waLineInput = page.locator("#receipt-short-whatsapp-input");
    await expect(waLineInput).toBeVisible();
    const charCounter = page.locator("#receipt-wa-char-counter");
    await expect(charCounter).toBeVisible();
    await expect(charCounter).toContainText("/ 140");

    // Bouton de génération IA du reçu
    const aiGenBtn = page.locator("#btn-ai-generate-receipt");
    await expect(aiGenBtn).toBeVisible();
    await aiGenBtn.click();
    await page.waitForTimeout(500);

    // Vérifier que le texte a été injecté
    const usageVal = await usageInput.inputValue();
    expect(usageVal.length).toBeGreaterThan(10);
  });

  // --------------------------------------------------------------------------
  // TEST 4 : Page publique du reçu (/recu/[token])
  // --------------------------------------------------------------------------
  test("4. Page publique du reçu client : Confidentialité, Détails & Impression", async ({ page }) => {
    const token = "rcp_cmd10480_tok_fatou_diop_delivered_secure_01";
    await page.goto(`http://localhost:3000/recu/${token}`);
    await page.waitForSelector("#receipt-public-container", { state: "visible" });

    // A. En-tête de la boutique
    await expect(page.locator("#receipt-public-container")).toContainText("Lomé Glow Cosmétiques");
    await expect(page.locator("#receipt-number")).toContainText("REC-2026-010480");

    // B. Confidentialité client : Prénom & Ville UNIQUEMENT
    const customerName = page.locator("#receipt-customer-name");
    await expect(customerName).toContainText("Fatou");
    const customerCity = page.locator("#receipt-customer-city");
    await expect(customerCity).toContainText("Dakar (Plateau)");

    // Vérifier l'absence formelle de numéro de téléphone en clair et d'adresse rue
    const bodyText = await page.innerText("#receipt-public-container");
    expect(bodyText).not.toContain("+221770001122");
    expect(bodyText).not.toContain("Rue 12 x Boulevard de la République");

    // C. Articles et blocs d'accompagnement
    await expect(page.locator("#receipt-public-container")).toContainText("Café Bio Champignon Vitality");
    await expect(page.locator("#receipt-public-container")).toContainText("Conseils d'utilisation");
    await expect(page.locator("#receipt-public-container")).toContainText("Garantie");

    // D. Montant total et mention légale
    const totalPaid = page.locator("#receipt-total-paid");
    await expect(totalPaid).toContainText("25 000");
    await expect(page.locator("#receipt-public-container")).toContainText(
      "Ce reçu confirme la livraison et le paiement de la commande. Il ne remplace pas une facture."
    );

    // E. Boutons d'action : Imprimer et Aide WhatsApp
    await expect(page.locator("#btn-print-receipt")).toBeVisible();
    await expect(page.locator("#btn-receipt-whatsapp-help")).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // TEST 5 : Page "Reçus à envoyer" (/app/[store]/commandes/recus)
  // --------------------------------------------------------------------------
  test("5. Gestion des reçus : Compteurs, Envoi WhatsApp, Invite retour & Opt-out", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/commandes/recus");
    await page.waitForSelector("#stat-to-send-count", { state: "visible" });

    // A. Cartes de statistiques
    await expect(page.locator("#stat-to-send-count")).toBeVisible();

    // B. Liste des cartes de reçus
    const firstReceiptCard = page.locator("#receipt-card-rcp_ord_10480");
    await expect(firstReceiptCard).toBeVisible();
    await expect(firstReceiptCard).toContainText("Fatou");
    await expect(firstReceiptCard).toContainText("REC-2026-010480");

    // C. Actions sur la carte : Copier message et lien
    const copyMsgBtn = page.locator("#btn-copy-msg-rcp_ord_10480");
    await expect(copyMsgBtn).toBeVisible();
    const copyLinkBtn = page.locator("#btn-copy-link-rcp_ord_10480");
    await expect(copyLinkBtn).toBeVisible();

    // D. Clic sur "Envoyer sur WhatsApp" -> Déclenchement de l'invite au retour
    const sendWaBtn = page.locator("#btn-send-whatsapp-rcp_ord_10480");
    await expect(sendWaBtn).toBeVisible();
    await sendWaBtn.click();

    // Vérifier l'apparition de la modale d'invite au retour
    const confirmBtn = page.locator("#btn-confirm-sent-yes");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Basculer sur l'onglet "Envoyés" pour vérifier que le reçu y figure bien
    await page.click("button:has-text('Envoyés')");
    const sentCard = page.locator("#receipt-card-rcp_ord_10480");
    await expect(sentCard).toContainText("Envoyé");

    // E. Paramètres des reçus (Modale de configuration)
    const settingsBtn = page.locator("#btn-receipt-settings");
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await expect(page.locator("#btn-save-receipt-settings")).toBeVisible();
    await page.click("#btn-save-receipt-settings");
  });

  // --------------------------------------------------------------------------
  // TEST 6 : Fiche commande (CMD-10480) & Limite de 3 renvois
  // --------------------------------------------------------------------------
  test("6. Fiche commande : Bloc Reçu dédié, Historique et Limite 3 renvois", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/commandes/CMD-10480");
    await page.waitForSelector("#order-receipt-card", { state: "visible" });

    const receiptCard = page.locator("#order-receipt-card");
    await expect(receiptCard).toBeVisible();
    await expect(receiptCard).toContainText("REC-2026-010480");

    // Boutons Voir reçu et Copier lien
    await expect(page.locator("#btn-order-view-receipt")).toBeVisible();
    await expect(page.locator("#btn-order-copy-receipt-link")).toBeVisible();

    // Bouton de renvoi sur WhatsApp
    const resendBtn = page.locator("#btn-order-resend-receipt");
    await expect(resendBtn).toBeVisible();
    await resendBtn.click();

    // Modale de renvoi avec motif obligatoire
    await expect(page.locator("#resend-reason-select")).toBeVisible();
    const confirmResendBtn = page.locator("#btn-confirm-resend");
    await expect(confirmResendBtn).toBeVisible();
    await confirmResendBtn.click();

    // Vérifier l'incrémentation du compteur de renvois
    await expect(receiptCard).toContainText("1 / 3");
  });
});

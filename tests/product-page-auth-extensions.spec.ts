import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("EXTENSION : Formulaire de commande, Modèle page produit, Bannière défilante, Thème par image, Inscription", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("afribuilder_active_role", "owner");
    });
  });

  test("A & B: Formulaire de commande COD standard et Modèle 15 sections", async ({ page }) => {
    // 1. Accès à la page produit standard
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/prod_coffee`);
    await page.waitForLoadState("networkidle");

    // Vérification de la présence des sections clés
    await expect(page.getByRole("heading", { name: /Café Bio Champignon/i }).first()).toBeVisible();
    await expect(page.getByText("En stock — prêt à être expédié")).toBeVisible();
    await expect(page.getByText("Offre Spéciale Fin de Stock")).toBeVisible();

    // Vérifier les 4 piliers de réassurance
    await expect(page.getByText("Vérifiez avant de payer")).toBeVisible();
    await expect(page.getByText("Livraison 24h à 48h")).toBeVisible();

    // Vérifier les cas d'usage ("Où avez-vous mal ?")
    await expect(page.getByText("Ce café est spécialement formulé pour vous si :")).toBeVisible();
    await expect(page.getByText("Coups de barre à 14h")).toBeVisible();

    // Vérifier la promesse et le problème/solution
    await expect(page.getByText("Le Problème")).toBeVisible();
    await expect(page.getByText("La Solution AfriBuilder")).toBeVisible();

    // Vérifier la FAQ
    await expect(page.getByText("Questions fréquentes")).toBeVisible();

    // Vérifier l'avertissement légal bien-être
    await expect(page.getByText(/Avertissement légal & mentions obligatoires/i)).toBeVisible();

    // Vérifier le formulaire de commande Standard
    await expect(page.locator("#main-product-order-form").getByRole("heading", { name: /Remplissez le formulaire pour confirmer votre commande/i })).toBeVisible();

    // Remplissage du formulaire de commande COD
    const nameInput = page.locator("input[autocomplete='name']").first();
    await nameInput.fill("Amina Diallo");

    const phoneInput = page.locator("input[autocomplete='tel']").first();
    await phoneInput.fill("0748291102");

    const addressInput = page.getByPlaceholder(/Près de la Pharmacie/i).first();
    await addressInput.fill("Cocody Danga, Carrefour des fleurs, Villa 12");

    // Capture d'écran du formulaire rempli avec offres de quantité
    await page.screenshot({ path: "tests/screenshots/ext-01-standard-order-form.png" });

    // Soumission de la commande
    const submitBtn = page.getByRole("button", { name: /Je commande —/i }).first();
    await submitBtn.click();

    // Vérifier l'écran de confirmation
    await expect(page.getByText("Commande confirmée avec succès !")).toBeVisible();
    await expect(page.getByText("Merci, Amina Diallo")).toBeVisible();
    await expect(page.getByText(/Notre équipe vous appelle dans les 15 à 30 minutes/i)).toBeVisible();

    // Vérifier le lien WhatsApp et le lien de suivi client
    const waLink = page.getByRole("link", { name: /Confirmer instantanément sur WhatsApp/i });
    await expect(waLink).toBeVisible();
    expect(await waLink.getAttribute("href")).toContain("wa.me");

    const trackingLink = page.getByRole("link", { name: /Suivre l'acheminement de mon colis en direct/i });
    await expect(trackingLink).toBeVisible();

    // Screenshot de l'écran de confirmation
    await page.screenshot({ path: "tests/screenshots/ext-02-order-confirmation-screen.png" });
  });

  test("C: Bannière défilante de la boutique avec garanties et avis vérifiés", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/lome-glow`);
    await page.waitForLoadState("networkidle");

    // Vérifier l'affichage du bandeau d'annonces
    const banner = page.locator("aside[aria-label='Annonces et garanties de la boutique']");
    await expect(banner).toBeVisible();

    // Vérifier les garanties et avis clients vérifiés
    await expect(page.getByText(/Paiement à la livraison garanti/i).first()).toBeVisible();
    await expect(page.getByText(/Acheteur vérifié/i).first()).toBeVisible();

    // Screenshot de la bannière défilante
    await page.screenshot({ path: "tests/screenshots/ext-03-store-marquee-banner.png" });
  });

  test("B & 14: Avis clients authentiques et validation stricte du jeton de dépôt", async ({ page }) => {
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/prod_coffee`);
    await page.waitForLoadState("networkidle");

    // 1. Bouton "Écrire un avis"
    const writeReviewBtn = page.getByRole("button", { name: /Écrire un avis/i });
    await expect(writeReviewBtn).toBeVisible();
    await writeReviewBtn.click();

    await expect(page.getByRole("heading", { name: "Déposer un avis vérifié" })).toBeVisible();

    // 2. Test avec un jeton invalide (Sécurité F)
    const tokenInput = page.getByPlaceholder("Ex: rev_tok_awa_traore_valid_delivered_10482");
    await tokenInput.fill("fake_unauthorized_token_123");
    await page.getByPlaceholder("Ex: Awa T.").fill("Test Client");
    await page.getByPlaceholder("Partagez votre expérience avec ce produit...").fill("Avis non autorisé sans jeton.");

    const submitReviewBtn = page.getByRole("button", { name: "Publier mon avis" });
    await submitReviewBtn.click();

    await expect(page.getByText(/Ce lien de dépôt d'avis est introuvable ou invalide/i)).toBeVisible();

    // 3. Test avec un jeton valide lié à une commande livrée réelle
    await tokenInput.fill("rev_tok_awa_traore_valid_delivered_10482");
    await page.getByPlaceholder("Ex: Awa T.").fill("Awa T.");
    await page.getByPlaceholder("Ex: Abidjan").fill("Abidjan");
    await page.getByPlaceholder("Partagez votre expérience avec ce produit...").fill("Excellent café aux champignons, très doux pour l'estomac et énergisant !");

    await submitReviewBtn.click();
    await expect(page.getByText(/Merci pour votre avis authentique !/i)).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/ext-04-verified-review-submitted.png" });
  });

  test("E: Inscription sécurisée, rejet emails jetables & suggestion fautes de frappe", async ({ page }) => {
    await page.goto(`${BASE_URL}/inscription`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Créer mon compte vendeur" })).toBeVisible();

    const nameInput = page.getByPlaceholder("Ex: Promises Bedi");
    const emailInput = page.getByPlaceholder("contact@maboutique.com");
    const phoneInput = page.getByPlaceholder("90 12 34 56");
    const passInput = page.getByPlaceholder("••••••••••••");
    const termsCheckbox = page.locator("input[type='checkbox']").first();
    const submitBtn = page.getByRole("button", { name: "Créer mon compte vendeur" });

    // 1. Test rejet email jetable (Ex: yopmail.com)
    await nameInput.fill("Test Vendeur");
    await phoneInput.fill("90123456");
    await emailInput.fill("arnaqueur@yopmail.com");
    await passInput.fill("monSuperMotDePasse2026!");
    await termsCheckbox.check();

    await submitBtn.click();
    await expect(page.getByText(/Les adresses email temporaires et jetables ne sont pas acceptées/i)).toBeVisible();

    // 2. Test suggestion de faute de frappe (Ex: gmial.com -> gmail.com)
    await emailInput.fill("vendeur@gmial.com");
    await emailInput.blur();
    await expect(page.getByText(/Vouliez-vous dire/i)).toBeVisible();
    await expect(page.getByText("vendeur@gmail.com")).toBeVisible();

    // Clic sur "Corriger"
    await page.getByRole("button", { name: "Corriger" }).click();
    await expect(emailInput).toHaveValue("vendeur@gmail.com");

    // 3. Test rejet mot de passe trop facile (Ex: 12345678)
    await passInput.fill("12345678");
    await submitBtn.click();
    await expect(page.getByText(/Ce mot de passe est trop facile à deviner/i)).toBeVisible();

    // 4. Inscription valide menant à l'écran de code de vérification
    await passInput.fill("MonSuperSecuriteAfriBuilder2026!");
    await page.screenshot({ path: "tests/screenshots/ext-05-signup-form-validation.png" });

    await submitBtn.click();

    // Redirection vers l'écran de vérification d'email
    await page.waitForURL(/\/auth\/verifier-email/);
    await expect(page.getByRole("heading", { name: "Vérifiez votre adresse e-mail" })).toBeVisible();
    await expect(page.locator("input[placeholder='••••••']")).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/ext-06-verify-email-code-screen.png" });
  });

  test("E: Vérification d'email avec code à 6 chiffres et limitation 5 tentatives", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/verifier-email?email=amadou.test%40afribuilder.com`);
    await page.waitForLoadState("networkidle");

    const codeInput = page.locator("input[placeholder='••••••']");
    const confirmBtn = page.getByRole("button", { name: /Confirmer et activer mon compte/i });

    // 1. Test code erroné (décrémentation des tentatives)
    await codeInput.fill("000000");
    await confirmBtn.click();
    await expect(page.getByText(/Code de vérification incorrect/i)).toBeVisible();

    // 2. Saisie du code valide (749216)
    await codeInput.fill("749216");
    await confirmBtn.click();

    await expect(page.getByText("E-mail vérifié avec succès !")).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/ext-07-email-verified-success.png" });
  });

  test("E.5: Restriction de compte non-vérifié (Bannière d'avertissement)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_user_verified", "false");
    });
    await page.goto(`${BASE_URL}/app/lome-glow?unverified=true`);
    await page.waitForLoadState("networkidle");

    // Vérifier l'apparition de la bannière d'alerte
    await expect(page.getByText("Compte en attente de vérification e-mail")).toBeVisible();
    await expect(page.getByText(/Votre adresse e-mail n'a pas encore été validée/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Vérifier mon e-mail" })).toBeVisible();

    await page.screenshot({ path: "tests/screenshots/ext-08-unverified-account-banner.png" });
  });

  test("Connexion: Écran de login & bascule code magique", async ({ page }) => {
    await page.goto(`${BASE_URL}/connexion`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Connexion à votre espace" })).toBeVisible();

    // Basculer vers code par email
    const magicCodeBtn = page.getByRole("button", { name: "Recevoir un code par e-mail" });
    await magicCodeBtn.click();

    await expect(page.getByText("Connexion sans mot de passe via code temporaire")).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/ext-09-login-magic-code.png" });
  });
});

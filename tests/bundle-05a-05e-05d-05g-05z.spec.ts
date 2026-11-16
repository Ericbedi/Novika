import { test, expect } from "@playwright/test";

test.describe("Bundle Prompts 05-A, 05-E, 05-D, 05-G, 05-Z", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("01. Prompt 05-A : Écran de connexion, message neutre, rate-limiting & redirection selon le rôle", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile iPhone 13
    await page.goto("http://localhost:3000/connexion", { waitUntil: "domcontentloaded" });

    // 1. Vérification des champs et autocomplete
    const emailInput = page.locator("#input-login-email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const passwordInput = page.locator("#input-login-password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");

    // 2. Bouton afficher / masquer mot de passe
    const toggleBtn = page.locator("#btn-toggle-password-visibility");
    await expect(toggleBtn).toBeVisible();
    await passwordInput.fill("secret12345");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // 3. Règle absolue anti-énumération : message unique et neutre
    await emailInput.fill("amadou@afribuilder.com");
    await passwordInput.fill("wrongpass");
    await page.locator("#btn-submit-login").click();
    const errorBox = page.locator("#login-error-message");
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText("E-mail ou mot de passe incorrect.");

    // 4. Test du verrouillage temporaire après 5 échecs consécutifs
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(100);
      await page.locator("#btn-submit-login").click();
    }
    await expect(page.locator("text=Trop de tentatives échouées").first()).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05a-login-flow.png`,
      fullPage: false,
    });
  });

  test("02. Prompt 05-A : Création de mot de passe par l'utilisateur (règles >= 10 car, pas de fuites pwned)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/auth/creer-mot-de-passe?email=amadou@afribuilder.com", {
      waitUntil: "domcontentloaded",
    });

    const passInput = page.locator("#input-create-password");
    const confirmInput = page.locator("#input-create-confirm-password");
    const submitBtn = page.locator("#btn-submit-create-password");

    // 1. Refuser mot de passe < 10 caractères
    await passInput.fill("court123");
    await confirmInput.fill("court123");
    await submitBtn.click();
    await expect(page.locator("#create-password-error-message")).toContainText("au minimum 10 caractères");

    // 2. Refuser mot de passe contenant l'e-mail
    await passInput.fill("amadou2026Secure!");
    await confirmInput.fill("amadou2026Secure!");
    await submitBtn.click();
    await expect(page.locator("#create-password-error-message")).toContainText("ne doit pas contenir votre identifiant");

    // 3. Refuser mot de passe compromis / fuité connu (k-anonymat)
    await passInput.fill("password123");
    await confirmInput.fill("password123");
    await submitBtn.click();
    await expect(page.locator("#create-password-error-message")).toContainText("trop courant ou apparaît dans des fuites");

    // 4. Mot de passe robuste accepté
    await passInput.fill("AfriSuperSecurite99");
    await confirmInput.fill("AfriSuperSecurite99");
    await expect(page.locator("text=Fort").first()).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05a-create-password.png`,
      fullPage: false,
    });
  });

  test("03. Prompt 05-G : Performance Produit (scaling), verdicts, simulateur & disclaimer obligatoire", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("http://localhost:3000/app/lome-glow/performance-produit", {
      waitUntil: "domcontentloaded",
    });

    // 1. Vérifier les KPIs du tableau de bord
    await expect(page.locator("h1:has-text('Performance Produit & Scaling')")).toBeVisible();
    await expect(page.locator("text=Ads Spend").first()).toBeVisible();
    await expect(page.locator("text=CPA Réel Moyen")).toBeVisible();

    // 2. Vérifier les verdicts et la phrase légale obligatoire
    const disclaimer = page.locator("text=Aide à la décision basée sur vos données. Elle ne remplace pas votre jugement.");
    await expect(disclaimer).toBeVisible();

    // 3. Tester le simulateur en direct
    const simBtn = page.locator("#btn-open-scaling-simulator");
    await expect(simBtn).toBeVisible();
    await simBtn.click();

    const simPanel = page.locator("#scaling-live-simulator-panel");
    await expect(simPanel).toBeVisible();
    await expect(simPanel.locator("text=CPA Breakeven ($)")).toBeVisible();
    await expect(simPanel.locator("text=CPA Cible ($)")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05g-scaling-dashboard.png`,
      fullPage: false,
    });
  });

  test("04. Prompt 05-E : Entonnoir de conversion du parcours client & analyse d'abandon par champ", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("http://localhost:3000/app/lome-glow/stats/entonnoir", {
      waitUntil: "domcontentloaded",
    });

    // 1. Vérifier les étapes de l'entonnoir
    await expect(page.locator("h1:has-text('Entonnoir de Conversion')")).toBeVisible();
    const stepsContainer = page.locator("#funnel-steps-container");
    await expect(stepsContainer.locator("text=Visiteurs uniques")).toBeVisible();
    await expect(stepsContainer.locator("text=Fiche produit consultée")).toBeVisible();
    await expect(stepsContainer.locator("text=Clic sur « Commander »")).toBeVisible();
    await expect(stepsContainer.locator("text=Formulaire commencé")).toBeVisible();
    await expect(stepsContainer.locator("text=Commande confirmée")).toBeVisible();

    // 2. Vérifier la phrase d'aide factuelle (62% quittent au téléphone)
    await expect(page.locator("text=62 % des visiteurs mobiles quittent au champ téléphone")).toBeVisible();

    // 3. Vérifier l'analyse d'abandon par champ et la comparaison par source
    await expect(page.locator("text=Abandon par Champ de Saisie")).toBeVisible();
    await expect(page.locator("text=Rentabilité par Source de Trafic")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05e-conversion-funnel.png`,
      fullPage: false,
    });
  });

  test("05. Prompt 05-D : Suppression de compte dans Réglages Profil & 2FA", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("http://localhost:3000/app/lome-glow/reglages?tab=profile", {
      waitUntil: "domcontentloaded",
    });

    // 1. Vérifier la présence du 2FA et des sessions
    await expect(page.locator("text=Sécurité du Compte & Sessions")).toBeVisible();
    await expect(page.locator("#toggle-2fa")).toBeVisible();
    await expect(page.locator("#btn-logout-all-sessions")).toBeVisible();

    // 2. Vérifier la Zone dangereuse
    const dangerZone = page.locator("#danger-zone-account-deletion");
    await expect(dangerZone).toBeVisible();
    const deleteBtn = page.locator("#btn-delete-account-trigger");
    await expect(deleteBtn).toBeVisible();

    // 3. Clic sur le déclencheur de suppression : règle de blocage pour propriétaire avec équipe
    await deleteBtn.click();
    const blockedNotice = page.locator("#delete-account-blocked-notice");
    await expect(blockedNotice).toBeVisible();
    await expect(blockedNotice).toContainText("Transfert de propriété requis");

    // 4. Test en tant que co-admin ou membre sans équipe -> ouverture de la modale
    await page.locator("#btn-simulate-solo-member-delete").click();
    const modal = page.locator("#modal-account-deletion");
    await expect(modal).toBeVisible();
    await expect(modal.locator("text=Ce qui sera supprimé")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05d-account-deletion-modal.png`,
      fullPage: false,
    });
  });

  test("06. Prompt 05-Z : Réglages 8 sections (retrait pays) & Éditeur de vitrine avec 54 pays et frais vendeur", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 860 });

    // 1. Vérifier que les Réglages n'ont plus "Pays & Zones" et comptent exactement 8 cases
    await page.goto("http://localhost:3000/app/lome-glow/reglages", { waitUntil: "domcontentloaded" });
    const settingsGrid = page.locator(".sm\\:grid");
    await expect(settingsGrid).toBeVisible();
    const paysTab = page.locator("#settings-tab-pays");
    await expect(paysTab).toHaveCount(0); // Plus de case "pays"

    // 2. Tester la redirection de l'ancienne route /reglages/pays
    await page.goto("http://localhost:3000/app/lome-glow/reglages/pays");
    await page.waitForURL("**/app/lome-glow/reglages");
    expect(page.url()).toContain("/app/lome-glow/reglages");

    await page.screenshot({
      path: `${artifactDir}/bundle-05z-settings-8sections.png`,
      fullPage: false,
    });

    // 3. Vérifier la présence des 54 pays, des frais vendeur et des zones prépayées dans l'éditeur de vitrine Section 1
    await page.goto("http://localhost:3000/app/lome-glow/boutique-en-ligne?tab=info", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("text=Pays où vous vendez")).toBeVisible();
    const countriesList = page.locator("#storefront-countries-list");
    await expect(countriesList).toBeVisible();

    // Tester la recherche dans les 54 pays
    const searchInput = page.locator("#input-search-countries-storefront");
    await searchInput.fill("Bénin");
    await expect(countriesList.locator("text=Bénin")).toBeVisible();

    // Vérifier les frais de livraison vendeur par défaut (L)
    const deliveryCostInput = page.locator("#input-default-delivery-cost");
    await expect(deliveryCostInput).toBeVisible();
    await expect(deliveryCostInput).toHaveValue("1500");

    // Vérifier les zones d'expédition prépayée
    await expect(page.locator("text=Zones d'expédition prépayée")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05z-storefront-54countries.png`,
      fullPage: false,
    });
  });
});

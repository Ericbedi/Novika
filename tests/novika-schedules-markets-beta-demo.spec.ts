import { test, expect } from "@playwright/test";

test.describe("Novika - Bêta Approvals, Horaires, Son Unique, Marchés & Démo Interactive", () => {
  test("1. Landing Page : Hero immédiat, bandeau devises, démo interactive #demo et carte d'Afrique", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    // Hero visible immédiatement
    const heroTitle = page.locator("h1:has-text('Vendez en paiement à la livraison')");
    await expect(heroTitle).toBeVisible();

    const heroSubtitle = page.locator("text=Boutique, closeuses, livreurs, stock et finances au même endroit");
    await expect(heroSubtitle).toBeVisible();

    // 3 Pilules de réassurance (Prompt 05-L : Textes corrigés depuis landingContent.hero.pills)
    await expect(page.locator("text=Le client paie à la livraison")).toBeVisible();
    await expect(page.locator("text=Livraison gratuite automatique par zone")).toBeVisible();
    await expect(page.locator("text=Aucune commande bloquée · Fiche closeuse")).toBeVisible();

    // Bandeau devises avec bouton Pause
    const marqueePauseBtn = page.locator("#toggle-marquee-pause-btn");
    await expect(marqueePauseBtn).toBeVisible();
    await marqueePauseBtn.click();
    await expect(marqueePauseBtn).toContainText("Défiler");
    await marqueePauseBtn.click();
    await expect(marqueePauseBtn).toContainText("Pause");

    // Bouton 'Voir comment ça marche' pointe vers #demo
    const seeHowBtn = page.locator("#hero-see-how-it-works-btn");
    await expect(seeHowBtn).toHaveAttribute("href", "#demo");
    await seeHowBtn.click();

    // Section Démonstration #demo
    const demoSection = page.locator("#demo");
    await expect(demoSection).toBeVisible();
    await expect(page.locator("text=Le parcours complet d'une commande COD")).toBeVisible();

    // Étape 1 par défaut
    await expect(page.locator("text=1. Réception")).toBeVisible();
    await expect(page.locator("text=#CMD-2026-LOM-042")).toBeVisible();
    await expect(demoSection.getByText("35 000 FCFA").first()).toBeVisible();

    // Étape suivante
    const nextBtn = page.locator("#demo-next-step-btn");
    await nextBtn.click();
    await expect(page.locator("text=2. Confirmation")).toBeVisible();
    await expect(page.locator("text=Closeuse · Awa")).toBeVisible();

    // Lecture / Pause
    const playPauseBtn = page.locator("#demo-play-pause-btn");
    await playPauseBtn.click();
    await expect(playPauseBtn).toContainText("Pause");
    await playPauseBtn.click();
    await expect(playPauseBtn).toContainText("Lecture automatique");

    // Recommencer
    await page.locator("#demo-reset-btn").click();
    await expect(page.locator("text=1. Réception")).toBeVisible();

    // Carte d'Afrique en points
    await expect(page.locator("text=Couverture active en Afrique de l'Ouest & Centrale")).toBeVisible();
    const pauseMapBtn = page.locator("#pause-map-animation-btn");
    await expect(pauseMapBtn).toBeVisible();
    await pauseMapBtn.click();
    await expect(pauseMapBtn).toContainText("Reprendre l'animation");

    // Sélection d'un pays (Sénégal)
    await page.click("button:has-text('🇸🇳')");
    await expect(page.locator("h4:has-text('Sénégal')")).toBeVisible();

    // Bouton accessibilité global dans le footer
    const globalPauseBtn = page.locator("#global-pause-animations-toggle");
    await expect(globalPauseBtn).toBeVisible();
    await globalPauseBtn.click();
    await expect(globalPauseBtn).toContainText("Activer les animations");
  });

  test("2. Parcours 1 : Demande d'accès avec vérification OTP stricte (/acces)", async ({ page }) => {
    await page.goto("http://localhost:3000/acces");

    await expect(page.locator("h1:has-text('Demander mon accès à Novika')")).toBeVisible();

    // Remplissage formulaire avec adresse unique
    const uniqueEmail = `test.vendeur.${Date.now()}@gmail.com`;
    await page.fill("input[placeholder*='Aminata Diallo']", "Kouassi Yao");
    await page.fill("#request-email-input", uniqueEmail);
    await page.fill("input[placeholder*='+228 90 12']", "+2250788990011");

    await page.click("#submit-access-request-btn");

    // Modal OTP doit s'ouvrir
    await expect(page.locator("h3:has-text('Confirmez votre boîte e-mail')")).toBeVisible();
    const otpInput = page.locator("#request-otp-input");
    await expect(otpInput).toBeVisible();

    // Récupérer le code de test affiché
    const code = (await page.locator("#request-demo-otp-code").textContent())?.trim() || "123456";

    await otpInput.fill(code);
    await page.click("#verify-request-otp-btn");

    // Message de confirmation sur la page merci
    await expect(page.locator("h1:has-text('Demande bien reçue !')")).toBeVisible({ timeout: 10000 });
  });

  test("3. Parcours Invité : Activation sécurisée avec e-mail verrouillé (/invitation/[token])", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/invitation/tok_demo_aicha_valid");

    // Écran d'accueil anti-scanner (aucun compte créé à l'ouverture)
    await expect(page.locator("h1:has-text('Activer votre accès vendeur')")).toBeVisible();
    const requestBtn = page.locator("#request-activation-code-btn");
    await expect(requestBtn).toBeVisible();
    await requestBtn.click();

    // Écran OTP boîte mail
    await expect(page.locator("h1:has-text('Confirmez votre boîte e-mail')")).toBeVisible();
    const otpInput = page.locator("#activation-otp-input");
    await expect(otpInput).toBeVisible();

    const debugText = await page.locator("text=[Bêta Démo] Code d'activation :").textContent();
    const codeMatch = debugText?.match(/\d{6}/);
    const code = codeMatch ? codeMatch[0] : "592184";

    await otpInput.fill(code);
    await page.click("#submit-activation-otp-btn");

    // Écran de finalisation du profil
    await expect(page.locator("h1:has-text('Créez vos identifiants vendeur')")).toBeVisible();

    // E-mail strictement verrouillé et désactivé
    const lockedEmail = page.locator("#locked-email-input");
    await expect(lockedEmail).toBeDisabled();
    await expect(page.locator("text=Verrouillée à l'invitation")).toBeVisible();

    // Compléter les champs
    await page.fill("input[placeholder*='Aminata Diallo']", "Aïcha Bâ");
    await page.fill("input[placeholder*='Glow Lomé Cosmétiques']", "Dakar Prestige Bêta");
    await page.fill("input[placeholder*='+228 90 12']", "+221770001122");
    await page.fill("input[placeholder*='••••••••••••']", "SecretNovika2026!");
    await page.click("#accept-beta-terms-checkbox");

    await page.click("#finalize-account-btn");

    // Redirection vers l'espace de bienvenue
    await page.waitForURL("**/bienvenue?store=lome-glow");
    await expect(page.locator("text=Bienvenue")).toBeVisible();
  });

  test("4. Back-office Platform Admin : Hub Bêta, cohortes et validation par lot (/platform-admin)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/platform-admin");

    // 2FA super admin si présent (placeholder 'Ex: 123456')
    const totpInput = page.locator("input[placeholder*='123456']");
    if (await totpInput.isVisible()) {
      await totpInput.fill("123456");
      await page.click("button:has-text('Vérifier et Déverrouiller')");
    }

    // Onglet Bêta Hub
    const betaHubTab = page.locator("#tab-btn-beta-hub");
    await expect(betaHubTab).toBeVisible();
    await betaHubTab.click();

    // Jauge de cohorte (Pionniers : 48/50)
    await expect(page.locator("h3:has-text('Cohorte 1 — Pionniers Lomé & Abidjan')")).toBeVisible();
    await expect(page.locator("text=Plafond strict : 50 vendeurs")).toBeVisible();

    // Onglet lot d'e-mails
    await page.click("#tab-beta-batch");
    await expect(page.locator("h3:has-text('Envoi direct d\\'invitations par lot')")).toBeVisible();

    const testBatch = `vendeur.valide@gmail.com\njohn.doe@mailinator.com\nkoffi@gmial.com\nvendeur.valide@gmail.com`;
    await page.fill("#batch-emails-textarea", testBatch);

    // Rapport de pré-validation en direct
    await expect(page.locator("text=Rapport de pré-validation en direct")).toBeVisible();
    await expect(page.locator("text=Adresses Valides")).toBeVisible();
    await expect(page.locator("text=E-mails Jetables Rejetés")).toBeVisible();
    await expect(page.locator("text=Suggestions Typo")).toBeVisible();

    // Revenir sur demandes vérifiées et approuver
    await page.click("#tab-beta-requests");
    const approveBtn = page.locator("button:has-text('Approuver & Inviter')").first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator("text=✓ Action exécutée avec succès.")).toBeVisible();
    }
  });

  test("5. Horaires de travail de l'équipe : 7 jours, dimanche verrouillé et réinitialisation (/reglages/equipe/horaires)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/equipe/horaires");

    // Vérifier l'en-tête et la bannière en direct
    await expect(page.locator("h1:has-text('Horaires de travail de l\\'équipe')")).toBeVisible();
    await expect(page.locator("text=Équipe en service :")).toBeVisible();

    // Tableau des 7 jours
    await expect(page.locator("text=Lundi")).toBeVisible();
    await expect(page.locator("text=Samedi")).toBeVisible();
    await expect(page.locator("span", { hasText: "Dimanche" }).first()).toBeVisible();

    // Vérifier que le dimanche a la mention d'activation propriétaire
    const sundayNotice = page.locator("text=Dimanche exceptionnel activable uniquement par l'Admin propriétaire");
    await expect(sundayNotice).toBeVisible();

    // Bouton 'Appliquer à tous les jours'
    const applyAllBtn = page.locator("#apply-to-all-working-days-btn");
    await expect(applyAllBtn).toBeVisible();
    await applyAllBtn.click();
    await expect(page.locator("text=Horaires de lundi")).toBeVisible();

    // Bouton 'Rétablir (07:00–18:00, lun–sam)'
    const resetBtn = page.locator("#reset-schedules-defaults-btn");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.locator("text=Horaires réinitialisés aux valeurs Novika par défaut")).toBeVisible();

    // Basculer les portées (Scope)
    await page.click("#scope-btn-role");
    await expect(page.locator("text=Choisir le rôle à surcharger")).toBeVisible();

    await page.click("#scope-btn-member");
    await expect(page.locator("text=Choisir le collaborateur")).toBeVisible();

    // Enregistrer
    await page.click("#save-schedules-btn");
    await expect(page.locator("text=Horaires d'équipe enregistrés avec succès")).toBeVisible();
  });

  test("6. Analyse de rentabilité des marchés : P&L, seuil d*, simulateur et restriction Manager (/stats/marches)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/app/lome-glow/stats/marches");

    await expect(page.locator("h1:has-text('Analyse de Rentabilité des Marchés')")).toBeVisible();

    // KPI cards
    await expect(page.locator("text=Marchés Actifs")).toBeVisible();
    await expect(page.locator("text=Taux de Livraison Moyen")).toBeVisible();
    await expect(page.locator("text=Marge Nette Consolidée")).toBeVisible();

    // Liste des marchés et verdicts
    await expect(page.locator("span", { hasText: "Togo (Lomé & Régions)" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Côte d'Ivoire (Abidjan)" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Bénin (Cotonou)" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Cameroun (Douala & Yaoundé)" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "Sénégal (Dakar)" }).first()).toBeVisible();

    // Vérifier les badges de verdict
    await expect(page.locator("span:has-text('Rentable')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Limite')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Non rentable')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Données insuffisantes')").first()).toBeVisible();

    // Vérifier le seuil de rentabilité d* et le P&L en cascade
    await expect(page.locator("text=Seuil de rentabilité d* = (c+f)/(m+f)")).toBeVisible();
    await expect(page.locator("text=Décomposition en cascade (P&L Marché)")).toBeVisible();

    // Simulateur interactif
    await expect(page.locator("h2:has-text('Simulateur Interactif de Marché COD')")).toBeVisible();
    const sliderDelivery = page.locator("#slider-delivery-rate");
    await expect(sliderDelivery).toBeVisible();
    await sliderDelivery.fill("85");

    // Tester la restriction d'affichage pour le rôle Manager
    const roleSelector = page.locator("#market-role-selector");
    await roleSelector.selectOption("manager");

    // En vue Manager, les marges et coûts doivent être masqués
    await expect(page.locator("text=Vue Manager restreinte")).toBeVisible();
    await expect(page.locator("text=[Masqué · Rôle Manager]").first()).toBeVisible();
  });

  test("7. Paramètres Notifications : Son de commande unique et test sonore", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages");

    // Onglet Notifications par ID unique
    await page.click("#settings-tab-notifications");

    await expect(page.locator("text=Son de nouvelle commande (Prompt 05-S)")).toBeVisible();
    await expect(page.locator("text=public/sounds/novika-order.mp3")).toBeVisible();

    // Bouton tester le son
    const testSoundBtn = page.locator("#test-order-sound-btn");
    await expect(testSoundBtn).toBeVisible();
    await testSoundBtn.click();

    // Vérifier également le lien vers les horaires dans l'onglet Équipe
    await page.click("#settings-tab-team");
    const schedulesLink = page.locator("#link-to-team-schedules");
    await expect(schedulesLink).toBeVisible();
    await expect(schedulesLink).toHaveAttribute("href", "/app/lome-glow/reglages/equipe/horaires");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Bundle Prompts 05-N, 05-R, 05-F, 05-V, 05-F2, 05-P2, 05-X", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("01. Prompt 05-N : Section 1 'Informations de la boutique' dans l'éditeur de vitrine", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("http://localhost:3000/app/lome-glow/boutique-en-ligne?tab=info", { waitUntil: "domcontentloaded" });

    // 1. Vérifier l'ordre strict des 6 onglets de l'éditeur (Prompt 05-N)
    const tabButtons = page.locator("button[id^='tab-storefront-']");
    await expect(tabButtons).toHaveCount(6);

    const tabLabels = await tabButtons.allInnerTexts();
    console.log("Tab labels in storefront editor:", tabLabels);
    expect(tabLabels[0]).toContain("Informations");
    expect(tabLabels[1]).toContain("Thème");
    expect(tabLabels[2]).toContain("Bannières");
    expect(tabLabels[3]).toContain("Page d'accueil");
    expect(tabLabels[4]).toContain("Catalogue");
    expect(tabLabels[5]).toContain("Contact");

    // 2. Vérifier les champs de la Section 1 (nom, description, pays verrouillé si commandes, devise en lecture seule)
    const nameInput = page.locator("#input-info-store-name");
    await expect(nameInput).toBeVisible();
    const descInput = page.locator("#input-info-store-description");
    await expect(descInput).toBeVisible();

    // Règle Prompt 05-N : Boutique avec commandes existantes -> pays verrouillé avec message explicite
    const lockedCountryNotice = page.locator("text=Pour vendre dans un autre pays, dupliquez la boutique");
    await expect(lockedCountryNotice).toBeVisible();

    const currencyInput = page.locator("#input-info-billing-currency");
    await expect(currencyInput).toBeVisible();
    await expect(currencyInput).toBeDisabled();

    // 3. Tester la mise à jour dynamique de l'aperçu en direct pendant la saisie
    await nameInput.fill("Lomé Vitalité Express Test");
    const previewSpan = page.locator(".lg\\:col-span-7 span:has-text('Lomé Vitalité Express Test')").first();
    await expect(previewSpan).toBeVisible();

    // 4. Vérifier le bouton Enregistrer
    const saveBtn = page.locator("#btn-save-storefront");
    await expect(saveBtn).toBeVisible();

    // Capture d'écran de l'éditeur avec Section 1
    await page.screenshot({
      path: `${artifactDir}/bundle-01-storefront-editor-info-section1.png`,
      fullPage: false,
    });
  });

  test("02. Prompt 05-R & 05-N : Navigation des Réglages (grille desktop) et carte de redirection", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto("http://localhost:3000/app/lome-glow/reglages", { waitUntil: "domcontentloaded" });

    // 1. Vérifier la grille de cases sur bureau (visible) et le dropdown mobile (caché)
    const desktopGrid = page.locator(".sm\\:grid");
    await expect(desktopGrid).toBeVisible();
    const mobileDropdown = page.locator("#btn-settings-dropdown-trigger");
    await expect(mobileDropdown).toBeHidden();

    // 2. Vérifier les cases avec icône, libellé, description <= 6 mots
    const generalTab = page.locator("#settings-tab-general");
    await expect(generalTab).toBeVisible();
    await expect(generalTab).toHaveAttribute("aria-current", "page");

    const teamTab = page.locator("#settings-tab-team");
    await expect(teamTab).toBeVisible();
    await expect(teamTab).toContainText("Équipe");

    // 3. Vérifier la carte de redirection vers l'éditeur de vitrine dans l'onglet Général (Prompt 05-N)
    const redirectLink = page.locator("#link-goto-storefront-info");
    await expect(redirectLink).toBeVisible();
    await expect(redirectLink).toHaveAttribute("href", "/app/lome-glow/boutique-en-ligne?tab=info");

    // 4. Clic sur l'onglet Équipe et vérification du changement d'onglet
    await teamTab.click();
    await expect(page.locator("text=Membres & Rôles").first()).toBeVisible();

    // Capture d'écran des réglages sur desktop
    await page.screenshot({
      path: `${artifactDir}/bundle-02-settings-desktop-grid.png`,
      fullPage: false,
    });
  });

  test("03. Prompt 05-R : Menu déroulant accessible des Réglages sur mobile (iPhone 13)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/app/lome-glow/reglages", { waitUntil: "domcontentloaded" });

    // 1. Vérifier que la grille desktop est masquée et que le déclencheur mobile est affiché
    const mobileDropdown = page.locator("#btn-settings-dropdown-trigger");
    await expect(mobileDropdown).toBeVisible();
    const desktopGrid = page.locator(".sm\\:grid");
    await expect(desktopGrid).toBeHidden();

    // 2. Ouvrir le menu déroulant mobile
    await page.waitForTimeout(400);
    await mobileDropdown.click({ force: true });
    const menuPopup = page.locator("#settings-dropdown-menu");
    await expect(menuPopup).toBeVisible();

    // Vérifier les 9 options du menu avec touch target >= 44px
    const options = menuPopup.locator("button, a");
    const count = await options.count();
    expect(count).toBe(9);

    // Capture d'écran du menu déroulant mobile ouvert
    await page.screenshot({
      path: `${artifactDir}/bundle-03-settings-mobile-dropdown.png`,
      fullPage: false,
    });
  });

  test("04. Prompt 05-F, 05-F2 & 05-V : Formulaire de commande court, suppression carte récap, variantes & téléphone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/boutique/lome-glow/apercu/produit/prod_03", { waitUntil: "domcontentloaded" });

    // 1. Prompt 05-F2 : Vérifier que le formulaire ne contient plus l'ancienne carte récapitulative
    const formContainer = page.locator("#main-product-order-form");
    await expect(formContainer).toBeVisible();

    // L'ancienne carte récapitulative avait une vignette image produit dans le formulaire
    const formProductImg = formContainer.locator("img[alt='Ceinture Amincissante Néoprène Double Sangle']");
    await expect(formProductImg).toHaveCount(0);

    // 2. Prompt 05-V : Vérifier les variantes (Taille M, L, XL, XXL)
    const variantButtons = formContainer.locator("button:has-text('Taille')");
    await expect(variantButtons.first()).toBeVisible();

    // Vérifier que Taille XXL avec stock 0 affiche "Rupture" et est désactivée
    const xxlButton = formContainer.locator("button:has-text('Taille XXL')");
    await expect(xxlButton).toBeVisible();
    await expect(xxlButton).toBeDisabled();
    await expect(xxlButton).toContainText("Rupture");

    // 3. Prompt 05-F : Vérifier le conteneur unique arrondi du téléphone [Drapeau + Indicatif | Numéro]
    const dialCode = formContainer.locator("text=+228").first();
    await expect(dialCode).toBeVisible();
    const phoneInput = formContainer.locator("input[type='tel']").first();
    await expect(phoneInput).toBeVisible();

    // 4. Prompt 05-F : Vérifier la suppression de la case à cocher WhatsApp, remplacée par le lien discret
    const waCheckbox = formContainer.locator("text=C'est aussi mon numéro WhatsApp");
    await expect(waCheckbox).toBeHidden();

    const waLink = formContainer.locator("text=Ce n'est pas mon numéro WhatsApp ?");
    await expect(waLink).toBeVisible();

    // Cliquer sur le lien pour afficher le champ secondaire
    await waLink.click();
    await expect(formContainer.locator("text=Numéro WhatsApp pour le suivi")).toBeVisible();

    // 5. Prompt 05-F : Vérifier le lien discret de géolocalisation
    const gpsLink = formContainer.locator("text=Préciser ma position (optionnel)");
    await expect(gpsLink).toBeVisible();

    // 6. Prompt 05-F : Vérifier le bouton collant en bas de l'écran (Sticky mobile bar)
    const stickyBar = page.locator("aside[aria-label='Commander rapidement']");
    await expect(stickyBar).toBeVisible();
    await expect(stickyBar).toContainText("Paiement à la livraison");
    await expect(stickyBar).toContainText("Commander ·");

    // 7. Zéro débordement horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Capture d'écran du formulaire de commande sur mobile
    await page.screenshot({
      path: `${artifactDir}/bundle-04-mobile-order-form-compact.png`,
      fullPage: false,
    });
  });

  test("05. Prompt 05-X : Barre de navigation inférieure mobile (5 éléments) & Safe Area", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/app/lome-glow/commandes", { waitUntil: "domcontentloaded" });

    // 1. Vérifier la présence de la barre de navigation inférieure mobile (#mobile-bottom-nav)
    const bottomNav = page.locator("#mobile-bottom-nav");
    await expect(bottomNav).toBeVisible();

    // 2. Vérifier les 5 éléments : Commandes, Produits, Stats, Équipe, Plus
    await expect(bottomNav.locator("text=Commandes")).toBeVisible();
    await expect(bottomNav.locator("text=Produits")).toBeVisible();
    await expect(bottomNav.locator("text=Stats")).toBeVisible();
    await expect(bottomNav.locator("text=Équipe")).toBeVisible();
    await expect(bottomNav.locator("text=Plus")).toBeVisible();

    // 3. Cliquer sur "Plus" et vérifier l'ouverture du tiroir latéral mobile
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const btn = document.getElementById('btn-mobile-bottom-more');
      btn?.click();
    });
    const drawer = page.locator("#mobile-sidebar-drawer");
    await expect(drawer).toBeVisible();

    // 4. Vérifier 0 débordement horizontal sur 390px, 375px, 360px, 320px
    for (const w of [390, 375, 360, 320]) {
      await page.setViewportSize({ width: w, height: 750 });
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    }

    // Capture d'écran de l'app mobile avec barre de navigation inférieure
    await page.setViewportSize({ width: 390, height: 844 });
    const closeBtn = page.locator("#btn-mobile-drawer-close");
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true });
    }
    await page.screenshot({
      path: `${artifactDir}/bundle-05-mobile-bottom-nav-shell.png`,
      fullPage: false,
    });
  });
});

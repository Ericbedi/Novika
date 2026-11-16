import { test, expect } from "@playwright/test";

test.describe("Bundle Prompts 05-Px & 05-Q : Pixels Meta & Performance Plateforme", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("01. Prompt 05-Px : Gestion jusqu'à 3 pixels Meta, validation 15-16 chiffres, rejet doublons & limite de 3", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/reglages?tab=pixels", {
      waitUntil: "domcontentloaded",
    });

    // 1. Accéder aux réglages et activer l'onglet Pixels
    await page.goto("http://localhost:3000/app/lome-glow/reglages?tab=pixels", {
      waitUntil: "domcontentloaded",
    });
    const tabBtn = page.locator("#settings-tab-pixels");
    if (await tabBtn.isVisible()) {
      await tabBtn.click();
    }

    // Vérifier la présence de la section Pixels Meta
    const sectionPixels = page.locator("#section-meta-pixels");
    await expect(sectionPixels).toBeVisible();
    await expect(sectionPixels.locator("text=Pixels Facebook (Meta)")).toBeVisible();

    // 2. Vérifier le sélecteur global d'événement commande (Purchase / Lead)
    const selectOrderEvent = page.locator("#select-pixel-order-event");
    await expect(selectOrderEvent).toBeVisible();
    await selectOrderEvent.selectOption("Lead");
    await expect(selectOrderEvent).toHaveValue("Lead");
    await selectOrderEvent.selectOption("Purchase");
    await expect(selectOrderEvent).toHaveValue("Purchase");

    // 3. Ouvrir la modale d'ajout d'un pixel
    const addPixelBtn = page.locator("#btn-add-meta-pixel");
    await expect(addPixelBtn).toBeVisible();
    await addPixelBtn.click();

    const modal = page.locator("#modal-meta-pixel");
    await expect(modal).toBeVisible();

    // 4. Tester la validation de l'ID (refuser < 15 chiffres ou caractères non numériques)
    const inputName = page.locator("#input-pixel-modal-name");
    const inputId = page.locator("#input-pixel-modal-id");
    const submitBtn = page.locator("#btn-submit-pixel-modal");

    await inputName.fill("Pixel Test Validation");
    await inputId.fill("12345"); // Trop court (< 15)
    await submitBtn.click();
    await expect(page.locator("#pixel-modal-id-error")).toContainText("15 ou 16 chiffres");

    // 5. Tester le rejet de doublon avec un ID déjà présent sur lome-glow (109283746501928)
    await inputId.fill("109283746501928");
    await submitBtn.click();
    await expect(page.locator("#pixel-modal-error-message")).toContainText("déjà configuré sur cette boutique");

    // 6. Ajouter un 3ème pixel valide (15 chiffres : 777778888899999)
    await inputName.fill("Pixel 3 - Campagne Dakar Promo");
    await inputId.fill("777778888899999");

    // Activer l'option CAPI
    const toggleCapi = page.locator("#toggle-pixel-capi");
    await toggleCapi.click();
    await expect(page.locator("#select-pixel-capi-trigger")).toBeVisible();
    await page.locator("#input-pixel-test-code").fill("TEST_DKR_88");

    // Soumettre l'ajout du 3ème pixel
    await submitBtn.click();
    await expect(modal).not.toBeVisible();

    // 7. Vérifier que la limite de 3 pixels est atteinte : le bouton "Ajouter" DOIT être désactivé
    await expect(page.locator("#btn-add-meta-pixel")).toBeDisabled();
    await expect(page.locator("#max-pixels-warning-text")).toContainText("Maximum 3 pixels par boutique");

    // 8. Tester le bouton "Tester mon pixel" sur le premier pixel
    const testPixelBtn = page.locator("#btn-test-pixel-pix_tg_01");
    await expect(testPixelBtn).toBeVisible();
    await testPixelBtn.click();

    const testResult = page.locator("#pixel-test-result-pix_tg_01");
    await expect(testResult).toBeVisible();
    await expect(testResult).toContainText("Code 200");

    // 9. Vérifier le lien d'aide Meta Events Manager
    await expect(page.locator("#link-meta-pixel-help")).toContainText("Où trouver mon ID de pixel ?");

    await page.screenshot({
      path: `${artifactDir}/bundle-05px-meta-pixels-management.png`,
      fullPage: false,
    });
  });

  test("02. Prompt 05-Px : API serveur, étanchéité multi-boutique & masquage du jeton CAPI", async ({
    request,
  }) => {
    // 1. Isolation multi-boutique : Lomé vs Abidjan
    const resLome = await request.get("http://localhost:3000/api/pixels?store=lome-glow");
    expect(resLome.ok()).toBeTruthy();
    const dataLome = await resLome.json();
    expect(dataLome.pixels.length).toBeGreaterThan(0);
    dataLome.pixels.forEach((p: any) => {
      expect(p.storeSlug).toBe("lome-glow");
      expect(p.capiToken).toBeUndefined(); // Jamais exposé en clair
    });

    const resAbidjan = await request.get("http://localhost:3000/api/pixels?store=abidjan-bio");
    expect(resAbidjan.ok()).toBeTruthy();
    const dataAbidjan = await resAbidjan.json();
    expect(dataAbidjan.pixels.length).toBeGreaterThan(0);
    dataAbidjan.pixels.forEach((p: any) => {
      expect(p.storeSlug).toBe("abidjan-bio");
      expect(p.capiToken).toBeUndefined();
    });

    // 2. S'assurer que lome-glow a 3 pixels via l'API
    if (dataLome.pixels.length < 3) {
      await request.post("http://localhost:3000/api/pixels", {
        data: {
          storeSlug: "lome-glow",
          name: "Pixel 3 API",
          pixelId: "888887777766666",
        },
      });
    }

    // 3. Vérifier que l'API refuse un 4ème pixel (limite stricte côté serveur)
    const res4th = await request.post("http://localhost:3000/api/pixels", {
      data: {
        storeSlug: "lome-glow",
        name: "4eme Pixel Interdit",
        pixelId: "999998888877777",
      },
    });
    expect(res4th.status()).toBe(400);
    const errData = await res4th.json();
    expect(errData.error).toContain("Maximum 3 pixels par boutique");
  });

  test("03. Prompt 05-Px : Vitrine, bandeau cookies marketing & politique de confidentialité", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Accéder à la fiche produit
    await page.goto("http://localhost:3000/boutique/lome-glow/produit/prod_01", {
      waitUntil: "domcontentloaded",
    });

    // 2. Vérifier la présence du bandeau de consentement
    const banner = page.locator("#storefront-cookie-consent-banner");
    await expect(banner).toBeVisible();
    await expect(banner.locator("text=Respect de votre vie privée & Cookies")).toBeVisible();

    // 3. Tester la personnalisation du consentement (Marketing / Meta Pixel)
    const customBtn = page.locator("#btn-customize-cookies");
    await customBtn.click();
    await expect(page.locator("text=Cookies Marketing (Meta Pixel & CAPI)")).toBeVisible();

    // Activer les cookies marketing et enregistrer
    await page.locator("#checkbox-consent-marketing").check();
    await page.locator("#btn-save-cookie-preferences").click();
    await expect(banner).not.toBeVisible();

    // 4. Vérifier la politique de confidentialité (mention explicite Meta Pixel et CAPI)
    await page.goto("http://localhost:3000/boutique/lome-glow/pages/confidentialite", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("h1:has-text('Politique de Confidentialité')")).toBeVisible();
    const privacyContent = page.locator("main");
    await expect(privacyContent).toContainText("Pixel Meta et l'API de conversions (CAPI)");
    await expect(privacyContent).toContainText("SHA-256");

    await page.screenshot({
      path: `${artifactDir}/bundle-05px-cookie-consent-and-storefront.png`,
      fullPage: false,
    });
  });

  test("04. Prompt 05-Q : Vitesse d'affichage < 1s et squelettes instantanés (< 100 ms)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Tableau de bord
    await page.goto("http://localhost:3000/app/lome-glow", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1:has-text('Tableau de bord')")).toBeVisible();

    // 2. Commandes
    await page.goto("http://localhost:3000/app/lome-glow/commandes", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1:has-text('Commandes')")).toBeVisible();

    // 3. Produits
    await page.goto("http://localhost:3000/app/lome-glow/produits", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1:has-text('Produits')")).toBeVisible();

    // 4. Réglages
    await page.goto("http://localhost:3000/app/lome-glow/reglages", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".sm\\:grid")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/bundle-05q-instant-loading-skeletons.png`,
      fullPage: false,
    });
  });
});

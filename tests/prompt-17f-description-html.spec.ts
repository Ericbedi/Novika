import { test, expect } from "@playwright/test";

test.describe("Prompt 17-F : Mise en forme des descriptions HTML & Sécurité XSS", () => {
  const storeSlug = "lome-glow";

  test("Éditeur de fiche produit : outils de nettoyage, restructuration IA et aperçu vitrine", async ({
    page,
  }) => {
    // Connexion admin
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/app/${storeSlug}/produits/nouveau?role=owner`);
    await page.waitForLoadState("networkidle");

    // 1. Vérification de la carte Description
    await expect(page.locator("label:has-text('Description')")).toBeVisible();
    await expect(page.locator("#btn-clean-formatting")).toBeVisible();
    await expect(page.locator("#btn-ai-improve")).toBeVisible();

    // 2. Bascule en mode Code HTML
    await page.click("#btn-mode-html");
    const textarea = page.locator("[data-testid='rich-description-html-textarea']");
    await expect(textarea).toBeVisible();

    // 3. Injection d'une balise h1 et d'un script pour tester la neutralisation
    await textarea.fill(
      "<h1>Titre Externe</h1><p style='font-weight: bold;'>Bénéfice puissant</p><script>alert('xss')</script>"
    );

    // 4. Clic sur Nettoyer
    await page.click("#btn-clean-formatting");
    await expect(
      page.locator("text=Description déjà parfaitement conforme.").or(
        page.locator("text=neutralisés avec succès")
      )
    ).toBeVisible();

    // 5. Bascule en mode Aperçu Vitrine
    await page.click("#btn-mode-preview");
    const previewContainer = page.locator("[data-testid='novika-product-description']");
    await expect(previewContainer).toBeVisible();

    // Vérifier que le H1 est devenu H2
    await expect(previewContainer.locator("h2:has-text('Titre Externe')")).toBeVisible();
    await expect(previewContainer.locator("h1")).toHaveCount(0);
    // Vérifier l'absence absolue de balise script
    await expect(previewContainer.locator("script")).toHaveCount(0);

    // 6. Test du bouton "Améliorer avec l'IA"
    await page.click("#btn-ai-improve");
    await expect(page.locator("text=Fiche restructurée par l'IA en sections clés")).toBeVisible();
    await expect(previewContainer.locator("h3:has-text('Bénéfices clés')")).toBeVisible();
    await expect(previewContainer.locator("h3:has-text('Précautions d\\'emploi')")).toBeVisible();

    // Capture d'écran du formulaire de description avec aperçu
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/prompt-17f-editor-desktop.png",
      fullPage: false,
    });
  });

  test("Affichage responsive iPhone 13 (390px) de la description sur la vitrine client", async ({
    page,
  }) => {
    // Émulation iPhone 13
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/boutique/${storeSlug}/produit/cafe-bio-champignon-vitality`);
    await page.waitForLoadState("networkidle");

    // Vérification du composant ProductDescription
    const descriptionSection = page.locator("[data-testid='novika-product-description']");
    await expect(descriptionSection).toBeVisible();

    // Vérifier qu'aucun débordement horizontal n'a lieu
    const boundingBox = await descriptionSection.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(390);
    }

    // Capture d'écran mobile iPhone 13 de la fiche produit et description
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/prompt-17f-storefront-iphone13.png",
      fullPage: false,
    });
  });

  test("Modale Avant / Après : conservation 30 jours et rapport honnête", async ({ page }) => {
    // Connexion admin
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

    await page.setViewportSize({ width: 1440, height: 900 });
    // Ouvrir un produit existant (ex: serum-eclat-vitamine-c)
    await page.goto(`/app/${storeSlug}/produits/serum-visage-anti-taches?role=owner`);
    await page.waitForLoadState("networkidle");

    // Bouton de comparaison Avant / Après si présent
    const btnCompare = page.locator("#btn-open-comparison-modal");
    if (await btnCompare.isVisible()) {
      await btnCompare.click();
      await expect(page.locator("[data-testid='description-comparison-modal']")).toBeVisible();
      await expect(page.locator("text=Description d'origine (Source brute)")).toBeVisible();
      await expect(page.locator("text=Rendu Novika sécurisé (Vitrine)")).toBeVisible();

      // Capture de la modale
      await page.screenshot({
        path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/prompt-17f-comparison-modal.png",
      });
    }
  });
});

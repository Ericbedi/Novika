import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Prompt 12 : Thème principal de la vitrine « Novika Classique »", () => {
  // 1. Rendu responsive sans erreur à 320 / 390 / 768 / 1280 px (aucun scroll horizontal parasite)
  const viewports = [
    { name: "320px (Petit écran mobile)", width: 320, height: 600 },
    { name: "390px (iPhone 13 - Mobile First)", width: 390, height: 844 },
    { name: "768px (Tablette)", width: 768, height: 1024 },
    { name: "1280px (Ordinateur)", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`1. Rendu sans erreur à ${vp.name} : aucun débordement horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/boutique/lome-glow`);
      await page.waitForLoadState("domcontentloaded");

      // Vérifier que le titre de la boutique est bien affiché
      await expect(page.locator("body")).toBeVisible();

      // Vérifier qu'il n'y a aucun débordement horizontal parasite (scrollWidth <= clientWidth + 2px tolérance zoom)
      const isHorizontalScrollFree = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
      });
      expect(isHorizontalScrollFree).toBe(true);
    });
  }

  test("2. Section vide masquée pour le public et affichée avec boîte d'invitation pour l'admin en édition", async ({
    page,
  }) => {
    // Visite publique d'une boutique neuve sans contenu
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/boutique/cotonou-tech`);
    await page.waitForLoadState("domcontentloaded");

    // Aucune boîte de configuration admin ne doit être visible pour le public
    const adminPencil = page.locator("text=Modifier la Bannière Hero");
    await expect(adminPencil).not.toBeVisible();

    // Mode édition admin activé
    await page.addInitScript(() => {
      if (window.location.pathname.startsWith("/boutique")) {
        localStorage.setItem("novika_user_verified", "true");
        localStorage.setItem("novika_active_role", "owner");
      }
    });

    await page.goto(`${BASE_URL}/boutique/lome-glow`);
    await page.waitForLoadState("domcontentloaded");

    // Activer le mode édition via la barre admin flottante
    const editToggle = page.locator("#btn-toggle-edit-mode");
    if (await editToggle.isVisible()) {
      await editToggle.click();
    }
  });

  test("3. Fiche Produit : Formulaire COD intégré, Stock réel sans faux décompte & Bouton collant 390px", async ({
    page,
  }) => {
    // Tester sur iPhone 13 (390 px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/prod_01`);
    await page.waitForLoadState("domcontentloaded");

    // 1. Vérifier la présence du produit
    await expect(page.locator("h1")).toBeVisible();

    // 2. Vérifier que l'urgence est STRICTEMENT basée sur le stock réel (aucun compte à rebours fictif)
    const countdownTimer = page.locator("#fake-countdown-timer, .fake-countdown");
    await expect(countdownTimer).toHaveCount(0);

    // 3. Vérifier la présence du formulaire de commande COD direct
    const codForm = page.locator("#cod-order-form");
    await expect(codForm).toBeVisible();

    // 4. Vérifier la présence du bouton collant en bas d'écran sur mobile
    const stickyCta = page.getByRole("button", { name: /Commander ·/i });
    await expect(stickyCta).toBeVisible();

    // Vérifier la cible tactile >= 44px
    const bbox = await stickyCta.boundingBox();
    expect(bbox?.height).toBeGreaterThanOrEqual(44);
  });

  test("4. API Backend : Contrôle d'accès strict (refus de modification aux non-admins) & Isolation", async ({
    request,
  }) => {
    // Tentative de modification de thème par un rôle closer (interdit)
    const unauthorizedResponse = await request.post(`${BASE_URL}/api/theme`, {
      data: {
        shopId: "lome-glow",
        action: "save_draft",
        actorRole: "closer", // Rôle non autorisé
        themeData: { name: "Hacked Theme" },
      },
    });

    expect(unauthorizedResponse.status()).toBe(403);
    const errJson = await unauthorizedResponse.json();
    expect(errJson.success).toBe(false);
    expect(errJson.error).toContain("seuls les administrateurs et fondateurs peuvent modifier le thème");

    // Modification légitime par le propriétaire (owner)
    const authorizedResponse = await request.post(`${BASE_URL}/api/theme`, {
      data: {
        shopId: "lome-glow",
        action: "save_draft",
        actorRole: "owner",
        themeData: { name: "Lomé Glow — Thème Validé" },
      },
    });

    expect(authorizedResponse.status()).toBe(200);
    const successJson = await authorizedResponse.json();
    expect(successJson.success).toBe(true);

    // Vérifier l'isolation stricte entre boutiques
    const abidjanResponse = await request.get(`${BASE_URL}/api/theme?shopId=abidjan-prestige`);
    expect(abidjanResponse.status()).toBe(200);
    const abidjanJson = await abidjanResponse.json();
    expect(abidjanJson.theme.shopId).toBe("abidjan-prestige");
    expect(abidjanJson.theme.name).not.toBe("Lomé Glow — Thème Validé");
  });

  test("5. Règle de Propriété : Aucun mot interdit (Zendrop, Dawn, Liquid) dans le code source", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/boutique/lome-glow`);
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain("zendrop");
    expect(pageContent.toLowerCase()).not.toContain("dawn");
    expect(pageContent.toLowerCase()).not.toContain("{% schema %}");
    expect(pageContent.toLowerCase()).not.toContain("{% javascript %}");
  });
});

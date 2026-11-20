import { test, expect } from "@playwright/test";

test.describe("Prompt 17-K : Résolution et Affichage Produit Vitrine", () => {
  test.beforeEach(async ({ context }) => {
    // Session admin active pour lome-glow
    await context.addCookies([
      {
        name: "novika_active_role",
        value: "owner",
        domain: "localhost",
        path: "/",
      },
      {
        name: "novika_session",
        value: JSON.stringify({ role: "owner", email: "promisesbedi@gmail.com" }),
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("1. L'icône œil de la liste des produits génère l'URL canonique unifiée avec prévisualisation", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/produits");
    await page.waitForLoadState("domcontentloaded");

    const previewBtn = page.locator('[id^="btn-product-preview-"]').first();
    await expect(previewBtn).toBeVisible({ timeout: 10000 });

    const href = await previewBtn.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/(https:\/\/lomeglow\.shop|\/boutique\/lome-glow)\/produits\//);
    expect(href).toContain("preview=true");
    expect(href).toContain("token=");
  });

  test("2. L'accès à un produit actif affiche la fiche sans erreur 404", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/cafe-bio-champignon-vitality");
    await page.waitForLoadState("domcontentloaded");

    // Vérifier l'absence de 404
    await expect(page.locator("text=404")).not.toBeVisible();
    await expect(page.locator("text=Page ou produit introuvable")).not.toBeVisible();

    // Vérifier le contenu du produit
    await expect(page.locator("text=Café Bio Champignon Vitality").first()).toBeVisible({ timeout: 10000 });
  });

  test("3. L'accès direct à un produit brouillon affiche l'écran 'Produit indisponible' (pas de 404 générique)", async ({ page }) => {
    // prod_09 (correcteur-posture-dos-ajustable) est en brouillon (draft)
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/correcteur-posture-dos-ajustable");
    await page.waitForLoadState("domcontentloaded");

    // Vérifier l'écran dédié Produit indisponible
    await expect(page.locator("text=Produit indisponible").first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("text=Ce produit n'est pas encore disponible à la vente dans notre boutique.")
    ).toBeVisible();

    // Vérifier les boutons d'action vers la boutique
    await expect(page.locator("text=Retourner à l'accueil de la boutique")).toBeVisible();
    await expect(page.locator("text=Voir les autres articles disponibles")).toBeVisible();

    // Vérifier l'absence de la 404 générique
    await expect(page.locator("text=404")).not.toBeVisible();
  });

  test("4. L'accès à un produit brouillon avec ?preview=true affiche le produit et le bandeau d'aperçu administrateur", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/correcteur-posture-dos-ajustable?preview=true");
    await page.waitForLoadState("domcontentloaded");

    // Vérifier le bandeau d'aperçu administrateur
    const banner = page.locator('[data-testid="admin-preview-banner"]');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText("Aperçu : ce produit n'est pas encore publié");

    // Vérifier le lien pour modifier le produit
    const editLink = banner.locator('a[href*="/modifier"]');
    await expect(editLink).toBeVisible();
  });

  test("5. L'accès à un produit inexistant affiche la page 404 propre à la boutique avec son branding", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/article-inexistant-fantome-123");
    await page.waitForLoadState("domcontentloaded");

    // Vérifier l'identité de la boutique
    await expect(page.locator("text=Lomé Glow Cosmétiques").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Page ou produit introuvable")).toBeVisible();
    await expect(page.locator("text=Retourner à l'accueil de la boutique")).toBeVisible();
    await expect(page.locator("text=Consulter le catalogue")).toBeVisible();

    // Vérifier le bloc de diagnostic administrateur (vu que rôle admin dans les cookies)
    await expect(page.locator("text=Diagnostic Administrateur Novika")).toBeVisible();
    await expect(page.locator("text=Aucun produit ne correspond à l'identifiant")).toBeVisible();
  });

  test("6. Résolution tolérante : l'accès via id (prod_01) résout le produit et redirige vers le slug canonique", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow/produits/prod_01");
    await page.waitForLoadState("domcontentloaded");

    // La page doit résoudre le produit et mettre à jour l'URL avec le slug canonique
    await expect(page.locator("text=Café Bio Champignon Vitality").first()).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*\/boutique\/lome-glow\/produits\/cafe-bio-champignon-vitality/);
  });
});

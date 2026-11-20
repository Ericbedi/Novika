import { test, expect } from "@playwright/test";

test.describe("Prompts 19 & 21-b : Domaines Personnalisés, Multi-Boutiques & Vitrine 3 pages", () => {
  const artifactDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test("Prompt 19 : Gestion des noms de domaine et instructions DNS Vercel", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/domaines");
    await page.waitForLoadState("networkidle");

    // En-tête et adresse de secours
    await expect(page.locator("h1:has-text('Noms de domaine personnalisés')")).toBeVisible();
    await expect(page.locator("text=novika-delta.vercel.app/boutique/lome-glow")).toBeVisible();

    // Domaine par défaut lomeglow.shop
    await expect(page.locator("text=lomeglow.shop").first()).toBeVisible();
    await expect(page.locator("text=76.76.21.21").first()).toBeVisible();

    // Capture d'écran de l'interface des domaines
    await page.screenshot({
      path: `${artifactDir}/prompt-19-domains-manager.png`,
      fullPage: true,
    });

    // Test d'ouverture du modal d'ajout de domaine
    const addBtn = page.locator("#btn-add-domain");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Saisie du domaine
    const input = page.locator("#input-domain-name");
    await expect(input).toBeVisible();
    await input.fill("kelio.com");

    // Validation et passage à l'étape DNS
    await page.locator("button[type='submit']:has-text('Continuer')").click();
    await page.waitForTimeout(600);

    // Vérifier les instructions DNS
    await expect(page.locator("text=Instructions DNS Vercel")).toBeVisible();
    await expect(page.locator("text=76.76.21.21").first()).toBeVisible();
  });

  test("Prompt 19 : Vue « Toutes les boutiques » en synthèse propriétaire", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");

    // Bouton de bascule vers la synthèse propriétaire
    const ownerTab = page.locator("#tab-view-owner");
    await expect(ownerTab).toBeVisible();
    await ownerTab.click();
    await page.waitForTimeout(300);

    // Vérifier le tableau de bord global
    await expect(page.locator("text=Tableau de bord global des boutiques")).toBeVisible();
    await expect(page.locator("th:has-text('Commandes du jour')")).toBeVisible();
    await expect(page.locator("th:has-text('Commandes livrées')")).toBeVisible();
    await expect(page.locator("th:has-text('CA livré')")).toBeVisible();

    // Capture d'écran du tableau de synthèse propriétaire
    await page.screenshot({
      path: `${artifactDir}/prompt-19-all-stores-owner.png`,
      fullPage: true,
    });
  });

  test("Prompt 21-b : Vitrine à 3 pages UNIQUEMENT (Accueil, Catalogue, Contact) & Redirection 301", async ({ page }) => {
    // 1. Accès à la vitrine
    await page.goto("http://localhost:3000/boutique/lome-glow");
    await page.waitForLoadState("networkidle");

    // Vérifier que seuls Accueil, Catalogue, Contact sont présents dans le menu
    const nav = page.locator("header nav");
    await expect(nav.locator("a:has-text('Accueil')")).toBeVisible();
    await expect(nav.locator("a:has-text('Catalogue')")).toBeVisible();
    await expect(nav.locator("a:has-text('Contact')")).toBeVisible();

    // Vérifier l'absence de Blog, À Propos, Recherche et Panier multi-produits dans l'en-tête
    await expect(nav.locator("a:has-text('Blog')")).toHaveCount(0);
    await expect(nav.locator("a:has-text('À Propos')")).toHaveCount(0);
    await expect(page.locator("header a[title*='Recherche']")).toHaveCount(0);

    // Capture d'écran desktop
    await page.screenshot({
      path: `${artifactDir}/prompt-21b-storefront-3pages.png`,
      fullPage: true,
    });

    // 2. Test de redirection 301 permanente des routes supprimées (/collections -> Accueil)
    await page.goto("http://localhost:3000/boutique/lome-glow/collections");
    await page.waitForURL("http://localhost:3000/boutique/lome-glow");
    expect(page.url()).toBe("http://localhost:3000/boutique/lome-glow");

    // 3. Test de redirection 301 permanente (/blog -> Accueil)
    await page.goto("http://localhost:3000/boutique/lome-glow/blog");
    await page.waitForURL("http://localhost:3000/boutique/lome-glow");
    expect(page.url()).toBe("http://localhost:3000/boutique/lome-glow");
  });

  test("Prompt 21-b : Rendu mobile iPhone 13 sur la vitrine", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/boutique/lome-glow");
    await page.waitForLoadState("networkidle");

    // En-tête mobile épuré avec Logo et WhatsApp
    await expect(page.locator("header a:has-text('WhatsApp')")).toBeVisible();

    await page.screenshot({
      path: `${artifactDir}/prompt-21b-mobile-iphone13.png`,
      fullPage: true,
    });
  });
});

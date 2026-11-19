import { test, expect } from "@playwright/test";

test.describe("Prompt 15 : Galerie produit en slides (plusieurs images, miniatures, zoom, mobile swipe)", () => {
  test.beforeEach(async ({ page }) => {
    // Session administrateur pour l'espace vendeur
    await page.context().addCookies([
      {
        name: "novika_session",
        value: JSON.stringify({
          id: "usr_admin_01",
          email: "admin@novika.com",
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
  });

  test("1. Vitrine : Affichage de la galerie produit, miniatures, compteur et badge principale", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/boutique/lome-glow/produit/prod_01", { waitUntil: "networkidle" });

    // 1. Cadre de la galerie
    const galleryRegion = page.locator('div[role="region"][aria-label*="Galerie produit"]').first();
    await expect(galleryRegion).toBeVisible();

    // 2. Compteur "1 / 3"
    const counter = page.locator('[data-testid="gallery-counter"]').first();
    await expect(counter).toBeVisible();
    await expect(counter).toHaveText(/1\s*\/\s*3/);

    // 3. Badge "Principale"
    await expect(page.locator("text=Principale").first()).toBeVisible();

    // 4. Miniatures sous l'image principale
    const tablist = page.locator('div[role="tablist"]').first();
    await expect(tablist).toBeVisible();
    const thumbnails = tablist.locator('button[role="tab"]');
    await expect(thumbnails).toHaveCount(3);

    // Clic sur la 2e miniature
    await thumbnails.nth(1).click();
    await expect(counter).toHaveText(/2\s*\/\s*3/);

    // Clic sur la 3e miniature
    await thumbnails.nth(2).click();
    await expect(counter).toHaveText(/3\s*\/\s*3/);
  });

  test("2. Vitrine : Navigation par flèches et au clavier (ArrowLeft / ArrowRight)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/boutique/lome-glow/produit/prod_01", { waitUntil: "networkidle" });

    const galleryRegion = page.locator('div[role="region"][aria-label*="Galerie produit"]').first();
    const counter = page.locator('[data-testid="gallery-counter"]').first();

    // Flèche suivante
    const nextBtn = page.locator('button[aria-label="Image suivante"]').first();
    await nextBtn.click({ force: true });
    await expect(counter).toHaveText(/2\s*\/\s*3/);

    // Flèche précédente
    const prevBtn = page.locator('button[aria-label="Image précédente"]').first();
    await prevBtn.click({ force: true });
    await expect(counter).toHaveText(/1\s*\/\s*3/);

    // Clavier : focus sur la galerie puis ArrowRight
    await galleryRegion.focus();
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText(/2\s*\/\s*3/);

    await page.keyboard.press("ArrowLeft");
    await expect(counter).toHaveText(/1\s*\/\s*3/);
  });

  test("3. Vitrine : Synchronisation de l'image lors du changement de variante", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/boutique/lome-glow/produit/prod_01", { waitUntil: "networkidle" });

    const counter = page.locator('[data-testid="gallery-counter"]').first();
    await expect(counter).toHaveText(/1\s*\/\s*3/);

    // Cliquer sur la variante 2 ("Pack Double Énergie")
    const variant2Btn = page.getByText("Pack Double Énergie", { exact: false }).first();
    if (await variant2Btn.isVisible()) {
      await variant2Btn.click();
      // La galerie doit automatiquement se caler sur l'image 2
      await expect(counter).toHaveText(/2\s*\/\s*3/);
    }
  });

  test("4. Vitrine : Visionneuse plein écran Lightbox Zoom (ouverture, fermeture Esc & bouton)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/boutique/lome-glow/produit/prod_01", { waitUntil: "networkidle" });

    // Bouton loupe
    const zoomBtn = page.locator('button[aria-label="Agrandir l\'image"]').first();
    await expect(zoomBtn).toBeVisible();
    await zoomBtn.click();

    // La boîte de dialogue Lightbox s'ouvre
    const dialog = page.locator('div[role="dialog"][aria-label*="Visionneuse plein écran"]');
    await expect(dialog).toBeVisible();

    // Contrôles de zoom dans la Lightbox
    const zoomInBtn = dialog.locator('button[aria-label="Augmenter le zoom"]');
    await expect(zoomInBtn).toBeVisible();
    await zoomInBtn.click();
    await expect(dialog.getByText("150%")).toBeVisible();

    // Fermeture avec la touche Échap
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    // Le focus est revenu sur le bouton déclencheur
    await expect(zoomBtn).toBeFocused();
  });

  test("5. Vitrine Mobile : Zéro débordement horizontal à 320px et 390px", async ({ page }) => {
    // Test 390px (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/boutique/lome-glow/produit/prod_01", { waitUntil: "networkidle" });

    let hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Test 320px (petit smartphone)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.reload({ waitUntil: "networkidle" });

    hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("6. Espace Vendeur : Bloc médias complet avec 20 visuels max, réordonnancement, vidéo et mentions légales", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/app/lome-glow/produits/prod_01", { waitUntil: "networkidle" });

    // 1. Titre et compteur d'images
    await expect(page.getByText("Médias du produit")).toBeVisible();
    const mediaCounter = page.locator('[data-testid="media-counter"]');
    await expect(mediaCounter).toBeVisible();
    await expect(mediaCounter).toHaveText(/3\s*\/\s*20\s*images/);

    // 2. Avertissement conformité publicitaire (santé/avant-après)
    await expect(
      page.getByText("Recommandation conformité & plateformes publicitaires :")
    ).toBeVisible();
    await expect(
      page.getByText("Vérifiez que vos visuels respectent les règles des plateformes publicitaires")
    ).toBeVisible();

    // 3. Case à cocher des droits d'images
    const rightsCheckbox = page.locator(
      'input[type="checkbox"]:has-text("Je confirme"), label:has-text("Je confirme avoir le droit d\'utiliser ces images") input'
    );
    await expect(rightsCheckbox).toBeVisible();
    await expect(rightsCheckbox).toBeChecked();

    // 4. Contrôles sur chaque image (Monter, Descendre, Remplacer, Alt, Supprimer)
    await expect(page.locator('button[title="Monter d\'un rang"]').first()).toBeVisible();
    await expect(page.locator('button[title="Descendre d\'un rang"]').first()).toBeVisible();
    await expect(page.locator('button[title="Remplacer cette image"]').first()).toBeVisible();
    await expect(page.locator('button[title*="Modifier le texte alternatif"]').first()).toBeVisible();

    // 5. Bouton vidéo optionnelle (slide dans la galerie)
    const videoToggleBtn = page.getByRole("button", { name: /Ajouter vidéo|Vidéo active/i });
    await expect(videoToggleBtn).toBeVisible();
    await videoToggleBtn.click();

    // Le champ d'URL vidéo s'affiche
    const videoInput = page.locator('input[placeholder*="youtube.com/watch"]');
    await expect(videoInput).toBeVisible();

    // Saisie d'une URL YouTube valide
    await videoInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await expect(page.getByText("Format YouTube valide")).toBeVisible();
  });
});

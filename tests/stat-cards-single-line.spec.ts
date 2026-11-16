import { test, expect } from "@playwright/test";

test.describe("Correctif : Cartes de statistiques sur une seule ligne & Comportement Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
      sessionStorage.clear();
    });
  });

  test("1. Écran 1920 px & 1440 px : Les 5 cartes sont sur UNE SEULE ligne à partir de 960 px de conteneur", async ({ page }) => {
    // 1440 px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const grid = page.locator("#dashboard-stat-cards-grid");
    await expect(grid).toBeVisible();
    // Attendre la fin complète de l'animation de transition ScrollReveal (durée 700ms + délai 100ms)
    await page.waitForTimeout(1000);

    const cards = grid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);

    // Vérifier que les 5 cartes sont sur la MÊME ligne (même position Y)
    const boxes = [];
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }

    const firstY = boxes[0].y;
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].y - firstY)).toBeLessThanOrEqual(2);
    }

    // Vérifier les dimensions à 1440px : environ 215 à 230 px de large sur 130 à 140 px de haut
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(180);
      expect(b.width).toBeLessThanOrEqual(250);
      expect(b.height).toBeGreaterThanOrEqual(128);
    }

    // Hauteurs égales dans la rangée
    const firstH = boxes[0].height;
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].height - firstH)).toBeLessThanOrEqual(2);
    }

    // Alignement parfait des 5 mini-courbes sur la même ligne de base Y
    const sparklines = grid.locator(".stat-card-item .mt-auto svg");
    await expect(sparklines).toHaveCount(5);
    const sparkY0 = (await sparklines.nth(0).boundingBox())?.y;
    expect(sparkY0).toBeDefined();
    for (let i = 1; i < 5; i++) {
      const sparkY = (await sparklines.nth(i).boundingBox())?.y;
      expect(Math.abs(sparkY! - sparkY0!)).toBeLessThanOrEqual(2);
    }

    // Carte « Ventes totales » avec 3 850 000 FCFA lisible
    const salesCard = page.locator("#stat-card-total-sales");
    await expect(salesCard).toBeVisible();
    await expect(salesCard.locator(".stat-card-val-full")).toContainText("3 850 000");
    await expect(salesCard.locator(".stat-card-val-full")).toContainText("FCFA");

    // 1920 px : 5 cartes également sur une seule ligne
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(400);
    const boxes1920 = [];
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      boxes1920.push(box!);
    }
    const firstY1920 = boxes1920[0].y;
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes1920[i].y - firstY1920)).toBeLessThanOrEqual(2);
    }
  });

  test("2. Écran 1280 px : Barre latérale ouverte (256px) et réduite (72px) - 5 cartes sur une ligne", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const grid = page.locator("#dashboard-stat-cards-grid");
    const cards = grid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);

    // Barre latérale ouverte : vérifier que les 5 cartes sont sur une ligne
    const boxesOpen = [];
    for (let i = 0; i < 5; i++) {
      const b = await cards.nth(i).boundingBox();
      boxesOpen.push(b!);
    }
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxesOpen[i].y - boxesOpen[0].y)).toBeLessThanOrEqual(2);
    }

    // Réduire la barre latérale (72px)
    const collapseToggle = page.locator("#btn-sidebar-collapse-toggle");
    if (await collapseToggle.isVisible()) {
      await collapseToggle.click();
      await page.waitForTimeout(300);

      const boxesCollapsed = [];
      for (let i = 0; i < 5; i++) {
        const b = await cards.nth(i).boundingBox();
        boxesCollapsed.push(b!);
      }
      for (let i = 1; i < 5; i++) {
        expect(Math.abs(boxesCollapsed[i].y - boxesCollapsed[0].y)).toBeLessThanOrEqual(2);
      }
    }
  });

  test("3. Écran 768 px & 1024 px : Disposition 3 + 2 (les 2 dernières s'étirent)", async ({ page }) => {
    // 1024 px : largeur de conteneur entre 600 et 959 px (3 + 2)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const grid = page.locator("#dashboard-stat-cards-grid");
    const cards = grid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);

    const b = [];
    for (let i = 0; i < 5; i++) {
      b.push((await cards.nth(i).boundingBox())!);
    }

    // Rangée 1 : Cartes 0, 1, 2 ont le même Y
    expect(Math.abs(b[0].y - b[1].y)).toBeLessThanOrEqual(2);
    expect(Math.abs(b[1].y - b[2].y)).toBeLessThanOrEqual(2);

    // Rangée 2 : Cartes 3, 4 ont un Y inférieur et sont alignées entre elles
    expect(b[3].y).toBeGreaterThan(b[0].y);
    expect(Math.abs(b[3].y - b[4].y)).toBeLessThanOrEqual(2);

    // Les cartes 3 et 4 s'étirent (leur largeur est plus grande que celles de la rangée 1)
    expect(b[3].width).toBeGreaterThan(b[0].width);
    expect(b[4].width).toBeGreaterThan(b[0].width);

    // Aucun défilement horizontal sur la page
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("4. Écran 360 px (Mobile) : Disposition 2 + 2 + 1 (la dernière pleine largeur) et format compact", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#live-globe-card", { state: "visible" });

    const grid = page.locator("#dashboard-stat-cards-grid");
    const cards = grid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);

    const b = [];
    for (let i = 0; i < 5; i++) {
      b.push((await cards.nth(i).boundingBox())!);
    }

    // Rangée 1 : Cartes 0, 1
    expect(Math.abs(b[0].y - b[1].y)).toBeLessThanOrEqual(2);

    // Rangée 2 : Cartes 2, 3
    expect(b[2].y).toBeGreaterThan(b[0].y);
    expect(Math.abs(b[2].y - b[3].y)).toBeLessThanOrEqual(2);

    // Rangée 3 : Carte 4 (pleine largeur, plus large que cartes 0 et 1)
    expect(b[4].y).toBeGreaterThan(b[2].y);
    expect(b[4].width).toBeGreaterThan(b[0].width * 1.5);

    // Vérification du format compact des grands nombres
    // Ventes totales : « 3,85 M » ou « 3 850 000 » avec info-bulle complète
    const salesCard = page.locator("#stat-card-total-sales");
    await expect(salesCard).toBeVisible();
    const salesTitle = await salesCard.locator(".stat-card-val-container").getAttribute("title");
    expect(salesTitle?.replace(/\u00A0/g, " ")).toContain("3 850 000 FCFA");

    // Aucun défilement horizontal sur mobile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("5. Typographie & Accessibilité : Signe moins typographique, flèches, info-bulles et lecteur d'écran", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // Carte « Taux de conversion » avec variation négative
    const convCard = page.locator("#stat-card-conversion-rate");
    await expect(convCard).toBeVisible();

    // Vrai signe moins typographique « − »
    const badge = convCard.locator("span[role='status']");
    await expect(badge).toBeVisible();
    const badgeText = await badge.innerText();
    expect(badgeText).toContain("−3,1");
    expect(badgeText).toContain("%");

    // Texte pour lecteur d'écran
    const srText = await badge.locator(".sr-only").innerText();
    expect(srText).toContain("en baisse de 3,1 %");

    // Info-bulle accessible via attribut title
    const badgeTitle = await badge.getAttribute("title");
    expect(badgeTitle).toContain("Visites → Commandes");
    expect(badgeTitle).toContain("en baisse de 3,1 %");

    // Accessible au clavier via tabIndex
    await expect(badge).toHaveAttribute("tabindex", "0");
  });

  test("6. Grille unifiée sur Stats > Vue d'ensemble (/app/[store]/stats)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/stats");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const statsGrid = page.locator("#stats-overview-cards-grid");
    await expect(statsGrid).toBeVisible();

    const cards = statsGrid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
    await page.waitForTimeout(400);

    // Vérifier les 5 cartes sur une seule ligne
    const boxes = [];
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].y - boxes[0].y)).toBeLessThanOrEqual(2);
    }

    // Vérifier la présence des 5 cartes attendues
    await expect(statsGrid.getByText("Ventes Brutes")).toBeVisible();
    await expect(statsGrid.getByText("Remises Offertes")).toBeVisible();
    await expect(statsGrid.getByText("Retours / Rejets")).toBeVisible();
    await expect(statsGrid.getByText("Ventes Nettes")).toBeVisible();
    await expect(statsGrid.getByText("Panier Moyen (AOV)")).toBeVisible();
  });

  test("7. Grille unifiée sur Finances (/app/[store]/finances)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/finances");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const financesGrid = page.locator("#finances-stat-cards-grid");
    await expect(financesGrid).toBeVisible();

    const cards = financesGrid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
    await page.waitForTimeout(400);

    // Vérifier les 5 cartes sur une seule ligne
    const boxes = [];
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].y - boxes[0].y)).toBeLessThanOrEqual(2);
    }

    await expect(financesGrid.getByText("Revenus Encaissés")).toBeVisible();
    await expect(financesGrid.getByText("Livraisons Faites")).toBeVisible();
    await expect(financesGrid.getByText("Coût des Produits")).toBeVisible();
    await expect(financesGrid.getByText("Frais Pub & Livraison")).toBeVisible();
    await expect(financesGrid.getByText("Bénéfice Net Réel")).toBeVisible();
  });

  test("8. Grille unifiée sur Livre des comptes (/app/[store]/finances/livre-des-comptes)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/app/lome-glow/finances/livre-des-comptes");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    const waterfallGrid = page.locator("#waterfall-stat-cards-grid");
    await expect(waterfallGrid).toBeVisible();

    const cards = waterfallGrid.locator(".stat-card-item");
    await expect(cards).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
    await page.waitForTimeout(400);

    // Vérifier les 5 cartes sur une seule ligne
    const boxes = [];
    for (let i = 0; i < 5; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
    }
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].y - boxes[0].y)).toBeLessThanOrEqual(2);
    }

    await expect(waterfallGrid.getByText("CA Brut Encaissé")).toBeVisible();
    await expect(waterfallGrid.getByText("Coût Marchandises")).toBeVisible();
    await expect(waterfallGrid.getByText("Marge Commerciale")).toBeVisible();
    await expect(waterfallGrid.getByText("Frais Opérationnels")).toBeVisible();
    await expect(waterfallGrid.getByText("Bénéfice Net en Poche")).toBeVisible();
  });
});

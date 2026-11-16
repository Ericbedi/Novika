const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Dashboard sans header avec sidebar réorganisée
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-01-dashboard-no-header.png") });
    await page.close();
  }

  // 2. Command Palette (Ctrl+K)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.click("#btn-sidebar-search");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-02-command-palette-search.png") });
    await page.close();
  }

  // 3. Notifications Dropdown Panel
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.click("#btn-sidebar-notifications");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-03-notifications-panel.png") });
    await page.close();
  }

  // 4. Modale Bêta v0.9.4
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.click("#btn-beta-badge-info");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-04-beta-modal.png") });
    await page.close();
  }

  // 5. Page Gérer mes boutiques (/app/[store]/reglages/boutiques)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-05-manage-stores-page.png") });
    await page.close();
  }

  // 6. Vitrine avec Infinite Marquee sans aucun lien
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:3000/boutique/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-06-storefront-infinite-marquee.png") });
    await page.close();
  }

  // 7. Vue Mobile avec bouton rond flottant 44px
  {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.addInitScript(() => {
      localStorage.setItem("afribuilder_active_role", "owner");
      localStorage.setItem("afribuilder_user_verified", "true");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-07-mobile-floating-button.png") });

    // Ouvrir le tiroir mobile
    await page.click("#btn-mobile-drawer-toggle");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "layout-08-mobile-drawer-open.png") });
    await page.close();
  }

  await browser.close();
  console.log("Screenshots captured successfully in " + ARTIFACT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

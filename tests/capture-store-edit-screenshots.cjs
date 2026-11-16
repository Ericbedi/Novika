const { chromium } = require("playwright");
const path = require("path");

async function capture() {
  const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\98eca996-b0bb-4f59-b97c-9eeb86bea0b6";
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop view with Edit button on store cards
  const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await contextDesktop.newPage();
  await page.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
  await page.waitForLoadState("networkidle");

  await page.screenshot({
    path: path.join(artifactDir, "novika-store-edit-01-cards-button-order.png"),
    fullPage: false,
  });
  console.log("Captured cards button order screenshot");

  // 2. Open Edit Store Drawer on Desktop
  await page.locator("#btn-edit-store-lome-glow").click();
  await page.waitForSelector("div[role='dialog']");
  await page.waitForTimeout(600); // Allow slide-in animation

  await page.screenshot({
    path: path.join(artifactDir, "novika-store-edit-02-desktop-drawer.png"),
    fullPage: false,
  });
  console.log("Captured desktop drawer screenshot");

  // 3. Mobile full-screen drawer (375x812)
  const contextMobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto("http://localhost:3000/app/lome-glow/reglages/boutiques");
  await pageMobile.waitForLoadState("networkidle");

  await pageMobile.locator("#btn-edit-store-lome-glow").click();
  await pageMobile.waitForSelector("div[role='dialog']");
  await pageMobile.waitForTimeout(600);

  await pageMobile.screenshot({
    path: path.join(artifactDir, "novika-store-edit-03-mobile-fullscreen-drawer.png"),
    fullPage: false,
  });
  console.log("Captured mobile fullscreen drawer screenshot");

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});

const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem("afribuilder_active_role", "owner");
    localStorage.setItem("afribuilder_user_verified", "true");
    sessionStorage.clear();
  });
  const page = await context.newPage();

  // 1. Dashboard 1440px - Single line
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app/lome-glow');
  await page.waitForSelector('#dashboard-stat-cards-grid', { state: 'visible' });
  await page.waitForTimeout(1000);
  await page.locator('#dashboard-stat-cards-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-01-dashboard-1440px-single-line.png'), fullPage: false });
  console.log('Saved cards-01-dashboard-1440px-single-line.png');

  // 2. Dashboard 1280px - Sidebar open 256px
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(600);
  await page.locator('#dashboard-stat-cards-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-02-dashboard-1280px-sidebar-open.png'), fullPage: false });
  console.log('Saved cards-02-dashboard-1280px-sidebar-open.png');

  // 3. Dashboard 1024px - 3 + 2 layout
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(600);
  await page.locator('#dashboard-stat-cards-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-03-dashboard-1024px-3-plus-2.png'), fullPage: false });
  console.log('Saved cards-03-dashboard-1024px-3-plus-2.png');

  // 4. Dashboard 360px - Mobile 2 + 2 + 1 compact layout
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(600);
  await page.locator('#dashboard-stat-cards-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-04-dashboard-360px-mobile-compact.png'), fullPage: false });
  console.log('Saved cards-04-dashboard-360px-mobile-compact.png');

  // 5. Stats Overview 1440px - Single line
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app/lome-glow/stats');
  await page.waitForSelector('#stats-overview-cards-grid', { state: 'visible' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-05-stats-overview-1440px.png'), fullPage: false });
  console.log('Saved cards-05-stats-overview-1440px.png');

  // 6. Finances 1440px - Single line
  await page.goto('http://localhost:3000/app/lome-glow/finances');
  await page.waitForSelector('#finances-stat-cards-grid', { state: 'visible' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-06-finances-1440px.png'), fullPage: false });
  console.log('Saved cards-06-finances-1440px.png');

  // 7. Livre des comptes 1440px - Single line
  await page.goto('http://localhost:3000/app/lome-glow/finances/livre-des-comptes');
  await page.waitForSelector('#waterfall-stat-cards-grid', { state: 'visible' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'cards-07-livre-des-comptes-1440px.png'), fullPage: false });
  console.log('Saved cards-07-livre-des-comptes-1440px.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

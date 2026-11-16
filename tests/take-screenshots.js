const { chromium } = require("@playwright/test");
const path = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Sidebar & Store Selector
  await page.goto("http://localhost:3000/app/lome-glow");
  await page.locator("#btn-store-selector").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path + "/cs-01-compact-sidebar-store-selector.png" });

  // 2. User Popover Upward
  await page.keyboard.press("Escape");
  await page.locator("#btn-user-menu-trigger").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path + "/cs-02-user-menu-upward-popover.png" });

  // 3. Create Store Modal (5 steps)
  await page.keyboard.press("Escape");
  await page.locator("#btn-store-selector").click();
  await page.locator("#btn-open-create-store-modal").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path + "/cs-03-store-creation-5-steps-wizard.png" });

  // 4. Storefront Free Delivery & Expedition Zone
  await page.goto("http://localhost:3000/boutique/lome-glow/produit/prod_serum_vitc");
  const form = page.locator("#main-product-order-form");
  const citySelect = form.locator("select").nth(1);
  await citySelect.selectOption("Kara");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path + "/cs-04-storefront-free-delivery-expedition-zone.png" });

  await browser.close();
  console.log("Screenshots captured successfully!");
})();

import { chromium } from "playwright";
import * as path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const storeSlug = "lome-glow";
  const outputDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  // Session authentifiée
  await context.addCookies([
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

  // 1. Desktop 1440x1000
  const pageDesktop = await context.newPage();
  await pageDesktop.setViewportSize({ width: 1440, height: 1000 });
  await pageDesktop.goto(`http://localhost:3000/app/${storeSlug}/produits/nouveau`, {
    waitUntil: "networkidle",
  });
  await pageDesktop.waitForTimeout(1000);

  // Déplier l'aperçu SEO pour la capture
  const editSeoBtn = pageDesktop.locator("#btn-edit-seo");
  if (await editSeoBtn.isVisible()) {
    await editSeoBtn.click();
    await pageDesktop.waitForTimeout(300);
  }

  await pageDesktop.screenshot({
    path: path.join(outputDir, "prompt-17b-desktop-product-form.png"),
    fullPage: true,
  });
  console.log("Desktop full page capture saved!");

  // 2. Mobile iPhone 13 390x844
  const pageMobile = await context.newPage();
  await pageMobile.setViewportSize({ width: 390, height: 844 });
  await pageMobile.goto(`http://localhost:3000/app/${storeSlug}/produits/nouveau`, {
    waitUntil: "networkidle",
  });
  await pageMobile.waitForTimeout(1000);

  await pageMobile.screenshot({
    path: path.join(outputDir, "prompt-17b-mobile-iphone13.png"),
    fullPage: false,
  });
  console.log("Mobile iPhone 13 capture saved!");

  await browser.close();
}

main().catch(console.error);

import { chromium } from "playwright";
import * as path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const outputDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";
  const storeSlug = "lome-glow";

  // 1. Vue Admin Propriétaire (Desktop 1440x1000)
  const contextAdmin = await browser.newContext();
  await contextAdmin.addCookies([
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

  const pageAdmin = await contextAdmin.newPage();
  await pageAdmin.setViewportSize({ width: 1440, height: 1000 });
  await pageAdmin.goto(`http://localhost:3000/app/${storeSlug}/produits/nouveau`, {
    waitUntil: "networkidle",
  });
  await pageAdmin.waitForTimeout(1000);

  // Déplier les sections pour la capture
  const editSeoBtn = pageAdmin.locator("#btn-edit-seo");
  if (await editSeoBtn.isVisible()) await editSeoBtn.click();
  const extraPriceBtn = pageAdmin.locator("button:has-text('Prix d\\'affichage supplémentaires')");
  if (await extraPriceBtn.isVisible()) await extraPriceBtn.click();
  const stockDetailsBtn = pageAdmin.locator("button:has-text('Plus de détails (SKU, code-barres, rupture)')");
  if (await stockDetailsBtn.isVisible()) await stockDetailsBtn.click();
  const variantsToggle = pageAdmin.locator("#toggle-has-variants");
  if (await variantsToggle.isVisible()) await variantsToggle.click();

  await pageAdmin.waitForTimeout(500);

  await pageAdmin.screenshot({
    path: path.join(outputDir, "prompt-17c-desktop-product-form.png"),
    fullPage: true,
  });
  console.log("Admin desktop capture saved!");

  // 2. Vue Mobile iPhone 13 (390x844)
  const pageMobile = await contextAdmin.newPage();
  await pageMobile.setViewportSize({ width: 390, height: 844 });
  await pageMobile.goto(`http://localhost:3000/app/${storeSlug}/produits/nouveau`, {
    waitUntil: "networkidle",
  });
  await pageMobile.waitForTimeout(1000);

  await pageMobile.screenshot({
    path: path.join(outputDir, "prompt-17c-mobile-iphone13.png"),
    fullPage: false,
  });
  console.log("Mobile iPhone 13 capture saved!");

  // 3. Vue Closeuse (Coûts & marges masqués)
  const contextCloser = await browser.newContext();
  await contextCloser.addCookies([
    {
      name: "novika_session",
      value: JSON.stringify({
        id: "usr_closer_01",
        email: "closer@novika.com",
        role: "closer",
        createdAt: Date.now(),
      }),
      domain: "localhost",
      path: "/",
    },
    {
      name: "novika_active_role",
      value: "closer",
      domain: "localhost",
      path: "/",
    },
  ]);

  const pageCloser = await contextCloser.newPage();
  await pageCloser.setViewportSize({ width: 1440, height: 800 });
  await pageCloser.goto(`http://localhost:3000/app/${storeSlug}/produits/nouveau`, {
    waitUntil: "networkidle",
  });
  await pageCloser.waitForTimeout(1000);

  await pageCloser.screenshot({
    path: path.join(outputDir, "prompt-17c-closer-restricted.png"),
    fullPage: false,
  });
  console.log("Closer restricted capture saved!");

  await browser.close();
}

main().catch(console.error);

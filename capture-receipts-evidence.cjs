const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    localStorage.setItem("afribuilder_active_role", "owner");
    localStorage.setItem("afribuilder_user_verified", "true");
  });

  const page = await context.newPage();

  // 1. Page publique du reçu client (/recu/[token])
  console.log("Capturing 01 - Public Receipt Page...");
  await page.goto("http://localhost:3000/recu/rcp_cmd10480_tok_fatou_diop_delivered_secure_01");
  await page.waitForSelector("#receipt-public-container", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-01-public-receipt-token.png"),
    fullPage: true,
  });

  // 2. Page de gestion des reçus à envoyer (/app/[store]/commandes/recus)
  console.log("Capturing 02 - Receipts List Management...");
  await page.goto("http://localhost:3000/app/lome-glow/commandes/recus");
  await page.waitForSelector("#stat-to-send-count", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-02-management-list.png"),
    fullPage: false,
  });

  // 3. Invite au retour (Confirmation envoi WhatsApp)
  console.log("Capturing 03 - Return Prompt Confirmation...");
  const waBtn = page.locator("#btn-send-whatsapp-rcp_ord_10480");
  if (await waBtn.isVisible()) {
    // Intercept window.open
    await page.evaluate(() => {
      window.open = () => null;
    });
    await waBtn.click();
    await page.waitForSelector("#btn-confirm-sent-yes", { state: "visible" });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "receipt-03-whatsapp-return-prompt.png"),
      fullPage: false,
    });
    // Dismiss
    await page.keyboard.press("Escape");
  }

  // 4. Fiche produit : Onglet Contenu du reçu
  console.log("Capturing 04 - Product Receipt Tab...");
  await page.goto("http://localhost:3000/app/lome-glow/produits/prod_01");
  await page.waitForSelector("#tab-product-receipt-content", { state: "visible" });
  await page.click("#tab-product-receipt-content");
  await page.waitForSelector("#receipt-content-tab-pane", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-04-product-receipt-content-tab.png"),
    fullPage: false,
  });

  // 5. Assistant Import CSV en 5 étapes
  console.log("Capturing 05 - CSV Import Modal...");
  await page.goto("http://localhost:3000/app/lome-glow/produits");
  await page.waitForSelector("#btn-import-csv", { state: "visible" });
  await page.click("#btn-import-csv");
  await page.waitForSelector("#csv-import-modal", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-05-csv-import-step1.png"),
    fullPage: false,
  });

  // Passer à l'étape 4 pour capturer le test à blanc (Dry Run)
  await page.click("#btn-csv-next-step");
  await page.waitForTimeout(300);
  await page.click("#btn-csv-next-step");
  await page.waitForTimeout(300);
  await page.click("#btn-csv-next-step");
  await page.waitForSelector("#dry-run-summary", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-06-csv-import-dry-run.png"),
    fullPage: false,
  });

  // 6. Aperçu privé produit (30 minutes)
  console.log("Capturing 07 - Private Product Preview...");
  await page.goto("http://localhost:3000/boutique/lome-glow/apercu/produit/prod_01");
  await page.waitForSelector("#preview-mode-banner", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-07-private-preview-product.png"),
    fullPage: false,
  });

  // 7. Fiche commande : Carte de reçu dédiée & Limite 3 renvois
  console.log("Capturing 08 - Order Detail Receipt Card...");
  await page.goto("http://localhost:3000/app/lome-glow/commandes/CMD-10480");
  await page.waitForSelector("#order-receipt-card", { state: "visible" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "receipt-08-order-detail-receipt-card.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});

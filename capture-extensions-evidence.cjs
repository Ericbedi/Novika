const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

async function captureEvidence() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log("1. Capture Landing Hero & Marquee...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-01-landing-hero-and-marquee.png"),
    fullPage: false,
  });

  console.log("2. Capture Démo Interactive (#demo)...");
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-02-interactive-order-demo.png"),
    fullPage: false,
  });

  console.log("3. Capture Carte Afrique en Points...");
  await page.locator("#pause-map-animation-btn").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-03-africa-dots-map.png"),
    fullPage: false,
  });

  console.log("4. Capture Demande d'accès & Modal OTP...");
  await page.goto("http://localhost:3000/acces", { waitUntil: "networkidle" });
  await page.fill("input[placeholder*='Aminata Diallo']", "Fatou Traoré");
  await page.fill("#request-email-input", "fatou.traore.demo@gmail.com");
  await page.fill("input[placeholder*='+228 90 12']", "+2250700112233");
  await page.click("#submit-access-request-btn");
  await page.waitForSelector("#request-otp-input");
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-04-access-request-otp-modal.png"),
    fullPage: false,
  });

  console.log("5. Capture Activation Sécurisée (/invitation)...");
  await page.goto("http://localhost:3000/invitation/tok_demo_aicha_valid", { waitUntil: "networkidle" });
  await page.click("#request-activation-code-btn");
  await page.waitForSelector("#activation-otp-input");
  const code = (await page.locator("text=[Bêta Démo] Code d'activation :").textContent())?.match(/\d{6}/)?.[0] || "592184";
  await page.fill("#activation-otp-input", code);
  await page.click("#submit-activation-otp-btn");
  await page.waitForSelector("#locked-email-input");
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-05-invitation-locked-email.png"),
    fullPage: false,
  });

  console.log("6. Capture Platform Admin Hub Bêta...");
  await page.goto("http://localhost:3000/platform-admin", { waitUntil: "networkidle" });
  const totp = page.locator("input[placeholder*='123456']");
  if (await totp.isVisible()) {
    await totp.fill("123456");
    await page.click("button:has-text('Vérifier et Déverrouiller')");
  }
  await page.waitForSelector("#tab-btn-beta-hub");
  await page.click("#tab-btn-beta-hub");
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-06-platform-admin-beta-hub.png"),
    fullPage: false,
  });

  console.log("7. Capture Horaires de Travail Équipe...");
  await page.goto("http://localhost:3000/app/lome-glow/reglages/equipe/horaires", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-07-team-schedules-7days.png"),
    fullPage: false,
  });

  console.log("8. Capture Analyse Rentabilité Marchés (/stats/marches)...");
  await page.goto("http://localhost:3000/app/lome-glow/stats/marches", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-08-market-profitability-waterfall.png"),
    fullPage: false,
  });

  console.log("9. Capture Notification Sound Settings...");
  await page.goto("http://localhost:3000/app/lome-glow/reglages", { waitUntil: "networkidle" });
  await page.click("#settings-tab-notifications");
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "beta-ext-09-notification-sound-settings.png"),
    fullPage: false,
  });

  console.log("Toutes les captures d'écran ont été enregistrées avec succès !");
  await browser.close();
}

captureEvidence().catch((err) => {
  console.error(err);
  process.exit(1);
});

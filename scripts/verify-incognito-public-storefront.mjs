import { chromium } from "playwright";
import * as path from "path";

const outputDir = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

async function runVerification() {
  console.log("=== DÉBUT DES VÉRIFICATIONS VITRINE PUBLIQUE & DASHBOARD PRIVÉ ===");

  const browser = await chromium.launch({ headless: true });

  // =========================================================================
  // 1. CONTEXTE STRICTEMENT ANONYME / INCOGNITO (ZÉRO COOKIE, ZÉRO AUTH)
  // =========================================================================
  console.log("\n--- TEST 1 : Navigation incognito non connectée ---");
  const incognitoContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await incognitoContext.newPage();

  // Test 1.1 : Accueil boutique Kelio
  console.log("1.1 Ouverture de http://localhost:3000/boutique/kelio ...");
  await page.goto("http://localhost:3000/boutique/kelio", { waitUntil: "networkidle" });
  console.log("Attente de 10 secondes sur l'accueil boutique...");
  await page.waitForTimeout(10000);

  const homeUrl = page.url();
  console.log("URL actuelle :", homeUrl);
  if (!homeUrl.includes("/boutique/kelio")) {
    throw new Error(`Échec : Redirection inattendue sur l'accueil : ${homeUrl}`);
  }

  // Vérification de l'absence d'écran de préparation
  const preparationScreen = page.locator("text=Boutique en cours de préparation");
  const isPrepVisible = await preparationScreen.isVisible().catch(() => false);
  console.log("Écran de préparation présent ?", isPrepVisible ? "OUI (ERREUR)" : "NON (SUCCÈS)");
  if (isPrepVisible) {
    throw new Error("L'écran de préparation est visible pour un visiteur public !");
  }

  // Vérifier présence du Héro Kaelis
  const headline = await page.locator("h1").first().textContent();
  console.log("Titre Héro détecté :", headline?.trim());

  await page.screenshot({
    path: path.join(outputDir, "verified-incognito-kelio-home.png"),
    fullPage: true,
  });
  console.log("Capture d'écran enregistrée : verified-incognito-kelio-home.png");

  // Test 1.2 : Fiche Produit
  console.log("\n1.2 Ouverture de la fiche produit Sérum Éclat Vitamine C ...");
  await page.goto("http://localhost:3000/boutique/kelio/produits/serum-eclat-vitamine-c", {
    waitUntil: "networkidle",
  });
  console.log("Attente de 10 secondes sur la fiche produit...");
  await page.waitForTimeout(10000);

  const productUrl = page.url();
  console.log("URL actuelle fiche produit :", productUrl);
  if (!productUrl.includes("/produits/serum-eclat-vitamine-c")) {
    throw new Error(`Échec : Redirection inattendue sur le produit : ${productUrl}`);
  }

  const productTitle = await page.locator("h1").first().textContent();
  console.log("Titre produit détecté :", productTitle?.trim());

  await page.screenshot({
    path: path.join(outputDir, "verified-incognito-kelio-product.png"),
    fullPage: true,
  });
  console.log("Capture d'écran enregistrée : verified-incognito-kelio-product.png");

  // Test 1.3 : Panier & Commande COD
  console.log("\n1.3 Ajout au panier et passage de commande ...");
  // Ajouter un article au panier via le localStorage de la boutique (novika_store_cart_kelio)
  await page.evaluate(() => {
    const item = {
      id: "884117fc-a0e4-42ac-ac91-3d293d800017_default",
      productId: "884117fc-a0e4-42ac-ac91-3d293d800017",
      name: "Sérum Éclat Vitamine C",
      unitPrice: 15000,
      quantity: 1,
      stock: 50,
      image: "/products/serum-eclat.png",
      variantName: "Flacon 30ml",
    };
    localStorage.setItem("novika_store_cart_kelio", JSON.stringify([item]));
  });

  await page.goto("http://localhost:3000/boutique/kelio/panier", {
    waitUntil: "networkidle",
  });
  console.log("Attente de 10 secondes sur la page panier...");
  await page.waitForTimeout(10000);

  const cartUrl = page.url();
  console.log("URL panier actuelle :", cartUrl);
  if (!cartUrl.includes("/boutique/kelio/panier")) {
    throw new Error(`Échec : Le panier a été redirigé vers : ${cartUrl}`);
  }

  // Remplir le formulaire COD du panier
  console.log("Remplissage du formulaire de commande COD sur le panier...");
  await page.locator('[data-testid="input-customer-name"]').fill("Ablavi Dogbé");
  await page.locator('[data-testid="input-customer-phone"]').fill("90123456");
  await page.locator('[data-testid="input-customer-city"]').fill("Lomé - Hedzranawoe");
  await page.locator('[data-testid="input-customer-address"]').fill("Face pharmacie de la Paix, maison bleue");

  // Soumettre la commande
  const submitBtn = page.locator('[data-testid="btn-submit-cart-order"]');
  await submitBtn.click();

  console.log("Attente de la confirmation de commande...");
  await page.waitForSelector("text=Merci pour votre commande !", { timeout: 20000 });
  const confirmationText = await page.locator("text=CMD-").first().textContent();
  console.log("Numéro de commande validé :", confirmationText?.trim());

  await page.screenshot({
    path: path.join(outputDir, "verified-incognito-kelio-order-confirmed.png"),
    fullPage: false,
  });
  console.log("Capture d'écran enregistrée : verified-incognito-kelio-order-confirmed.png");

  // Test 1.4 : Vérification du blocage des routes privées sans connexion
  console.log("\n1.4 Vérification que l'accès au tableau de bord sans connexion redirige vers /connexion ...");
  await page.goto("http://localhost:3000/app/kelio", { waitUntil: "networkidle" });
  const redirectedAppUrl = page.url();
  console.log("URL après tentative d'accès à /app/kelio :", redirectedAppUrl);
  if (!redirectedAppUrl.includes("/connexion")) {
    throw new Error(`Échec : /app/kelio non protégé ! URL : ${redirectedAppUrl}`);
  }

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  const redirectedDashboardUrl = page.url();
  console.log("URL après tentative d'accès à /dashboard :", redirectedDashboardUrl);
  if (!redirectedDashboardUrl.includes("/connexion")) {
    throw new Error(`Échec : /dashboard non protégé ! URL : ${redirectedDashboardUrl}`);
  }

  await incognitoContext.close();
  console.log("Tests navigation incognito réussis à 100% !");

  // =========================================================================
  // 2. CONTEXTE AUTHENTIFIÉ PROPRIÉTAIRE (promisesbedi@gmail.com)
  // =========================================================================
  console.log("\n--- TEST 2 : Tableau de bord Propriétaire (promisesbedi@gmail.com) ---");
  const ownerContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await ownerContext.addCookies([
    {
      name: "novika_session",
      value: JSON.stringify({
        id: "usr_owner_promises",
        email: "promisesbedi@gmail.com",
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

  const ownerPage = await ownerContext.newPage();
  // Injecter l'état vérifié dans localStorage pour la session
  await ownerPage.addInitScript(() => {
    localStorage.setItem("novika_user_verified", "true");
    localStorage.setItem("novika_active_role", "owner");
    localStorage.setItem(
      "novika_user",
      JSON.stringify({
        id: "usr_owner_promises",
        email: "promisesbedi@gmail.com",
        fullName: "Promises Bedi",
        role: "owner",
      })
    );
  });

  console.log("Ouverture de http://localhost:3000/app/kelio/commandes ...");
  await ownerPage.goto("http://localhost:3000/app/kelio/commandes", {
    waitUntil: "networkidle",
  });

  const ownerOrdersUrl = ownerPage.url();
  console.log("URL tableau de bord commandes :", ownerOrdersUrl);

  const orderRow = ownerPage.locator("text=Ablavi Dogbé").first();
  await orderRow.waitFor({ state: "visible", timeout: 10000 });
  console.log("La commande 'Ablavi Dogbé' apparaît-elle dans le tableau de bord ? OUI (PARFAIT)");

  await ownerPage.screenshot({
    path: path.join(outputDir, "verified-owner-orders-dashboard.png"),
    fullPage: true,
  });
  console.log("Capture d'écran enregistrée : verified-owner-orders-dashboard.png");

  await browser.close();
  console.log("\n=== TOUTES LES VÉRIFICATIONS SONT RÉUSSIES SANS AUCUNE ERREUR ===");
}

runVerification().catch((err) => {
  console.error("ERREUR DE VÉRIFICATION :", err);
  process.exit(1);
});

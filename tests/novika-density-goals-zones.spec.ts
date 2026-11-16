import { test, expect } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

test.describe("Vérification E2E : Novika Rebranding, Landing, Objectifs de CA, Zones libres & Prix", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("novika_active_role", "owner");
      localStorage.setItem("novika_user_verified", "true");
      sessionStorage.clear();
    });
  });

  // --------------------------------------------------------------------------
  // TEST 1 : Page d'accueil publique Novika (15 sections & interactions)
  // --------------------------------------------------------------------------
  test("1. Landing Page publique Novika : 15 sections, onglets et FAQ", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    // A. Titre et Métadonnées
    await expect(page).toHaveTitle(/Novika — Plateforme COD pour vendeurs africains/);

    // B. Bandeau d'annonce fin
    const announcementBadge = page.getByText("BÊTA PRIVÉE", { exact: true });
    await expect(announcementBadge).toBeVisible();

    // C. En-tête collant & Logo
    const logoImg = page.locator("header img[alt='Logo Novika']");
    await expect(logoImg).toBeVisible();

    // D. Section Héros
    const heroTitle = page.locator("h1:has-text('Vendez en paiement à la livraison')");
    await expect(heroTitle).toBeVisible();

    const heroCta = page.locator("#hero-cta-btn");
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute("href", "/acces");

    // E. Bandeau Pays & Devises
    await expect(page.locator("text=Togo")).toBeVisible();
    await expect(page.locator("text=Côte d'Ivoire")).toBeVisible();

    // F. Onglets d'aperçu interactifs
    const fleetTabBtn = page.locator("button:has-text('Flotte & Tournées')");
    await fleetTabBtn.click();
    await expect(page.locator("text=Livreurs en course (8 actifs)")).toBeVisible();

    const financeTabBtn = page.locator("button:has-text('Caisse & Objectifs')");
    await financeTabBtn.click();
    await expect(page.locator("text=Objectif mensuel de CA encaissé")).toBeVisible();

    // G. Accordéon FAQ
    const faqQuestion = page.locator("button:has-text('Novika est-il adapté au paiement à la livraison (COD) ?')");
    await expect(faqQuestion).toBeVisible();

    // H. Formulaire d'accès rapide en bas de page
    const waitlistInput = page.locator("input[placeholder='Votre numéro WhatsApp ou e-mail']");
    await waitlistInput.fill("+228 90 12 34 56");
    const submitWaitlist = page.locator("#landing-submit-access-btn");
    await submitWaitlist.click();

    await expect(page.locator("text=Demande d'accès enregistrée !")).toBeVisible();

    // Capture d'écran Landing
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "novika-01-landing-page.png"), fullPage: false });
  });

  // --------------------------------------------------------------------------
  // TEST 2 : Parcours d'accès (/acces & /acces/merci)
  // --------------------------------------------------------------------------
  test("2. Parcours de demande d'accès (/acces -> /acces/merci)", async ({ page }) => {
    await page.goto("http://localhost:3000/acces");
    await page.waitForSelector("#submit-access-request-btn", { state: "visible" });

    await page.fill("input[placeholder='Ex. Aminata Diallo / Glow Dakar']", "Aminata Diallo");
    await page.fill("input[placeholder='Ex. 90 12 34 56']", "90 55 44 33");
    await page.fill("input[placeholder='Ex. contact@maboutique.com']", "aminata@glowdakar.com");

    const submitBtn = page.locator("#submit-access-request-btn");
    await submitBtn.click();

    await page.waitForURL("**/acces/merci");
    await expect(page.locator("h1:has-text('Demande bien reçue !')")).toBeVisible();

    // Capture d'écran Confirmation Accès
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "novika-02-access-merci.png") });
  });

  // --------------------------------------------------------------------------
  // TEST 3 : Parcours d'onboarding (/verification, /bienvenue, /demarrer)
  // --------------------------------------------------------------------------
  test("3. Parcours d'onboarding : Vérification, Bienvenue et Assistant 7 étapes", async ({ page }) => {
    // A. /verification
    await page.goto("http://localhost:3000/verification");
    await expect(page.locator("h1:has-text('Vérification de sécurité')")).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.fill(`#digit-${i}`, `${i + 1}`);
    }
    await page.click("#verify-code-btn");

    // B. /bienvenue
    await page.waitForURL("**/bienvenue");
    await expect(page.locator("h1:has-text('Bienvenue dans la bêta Novika')")).toBeVisible();
    await page.fill("input[placeholder='Ex. Lomé Glow / Abidjan Elegance']", "Lomé Glow Cosmétique");
    await page.check("input[type='checkbox']");
    await page.click("#start-onboarding-btn");

    // C. /demarrer (Assistant 7 étapes)
    await page.waitForURL("**/demarrer");
    await expect(page.locator("h1:has-text('Pour commencer')")).toBeVisible();
    await expect(page.locator("text=Créer votre boutique")).toBeVisible();

    // Capture d'écran Assistant de démarrage
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "novika-03-onboarding-demarrer.png") });
  });

  // --------------------------------------------------------------------------
  // TEST 4 : Dashboard Novika, Sélecteur de rôle (6 rôles) & Carte Objectifs
  // --------------------------------------------------------------------------
  test("4. Dashboard : Logo Novika, Rôles complets & Carte Objectif du mois", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForSelector("#sidebar-logo-link", { state: "visible" });

    // A. Logo Novika dans la barre latérale
    const sidebarLogo = page.locator("#sidebar-logo-link img[alt='Logo Novika']");
    await expect(sidebarLogo).toBeVisible();

    // B. Carte Objectif du mois de CA encaissé
    const goalCard = page.locator("#revenue-goal-card");
    await expect(goalCard).toBeVisible();
    await expect(goalCard).toContainText("Objectif du mois");
    await expect(goalCard).toContainText("Métrique : Encaissé réel en caisse");
    await expect(goalCard).toContainText("En avance");
    await expect(goalCard).toContainText("55%");

    // C. Présence de la barre segmentée et du repère d'allure
    const progressBar = goalCard.locator("[role='progressbar']");
    await expect(progressBar).toBeVisible();

    // D. Sélecteur de rôle dans le menu utilisateur : 6 rôles
    const userMenuTrigger = page.locator("#btn-user-menu-trigger");
    await userMenuTrigger.click();

    await expect(page.locator("button:has-text('Admin')").first()).toBeVisible();
    await expect(page.locator("button:has-text('Co-admin')")).toBeVisible();
    await expect(page.locator("button:has-text('Manager')")).toBeVisible();
    await expect(page.locator("button:has-text('Closeuse')")).toBeVisible();
    await expect(page.locator("button:has-text('Livreur')")).toBeVisible();
    await expect(page.locator("button:has-text('Agence')")).toBeVisible();

    // Fermer le menu avant capture
    await page.keyboard.press("Escape");

    // Capture d'écran Dashboard avec Carte Objectifs
    await goalCard.screenshot({ path: path.join(ARTIFACT_DIR, "novika-04-dashboard-revenue-goals.png") });
  });

  // --------------------------------------------------------------------------
  // TEST 5 : Finances > Objectifs (Page dédiée, Historique & Assistant création)
  // --------------------------------------------------------------------------
  test("5. Page Finances > Objectifs : Paliers, Historique et Modale Wizard", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/finances/objectifs");
    await page.waitForSelector("#btn-create-goal", { state: "visible" });

    // A. En-tête et objectif en cours
    await expect(page.getByRole("heading", { name: "Objectifs de chiffre d'affaires" })).toBeVisible();
    await expect(page.locator("#revenue-goal-card")).toBeVisible();
    await expect(page.locator("text=Paliers & Primes de l'objectif")).toBeVisible();

    // B. Bascule sur l'onglet Historique
    await page.click("button:has-text('Historique des périodes')");
    await expect(page.locator("text=Objectif du mois — Octobre 2026")).toBeVisible();
    await expect(page.locator("text=4 820 000 FCFA")).toBeVisible();

    // C. Ouverture de la modale de création en 4 étapes
    await page.click("button:has-text('Objectif en cours')");
    await page.click("#btn-create-goal");

    await expect(page.locator("h3:has-text('Créer un objectif de CA')")).toBeVisible();
    await expect(page.locator("text=Étape 1 sur 4")).toBeVisible();

    // Étape 1 -> Étape 2
    await page.click("#btn-wizard-next");
    await expect(page.locator("text=Étape 2 sur 4")).toBeVisible();
    await expect(page.locator("text=Périmètre d'application")).toBeVisible();

    // Étape 2 -> Étape 3
    await page.click("#btn-wizard-next");
    await expect(page.locator("text=Étape 3 sur 4")).toBeVisible();
    await expect(page.locator("text=Montant cible (FCFA)")).toBeVisible();

    // Étape 3 -> Étape 4 (Récapitulatif)
    await page.click("#btn-wizard-next");
    await expect(page.locator("text=Étape 4 sur 4")).toBeVisible();
    await expect(page.locator("text=Attention : un objectif avec prime est verrouillé")).toBeVisible();

    // Capture d'écran Assistant de création d'objectif
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "novika-05-create-goal-wizard.png") });

    // Validation finale
    await page.click("#btn-confirm-create-goal");
    await expect(page.locator("h3:has-text('Créer un objectif de CA')")).toHaveCount(0);
  });

  // --------------------------------------------------------------------------
  // TEST 6 : Ville libre, Détection de zone par signaux & Bloc de prix 3 lignes
  // --------------------------------------------------------------------------
  test("6. Vitrine Produit : Bloc de prix 3 lignes, Ville saisie librement & Détection de zone", async ({ page }) => {
    await page.goto("http://localhost:3000/boutique/lome-glow/produit/prod_01");
    await page.waitForSelector("#main-product-order-form", { state: "visible" });

    // A. Bloc de prix standardisé (3 lignes)
    // Ligne 1 : Étoiles et avis vérifiés
    await expect(page.locator("text=/\\d+ avis vérifiés/")).toBeVisible();

    // Ligne 2 : Prix actuel, ancien prix barré et pastille -XX%
    const currentPriceText = page.locator("span:has-text('14 900')").first();
    await expect(currentPriceText).toBeVisible();
    const discountBadge = page.locator("span:has-text('−50')").first();
    await expect(discountBadge).toBeVisible();

    // Ligne 3 : Pastilles réassurance (Livraison gratuite & Paiement à la livraison)
    await expect(page.locator("span:has-text('Livraison gratuite')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Paiement à la livraison')").first()).toBeVisible();

    // B. Formulaire de commande : Champ texte libre "Ville ou quartier" (Plus de select)
    const formScope = page.locator("#main-product-order-form");
    const citySelect = formScope.locator("select[name='city']");
    await expect(citySelect).toHaveCount(0);

    const cityInput = formScope.locator("input[placeholder*='Lomé, Agoè, Kara']");
    await expect(cityInput).toBeVisible();

    // C. Test détection Lomé -> Livraison gratuite à domicile
    await cityInput.fill("Lomé");
    await expect(formScope.locator("text=Livraison gratuite à domicile")).toBeVisible({ timeout: 5000 });

    // D. Test suggestion de correction (faute de frappe "Kra" -> "Kara")
    await cityInput.fill("Kra");
    const suggestionPill = formScope.locator("button:has-text('Vous vouliez dire Kara ? Oui')");
    await expect(suggestionPill).toBeVisible({ timeout: 5000 });

    // Clic sur la suggestion : corrige le champ
    await suggestionPill.click();
    await expect(cityInput).toHaveValue("Kara");
    await expect(formScope.locator("text=Livraison gratuite par expédition")).toBeVisible({ timeout: 5000 });

    // E. Bouton de géolocalisation avec mention de vie privée
    const geoBtn = formScope.locator("button:has-text('Utiliser ma position')");
    await expect(geoBtn).toBeVisible();
    await expect(formScope.locator("text=Votre position sert uniquement à vérifier la zone")).toBeVisible();

    // Capture d'écran Fiche Produit avec Bloc de Prix et Zone dynamique
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "novika-06-product-price-and-free-city-zone.png") });
  });
});

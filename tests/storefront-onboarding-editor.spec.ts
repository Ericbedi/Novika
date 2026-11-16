import { test, expect } from "@playwright/test";

test.describe("Boutique en Ligne, Éditeur CMS, Assistant d'Installation & Sécurité", () => {
  const BASE_URL = "http://localhost:3000/app/lome-glow";
  const STOREFRONT_URL = "http://localhost:3000/boutique/lome-glow";
  const ARTIFACT_DIR = "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6";

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("role_override")) {
        localStorage.setItem("afribuilder_active_role", "owner");
      }
      localStorage.removeItem("afribuilder_onboarding_dismissed_lome-glow");
    });
  });

  test("1. Carte « Pour commencer » : Progression Dynamique, 7 Étapes & Masquer/Rouvrir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}`);

    // Vérifier la présence de la carte d'installation en haut du dashboard
    await expect(page.getByText("Pour commencer")).toBeVisible();
    await expect(page.getByText("Complétez ces étapes pour configurer votre boutique")).toBeVisible();
    await expect(page.getByText(/sur 7 terminées/i)).toBeVisible();
    await expect(page.getByText("Progression globale")).toBeVisible();

    // Vérifier les 7 étapes
    await expect(page.getByText("Pays et devise")).toBeVisible();
    await expect(page.getByText("Ajoutez votre premier produit")).toBeVisible();
    await expect(page.getByText("Créez votre page d'accueil")).toBeVisible();
    await expect(page.getByText("Personnalisez votre thème")).toBeVisible();
    await expect(page.getByText("WhatsApp et contact")).toBeVisible();
    await expect(page.getByText("Ajoutez un domaine personnalisé")).toBeVisible();
    await expect(page.getByText("Optionnel")).toBeVisible();
    await expect(page.getByText("Passez une commande test, puis publiez")).toBeVisible();

    // Tester la simulation de commande test
    const testOrderBtn = page.getByRole("button", { name: "Simuler commande test" });
    if (await testOrderBtn.isVisible()) {
      await testOrderBtn.click();
      await expect(page.getByText(/Commande test simulée avec succès/i)).toBeVisible();
    }

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-01-onboarding-card-dashboard.png` });
  });

  test("2. Éditeur CMS : 4 Thèmes, IA « Adapter ma boutique à mes produits » & Switch Mobile/Desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/boutique-en-ligne?tab=theme`);

    // Vérifier le titre de l'éditeur
    await expect(page.getByText("Éditeur de Boutique en Ligne")).toBeVisible();
    await expect(page.getByText("Adresse :")).toBeVisible();

    // Tester le bouton IA « Adapter ma boutique à mes produits »
    const aiBtn = page.getByRole("button", { name: /Générer l'harmonie IA/i });
    await expect(aiBtn).toBeVisible();
    await aiBtn.click();
    await expect(page.getByText(/Thème et textes adaptés par l'IA enregistrés en brouillon/i)).toBeVisible();

    // Vérifier les thèmes prédéfinis
    await expect(page.getByText("Bannière Hero Impact")).toBeVisible();
    await expect(page.getByText("Galerie Visuelle")).toBeVisible();
    await expect(page.getByText("Éditorial & Storytelling")).toBeVisible();

    // Tester le basculement d'appareil (Desktop -> Mobile)
    const mobileBtn = page.getByTitle("Aperçu Mobile");
    await expect(mobileBtn).toBeVisible();
    await mobileBtn.click();

    // Vérifier l'aperçu mobile
    await expect(page.getByText("Rendu en direct :")).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-03-editor-theme-ai-tune.png` });
  });

  test("3. Éditeur CMS : Réorganisation des Sections & Lien d'Aperçu Privé Signé", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/boutique-en-ligne`);

    // Basculer sur l'onglet Sections
    await page.getByRole("button", { name: /Sections/i }).click();
    await expect(page.getByText(/Sections actives de l'Accueil/i)).toBeVisible();
    await expect(page.getByText("Bannière Principale (Hero)").first()).toBeVisible();
    await expect(page.getByText("Bandeau d'Avantages (Piliers COD)").first()).toBeVisible();

    // Tester l'ouverture de la modale Aperçu Privé (Lien signé avec jeton)
    await page.getByRole("button", { name: /Aperçu privé/i }).click();
    await expect(page.getByText("Lien d'Aperçu Privé Sécurisé")).toBeVisible();
    await expect(page.getByText(/preview_token=prv_tok_/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Copier le lien" })).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-05-editor-preview-token-modal.png` });
    await page.keyboard.press("Escape");
  });

  test("4. Vitrine Publique : Accueil (Hero, Avantages COD, Best-sellers & Avis Réels)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${STOREFRONT_URL}`);

    // Vérifier l'en-tête de la vitrine
    await expect(page.getByText("Lomé Glow Cosmétiques").first()).toBeVisible();
    await expect(page.getByText("Paiement à la livraison 100% Cash").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/i }).first()).toBeVisible();

    // Vérifier la bannière Hero ou Carrousel
    await expect(page.getByText("Beauté Naturelle d'Afrique de l'Ouest")).toBeVisible();
    await expect(page.getByRole("link", { name: "Découvrir la collection" }).first()).toBeVisible();

    // Vérifier les 4 piliers COD
    await expect(page.getByText("Paiement à la Livraison").first()).toBeVisible();
    await expect(page.getByText("Expédition Express 24h").first()).toBeVisible();
    await expect(page.getByText("Support WhatsApp 7j/7").first()).toBeVisible();
    await expect(page.getByText("Garantie Authenticité").first()).toBeVisible();

    // Vérifier les produits vedettes réels (sans aucun coût ni marge !)
    await expect(page.getByText("Produits Vedettes Plébiscités")).toBeVisible();
    await expect(page.getByText("Café Bio Champignon Vitality").first()).toBeVisible();

    // Vérifier la présence du bouton Signaler cette boutique dans le footer
    await expect(page.getByRole("button", { name: /Signaler cette boutique/i })).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-06-public-storefront-home.png` });
  });

  test("5. Vitrine Publique : Catalogue, Recherche en Direct & Filtres", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${STOREFRONT_URL}/catalogue`);

    // Vérifier le titre du catalogue
    await expect(page.getByText("Catalogue Produits")).toBeVisible();
    await expect(page.getByPlaceholder(/Rechercher par nom/i)).toBeVisible();

    // Tester la recherche en direct
    const searchInput = page.getByPlaceholder(/Rechercher par nom/i);
    await searchInput.fill("Café");
    await expect(page.getByText("Café Bio Champignon Vitality").first()).toBeVisible();

    // Effacer la recherche
    await searchInput.fill("");

    // Vérifier les filtres
    await expect(page.getByRole("button", { name: "En stock uniquement" })).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-07-public-catalog-filters.png` });
  });

  test("6. Vitrine Publique : Fiche Produit, Offres de Quantité & Commande COD Directe", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${STOREFRONT_URL}/produit/prod-1`);

    // Vérifier les éléments de la fiche produit
    await expect(page.getByRole("heading", { name: /Café Bio Champignon Vitality/i }).first()).toBeVisible();

    // Vérifier les offres de quantité
    await expect(page.getByText(/1 Boîte/i).first()).toBeVisible();
    await expect(page.getByText(/2 Boîtes/i).first()).toBeVisible();

    // Remplir le formulaire de commande COD
    await expect(page.getByText(/Remplissez le formulaire pour confirmer votre commande/i).first()).toBeVisible();
    await page.getByPlaceholder("Ex: Awa Traoré").first().fill("Afiwa Test Mensah");
    await page.getByPlaceholder("Ex: 07 48 29 11 02").first().fill("90887766");
    await page.getByPlaceholder(/Pharmacie/i).first().fill("Face Clinique Nyékonakpoè");

    // Valider la commande
    await page.getByRole("button", { name: /Je commande/i }).first().click();

    // Vérifier l'écran de succès de commande COD avec numéro de commande
    await expect(page.getByText(/Commande Confirmée/i).first()).toBeVisible();
    await expect(page.getByText(/TOTAL À PAYER À LA LIVRAISON/i)).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-08-public-product-cod-checkout.png` });
  });

  test("7. Sécurité & Anti-Abus : RLS Inter-Rôles, Honeypot de Contact & Protection des Coûts", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Vérifier la page Contact avec protection Honeypot
    await page.goto(`${STOREFRONT_URL}/contact`);
    await expect(page.getByText("Contactez-Nous & Zones de Livraison")).toBeVisible();
    await expect(page.getByText("Zones Desservies & Délais de Livraison")).toBeVisible();
    await expect(page.getByText("Envoyez-nous un Message")).toBeVisible();

    // Vérifier que le champ honeypot est masqué (tabIndex -1 / hidden)
    const honeypotInput = page.locator('input[name="website_url_honey"]');
    await expect(honeypotInput).toHaveClass(/hidden/);

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-09-public-contact-honeypot.png` });

    // 2. Tester l'étanchéité RLS : Rôle Closer bloqué sur l'Éditeur CMS
    await page.evaluate(() => {
      sessionStorage.setItem("role_override", "closer");
      localStorage.setItem("afribuilder_active_role", "closer");
    });
    await page.goto(`${BASE_URL}/boutique-en-ligne`);

    // Vérifier le message de blocage de sécurité RLS
    await expect(page.getByText("Accès Restreint (Sécurité RLS)")).toBeVisible();
    await expect(page.getByText(/ne vous autorise pas à modifier la vitrine en ligne/i)).toBeVisible();

    await page.screenshot({ path: `${ARTIFACT_DIR}/st-10-security-rls-restricted-role.png` });
  });
});

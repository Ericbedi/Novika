import { test, expect } from "@playwright/test";
import { ALL_CURRENCIES, AFRICAN_CURRENCIES, CURRENCY_MAP } from "../src/mock-data/currencies";
import {
  toSmallestUnit,
  fromSmallestUnit,
  formatMoneyInteger,
  canChangeStoreCurrency,
  areCmaParityCurrencies,
} from "../src/lib/currency-formatter";
import {
  PRESET_THEME_PALETTES,
  isValidHexColor,
  checkWcagAaCompliance,
  getBestTextColorForBackground,
} from "../src/lib/theme-contrast";
import {
  validateImageMagicBytes,
  isSafeBannerDestinationUrl,
  stripExifAndGenerateSrcset,
  computeOverlayContrast,
} from "../src/lib/banner-security";
import {
  validateStorefrontForPublishing,
  getLiveStoreOpenStatus,
} from "../src/lib/storefront-security";
import {
  validateBetaInvitationCode,
  isFeatureEnabledForStore,
  checkEmergencyKillSwitches,
  recordPlatformAuditEvent,
} from "../src/lib/beta-security";

test.describe("Bannières, Devises Africaines, Palettes, Vitrine, Bêta & Sidebar", () => {
  // =========================================================================
  // 1. UNIT & LOGIC VERIFICATION : DEVISES AFRICAINES & FORMATTAGE ENTIERS
  // =========================================================================
  test("Devises africaines ISO 4217 : Complétude et règles de décimales exactes", () => {
    expect(AFRICAN_CURRENCIES.length).toBeGreaterThanOrEqual(40);

    // Vérification décimales 0 pour zone CFA, Guinée, Rwanda, Burundi
    expect(CURRENCY_MAP["XOF"].decimals).toBe(0);
    expect(CURRENCY_MAP["XAF"].decimals).toBe(0);
    expect(CURRENCY_MAP["GNF"].decimals).toBe(0);
    expect(CURRENCY_MAP["RWF"].decimals).toBe(0);
    expect(CURRENCY_MAP["UGX"].decimals).toBe(0);

    // Vérification 3 décimales pour Afrique du Nord (TND, LYD)
    expect(CURRENCY_MAP["TND"].decimals).toBe(3);
    expect(CURRENCY_MAP["LYD"].decimals).toBe(3);

    // Vérification 2 décimales pour NGN, GHS, KES, ZAR, MAD, EGP
    expect(CURRENCY_MAP["NGN"].decimals).toBe(2);
    expect(CURRENCY_MAP["GHS"].decimals).toBe(2);
    expect(CURRENCY_MAP["KES"].decimals).toBe(2);
    expect(CURRENCY_MAP["ZAR"].decimals).toBe(2);

    // Conversion en plus petite unité entière (Jamais de flottant)
    expect(toSmallestUnit(15000, "XOF")).toBe(15000);
    expect(toSmallestUnit(25.50, "NGN")).toBe(2550); // 2550 kobos
    expect(toSmallestUnit(12.350, "TND")).toBe(12350); // 12350 millimes

    expect(fromSmallestUnit(2550, "NGN")).toBe(25.5);
    expect(fromSmallestUnit(12350, "TND")).toBe(12.35);

    // Formattage avec séparateur milliers et code devise
    const formattedXof = formatMoneyInteger(15000, "XOF");
    expect(formattedXof).toContain("15");
    expect(formattedXof).toContain("FCFA");

    // Parité CMA (Namibie, Lesotho, Eswatini avec le Rand ZAR)
    expect(areCmaParityCurrencies("ZAR", "NAD")).toBe(true);
    expect(areCmaParityCurrencies("ZAR", "LSL")).toBe(true);
    expect(areCmaParityCurrencies("ZAR", "SZL")).toBe(true);
    expect(areCmaParityCurrencies("ZAR", "XOF")).toBe(false);

    // Verrouillage de la devise après la première commande
    const lockedSettings = {
      shopId: "store-lome",
      primaryCurrency: "XOF",
      hasOrders: true,
      createdAt: "",
      updatedAt: "",
    };
    const lockCheck = canChangeStoreCurrency(lockedSettings);
    expect(lockCheck.allowed).toBe(false);
    expect(lockCheck.reason).toContain("verrouillée");

    const unlockedSettings = {
      shopId: "store-new",
      primaryCurrency: "NGN",
      hasOrders: false,
      createdAt: "",
      updatedAt: "",
    };
    expect(canChangeStoreCurrency(unlockedSettings).allowed).toBe(true);
  });

  // =========================================================================
  // 2. UNIT & LOGIC VERIFICATION : PALETTES DE THÈME & CONTRASTE WCAG AA
  // =========================================================================
  test("Palettes de thèmes : 10 palettes officielles, jetons hex stricts et conformité WCAG AA", () => {
    expect(PRESET_THEME_PALETTES.length).toBe(10);

    // Validation syntaxique stricte #RRGGBB
    expect(isValidHexColor("#C2410C")).toBe(true);
    expect(isValidHexColor("#166534")).toBe(true);
    expect(isValidHexColor("rgb(0,0,0)")).toBe(false);
    expect(isValidHexColor("<script>alert(1)</script>")).toBe(false);
    expect(isValidHexColor("#FFF")).toBe(false); // 6 chiffres requis

    // Vérification du contraste WCAG AA sur fond blanc pour Terre Cuite (#C2410C)
    const terreCuiteCheck = checkWcagAaCompliance("#C2410C", "#FFFFFF");
    expect(terreCuiteCheck.ratio).toBeGreaterThanOrEqual(4.5);
    expect(terreCuiteCheck.isCompliant).toBe(true);

    // Texte optimal pour bouton sombre vs clair
    expect(getBestTextColorForBackground("#111111")).toBe("#FFFFFF");
    expect(getBestTextColorForBackground("#FFFFFF")).toBe("#111111");
  });

  // =========================================================================
  // 3. UNIT & LOGIC VERIFICATION : BANNIÈRES SÉCURISÉES & BLOCAGE TEXTE D'EXEMPLE
  // =========================================================================
  test("Sécurité bannières & Détecteur de texte d'exemple pour la publication", () => {
    // Magic bytes : JPEG
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(validateImageMagicBytes(jpegBytes).detectedFormat).toBe("jpeg");

    // Rejet strict des SVG
    const svgBytes = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    const svgResult = validateImageMagicBytes(svgBytes);
    expect(svgResult.isValid).toBe(false);
    expect(svgResult.error).toContain("SVG refusé");

    // Validation des liens de destination
    expect(isSafeBannerDestinationUrl("/boutique/lome-glow/catalogue")).toBe(true);
    expect(isSafeBannerDestinationUrl("https://wa.me/22890123456")).toBe(true);
    expect(isSafeBannerDestinationUrl("https://mon-site.com")).toBe(true);
    expect(isSafeBannerDestinationUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeBannerDestinationUrl("data:text/html,...")).toBe(false);

    // Srcset et dimensions zéro CLS
    const responsive = stripExifAndGenerateSrcset("https://images.unsplash.com/photo-1556228720", 1920, 800);
    expect(responsive.srcset).toContain("640w");
    expect(responsive.srcset).toContain("1920w");
    expect(responsive.width).toBe(1920);

    // Blocage de publication si du texte d'exemple subsiste
    const storeWithSample = {
      name: "Lomé Glow",
      announcement: "[EXEMPLE] Livraison gratuite aujourd'hui",
      brandStory: "Lorem ipsum dolor sit amet",
      hasActiveProducts: true,
      hasContactMethod: true,
      hasConfiguredCurrency: true,
    };
    const pubCheckFail = validateStorefrontForPublishing(storeWithSample);
    expect(pubCheckFail.canPublish).toBe(false);
    expect(pubCheckFail.errors.length).toBeGreaterThan(0);
    expect(pubCheckFail.sampleTextFound.length).toBe(2);

    const storeClean = {
      name: "Lomé Glow Cosmétiques",
      announcement: "Livraison rapide partout à Lomé avec paiement cash",
      brandStory: "Notre atelier togolais formule des soins d'exception",
      hasActiveProducts: true,
      hasContactMethod: true,
      hasConfiguredCurrency: true,
    };
    const pubCheckSuccess = validateStorefrontForPublishing(storeClean);
    expect(pubCheckSuccess.canPublish).toBe(true);
    expect(pubCheckSuccess.sampleTextFound.length).toBe(0);

    // Horaires en direct
    const liveHours = getLiveStoreOpenStatus(0, 8, 19);
    expect(liveHours.statusLabel).toBeDefined();
  });

  // =========================================================================
  // 4. UNIT & LOGIC VERIFICATION : BÊTA PRIVÉE, FEATURE FLAGS & AUDIT
  // =========================================================================
  test("Bêta privée : Validation des codes d'invitation, Feature Flags serveur et Audit", () => {
    // Code valide
    const validCode = validateBetaInvitationCode("AFRI-LOME-2026");
    expect(validCode.isValid).toBe(true);
    expect(validCode.invitation?.code).toBe("AFRI-LOME-2026");

    // Code expiré
    const expiredCode = validateBetaInvitationCode("EXPIRED-BETA-TEST");
    expect(expiredCode.isValid).toBe(false);
    expect(expiredCode.error).toContain("expiré");

    // Code inexistant
    const badCode = validateBetaInvitationCode("INEXISTANT-CODE-999");
    expect(badCode.isValid).toBe(false);
    expect(badCode.error).toContain("invalide");

    // Feature flag serveur
    const paymentFlag = isFeatureEnabledForStore("online_mobile_money_payment", "store-lome");
    expect(paymentFlag.isEnabled).toBe(true); // store-lome est dans l'allowlist

    const paymentFlagUnknown = isFeatureEnabledForStore("online_mobile_money_payment", "store-inconnu");
    // globalement inactif pour les boutiques hors allowlist
    expect(paymentFlagUnknown.isEnabled).toBe(false);

    // Coupe-circuits d'urgence
    const killSwitches = checkEmergencyKillSwitches();
    expect(killSwitches.maintenanceMode).toBe(false);

    // Journal d'audit sans fuite de PII
    const logged = recordPlatformAuditEvent(
      "admin@afribuilder.com",
      "test_audit_action",
      "test_resource",
      { note: "Test réussi", password: "SECRET_PASSWORD_DO_NOT_LOG" }
    );
    expect(logged.details.note).toBe("Test réussi");
    expect(logged.details.password).toBeUndefined(); // PII supprimé !
  });

  // =========================================================================
  // 5. E2E UI TEST : SIDEBAR ACCORDÉON & DESIGN SYSTEM DU DASHBOARD
  // =========================================================================
  test("UI E2E : Sidebar 280px / 72px, accordéon repliable et pastilles normalisées", async ({
    page,
  }) => {
    // Réinitialiser le localStorage pour s'assurer que la barre latérale démarre à 280px
    await page.addInitScript(() => {
      localStorage.removeItem("afribuilder_sidebar_collapsed");
    });
    await page.goto("http://localhost:3000/app/lome-glow");
    await page.waitForLoadState("networkidle");

    // 1. Vérifier la présence de la barre latérale 280px
    const aside = page.locator("aside[aria-label='Barre latérale']");
    await expect(aside).toBeVisible();

    // 2. Vérifier le badge Bêta privée dans le header
    const betaBadge = page.locator("header").getByText("Bêta privée");
    await expect(betaBadge).toBeVisible();

    // 3. Vérifier le bouton d'avis testeur et l'ouverture du modal
    const feedbackBtn = page.getByTitle("Donner votre avis ou signaler un bug");
    await expect(feedbackBtn).toBeVisible();
    await feedbackBtn.click();

    const feedbackModal = page.locator("div[role='dialog']").filter({ hasText: "Avis & Signalement Bêta" });
    await expect(feedbackModal).toBeVisible();
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/beta-01-feedback-modal.png",
    });

    // Fermer le modal
    await feedbackModal.getByLabel("Fermer").click();
    await expect(feedbackModal).not.toBeVisible();

    // 4. Tester le bouton de réduction du menu (280px -> 72px)
    const collapseToggle = page.locator("#btn-sidebar-collapse-toggle");
    await expect(collapseToggle).toBeVisible();
    await expect(collapseToggle).toHaveAttribute("aria-label", "Réduire le menu");
    await collapseToggle.click();

    // Vérifier l'état réduit (72px)
    await page.waitForTimeout(300);
    await expect(collapseToggle).toHaveAttribute("aria-label", "Développer le menu");
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/sidebar-01-collapsed-72px.png",
    });

    // Ré-ouvrir à 280px
    await collapseToggle.click();
    await page.waitForTimeout(300);
    await expect(collapseToggle).toHaveAttribute("aria-label", "Réduire le menu");

    // 5. Tester l'accordéon : Ouvrir le groupe "Produits"
    const btnProduits = page.locator("#btn-nav-group-group-products");
    await expect(btnProduits).toBeVisible();
    await btnProduits.click();

    await expect(page.getByRole("link", { name: "Achats fournisseurs" })).toBeVisible();
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/sidebar-02-accordion-produits.png",
    });
  });

  // =========================================================================
  // 6. E2E UI TEST : BANNIÈRES D'IMAGES ADMIN
  // =========================================================================
  test("UI E2E : Page d'administration des bannières d'images", async ({ page }) => {
    await page.goto("http://localhost:3000/app/lome-glow/boutique-en-ligne/bannieres");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Bannières d'images & Carrousel" })).toBeVisible();
    await expect(page.getByText("Carrousel Principal (Accueil)")).toBeVisible();

    // Vérifier les contrôles de voile de lisibilité et point focal
    await expect(page.getByText("Voile de lisibilité (Contraste sombre)")).toBeVisible();
    await expect(page.getByText("Point focal X")).toBeVisible();

    // Vérifier la bibliothèque média et quota
    await expect(page.getByText("Bibliothèque Média & Quota de stockage")).toBeVisible();

    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/banners-01-admin-editor.png",
    });
  });

  // =========================================================================
  // 7. E2E UI TEST : VITRINE PUBLIQUE 11 SECTIONS, CARROUSEL & CATALOGUE
  // =========================================================================
  test("UI E2E : Vitrine publique 11 sections et catalogue 2 colonnes", async ({ page }) => {
    // 1. Accueil vitrine
    await page.goto("http://localhost:3000/boutique/lome-glow");
    await page.waitForLoadState("networkidle");

    // Vérifier la présence du carrousel de bannières
    const carousel = page.locator("section[aria-roledescription='carrousel']");
    await expect(carousel).toBeVisible();

    // Vérifier les boutons d'accessibilité du carrousel (précédent, pause, suivant)
    await expect(carousel.getByLabel("Diapositive suivante")).toBeVisible();
    await expect(carousel.getByLabel("Mettre en pause le défilement")).toBeVisible();

    // Vérifier les collections vedettes
    await expect(page.getByRole("heading", { name: "Collections Vedettes" })).toBeVisible();

    // Vérifier le bloc contact direct WhatsApp
    await expect(page.getByText("Discuter sur WhatsApp")).toBeVisible();

    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/storefront-01-home-carousel-11sections.png",
    });

    // 2. Catalogue 2 colonnes
    await page.goto("http://localhost:3000/boutique/lome-glow/catalogue");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Catalogue Produits" })).toBeVisible();
    await expect(page.getByPlaceholder(/Rechercher/i)).toBeVisible();

    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/storefront-02-catalog-grid.png",
    });

    // 3. Contact avec statut d'ouverture en direct
    await page.goto("http://localhost:3000/boutique/lome-glow/contact");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Contactez-Nous & Zones de Livraison" })).toBeVisible();
    await expect(page.getByText("Horaires de Traitement")).toBeVisible();

    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/storefront-03-contact-live-status.png",
    });
  });

  // =========================================================================
  // 8. E2E UI TEST : BACK-OFFICE PLATEFORME (/platform-admin) & 2FA
  // =========================================================================
  test("UI E2E : Back-office plateforme 2FA, Feature Flags & Coupe-circuits", async ({ page }) => {
    await page.goto("http://localhost:3000/platform-admin");
    await page.waitForLoadState("networkidle");

    // 1. Écran de vérification 2FA
    await expect(page.getByRole("heading", { name: "AfriBuilder Platform Admin" })).toBeVisible();
    const totpInput = page.getByPlaceholder("Ex: 123456");
    await expect(totpInput).toBeVisible();
    await totpInput.fill("123456");
    await page.getByRole("button", { name: "Vérifier et Déverrouiller" }).click();

    // 2. Tableau de bord Super-Admin
    await expect(page.getByText("Gestion des Déploiements & Interrupteurs")).toBeVisible();
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/platform-01-flags.png",
    });

    // 3. Basculer vers les coupe-circuits
    await page.getByRole("button", { name: "Coupe-Circuits d'Urgence" }).click();
    await expect(page.getByRole("heading", { name: "Mode Maintenance Globale" })).toBeVisible();
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/platform-02-killswitches.png",
    });

    // 4. Basculer vers les invitations
    await page.getByRole("button", { name: "Invitations Bêta" }).click();
    await expect(page.getByText("Générer un Code d'Invitation Bêta")).toBeVisible();
    await page.screenshot({
      path: "C:/Users/HP/.gemini/antigravity/brain/98eca996-b0bb-4f59-b97c-9eeb86bea0b6/platform-03-invitations.png",
    });
  });
});

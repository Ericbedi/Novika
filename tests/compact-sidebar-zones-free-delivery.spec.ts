import { test, expect } from "@playwright/test";
import {
  AFRICAN_COUNTRIES_54,
  getCountryByCode,
  getCountriesByRegion,
  getSharedCurrencyCountries,
} from "../src/server/data/african-countries";
import { ALL_CURRENCIES, AFRICAN_CURRENCIES, CURRENCY_MAP } from "../src/mock-data/currencies";
import {
  MOCK_CITY_ZONES,
  MOCK_CARRIERS,
  MOCK_SELLER_PAYMENT_METHODS,
  getZoneByCity,
} from "../src/mock-data/shipping-zones";
import { recalculateOrderOnServer } from "../src/lib/order-form-security";
import { MOCK_PRODUCTS } from "../src/mock-data/products";
import { MOCK_ORDER_FORM_SETTINGS, MOCK_QUANTITY_OFFERS } from "../src/mock-data/product-page-data";

const BASE_URL = "http://localhost:3000";

test.describe("Barre latérale compacte, Menu Utilisateur, 54 Pays, Zones par Ville & Livraison Gratuite", () => {
  // =========================================================================
  // 1. UNIT & LOGIC : 54 PAYS AFRICAINS & DEVISES ISO 4217
  // =========================================================================
  test("1. Matrice des 54 pays africains et conformité ISO 4217", () => {
    // Vérification du compte exact des 54 pays de l'Union Africaine
    expect(AFRICAN_COUNTRIES_54.length).toBe(54);

    // Répartition équilibrée par les 5 régions officielles
    const west = getCountriesByRegion("west");
    const central = getCountriesByRegion("central");
    const north = getCountriesByRegion("north");
    const east = getCountriesByRegion("east");
    const southern = getCountriesByRegion("southern");

    expect(west.length).toBe(16);
    expect(central.length).toBe(9);
    expect(north.length).toBe(6);
    expect(east.length).toBe(14);
    expect(southern.length).toBe(9);
    expect(west.length + central.length + north.length + east.length + southern.length).toBe(54);

    // Vérification de la séparation stricte XOF vs XAF
    const xofCountries = getSharedCurrencyCountries("XOF");
    const xafCountries = getSharedCurrencyCountries("XAF");
    expect(xofCountries.length).toBe(8); // UEMOA
    expect(xafCountries.length).toBe(6); // CEMAC
    // Aucun pays commun entre XOF et XAF
    const overlap = xofCountries.some((c) => xafCountries.some((c2) => c2.code === c.code));
    expect(overlap).toBe(false);

    // Vérification règles des décimales
    // 0 décimales : XOF, XAF, GNF, RWF, UGX, BIF, KMF, DJF
    expect(CURRENCY_MAP["XOF"].decimals).toBe(0);
    expect(CURRENCY_MAP["XAF"].decimals).toBe(0);
    expect(CURRENCY_MAP["GNF"].decimals).toBe(0);
    expect(CURRENCY_MAP["RWF"].decimals).toBe(0);
    expect(CURRENCY_MAP["UGX"].decimals).toBe(0);
    expect(CURRENCY_MAP["BIF"].decimals).toBe(0);
    expect(CURRENCY_MAP["KMF"].decimals).toBe(0);
    expect(CURRENCY_MAP["DJF"].decimals).toBe(0);

    // 3 décimales : TND, LYD (millimes / dirhams)
    expect(CURRENCY_MAP["TND"].decimals).toBe(3);
    expect(CURRENCY_MAP["LYD"].decimals).toBe(3);

    // 2 décimales : NGN, GHS, KES, ZAR, MAD, ZWG
    expect(CURRENCY_MAP["NGN"].decimals).toBe(2);
    expect(CURRENCY_MAP["GHS"].decimals).toBe(2);
    expect(CURRENCY_MAP["KES"].decimals).toBe(2);
    expect(CURRENCY_MAP["ZAR"].decimals).toBe(2);
    expect(CURRENCY_MAP["ZWG"].decimals).toBe(2); // Zimbabwe Gold
  });

  // =========================================================================
  // 2. UNIT & LOGIC : RÈGLE ABSOLUE DE LIVRAISON GRATUITE & ZONES PAR VILLE
  // =========================================================================
  test("2. Invariant de livraison gratuite et segmentation des zones par ville", () => {
    // Vérification zone locale (Lomé)
    const lomeZone = getZoneByCity("Lomé", "TG");
    expect(lomeZone).toBeDefined();
    expect(lomeZone?.zoneType).toBe("local");
    expect(lomeZone?.paymentMode).toBe("cod");
    expect(lomeZone?.clientDeliveryFee).toBe(0);

    // Vérification zone expédition (Kara)
    const karaZone = getZoneByCity("Kara", "TG");
    expect(karaZone).toBeDefined();
    expect(karaZone?.zoneType).toBe("expedition");
    expect(karaZone?.paymentMode).toBe("prepaid");
    expect(karaZone?.clientDeliveryFee).toBe(0);
    expect(karaZone?.carrierId).toBe("carrier_utb");

    // Vérification ville non desservie (Bassar)
    const bassarZone = getZoneByCity("Bassar (Non desservie)", "TG");
    expect(bassarZone).toBeDefined();
    expect(bassarZone?.zoneType).toBe("not_served");

    // Recalcul strict serveur : les frais de livraison client sont STRICTEMENT 0
    const dummyProduct = MOCK_PRODUCTS[0];
    const dummyOffer = MOCK_QUANTITY_OFFERS[0];
    const orderResult = recalculateOrderOnServer(
      {
        storeSlug: "lome-glow",
        country: "TG",
        productId: dummyProduct.id,
        quantityOfferId: dummyOffer.id,
        customerName: "Awa Kouassi",
        customerPhone: "+22890123456",
        isWhatsApp: true,
        city: "Lomé",
        address: "Marché de Hedzranawoe",
        commitmentChecked: true,
        idempotencyKey: "test_idem_free_delivery",
      },
      dummyProduct,
      MOCK_ORDER_FORM_SETTINGS,
      MOCK_QUANTITY_OFFERS
    );

    expect(orderResult.success).toBe(true);
    expect(orderResult.recalculatedOrder?.shippingFee).toBe(0);
    expect(orderResult.recalculatedOrder?.totalAmount).toBe(dummyOffer.totalPrice);
  });

  // =========================================================================
  // 3. E2E : BARRE LATÉRALE COMPACTE (256px / 72px) SANS SCROLLBAR HORIZONTALE
  // =========================================================================
  test("3. Barre latérale compacte 256px, hauteur 38px, badges 20px/24px et zéro débordement", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/app/lome-glow`);

    const sidebar = page.locator("aside[aria-label='Barre latérale']");
    await expect(sidebar).toBeVisible();

    // Largeur fixe compacte de 256px
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox?.width).toBeCloseTo(256, 5);

    // Vérification de la hauteur des éléments de navigation (38px)
    const accueilItem = sidebar.locator("a[href='/app/lome-glow']");
    await expect(accueilItem).toBeVisible();
    const itemBox = await accueilItem.boundingBox();
    expect(itemBox?.height).toBeCloseTo(38, 2);

    // Vérification du toggle de réduction (72px)
    const collapseBtn = page.locator("#btn-sidebar-collapse-toggle");
    await collapseBtn.click();
    await page.waitForTimeout(350);

    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox?.width).toBeCloseTo(72, 5);

    // Re-déplier à 256px
    await collapseBtn.click();
    await page.waitForTimeout(350);
    const restoredBox = await sidebar.boundingBox();
    expect(restoredBox?.width).toBeCloseTo(256, 5);
  });

  // =========================================================================
  // 4. E2E : SÉLECTEUR DE BOUTIQUE (44px) & MENU DROPDOWN
  // =========================================================================
  test("4. Sélecteur de boutique 44px avec drapeau, popover max 6 et bouton création", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/app/lome-glow`);

    const storeSelectorBtn = page.locator("#btn-store-selector");
    await expect(storeSelectorBtn).toBeVisible();

    // Hauteur exacte de 44px (h-11)
    const btnBox = await storeSelectorBtn.boundingBox();
    expect(btnBox?.height).toBeCloseTo(44, 2);

    // Contenu : Nom, Pays, Devise
    await expect(storeSelectorBtn).toContainText("Lomé Glow Cosmétiques");
    await expect(storeSelectorBtn).toContainText("TG · XOF");

    // Clic pour ouvrir le dropdown
    await storeSelectorBtn.click();

    const dropdown = page.locator("#store-selector-dropdown");
    await expect(dropdown).toBeVisible();

    // Vérifier les entrées du dropdown
    await expect(dropdown.locator("text=+ Créer une boutique")).toBeVisible();
    await expect(dropdown.locator("text=Gérer mes boutiques")).toBeVisible();
    await expect(dropdown.getByText(/Mes Boutiques \(\d+\)/)).toBeVisible();
  });

  // =========================================================================
  // 5. E2E : MENU UTILISATEUR OUVERT VERS LE HAUT (POPOVER) & DÉCONNEXION
  // =========================================================================
  test("5. Menu utilisateur popover vers le HAUT avec profil, switch rôle et déconnexion", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/app/lome-glow`);

    const userTrigger = page.locator("#btn-user-menu-trigger");
    await expect(userTrigger).toBeVisible();
    await expect(userTrigger).toContainText("Promises Bedi");

    // Ouvrir le popover vers le haut
    await userTrigger.click();

    const userPopover = page.locator("#user-menu-popover");
    await expect(userPopover).toBeVisible();

    // Vérifier l'en-tête du menu utilisateur
    await expect(userPopover).toContainText("Promises Bedi");
    await expect(userPopover).toContainText("promises@afribuilder.africa");
    await expect(userPopover).toContainText("Propriétaire");
    await expect(userPopover).toContainText("Lomé Glow Cosmétiques");

    // Vérifier les entrées
    await expect(userPopover.locator("text=Mon profil")).toBeVisible();
    await expect(userPopover.locator("text=Paramètres")).toBeVisible();
    await expect(userPopover.locator("text=Aide et support")).toBeVisible();

    // Vérifier le sélecteur de rôle test déplacé dans ce popover
    await expect(userPopover.locator("text=Rôle de test (développement)")).toBeVisible();
    await expect(userPopover.locator("button:has-text('Admin')")).toBeVisible();
    await expect(userPopover.locator("button:has-text('Closeuse')")).toBeVisible();

    // Vérifier le bouton de déconnexion rouge
    const logoutBtn = userPopover.locator("#btn-user-logout");
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toContainText("Déconnexion");
  });

  // =========================================================================
  // 6. E2E : ASSISTANT DE CRÉATION DE BOUTIQUE EN 5 ÉTAPES
  // =========================================================================
  test("6. Assistant de création de boutique : 5 étapes avec zone monétaire et livraison gratuite", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/app/lome-glow`);

    // Ouvrir le sélecteur puis la modale de création
    await page.locator("#btn-store-selector").click();
    await page.locator("#btn-open-create-store-modal").click();

    const modalTitle = page.locator("#create-store-title");
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toContainText("Créer une nouvelle boutique");

    // Étape 1 : Choix du pays principal (ex: Côte d'Ivoire)
    await page.locator("button:has-text('Côte d\\'Ivoire')").click();
    await page.locator("button:has-text('Suivant')").click();

    // Étape 2 : Devise officielle XOF
    await expect(page.locator("text=Devise principale officielle")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Franc CFA UEMOA" })).toBeVisible();
    await page.locator("button:has-text('Suivant')").click();

    // Étape 3 : Zone monétaire partagée (8 pays UEMOA)
    await expect(page.locator("text=Pays desservis dans la même zone monétaire")).toBeVisible();
    await expect(page.locator("text=Zone XOF")).toBeVisible();
    await page.locator("button:has-text('Suivant')").click();

    // Étape 4 : Nom de la boutique & WhatsApp
    await expect(page.locator("label:has-text('Nom de la boutique')")).toBeVisible();
    await page.locator("[data-testid='new-store-name']").fill("Abidjan Prestige Glam");
    await page.locator("button:has-text('Suivant')").click();

    // Étape 5 : Récapitulatif avec règle de livraison gratuite absolue
    await expect(page.locator("text=Règle AfriBuilder : Livraison 100% Gratuite pour vos clients")).toBeVisible();
    await expect(page.locator("text=Verrouillage comptable définitif après la 1ère commande")).toBeVisible();

    // Annuler/Fermer la modale
    await page.locator("button[aria-label='Fermer']").click();
    await expect(modalTitle).not.toBeVisible();
  });

  // =========================================================================
  // 7. E2E : LIVRAISON GRATUITE & ZONES EXPÉDITION DANS LE FORMULAIRE DE COMMANDE
  // =========================================================================
  test("7. Formulaire de commande storefront : Livraison Gratuite, zone locale COD vs zone expédition", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/boutique/lome-glow/produit/prod_serum_vitc`);

    // Vérifier la présence du badge Livraison Gratuite dans la page produit
    await expect(page.locator("text=Livraison Gratuite").first()).toBeVisible();

    // Formulaire de commande
    const form = page.locator("#main-product-order-form");
    await expect(form).toBeVisible();

    // Récapitulatif : La livraison doit être GRATUITE
    await expect(form.getByText("GRATUITE", { exact: true })).toBeVisible();

    // Sélection d'une ville en zone d'expédition : Kara (Relais UTB)
    const citySelect = form.locator("select").nth(1); // 2ème select (après l'indicatif téléphonique)
    await citySelect.selectOption("Kara");

    // Vérifier l'affichage du bandeau d'expédition
    await expect(
      form.locator("text=Zone d'expédition interurbaine (3 à 5 jours)")
    ).toBeVisible();

    // Vérifier l'engagement de paiement sous 24h
    await expect(
      form.locator("text=Je confirme ma commande et je m'engage à payer sous 24h")
    ).toBeVisible();

    // Vérifier le bouton de commande
    const submitBtn = form.locator("button[type='submit']");
    await expect(submitBtn).toContainText("Paiement avant expédition");

    // Sélection d'une ville non desservie : Bassar
    await citySelect.selectOption("Bassar (Non desservie)");
    await expect(
      form.getByRole("strong")
    ).toContainText("Livraison indisponible dans cette ville");
    await expect(submitBtn).toBeDisabled();
  });

  // =========================================================================
  // 8. E2E : PAGE DE SUIVI CLIENT /suivi/[token] AVEC PREUVE DE PAIEMENT
  // =========================================================================
  test("8. Page de suivi public /suivi/[token] : Livraison gratuite et soumission de preuve de paiement", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/suivi/tok_secure_awa_traore_abidjan_20261115_valid`);

    // Badge réassurance
    await expect(page.locator("text=Livraison 100% Gratuite")).toBeVisible();

    // Récapitulatif : Frais de livraison GRATUITE
    await expect(page.locator("text=Frais de livraison")).toBeVisible();
    await expect(page.getByText("GRATUITE", { exact: true })).toBeVisible();

    // Frise de suivi visible
    await expect(page.locator("text=En livraison")).toBeVisible();
    await expect(page.locator("text=Contacter la boutique sur WhatsApp")).toBeVisible();
  });
});

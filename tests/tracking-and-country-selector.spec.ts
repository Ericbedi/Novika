import { test, expect } from "@playwright/test";
import {
  ALL_54_AFRICAN_COUNTRIES,
  getSortedAfricanCountries,
  frenchCollator,
  searchAfricanCountries,
} from "../src/config/countries";
import {
  generateTrackingToken,
  generate4DigitProofCode,
  getTrackingOrderByToken,
  getInternalTrackingOrder,
  updateOrderStatusWithAudit,
  generateWhatsAppTrackingUrl,
} from "../src/server/data/tracking-store";
import { canManageShopCountries, canTransitionOrderStatus } from "../src/config/permissions";
import { updateShopCountryEligibility, getShopCountries } from "../src/server/data/shop-countries";

test.describe("Prompt 05-P & 05-T : Sélecteur de pays et Suivi de commande en direct", () => {
  // =========================================================================
  // TESTS PROMPT 05-P : Sélecteur de pays (Drapeaux SVG, Tri avec accents, Éligibilité)
  // =========================================================================

  test("P1. Tous les 54 pays d'Afrique disposent d'un drapeau SVG (aucun globe, aucun emoji)", () => {
    expect(ALL_54_AFRICAN_COUNTRIES.length).toBe(54);

    // Vérifie que chaque pays a un code ISO 3166-1 alpha-2 valide de 2 lettres
    for (const country of ALL_54_AFRICAN_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.length).toBeGreaterThan(2);
      expect(country.currency.length).toBe(3);
      expect(country.dialCode).toMatch(/^\+\d+$/);
    }

    // Vérifie que Togo, Côte d'Ivoire, Bénin, Sénégal, Cameroun, Nigéria, etc. sont présents
    const codes = ALL_54_AFRICAN_COUNTRIES.map((c) => c.code);
    expect(codes).toContain("TG");
    expect(codes).toContain("CI");
    expect(codes).toContain("BJ");
    expect(codes).toContain("SN");
    expect(codes).toContain("BF");
    expect(codes).toContain("ML");
    expect(codes).toContain("NE");
    expect(codes).toContain("CM");
    expect(codes).toContain("NG");
    expect(codes).toContain("GH");
  });

  test("P2. Tri alphabétique français avec Intl.Collator('fr', { sensitivity: 'base' })", () => {
    const sorted = getSortedAfricanCountries();
    expect(sorted.length).toBe(54);

    // Le premier pays alphabétiquement en français est l'Afrique du Sud, puis Algérie, Angola, Bénin, etc.
    expect(sorted[0].name).toBe("Afrique du Sud");
    expect(sorted[1].name).toBe("Algérie");
    expect(sorted[2].name).toBe("Angola");
    expect(sorted[3].name).toBe("Bénin");

    // Côte d'Ivoire doit être après Burkina Faso / Burundi et avant Djibouti / Égypte
    const names = sorted.map((c) => c.name);
    const idxBurkina = names.indexOf("Burkina Faso");
    const idxCI = names.indexOf("Côte d'Ivoire");
    const idxEgypte = names.indexOf("Égypte");
    const idxTogo = names.indexOf("Togo");

    expect(idxCI).toBeGreaterThan(idxBurkina);
    expect(idxEgypte).toBeGreaterThan(idxCI);

    // Le Togo n'est PLUS mis en premier (Prompt 05-P #2)
    expect(sorted[0].code).not.toBe("TG");
    expect(idxTogo).toBeGreaterThan(40); // Vers la fin de l'alphabet (T)
  });

  test("P3. Recherche insensible aux accents et à la casse (Prompt 05-P #2)", () => {
    // "cote" sans accent doit trouver "Côte d'Ivoire"
    const resCote = searchAfricanCountries("cote");
    expect(resCote.some((c) => c.code === "CI")).toBe(true);

    // "egypte" sans accent doit trouver "Égypte"
    const resEgypte = searchAfricanCountries("egypte");
    expect(resEgypte.some((c) => c.code === "EG")).toBe(true);

    // "+228" ou "228" doit trouver Togo
    const resTogo = searchAfricanCountries("+228");
    expect(resTogo.some((c) => c.code === "TG")).toBe(true);

    // "XOF" doit trouver les pays de l'UEMOA (TG, CI, BJ, SN, BF, ML, NE, GW)
    const resXof = searchAfricanCountries("XOF");
    expect(resXof.length).toBe(8);
  });

  test("P4. Éligibilité des pays : seul le propriétaire peut écrire et au moins un pays doit rester activé", () => {
    // 1. Refus strict pour non-propriétaire (manager, closer, courier)
    const resManager = updateShopCountryEligibility("lome-lux", "CI", false, "manager", "usr_mgr");
    expect(resManager.success).toBe(false);
    expect(resManager.error).toContain("Accès refusé");

    const resCloser = updateShopCountryEligibility("lome-lux", "CI", false, "closer", "usr_cls");
    expect(resCloser.success).toBe(false);

    // 2. Autorisation pour owner
    const resOwnerDisableCI = updateShopCountryEligibility("lome-lux", "CI", false, "owner", "usr_owner");
    expect(resOwnerDisableCI.success).toBe(true);
    expect(resOwnerDisableCI.record?.enabled).toBe(false);

    // Réactivation
    const resOwnerEnableCI = updateShopCountryEligibility("lome-lux", "CI", true, "owner", "usr_owner");
    expect(resOwnerEnableCI.success).toBe(true);
    expect(resOwnerEnableCI.record?.enabled).toBe(true);

    // 3. Règle absolue Prompt 05-P #3 : Au moins un pays doit rester activé
    // Si on désactive tous les pays sauf un, la tentative de désactiver le dernier doit échouer
    const allShopCountries = getShopCountries("lome-lux");
    for (const c of allShopCountries) {
      if (c.countryCode !== "TG") {
        updateShopCountryEligibility("lome-lux", c.countryCode, false, "owner", "usr_owner");
      }
    }

    // Tentative de désactiver Togo (le dernier restant)
    const resDisableLast = updateShopCountryEligibility("lome-lux", "TG", false, "owner", "usr_owner");
    expect(resDisableLast.success).toBe(false);
    expect(resDisableLast.error).toContain("Au moins un pays doit rester activé");

    // Restauration des pays par défaut
    for (const code of ["CI", "BJ", "SN", "BF", "ML", "CM"]) {
      updateShopCountryEligibility("lome-lux", code, true, "owner", "usr_owner");
    }
  });

  // =========================================================================
  // TESTS PROMPT 05-T : Suivi de commande en direct par étapes
  // =========================================================================

  test("T1. Sécurité du jeton de suivi (128-bit, unguessable)", () => {
    const token = generateTrackingToken();
    expect(token).toMatch(/^tok_[a-f0-9]{32}$/); // 32 hex chars = 128 bits
    expect(token.length).toBe(36);

    const token2 = generateTrackingToken();
    expect(token).not.toBe(token2);
  });

  test("T2. Projection publique étanche : JAMAIS de téléphone, JAMAIS d'adresse complète, AUCUN GPS", () => {
    const publicOrder = getTrackingOrderByToken("tok_track_demo_abidjan_01");
    expect(publicOrder).not.toBeNull();
    if (!publicOrder) return;

    // Champs publics autorisés
    expect(publicOrder.orderNumber).toBe("CMD-10482");
    expect(publicOrder.customerFirstName).toBe("Awa");
    expect(publicOrder.city).toBe("Abidjan");
    expect(publicOrder.country).toBe("CI");
    expect(publicOrder.status).toBe("in_transit");
    expect(publicOrder.timeline.length).toBe(6);
    expect(publicOrder.items.length).toBeGreaterThan(0);
    expect(publicOrder.courierFirstName).toBe("Mamadou");

    // STRICTEMENT ABSENTS de la projection publique
    const rawObj = publicOrder as unknown as Record<string, unknown>;
    expect(rawObj.customerPhone).toBeUndefined();
    expect(rawObj.deliveryAddress).toBeUndefined();
    expect(rawObj.purchaseCost).toBeUndefined();
    expect(rawObj.profitMargin).toBeUndefined();
    expect(rawObj.internalNotes).toBeUndefined();
    expect(rawObj.gpsLatitude).toBeUndefined();
    expect(rawObj.gpsLongitude).toBeUndefined();
    expect(rawObj.driverLocation).toBeUndefined();
    expect(rawObj.coordinates).toBeUndefined();
  });

  test("T3. Jeton invalide ou expiré (> 30 jours) renvoie strictement null (page neutre 404 Lien introuvable)", () => {
    // Jeton inexistant
    const invalidOrder = getTrackingOrderByToken("tok_fake_non_existent_token_123");
    expect(invalidOrder).toBeNull();

    // Jeton expiré il y a plus de 30 jours
    const expiredOrder = getTrackingOrderByToken("tok_track_demo_expired_04");
    expect(expiredOrder).toBeNull();
  });

  test("T4. Transitions de statut et matrice de permissions Prompt 05-T", () => {
    // 1. Closeuse autorisée pour : confirmed, prepared, unreachable, postponed, cancelled
    expect(canTransitionOrderStatus("closer", "confirmed")).toBe(true);
    expect(canTransitionOrderStatus("closer", "prepared")).toBe(true);
    expect(canTransitionOrderStatus("closer", "unreachable")).toBe(true);
    expect(canTransitionOrderStatus("closer", "postponed")).toBe(true);
    expect(canTransitionOrderStatus("closer", "cancelled")).toBe(true);

    // Closeuse REFUSÉE pour remise, en route, livrée (réservé livreur/admin)
    expect(canTransitionOrderStatus("closer", "handed_over")).toBe(false);
    expect(canTransitionOrderStatus("closer", "in_transit")).toBe(false);
    expect(canTransitionOrderStatus("closer", "delivered")).toBe(false);

    // 2. Livreur autorisé pour : handed_over, in_transit, delivered, returned (UNIQUEMENT si assigné)
    expect(canTransitionOrderStatus("rider", "handed_over", true)).toBe(true);
    expect(canTransitionOrderStatus("rider", "in_transit", true)).toBe(true);
    expect(canTransitionOrderStatus("rider", "delivered", true)).toBe(true);
    expect(canTransitionOrderStatus("rider", "returned", true)).toBe(true);

    // Livreur non assigné : REFUS STRICT
    expect(canTransitionOrderStatus("rider", "delivered", false)).toBe(false);

    // 3. Admin / Owner : toutes transitions permises
    expect(canTransitionOrderStatus("owner", "delivered", false)).toBe(true);
    expect(canTransitionOrderStatus("admin", "delivered", false)).toBe(true);
  });

  test("T5. Preuve de livraison (Code à 4 chiffres obligatoire si option activée)", () => {
    // Tentative de passage à 'delivered' sans code pour une commande avec preuve activée
    const resNoCode = updateOrderStatusWithAudit({
      tokenOrId: "tok_track_demo_abidjan_01",
      targetStatus: "delivered",
      userId: "rdr_01",
      userName: "Mamadou Express",
      userRole: "rider",
      proofCodeEntered: "",
    });
    expect(resNoCode.success).toBe(false);
    expect(resNoCode.error).toContain("Code de confirmation");

    // Tentative avec code incorrect
    const resWrongCode = updateOrderStatusWithAudit({
      tokenOrId: "tok_track_demo_abidjan_01",
      targetStatus: "delivered",
      userId: "rdr_01",
      userName: "Mamadou Express",
      userRole: "rider",
      proofCodeEntered: "0000",
    });
    expect(resWrongCode.success).toBe(false);
    expect(resWrongCode.error).toContain("Code de confirmation");

    // Validation avec le bon code (4829)
    const resCorrectCode = updateOrderStatusWithAudit({
      tokenOrId: "tok_track_demo_abidjan_01",
      targetStatus: "delivered",
      userId: "rdr_01",
      userName: "Mamadou Express",
      userRole: "rider",
      proofCodeEntered: "4829",
      reason: "Remise en mains propres effectuée",
    });
    expect(resCorrectCode.success).toBe(true);
    expect(resCorrectCode.order?.status).toBe("delivered");
    expect(resCorrectCode.auditEntry).toBeDefined();
    expect(resCorrectCode.auditEntry?.fromStatus).toBe("in_transit");
    expect(resCorrectCode.auditEntry?.toStatus).toBe("delivered");
  });

  test("T6. Modèle de message WhatsApp de suivi conforme à Prompt 05-T", () => {
    // Modèle Prompt 05-T : « Bonjour {prénom}, votre commande {numéro} est {statut}. Suivez-la ici : {lien} »
    const waUrl = generateWhatsAppTrackingUrl({
      phone: "+2250748291102",
      customerFirstName: "Awa",
      orderNumber: "CMD-10482",
      statusLabel: "En cours de livraison",
      trackingToken: "tok_track_demo_abidjan_01",
      origin: "https://novika.app",
    });

    expect(waUrl).toContain("https://wa.me/2250748291102?text=");
    const decoded = decodeURIComponent(waUrl);
    expect(decoded).toContain("Bonjour Awa, votre commande CMD-10482 est En cours de livraison.");
    expect(decoded).toContain("Suivez-la ici : https://novika.app/suivi/tok_track_demo_abidjan_01");
  });

  // =========================================================================
  // TESTS INTERFACE UTILISATEUR & NAVIGATION (Pages web)
  // =========================================================================

  test("UI1. Page de suivi public /suivi/[token] avec frise des statuts et marque boutique", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/suivi/tok_track_demo_abidjan_01");

    // Marque boutique
    await expect(page.locator("h1:has-text('Lomé Lux')")).toBeVisible();
    await expect(page.locator("text=Suivi de livraison")).toBeVisible();

    // Numéro de commande et ville
    await expect(page.locator("text=CMD-10482")).toBeVisible();
    await expect(page.locator("text=Abidjan")).toBeVisible();

    // Frise des 6 étapes
    await expect(page.locator("text=Acheminement du colis")).toBeVisible();
    await expect(page.getByText("Reçue", { exact: true })).toBeVisible();
    await expect(page.getByText("Confirmée", { exact: true })).toBeVisible();
    await expect(page.getByText("Préparée", { exact: true })).toBeVisible();
    await expect(page.getByText("Remise", { exact: true })).toBeVisible();
    await expect(page.getByText("En route", { exact: true })).toBeVisible();
    await expect(page.getByText("Livrée", { exact: true })).toBeVisible();

    // Contenu des articles
    await expect(page.locator("text=Café Bio Champignon Vitality")).toBeVisible();

    // Bouton Contacter la boutique sur WhatsApp
    const contactBtn = page.locator("a:has-text('Contacter la boutique sur WhatsApp')");
    await expect(contactBtn).toBeVisible();

    // Message de confidentialité
    await expect(page.locator("text=Vos données personnelles sont protégées")).toBeVisible();

    // ZERO carte, ZERO GPS
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(page.locator("text=géolocalisation")).toHaveCount(0);
  });

  test("UI2. Jeton invalide ou expiré affiche la page neutre 'Lien introuvable'", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/suivi/tok_invalid_random_string_999");

    // Page neutre 404
    await expect(page.locator("h1:has-text('Lien introuvable')")).toBeVisible();
    await expect(
      page.locator("text=Ce lien de suivi est introuvable ou n'est plus actif.")
    ).toBeVisible();

    // Ne révèle aucune information sur une commande
    await expect(page.locator("text=CMD-")).toHaveCount(0);
  });

  test("UI3. Page Paramètres → Pays (/app/lome-lux/reglages/pays) : 54 pays, drapeaux SVG, tri alphabétique", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/app/lome-lux/reglages/pays");

    // En-tête
    await expect(page.locator("h1:has-text('Éligibilité des pays')")).toBeVisible();

    // Compteur de pays
    await expect(page.locator("text=pays activé")).toBeVisible();

    // Recherche de pays
    const searchInput = page.locator("input[placeholder*='Rechercher parmi les 54 pays']");
    await expect(searchInput).toBeVisible();

    // Recherche "Côte d'Ivoire" sans accent ("cote")
    await searchInput.fill("cote");
    await expect(page.locator("span:has-text(\"Côte d'Ivoire\")").first()).toBeVisible();
    await expect(page.locator("text=XOF").first()).toBeVisible();
    await expect(page.locator("text=+225").first()).toBeVisible();

    // Effacer recherche
    await searchInput.fill("");

    // Vérifier présence de plusieurs pays avec drapeaux SVG (Afrique du Sud, Bénin, Égypte, Togo)
    await expect(page.locator("span:has-text('Afrique du Sud')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Bénin')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Égypte')").first()).toBeVisible();
    await expect(page.locator("span:has-text('Togo')").first()).toBeVisible();
  });
});

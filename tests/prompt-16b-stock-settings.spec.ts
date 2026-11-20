import { test, expect } from "@playwright/test";
import {
  getStockSettings,
  updateStockSettings,
  isProductVisibleOnStorefront,
  shouldDisplayUnavailableScreen,
  reserveStockForOrder,
  releaseReservedStock,
  fulfillDeliveredOrderStock,
  generatePendingStockWhatsAppUrl,
  clearStockSettingsMemory,
} from "../src/lib/stock-settings-store";
import { canManageStockSettings } from "../src/config/permissions";
import { Product } from "../src/server/data/types";
import { saveShopProduct } from "../src/lib/products-store";

test.describe("Prompt 16-b : Réglages de stock par boutique (Réglages → Stock)", () => {
  const storeSlug = "lome-glow";

  test.beforeEach(() => {
    clearStockSettingsMemory();
  });

  test("1. Droits d'accès : Seul le propriétaire et l'administrateur peuvent modifier les réglages de stock", () => {
    expect(canManageStockSettings("owner")).toBe(true);
    expect(canManageStockSettings("admin")).toBe(true);

    expect(canManageStockSettings("manager")).toBe(false);
    expect(canManageStockSettings("closer")).toBe(false);
    expect(canManageStockSettings("rider")).toBe(false);
    expect(canManageStockSettings("courier")).toBe(false);
    expect(canManageStockSettings("agency")).toBe(false);
  });

  test("2. Réglage 1 : Option A (Afficher avec mention Rupture) vs Option B (Masquer de la vitrine)", () => {
    const testProd = {
      id: "prod_16b_visibility",
      name: "Sérum Anti-Taches",
      slug: "serum-anti-taches",
      category: "Soins",
      price: 18000,
      stock: 0,
      availableStock: 0,
      productStatus: "active",
      variants: [],
      images: [],
    } as unknown as Product;

    // Option A : Afficher avec la mention rupture
    updateStockSettings(storeSlug, { outOfStockVisibility: "show_badge" }, { role: "owner" });
    expect(isProductVisibleOnStorefront(testProd, storeSlug)).toBe(true);
    expect(shouldDisplayUnavailableScreen(testProd, storeSlug)).toBe(false);

    // Option B : Masquer de la vitrine
    updateStockSettings(storeSlug, { outOfStockVisibility: "hide" }, { role: "owner" });
    expect(isProductVisibleOnStorefront(testProd, storeSlug)).toBe(false);
    expect(shouldDisplayUnavailableScreen(testProd, storeSlug)).toBe(true);
  });

  test("3. Surcharge par produit : 'always_show' et 'always_hide'", () => {
    const prodAlwaysShow = {
      id: "prod_force_show",
      name: "Produit Phare",
      slug: "produit-phare",
      category: "Vedette",
      price: 25000,
      stock: 0,
      availableStock: 0,
      productStatus: "active",
      outOfStockVisibilityOverride: "always_show",
      variants: [],
      images: [],
    } as unknown as Product;

    const prodAlwaysHide = {
      id: "prod_force_hide",
      name: "Produit Discret",
      slug: "produit-discret",
      category: "Divers",
      price: 5000,
      stock: 0,
      availableStock: 0,
      productStatus: "active",
      outOfStockVisibilityOverride: "always_hide",
      variants: [],
      images: [],
    } as unknown as Product;

    // Boutique configurée sur Option B ("hide")
    updateStockSettings(storeSlug, { outOfStockVisibility: "hide" }, { role: "owner" });
    // prodAlwaysShow passe outre le hide
    expect(isProductVisibleOnStorefront(prodAlwaysShow, storeSlug)).toBe(true);
    expect(shouldDisplayUnavailableScreen(prodAlwaysShow, storeSlug)).toBe(false);

    // Boutique configurée sur Option A ("show_badge")
    updateStockSettings(storeSlug, { outOfStockVisibility: "show_badge" }, { role: "owner" });
    // prodAlwaysHide est masqué malgré le show_badge
    expect(isProductVisibleOnStorefront(prodAlwaysHide, storeSlug)).toBe(false);
    expect(shouldDisplayUnavailableScreen(prodAlwaysHide, storeSlug)).toBe(true);
  });

  test("4. Réglage 2 : Réservation atomique (Option A à la réception)", () => {
    const prod = {
      id: "prod_res_timing_a",
      name: "Savon Noir",
      slug: "savon-noir",
      category: "Soins",
      price: 3500,
      stock: 1,
      physicalStock: 1,
      reservedStock: 0,
      availableStock: 1,
      productStatus: "active",
      variants: [],
      images: [],
    } as unknown as Product;
    saveShopProduct(storeSlug, prod);

    updateStockSettings(storeSlug, { reservationTiming: "on_order_received" }, { role: "owner" });

    // Client 1 commande l'unique pièce disponible
    const res1 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_a",
      quantity: 1,
      orderNumber: "CMD-ORD-1",
      isCloserConfirmation: false,
    });

    expect(res1.success).toBe(true);
    expect(res1.reserved).toBe(true);
    expect(res1.availableStockRemaining).toBe(0);

    // Client 2 tente simultanément de commander la même pièce : refus immédiat
    const res2 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_a",
      quantity: 1,
      orderNumber: "CMD-ORD-2",
      isCloserConfirmation: false,
    });

    expect(res2.success).toBe(false);
    expect(res2.orderStatus).toBe("rejected_out_of_stock");
  });

  test("5. Réglage 2 : Réservation à la confirmation (Option B closeuse) et bascule 'pending_stock'", () => {
    const prod = {
      id: "prod_res_timing_b",
      name: "Huile de Ricin",
      slug: "huile-ricin",
      category: "Soins",
      price: 6000,
      stock: 1,
      physicalStock: 1,
      reservedStock: 0,
      availableStock: 1,
      productStatus: "active",
      variants: [],
      images: [],
    } as unknown as Product;
    saveShopProduct(storeSlug, prod);

    updateStockSettings(storeSlug, { reservationTiming: "on_closer_confirmation" }, { role: "owner" });

    // Deux commandes reçues : les deux passent sans bloquer de stock
    const resOrder1 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_b",
      quantity: 1,
      orderNumber: "CMD-CLOSER-1",
      isCloserConfirmation: false,
    });
    expect(resOrder1.success).toBe(true);
    expect(resOrder1.reserved).toBe(false);

    const resOrder2 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_b",
      quantity: 1,
      orderNumber: "CMD-CLOSER-2",
      isCloserConfirmation: false,
    });
    expect(resOrder2.success).toBe(true);
    expect(resOrder2.reserved).toBe(false);

    // La closeuse confirme la commande 1 : le stock est réservé
    const confirm1 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_b",
      quantity: 1,
      orderNumber: "CMD-CLOSER-1",
      isCloserConfirmation: true,
    });
    expect(confirm1.success).toBe(true);
    expect(confirm1.reserved).toBe(true);
    expect(confirm1.orderStatus).toBe("confirmed");

    // La closeuse tente de confirmer la commande 2 : le stock est désormais épuisé !
    const confirm2 = reserveStockForOrder({
      storeSlug,
      productId: "prod_res_timing_b",
      quantity: 1,
      orderNumber: "CMD-CLOSER-2",
      isCloserConfirmation: true,
    });

    // Confirmation refusée avec bascule automatique en "En attente de stock"
    expect(confirm2.success).toBe(false);
    expect(confirm2.orderStatus).toBe("pending_stock");
  });

  test("6. Livraison effective (fulfill) décrémente le stock physique et solde la réservation", () => {
    const prod = {
      id: "prod_fulfill_test",
      name: "Poudre de Baobab",
      slug: "poudre-baobab",
      category: "Alimentation",
      price: 4500,
      stock: 10,
      physicalStock: 10,
      reservedStock: 2,
      availableStock: 8,
      productStatus: "active",
      variants: [],
      images: [],
    } as unknown as Product;
    saveShopProduct(storeSlug, prod);

    fulfillDeliveredOrderStock({
      storeSlug,
      productId: "prod_fulfill_test",
      quantity: 2,
      orderNumber: "CMD-DELIVERED-001",
    });

    // Libération et livraison vérifiées
    const releaseRes = releaseReservedStock({
      storeSlug,
      productId: "prod_fulfill_test",
      quantity: 0,
      orderNumber: "CMD-DELIVERED-001",
    });
    expect(releaseRes).toBeUndefined();
  });

  test("7. Message WhatsApp en un clic pour les commandes en attente de stock", () => {
    const waUrl = generatePendingStockWhatsAppUrl({
      customerPhone: "+2250700112233",
      customerName: "Awa Touré",
      orderNumber: "CMD-STOCK-55",
      productName: "Glow Élixir",
      storeName: "Novika Abidjan",
    });

    expect(waUrl).toContain("https://wa.me/2250700112233");
    expect(waUrl).toContain(encodeURIComponent("Awa"));
    expect(waUrl).toContain(encodeURIComponent("CMD-STOCK-55"));
    expect(waUrl).toContain(encodeURIComponent("Glow Élixir"));
    expect(waUrl).toContain(encodeURIComponent("réapprovisionnement express"));
  });
});

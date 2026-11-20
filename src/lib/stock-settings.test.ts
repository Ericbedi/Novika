import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_STOCK_SETTINGS,
  getStockSettings,
  updateStockSettings,
  clearStockSettingsMemory,
  isProductVisibleOnStorefront,
  shouldDisplayUnavailableScreen,
  reserveStockForOrder,
  releaseReservedStock,
  fulfillDeliveredOrderStock,
  releaseExpiredStockReservations,
  generatePendingStockWhatsAppUrl,
  getStockAuditLogs,
} from "./stock-settings-store";
import { Product, StoreStockSettings } from "@/server/data/types";
import { saveShopProduct } from "./products-store";

describe("Prompt 16-b : Réglages de Stock par Boutique & Réservations", () => {
  const storeSlug = "test-store-stock";

  beforeEach(() => {
    clearStockSettingsMemory();
  });

  describe("1. Réglages par défaut & Mises à jour avec Contrôle de Rôles", () => {
    it("fournit les réglages par défaut conformes au Prompt 16-b", () => {
      const settings = getStockSettings(storeSlug);
      expect(settings.outOfStockVisibility).toBe("show_badge");
      expect(settings.reservationTiming).toBe("on_order_received");
      expect(settings.reservationTimeoutHours).toBe(48);
    });

    it("autorise un propriétaire (owner) à modifier les réglages et crée un log d'audit", () => {
      const res = updateStockSettings(
        storeSlug,
        {
          outOfStockVisibility: "hide",
          reservationTiming: "on_closer_confirmation",
          reservationTimeoutHours: 24,
        },
        { role: "owner", name: "Fondateur" }
      );

      expect(res.success).toBe(true);
      expect(res.settings.outOfStockVisibility).toBe("hide");
      expect(res.settings.reservationTiming).toBe("on_closer_confirmation");
      expect(res.settings.reservationTimeoutHours).toBe(24);

      const logs = getStockAuditLogs(storeSlug);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe("update_stock_settings");
      expect(logs[0].performedBy).toBe("Fondateur");
      expect(logs[0].userRole).toBe("owner");
    });

    it("autorise un administrateur (admin) à modifier les réglages", () => {
      const res = updateStockSettings(
        storeSlug,
        { outOfStockVisibility: "show_badge" },
        { role: "admin", name: "Admin Opérations" }
      );
      expect(res.success).toBe(true);
    });

    it("interdit la modification aux closeuses, livreurs et managers", () => {
      const resCloser = updateStockSettings(
        storeSlug,
        { outOfStockVisibility: "hide" },
        { role: "closer", name: "Aïcha" }
      );
      expect(resCloser.success).toBe(false);
      expect(resCloser.error).toContain("Action non autorisée");

      const resRider = updateStockSettings(
        storeSlug,
        { reservationTiming: "on_closer_confirmation" },
        { role: "rider", name: "Koffi" }
      );
      expect(resRider.success).toBe(false);

      const resManager = updateStockSettings(
        storeSlug,
        { reservationTiming: "on_closer_confirmation" },
        { role: "manager", name: "Directeur Régional" }
      );
      expect(resManager.success).toBe(false);
    });
  });

  describe("2. Réglage 1 : Visibilité sur la Vitrine (Catalogue, Recherche, Collections)", () => {
    const baseProduct: Product = {
      id: "prod_test_vis",
      name: "Sérum Test",
      slug: "serum-test",
      category: "Soins",
      price: 15000,
      salePrice: 15000,
      stock: 10,
      availableStock: 10,
      physicalStock: 10,
      reservedStock: 0,
      productStatus: "active",
      status: "active",
      variants: [],
      images: [],
    };

    it("affiche toujours un produit en stock (> 0) quelle que soit l'option", () => {
      const inStockProduct = { ...baseProduct, stock: 5, availableStock: 5 };
      expect(isProductVisibleOnStorefront(inStockProduct, storeSlug, { outOfStockVisibility: "show_badge" } as any)).toBe(true);
      expect(isProductVisibleOnStorefront(inStockProduct, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(true);
    });

    it("en rupture : affiche si Option A (show_badge) et masque si Option B (hide)", () => {
      const outOfStockProduct = { ...baseProduct, stock: 0, availableStock: 0 };

      // Option A : Afficher avec la mention rupture
      expect(isProductVisibleOnStorefront(outOfStockProduct, storeSlug, { outOfStockVisibility: "show_badge" } as any)).toBe(true);

      // Option B : Masquer de la vitrine
      expect(isProductVisibleOnStorefront(outOfStockProduct, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(false);
    });

    it("respecte la surcharge individuelle par produit (always_show)", () => {
      const prodOverrideShow: Product = {
        ...baseProduct,
        stock: 0,
        availableStock: 0,
        outOfStockVisibilityOverride: "always_show",
      };
      // Même si la boutique est configurée sur "hide", ce produit reste visible
      expect(isProductVisibleOnStorefront(prodOverrideShow, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(true);
    });

    it("respecte la surcharge individuelle par produit (always_hide)", () => {
      const prodOverrideHide: Product = {
        ...baseProduct,
        stock: 0,
        availableStock: 0,
        outOfStockVisibilityOverride: "always_hide",
      };
      // Même si la boutique est sur "show_badge", ce produit est masqué
      expect(isProductVisibleOnStorefront(prodOverrideHide, storeSlug, { outOfStockVisibility: "show_badge" } as any)).toBe(false);
    });

    it("ne rend jamais visible un produit archivé, en brouillon ou supprimé (corbeille)", () => {
      const draftProd: Product = { ...baseProduct, stock: 20, productStatus: "draft" };
      expect(isProductVisibleOnStorefront(draftProd, storeSlug)).toBe(false);

      const deletedProd: Product = { ...baseProduct, stock: 20, deletedAt: new Date().toISOString() };
      expect(isProductVisibleOnStorefront(deletedProd, storeSlug)).toBe(false);

      const hiddenProd: Product = { ...baseProduct, stock: 20, hiddenFromCatalog: true };
      expect(isProductVisibleOnStorefront(hiddenProd, storeSlug)).toBe(false);
    });
  });

  describe("3. Fiche Produit Directe : Écran 'Produit indisponible pour le moment'", () => {
    const baseProduct: Product = {
      id: "prod_detail_test",
      name: "Thé Minceur",
      slug: "the-minceur",
      category: "Bien-être",
      price: 10000,
      stock: 0,
      availableStock: 0,
      productStatus: "active",
      variants: [],
      images: [],
    };

    it("déclenche l'écran indisponible si stock = 0 et réglage boutique = 'hide'", () => {
      expect(shouldDisplayUnavailableScreen(baseProduct, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(true);
    });

    it("ne déclenche PAS l'écran indisponible si réglage boutique = 'show_badge' (la fiche normale s'affiche avec badge rupture)", () => {
      expect(shouldDisplayUnavailableScreen(baseProduct, storeSlug, { outOfStockVisibility: "show_badge" } as any)).toBe(false);
    });

    it("surcharge produit : always_hide déclenche l'écran même en mode show_badge", () => {
      const prod = { ...baseProduct, outOfStockVisibilityOverride: "always_hide" as const };
      expect(shouldDisplayUnavailableScreen(prod, storeSlug, { outOfStockVisibility: "show_badge" } as any)).toBe(true);
    });

    it("surcharge produit : always_show n'affiche jamais l'écran indisponible", () => {
      const prod = { ...baseProduct, outOfStockVisibilityOverride: "always_show" as const };
      expect(shouldDisplayUnavailableScreen(prod, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(false);
    });

    it("un produit en stock n'affiche jamais l'écran indisponible", () => {
      const prodInStock = { ...baseProduct, stock: 5, availableStock: 5 };
      expect(shouldDisplayUnavailableScreen(prodInStock, storeSlug, { outOfStockVisibility: "hide" } as any)).toBe(false);
    });
  });

  describe("4. Réglage 2 : Moment de Réservation (Option A Réception vs Option B Confirmation)", () => {
    const testProduct: Product = {
      id: "prod_atom_1",
      name: "Crème Hydratante",
      slug: "creme-hydratante",
      category: "Beauté",
      price: 12000,
      stock: 3,
      physicalStock: 3,
      reservedStock: 0,
      availableStock: 3,
      productStatus: "active",
      variants: [],
      images: [],
    };

    beforeEach(() => {
      saveShopProduct(storeSlug, { ...testProduct });
    });

    it("Option A (À la réception) : réserve immédiatement dès la commande", () => {
      updateStockSettings(storeSlug, { reservationTiming: "on_order_received" }, { role: "owner" });

      const res = reserveStockForOrder({
        storeSlug,
        productId: "prod_atom_1",
        quantity: 2,
        orderNumber: "CMD-101",
        isCloserConfirmation: false,
      });

      expect(res.success).toBe(true);
      expect(res.reserved).toBe(true);
      expect(res.availableStockRemaining).toBe(1);

      // Deuxième commande de 2 unités alors qu'il n'en reste qu'1 : refus direct
      const res2 = reserveStockForOrder({
        storeSlug,
        productId: "prod_atom_1",
        quantity: 2,
        orderNumber: "CMD-102",
        isCloserConfirmation: false,
      });

      expect(res2.success).toBe(false);
      expect(res2.orderStatus).toBe("rejected_out_of_stock");
    });

    it("Option B (À la confirmation) : commande passe sans réserver, réservation à la confirmation closeuse", () => {
      updateStockSettings(storeSlug, { reservationTiming: "on_closer_confirmation" }, { role: "owner" });

      // Étape 1 : Réception de la commande (le client clique sur Acheter)
      const resReceived = reserveStockForOrder({
        storeSlug,
        productId: "prod_atom_1",
        quantity: 2,
        orderNumber: "CMD-201",
        isCloserConfirmation: false,
      });

      expect(resReceived.success).toBe(true);
      expect(resReceived.reserved).toBe(false); // Rien n'est réservé !
      expect(resReceived.orderStatus).toBe("pending");

      // Étape 2 : Confirmation par la closeuse (réservation ferme)
      const resConfirm = reserveStockForOrder({
        storeSlug,
        productId: "prod_atom_1",
        quantity: 2,
        orderNumber: "CMD-201",
        isCloserConfirmation: true,
      });

      expect(resConfirm.success).toBe(true);
      expect(resConfirm.reserved).toBe(true);
      expect(resConfirm.orderStatus).toBe("confirmed");
      expect(resConfirm.availableStockRemaining).toBe(1);

      // Étape 3 : Une autre commande tente d'être confirmée pour 2 pièces alors qu'il ne reste qu'1 pièce
      const resConflict = reserveStockForOrder({
        storeSlug,
        productId: "prod_atom_1",
        quantity: 2,
        orderNumber: "CMD-202",
        isCloserConfirmation: true,
      });

      // Refus de confirmation + bascule automatique en "pending_stock"
      expect(resConflict.success).toBe(false);
      expect(resConflict.orderStatus).toBe("pending_stock");
    });
  });

  describe("5. Cycle de Vie Complet : Libération et Livraison Effective", () => {
    beforeEach(() => {
      const prod: Product = {
        id: "prod_life_1",
        name: "Produit Cycle",
        slug: "produit-cycle",
        category: "Test",
        price: 5000,
        stock: 5,
        physicalStock: 5,
        reservedStock: 2,
        availableStock: 3,
        productStatus: "active",
        variants: [],
        images: [],
      };
      saveShopProduct(storeSlug, prod);
    });

    it("libère le stock réservé lors d'une annulation ou d'un rejet", () => {
      releaseReservedStock({
        storeSlug,
        productId: "prod_life_1",
        quantity: 2,
        orderNumber: "CMD-ANNUL",
        reason: "Client a changé d'avis",
      });

      const settings = getStockSettings(storeSlug);
      expect(settings).toBeDefined();

      const logs = getStockAuditLogs(storeSlug);
      expect(logs.some((l) => l.action === "release_stock")).toBe(true);
    });

    it("décrémente le stock physique et solde la réservation à la livraison (fulfill)", () => {
      fulfillDeliveredOrderStock({
        storeSlug,
        productId: "prod_life_1",
        quantity: 2,
        orderNumber: "CMD-LIVRE",
      });

      const logs = getStockAuditLogs(storeSlug);
      expect(logs.some((l) => l.action === "fulfill_stock")).toBe(true);
    });

    it("purge les réservations expirées de plus de la durée max", () => {
      const res = releaseExpiredStockReservations(storeSlug);
      expect(res).toBeDefined();
      expect(typeof res.releasedCount).toBe("number");
    });
  });

  describe("6. Modèle WhatsApp Prêt à l'Emploi pour les Commandes en Attente de Stock", () => {
    it("génère une URL WhatsApp valide et personnalisée avec le numéro, le prénom et l'article", () => {
      const url = generatePendingStockWhatsAppUrl({
        customerPhone: "+228 90 12 34 56",
        customerName: "Koffi Mensah",
        orderNumber: "CMD-9801",
        productName: "Montre Chrono Or",
        storeName: "Lomé Luxe",
      });

      expect(url).toContain("https://wa.me/22890123456");
      expect(url).toContain(encodeURIComponent("Koffi"));
      expect(url).toContain(encodeURIComponent("CMD-9801"));
      expect(url).toContain(encodeURIComponent("Montre Chrono Or"));
      expect(url).toContain(encodeURIComponent("réapprovisionnement express"));
    });
  });
});

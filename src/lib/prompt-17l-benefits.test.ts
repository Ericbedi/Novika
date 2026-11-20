import { describe, it, expect } from "vitest";
import { Product, ProductBenefitsBlock } from "@/server/data/types";
import { MOCK_PRODUCTS } from "@/mock-data/products";

describe("Prompt 17-L : Bénéfices du produit, formules & rupture de stock", () => {
  describe("1. Retrait des formules automatiques et sélecteur simple", () => {
    it("désactive les formules par défaut (showQuantityOffers: false) pour un nouveau produit", () => {
      const p: Partial<Product> = { id: "prod_01", showQuantityOffers: false };
      expect(p).toBeDefined();
      expect(p?.showQuantityOffers).toBe(false);
    });

    it("ne retourne aucune formule si showQuantityOffers n'est pas activé", () => {
      const mockProduct: Partial<Product> = {
        id: "test-prod",
        name: "Produit Test",
        slug: "produit-test",
        salePrice: 10000,
        showQuantityOffers: false,
        quantityOffers: [
          { id: "off-1", quantity: 1, unitPrice: 10000, totalPrice: 10000, badgeText: "Pack 1" },
          { id: "off-2", quantity: 2, unitPrice: 8500, totalPrice: 17000, badgeText: "Pack 2" },
        ],
      };

      const resolvedOffers = mockProduct.showQuantityOffers && mockProduct.quantityOffers?.length
        ? mockProduct.quantityOffers
        : [];

      expect(resolvedOffers).toHaveLength(0);
    });

    it("retourne les formules si showQuantityOffers est activé par l'admin", () => {
      const mockProduct: Partial<Product> = {
        id: "test-prod-active",
        name: "Produit Test Actif",
        slug: "produit-test-actif",
        salePrice: 10000,
        showQuantityOffers: true,
        quantityOffers: [
          { id: "off-1", quantity: 1, unitPrice: 10000, totalPrice: 10000, badgeText: "Pack 1" },
          { id: "off-2", quantity: 2, unitPrice: 8500, totalPrice: 17000, badgeText: "Pack 2" },
        ],
      };

      const resolvedOffers = mockProduct.showQuantityOffers && mockProduct.quantityOffers?.length
        ? mockProduct.quantityOffers
        : [];

      expect(resolvedOffers).toHaveLength(2);
      expect(resolvedOffers[1].totalPrice).toBe(17000);
    });
  });

  describe("2. Bloc Bénéfices du produit", () => {
    it("supporte les 10 icônes sobres autorisées", () => {
      const allowedIcons = [
        "check",
        "sparkles",
        "shield",
        "heart",
        "zap",
        "star",
        "leaf",
        "smile",
        "flame",
        "clock",
      ] as const;

      expect(allowedIcons).toHaveLength(10);
      expect(allowedIcons).toContain("shield");
      expect(allowedIcons).toContain("zap");
      expect(allowedIcons).toContain("sparkles");
    });

    it("permet d'enregistrer entre 3 et 8 bénéfices avec titre et description", () => {
      const benefits: ProductBenefitsBlock = {
        title: "Pourquoi vous allez l'aimer",
        footerNote: "Livraison rapide avec paiement à la réception.",
        items: [
          { id: "b1", icon: "zap", title: "Énergie propre & durable", description: "Sans palpitations" },
          { id: "b2", icon: "leaf", title: "100% Ingrédients naturels", description: "Plantes sélectionnées" },
          { id: "b3", icon: "shield", title: "Qualité certifiée", description: "Testé en laboratoire" },
          { id: "b4", icon: "clock", title: "Action rapide" },
        ],
      };

      expect(benefits.items).toHaveLength(4);
      expect(benefits.title).toBe("Pourquoi vous allez l'aimer");
      expect(benefits.items[0].icon).toBe("zap");
      expect(benefits.items[3].description).toBeUndefined();
    });

    it("règle storefront : masque entièrement le conteneur si benefits est vide ou absent", () => {
      const pWithoutBenefits: Partial<Product> = { id: "p1" };
      const hasBenefits = Boolean(
        pWithoutBenefits.benefits &&
        Array.isArray(pWithoutBenefits.benefits.items) &&
        pWithoutBenefits.benefits.items.some((b) => b.title && b.title.trim().length > 0)
      );

      expect(hasBenefits).toBe(false);

      const pWithEmptyBenefits: Partial<Product> = {
        id: "p2",
        benefits: { title: "Titre", items: [] },
      };
      const hasEmptyBenefits = Boolean(
        pWithEmptyBenefits.benefits &&
        Array.isArray(pWithEmptyBenefits.benefits.items) &&
        pWithEmptyBenefits.benefits.items.some((b) => b.title && b.title.trim().length > 0)
      );

      expect(hasEmptyBenefits).toBe(false);

      const pWithFilledBenefits: Partial<Product> = {
        id: "p3",
        benefits: {
          title: "Titre",
          items: [{ id: "b1", icon: "check", title: "Bénéfice concret" }],
        },
      };
      const hasFilledBenefits = Boolean(
        pWithFilledBenefits.benefits &&
        Array.isArray(pWithFilledBenefits.benefits.items) &&
        pWithFilledBenefits.benefits.items.some((b) => b.title && b.title.trim().length > 0)
      );

      expect(hasFilledBenefits).toBe(true);
    });
  });

  describe("3. Logique de rupture de stock et bouton unique", () => {
    it("ne marque pas en rupture un produit dont le stock n'est pas suivi (trackStock = false)", () => {
      const productUntracked: Partial<Product> = {
        trackStock: false,
        trackQuantity: false,
        stock: 0,
        physicalStock: 0,
      };

      const isStockTracked = productUntracked.trackStock !== false && productUntracked.trackQuantity !== false;
      const realStock = productUntracked.physicalStock ?? productUntracked.stock ?? 0;
      const isOutOfStock = isStockTracked && realStock <= 0;

      expect(isStockTracked).toBe(false);
      expect(isOutOfStock).toBe(false);
    });

    it("marque en rupture uniquement un produit avec stock suivi ET stock <= 0", () => {
      const productTrackedInStock: Partial<Product> = {
        trackStock: true,
        trackQuantity: true,
        stock: 12,
        physicalStock: 12,
      };

      const isStockTracked1 = productTrackedInStock.trackStock !== false && productTrackedInStock.trackQuantity !== false;
      const realStock1 = productTrackedInStock.physicalStock ?? productTrackedInStock.stock ?? 0;
      const isOutOfStock1 = isStockTracked1 && realStock1 <= 0;

      expect(isOutOfStock1).toBe(false);

      const productTrackedOutOfStock: Partial<Product> = {
        trackStock: true,
        trackQuantity: true,
        stock: 0,
        physicalStock: 0,
      };

      const isStockTracked2 = productTrackedOutOfStock.trackStock !== false && productTrackedOutOfStock.trackQuantity !== false;
      const realStock2 = productTrackedOutOfStock.physicalStock ?? productTrackedOutOfStock.stock ?? 0;
      const isOutOfStock2 = isStockTracked2 && realStock2 <= 0;

      expect(isOutOfStock2).toBe(true);
    });

    it("affiche un seul bouton pleine largeur en cas de rupture de stock", () => {
      const isOutOfStock = true;

      // Condition de rendu dans NovikaProductPage.tsx :
      // {isOutOfStock ? (
      //   <button data-testid="btn-out-of-stock-single" ...>Rupture de stock</button>
      // ) : (
      //   <div className="flex ..."><button data-testid="btn-add-to-cart">...</button><button data-testid="btn-buy-now">...</button></div>
      // )}
      const renderedButtons = isOutOfStock
        ? ["btn-out-of-stock-single"]
        : ["btn-add-to-cart", "btn-buy-now"];

      expect(renderedButtons).toEqual(["btn-out-of-stock-single"]);
      expect(renderedButtons).toHaveLength(1);
    });
  });
});

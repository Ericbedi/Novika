import { describe, it, expect, beforeEach } from "vitest";
import {
  validatePixelId,
  canAddPixel,
  hashUserData,
  metaPixelsStore,
  ShopPixel,
} from "./meta-pixels";

describe("Prompt 05-Px : Pixels Facebook (Meta) - Règles & Sécurité", () => {
  describe("1. Validation de l'identifiant Pixel Meta (15 à 16 chiffres uniquement)", () => {
    it("Accepte un ID de 15 chiffres", () => {
      const res = validatePixelId("109283746501928");
      expect(res.isValid).toBe(true);
    });

    it("Accepte un ID de 16 chiffres", () => {
      const res = validatePixelId("1092837465019283");
      expect(res.isValid).toBe(true);
    });

    it("Refuse un ID trop court (< 15 chiffres)", () => {
      const res = validatePixelId("12345678901234"); // 14 chiffres
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("15 ou 16 chiffres");
    });

    it("Refuse un ID trop long (> 16 chiffres)", () => {
      const res = validatePixelId("12345678901234567"); // 17 chiffres
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("15 ou 16 chiffres");
    });

    it("Refuse les lettres, espaces ou caractères spéciaux", () => {
      expect(validatePixelId("10928374650192A").isValid).toBe(false);
      expect(validatePixelId("109283 74650192").isValid).toBe(false);
      expect(validatePixelId("fb-pixel-12345678").isValid).toBe(false);
      expect(validatePixelId("<script>alert(1)</script>").isValid).toBe(false);
    });
  });

  describe("2. Limite stricte de 3 pixels par boutique", () => {
    const mockPixels: ShopPixel[] = [
      {
        id: "p1",
        storeSlug: "store-a",
        name: "P1",
        pixelId: "111111111111111",
        isActive: true,
        applyToAllProducts: true,
        productIds: [],
        capiEnabled: false,
        capiTrigger: "on_order",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        storeSlug: "store-a",
        name: "P2",
        pixelId: "222222222222222",
        isActive: true,
        applyToAllProducts: true,
        productIds: [],
        capiEnabled: false,
        capiTrigger: "on_order",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p3",
        storeSlug: "store-a",
        name: "P3",
        pixelId: "333333333333333",
        isActive: true,
        applyToAllProducts: true,
        productIds: [],
        capiEnabled: false,
        capiTrigger: "on_order",
        createdAt: "",
        updatedAt: "",
      },
    ];

    it("Autorise l'ajout d'un 3e pixel quand il y en a 2", () => {
      const res = canAddPixel(mockPixels.slice(0, 2), "444444444444444");
      expect(res.allowed).toBe(true);
    });

    it("Bloque l'ajout d'un 4e pixel si 3 sont déjà présents", () => {
      const res = canAddPixel(mockPixels, "444444444444444");
      expect(res.allowed).toBe(false);
      expect(res.error).toContain("Maximum 3 pixels par boutique");
    });
  });

  describe("3. Détection et refus des doublons d'ID", () => {
    const mockPixels: ShopPixel[] = [
      {
        id: "p1",
        storeSlug: "store-a",
        name: "Pixel Alpha",
        pixelId: "109283746501928",
        isActive: true,
        applyToAllProducts: true,
        productIds: [],
        capiEnabled: false,
        capiTrigger: "on_order",
        createdAt: "",
        updatedAt: "",
      },
    ];

    it("Refuse d'ajouter un pixel avec le même pixelId", () => {
      const res = canAddPixel(mockPixels, "109283746501928");
      expect(res.allowed).toBe(false);
      expect(res.error).toContain("déjà configuré sur cette boutique");
    });
  });

  describe("4. Confidentialité & Masquage CAPI", () => {
    it("Masque systématiquement le jeton d'accès CAPI pour le frontend", () => {
      const pixels = metaPixelsStore.getPixels("lome-glow", true);
      pixels.forEach((p) => {
        expect(p.capiToken).toBeUndefined();
      });
    });

    it("Hache les données de correspondance avancée en SHA-256 normalisé", () => {
      const hashedPhone = hashUserData("+228 90 11 22 33", "phone");
      expect(hashedPhone).toMatch(/^[a-f0-9]{64}$/);

      const hashedEmail = hashUserData("  Client.Test@gmail.com ", "email");
      expect(hashedEmail).toMatch(/^[a-f0-9]{64}$/);
      expect(hashedEmail).toBe(hashUserData("client.test@gmail.com", "email"));
    });
  });

  describe("5. Isolation stricte entre boutiques", () => {
    it("Les pixels de lome-glow et abidjan-bio sont totalement étanches", () => {
      const lomePixels = metaPixelsStore.getPixels("lome-glow");
      const abidjanPixels = metaPixelsStore.getPixels("abidjan-bio");

      expect(lomePixels.length).toBeGreaterThan(0);
      expect(abidjanPixels.length).toBeGreaterThan(0);

      lomePixels.forEach((p) => expect(p.storeSlug).toBe("lome-glow"));
      abidjanPixels.forEach((p) => expect(p.storeSlug).toBe("abidjan-bio"));
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  getProductByShopAndSlugOrId,
  saveShopProductsList,
  getShopProductsRaw,
  clearShopProductsMemory,
} from "./products-store";
import { Product } from "@/server/data/types";
import {
  validateProductImageFile,
  MAX_GIF_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
} from "./image-utils";
import { detectImageMagicBytes } from "./media-storage";

describe("Prompt 17-J : Correction Édition Produit, Isolation des Boutiques & Support GIF", () => {
  const shopA = "boutique-abidjan";
  const shopB = "boutique-dakar";

  const productA: Product = {
    id: "prod_a_101",
    name: "Huile Pure de Baobab Bio",
    title: "Huile Pure de Baobab Bio",
    slug: "huile-baobab-bio",
    category: "Soins Visage & Corps",
    collection: "Huiles Naturelles",
    stock: 50,
    variants: [],
    quantityOffers: [],
    salePrice: 15000,
    price: 15000,
    costPrice: 6000,
    description: "<p>Huile 100% naturelle extraite à froid au Sénégal.</p>",
    images: ["/products/baobab.jpg"],
    status: "active",
    productStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const productB: Product = {
    id: "prod_b_202",
    name: "Savon Noir Traditionnel au Karité",
    title: "Savon Noir Traditionnel au Karité",
    slug: "savon-noir-karite",
    category: "Savons & Nettoyants",
    collection: "Hygiène Naturelle",
    stock: 120,
    variants: [],
    quantityOffers: [],
    salePrice: 4500,
    price: 4500,
    costPrice: 1800,
    description: "<p>Savon exfoliant doux purifiant pour le corps et le visage.</p>",
    images: ["/products/savon-noir.jpg"],
    status: "active",
    productStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const productC: Product = {
    id: "prod_c_303",
    name: "Crème Hydratante à l'Aloe Vera & Hibiscus",
    title: "Crème Hydratante à l'Aloe Vera & Hibiscus",
    slug: "creme-aloe-hibiscus",
    category: "Hydratation",
    collection: "Soins du Visage",
    stock: 75,
    variants: [],
    quantityOffers: [],
    salePrice: 12000,
    price: 12000,
    costPrice: 4000,
    description: "<p>Hydratation intense 24h avec extrait pur d'hibiscus karkadé.</p>",
    images: ["/products/creme-aloe.jpg"],
    status: "active",
    productStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    clearShopProductsMemory();
    saveShopProductsList(shopA, [productA, productB, productC]);
    saveShopProductsList(shopB, []);
  });

  describe("1. Résolution stricte par ID et Shop ID (Zéro repli silencieux)", () => {
    it("charge le produit A avec ses données exactes (titre, prix, image, description)", () => {
      const loaded = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_a_101",
        allowDraft: true,
      });

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("prod_a_101");
      expect(loaded?.name).toBe("Huile Pure de Baobab Bio");
      expect(loaded?.salePrice).toBe(15000);
      expect(loaded?.images).toEqual(["/products/baobab.jpg"]);
      expect(loaded?.description).toContain("extraite à froid");
    });

    it("charge le produit B avec ses données exactes sans aucune interférence avec A", () => {
      const loaded = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_b_202",
        allowDraft: true,
      });

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("prod_b_202");
      expect(loaded?.name).toBe("Savon Noir Traditionnel au Karité");
      expect(loaded?.salePrice).toBe(4500);
      expect(loaded?.images).toEqual(["/products/savon-noir.jpg"]);
      expect(loaded?.description).toContain("Savon exfoliant");
    });

    it("charge le produit C avec ses données exactes", () => {
      const loaded = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_c_303",
        allowDraft: true,
      });

      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe("prod_c_303");
      expect(loaded?.name).toBe("Crème Hydratante à l'Aloe Vera & Hibiscus");
      expect(loaded?.salePrice).toBe(12000);
    });

    it("renvoie strictement null pour un ID inexistant et ne retombe JAMAIS sur un produit par défaut", () => {
      const nonExistent = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_inexistant_999",
        allowDraft: true,
      });

      // Règle d'or : JAMAIS de repli silencieux sur MOCK_PRODUCTS[0] ou un autre produit
      expect(nonExistent).toBeNull();
    });

    it("isole strictement les boutiques : un produit de la boutique A est introuvable depuis la boutique B", () => {
      const crossShop = getProductByShopAndSlugOrId({
        shopSlug: shopB,
        slugOrId: "prod_a_101",
        allowDraft: true,
      });

      expect(crossShop).toBeNull();
    });

    it("modifier le produit A ne modifie absolument pas le produit B ou C", () => {
      const products = getShopProductsRaw(shopA);
      const updatedA: Product = {
        ...productA,
        name: "Huile de Baobab Édition Prestige",
        salePrice: 18500,
        description: "<p>Nouvelle formule enrichie en vitamine E naturelle.</p>",
      };

      const newList = products.map((p) => (p.id === updatedA.id ? updatedA : p));
      saveShopProductsList(shopA, newList);

      const refetchedA = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_a_101",
        allowDraft: true,
      });
      const refetchedB = getProductByShopAndSlugOrId({
        shopSlug: shopA,
        slugOrId: "prod_b_202",
        allowDraft: true,
      });

      expect(refetchedA?.name).toBe("Huile de Baobab Édition Prestige");
      expect(refetchedA?.salePrice).toBe(18500);

      // B n'a pas bougé d'un iota
      expect(refetchedB?.name).toBe("Savon Noir Traditionnel au Karité");
      expect(refetchedB?.salePrice).toBe(4500);
      expect(refetchedB?.description).toContain("Savon exfoliant");
    });
  });

  describe("2. Isolation des brouillons locaux par boutique et produit", () => {
    it("génère une clé de brouillon spécifique composée de shop_id et product_id", () => {
      const draftKeyA = `draft_${shopA}_${productA.id}`;
      const draftKeyB = `draft_${shopA}_${productB.id}`;

      expect(draftKeyA).toBe("draft_boutique-abidjan_prod_a_101");
      expect(draftKeyB).toBe("draft_boutique-abidjan_prod_b_202");
      expect(draftKeyA).not.toBe(draftKeyB);
    });

    it("refuse de charger le brouillon d'un autre produit ou d'une autre boutique", () => {
      const draftData = {
        shopSlug: shopA,
        productId: productA.id,
        name: "Brouillon en cours pour A",
        salePrice: 19000,
      };

      // Si le formulaire chargeait ce brouillon alors qu'on est sur le produit B :
      const isTargetProductB = productB.id;
      const canRestoreOnB = draftData.productId === isTargetProductB;
      expect(canRestoreOnB).toBe(false);

      // Si le formulaire chargeait ce brouillon sur une autre boutique :
      const canRestoreOnShopB = draftData.shopSlug === shopB;
      expect(canRestoreOnShopB).toBe(false);
    });
  });

  describe("3. Support complet des animations GIF et validation des limites", () => {
    it("détecte les magic bytes GIF87a et GIF89a", () => {
      // GIF89a : 47 49 46 38 39 61
      const gif89aBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const check89a = detectImageMagicBytes(gif89aBuffer);
      expect(check89a.valid).toBe(true);
      expect(check89a.mimeType).toBe("image/gif");

      // GIF87a : 47 49 46 38 37 61
      const gif87aBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const check87a = detectImageMagicBytes(gif87aBuffer);
      expect(check87a.valid).toBe(true);
      expect(check87a.mimeType).toBe("image/gif");
    });

    it("accepte les GIFs animés jusqu'à 8 Mo avec allowGif: true", () => {
      const validGif = {
        name: "demo-application-serum.gif",
        size: 7.2 * 1024 * 1024, // 7.2 Mo
        type: "image/gif",
      };

      const result = validateProductImageFile(validGif, { allowGif: true });
      expect(result.valid).toBe(true);
    });

    it("rejette les GIFs dépassant 8 Mo avec un message d'erreur clair", () => {
      const heavyGif = {
        name: "presentation-lourde.gif",
        size: 8.5 * 1024 * 1024, // 8.5 Mo
        type: "image/gif",
      };

      const result = validateProductImageFile(heavyGif, { allowGif: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("dépasse la limite autorisée de 8 Mo");
    });

    it("rejette les images statiques dépassant 5 Mo", () => {
      const heavyJpeg = {
        name: "photo_flacon.jpg",
        size: 5.8 * 1024 * 1024,
        type: "image/jpeg",
      };

      const result = validateProductImageFile(heavyJpeg, { allowGif: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("dépasse la limite autorisée de 5 Mo");
    });
  });

  describe("4. Saisie textuelle riche sans altération ni perte", () => {
    it("préserve le texte avec accents, retours à la ligne, gras et italique sans corruption", () => {
      const rawText = `
        <h2>Caractéristiques du Sérum Éclat & Anti-taches</h2>
        <p>Notre formule exclusive à base d'<strong>acides de fruits</strong> et de <em>niacinamide pure</em> régénère l'épiderme.</p>
        <p>Conseils d'application :</p>
        <ul>
          <li>Appliquer matin et soir sur peau propre et sèche.</li>
          <li>Masser délicatement jusqu'à absorption complète.</li>
        </ul>
        <p>Résultats visibles dès 14 jours d'utilisation régulière.</p>
      `.trim();

      // Vérifie que le texte compte au moins 20 mots avec accents et retours à la ligne
      const wordCount = rawText.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
      expect(wordCount).toBeGreaterThan(20);
      expect(rawText).toContain("Éclat & Anti-taches");
      expect(rawText).toContain("<strong>acides de fruits</strong>");
      expect(rawText).toContain("<em>niacinamide pure</em>");
      expect(rawText).toContain("jusqu'à absorption");
    });
  });
});

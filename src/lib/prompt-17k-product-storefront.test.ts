import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  getProductPublicUrl,
  getStorePublicUrl,
  generatePreviewToken,
  verifyPreviewToken,
} from "./storefront-urls";
import {
  generateShortCode,
  ensureProductSlugAndShortCode,
  normalizeProductIdentifier,
  findProductInShopRaw,
  getProductByShopAndSlugOrId,
  saveShopProductsList,
} from "./products-store";
import { Product } from "@/server/data/types";
import { saveStoreDomains, clearCustomDomainsMemory } from "./custom-domains";

describe("Prompt 17-K : Résolution et URLs publiques des produits sur la vitrine", () => {
  beforeEach(() => {
    clearCustomDomainsMemory();
  });

  describe("1. getProductPublicUrl (Générateur unique d'URL)", () => {
    const mockProduct: Product = {
      id: "prod_test_01",
      name: "Thé Minceur Détox",
      title: "Thé Minceur Détox",
      slug: "the-minceur-detox",
      shortCode: "m3k9x2",
      short_code: "m3k9x2",
      description: "Description test",
      category: "Santé",
      collection: "Minceur",
      images: ["/test.png"],
      salePrice: 15000,
      costPrice: 5000,
      stock: 25,
      status: "in_stock",
      productStatus: "active",
      published_to_storefront: true,
      variants: [],
      quantityOffers: [],
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("génère l'adresse de secours canonique (/boutique/{slug}/produits/{slug}) en l'absence de domaine personnalisé", () => {
      const url = getProductPublicUrl(mockProduct, "lome-prestige");
      expect(url).toBe("/boutique/lome-prestige/produits/the-minceur-detox");
    });

    it("génère l'adresse absolue sur le domaine personnalisé actif si présent", () => {
      saveStoreDomains("kelio-store", [
        {
          id: "dom_1",
          storeSlug: "kelio-store",
          domain: "kelio.com",
          isPrimary: true,
          status: "active",
          dnsRecords: [],
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ]);

      const url = getProductPublicUrl(mockProduct, "kelio-store");
      expect(url).toBe("https://kelio.com/produits/the-minceur-detox");
    });

    it("inclut le paramètre de prévisualisation et le jeton sécurisé pour un aperçu admin", () => {
      const url = getProductPublicUrl(mockProduct, "lome-prestige", { preview: true });
      expect(url).toContain("preview=true");
      expect(url).toContain("token=");
    });

    it("génère une URL de lien court avec shortLink: true", () => {
      const url = getProductPublicUrl(mockProduct, "lome-prestige", { shortLink: true });
      expect(url).toBe("/boutique/lome-prestige/produits/m3k9x2");
    });

    it("permet de générer une URL absolue vers novika-delta.vercel.app si option absolute demandée", () => {
      const url = getProductPublicUrl(mockProduct, "lome-prestige", { absolute: true });
      expect(url).toBe("https://novika-delta.vercel.app/boutique/lome-prestige/produits/the-minceur-detox");
    });
  });

  describe("2. Jeton de prévisualisation signé (1h de validité)", () => {
    it("génère un jeton valide vérifiable pour la même boutique et le même produit", () => {
      const token = generatePreviewToken("prod_99", "lome-glow");
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(10);

      const isValid = verifyPreviewToken(token, "prod_99", "lome-glow");
      expect(isValid).toBe(true);
    });

    it("rejette un jeton avec un mauvais productId ou une mauvaise boutique", () => {
      const token = generatePreviewToken("prod_99", "lome-glow");
      expect(verifyPreviewToken(token, "prod_different", "lome-glow")).toBe(false);
      expect(verifyPreviewToken(token, "prod_99", "autre-boutique")).toBe(false);
    });

    it("rejette un jeton expiré ou corrompu", () => {
      expect(verifyPreviewToken("invalid_garbage_token", "prod_99", "lome-glow")).toBe(false);
      expect(verifyPreviewToken(null, "prod_99", "lome-glow")).toBe(false);
    });
  });

  describe("3. Migration non destructive : Slugs & Short Codes", () => {
    it("ne modifie JAMAIS un slug ou un short_code déjà existant", () => {
      const existingProduct: Product = {
        id: "prod_locked",
        name: "Savon Noir",
        title: "Savon Noir",
        slug: "mon-super-slug-existant",
        shortCode: "custom1",
        short_code: "custom1",
        description: "Test",
        category: "Beauté",
        collection: "Corps",
        images: [],
        salePrice: 5000,
        costPrice: 2000,
        stock: 10,
        status: "active",
        productStatus: "active",
        published_to_storefront: true,
        variants: [],
        quantityOffers: [],
        createdAt: "2026-01-01T00:00:00Z",
      };

      const result = ensureProductSlugAndShortCode(existingProduct, []);
      expect(result.slug).toBe("mon-super-slug-existant");
      expect(result.shortCode).toBe("custom1");
      expect(result.short_code).toBe("custom1");
    });

    it("génère automatiquement un slug et un short_code de 6 caractères pour un produit qui n'en a pas", () => {
      const unmigrated: any = {
        id: "prod_new_01",
        name: "Crème Hydratante Karité & Coco",
        title: "Crème Hydratante Karité & Coco",
        description: "Test",
        category: "Soins",
        collection: "Visage",
        images: [],
        salePrice: 8000,
        costPrice: 3000,
        stock: 15,
        status: "active",
        productStatus: "active",
        variants: [],
        quantityOffers: [],
        createdAt: "2026-01-01T00:00:00Z",
      };

      const migrated = ensureProductSlugAndShortCode(unmigrated, []);
      expect(migrated.slug).toBe("creme-hydratante-karite-coco");
      expect(migrated.shortCode).toBeDefined();
      expect(migrated.shortCode).toHaveLength(6);
      expect(migrated.short_code).toBe(migrated.shortCode);
      expect(migrated.published_to_storefront).toBe(true);
    });

    it("gère les collisions de slug sans écraser l'existant en ajoutant -2, -3", () => {
      const existing: Product[] = [
        {
          id: "prod_01",
          name: "Sérum Éclat",
          slug: "serum-eclat",
          description: "",
          category: "",
          collection: "",
          images: [],
          salePrice: 10000,
          costPrice: 3000,
          stock: 5,
          status: "active",
          variants: [],
          quantityOffers: [],
          createdAt: "",
        },
      ];

      const duplicateProduct: any = {
        id: "prod_02",
        name: "Sérum Éclat",
        title: "Sérum Éclat",
        description: "",
        category: "",
        collection: "",
        images: [],
        salePrice: 10000,
        costPrice: 3000,
        stock: 5,
        status: "active",
        variants: [],
        quantityOffers: [],
        createdAt: "",
      };

      const result = ensureProductSlugAndShortCode(duplicateProduct, existing);
      expect(result.slug).toBe("serum-eclat-2");
    });
  });

  describe("4. Résolution tolérante de route & Normalisation", () => {
    beforeAll(() => {
      saveShopProductsList("lome-glow", [
        {
          id: "prod_01",
          slug: "cafe-bio-champignon-vitality",
          title: "Café Bio Champignon Vitality",
          shortCode: "cafe01",
          status: "active",
          productStatus: "active",
          published_to_storefront: true,
          salePrice: 15000,
          price: 15000,
          stock: 10,
        } as any,
        {
          id: "prod_09",
          slug: "produit-brouillon",
          title: "Produit Brouillon Test",
          shortCode: "draft9",
          status: "draft",
          productStatus: "draft",
          published_to_storefront: false,
          salePrice: 10000,
          price: 10000,
          stock: 5,
        } as any,
      ]);
    });

    it("retrouve un produit par son id exact, slug exact ou short_code", () => {
      const resById = findProductInShopRaw("lome-glow", "prod_01");
      expect(resById.product).not.toBeNull();
      expect(resById.matchedBy).toBe("id");

      const resBySlug = findProductInShopRaw("lome-glow", "cafe-bio-champignon-vitality");
      expect(resBySlug.product).not.toBeNull();
      expect(resBySlug.matchedBy).toBe("slug");
    });

    it("retrouve un produit malgré la casse ou les accents (tolérance utilisateur)", () => {
      const resCaps = findProductInShopRaw("lome-glow", "PROD_01");
      expect(resCaps.product).not.toBeNull();

      const resAccents = findProductInShopRaw("lome-glow", "café-bio-champignon-vitality");
      expect(resAccents.product).not.toBeNull();
      expect(resAccents.matchedBy).toBe("slug");
    });

    it("distingue les produits brouillons des produits introuvables", () => {
      // prod_09 est en draft dans mock-data
      const draftCheck = findProductInShopRaw("lome-glow", "prod_09");
      expect(draftCheck.product).not.toBeNull();
      expect(draftCheck.isDraft).toBe(true);
      expect(draftCheck.isUnpublished).toBe(true);

      // Produit totalement inexistant
      const missingCheck = findProductInShopRaw("lome-glow", "produit_totalement_fantome");
      expect(missingCheck.product).toBeNull();
    });

    it("getProductByShopAndSlugOrId retourne le produit en allowDraft=true et null en allowDraft=false pour un brouillon", () => {
      const publicSearch = getProductByShopAndSlugOrId({
        shopSlug: "lome-glow",
        slugOrId: "prod_09",
        allowDraft: false,
      });
      expect(publicSearch).toBeNull();

      const adminSearch = getProductByShopAndSlugOrId({
        shopSlug: "lome-glow",
        slugOrId: "prod_09",
        allowDraft: true,
      });
      expect(adminSearch).not.toBeNull();
      expect(adminSearch?.id).toBe("prod_09");
    });
  });
});

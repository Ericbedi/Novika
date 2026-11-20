import { describe, it, expect, beforeEach } from "vitest";
import {
  findProductInShopRaw,
  getProductByShopAndSlugOrId,
  saveShopProductsList,
  clearShopProductsMemory,
  ensureProductSlugAndShortCode,
} from "./products-store";
import { convertDraftToProduct, MappedProductDraft } from "./shopify-csv-mapper";
import { Product } from "@/server/data/types";

describe("Prompt 17-O : Persistance Supabase, legacy_id et Sécurisation des Identifiants", () => {
  beforeEach(() => {
    clearShopProductsMemory();
  });

  it("1. convertDraftToProduct génère un legacy_id correspondant à l'identifiant initial", () => {
    const draft: MappedProductDraft = {
      handle: "the-vert-bio",
      title: "Thé Vert Bio Vitalité",
      descriptionHtml: "<p>Thé vert stimulant</p>",
      descriptionPlain: "Thé vert stimulant",
      rawBodyHtml: "<p>Thé vert stimulant</p>",
      category: "Santé & Bien-être",
      productType: "Thé",
      tags: ["santé"],
      vendor: "Fournisseur Kelio",
      images: [{ src: "https://example.com/the.jpg", isSafe: true }],
      variants: [
        {
          id: "var_1",
          name: "Standard",
          price: 15000,
          costPrice: 6000,
          stock: 25,
          sku: "THE-01",
          options: [],
        },
      ],
      salePrice: 15000,
      costPrice: 6000,
      stock: 25,
      sku: "THE-01",
      seo: {
        title: "Thé Vert Bio",
        description: "Thé vert stimulant",
        handle: "the-vert-bio",
      },
      originalPublished: true,
      unmappedData: {},
      warnings: [],
    };

    const product = convertDraftToProduct(draft, "kelio", "batch_test_1", "skip");

    expect(product.id).toMatch(/^prod_imp_/);
    expect((product as any).legacy_id).toBe(product.id);
    expect(product.slug).toBe("the-vert-bio");
    expect(product.published_to_storefront).toBe(true);
  });

  it("2. findProductInShopRaw retrouve un produit via son legacy_id, son id, son slug ou son shortCode", () => {
    const sampleProduct: Product = {
      id: "prod_imp_999888_abcde",
      legacy_id: "prod_imp_999888_abcde",
      name: "Infusion Détox",
      title: "Infusion Détox",
      slug: "infusion-detox",
      shortCode: "infdet",
      short_code: "infdet",
      description: "Infusion naturelle",
      category: "Santé",
      images: ["/products/serum-eclat.png"],
      salePrice: 12000,
      costPrice: 4000,
      stock: 30,
      status: "active",
      productStatus: "active",
      published_to_storefront: true,
      variants: [],
    } as any;

    saveShopProductsList("kelio", [sampleProduct]);

    // Recherche par legacy_id
    const resByLegacy = findProductInShopRaw("kelio", "prod_imp_999888_abcde");
    expect(resByLegacy.product).not.toBeNull();
    expect(resByLegacy.product?.slug).toBe("infusion-detox");

    // Recherche par slug
    const resBySlug = findProductInShopRaw("kelio", "infusion-detox");
    expect(resBySlug.product?.id).toBe("prod_imp_999888_abcde");

    // Recherche par shortCode
    const resByShortCode = findProductInShopRaw("kelio", "infdet");
    expect(resByShortCode.product?.id).toBe("prod_imp_999888_abcde");
  });

  it("3. getProductByShopAndSlugOrId retourne le bon produit pour un identifiant non-UUID et null si inexistant", () => {
    const sampleProduct: Product = {
      id: "c8f6d031-521b-4b30-a902-96f9e4920002",
      legacy_id: "prod_imp_1795150846529_zyeuy",
      name: "Accompagnez votre équilibre glycémique",
      title: "Accompagnez votre équilibre glycémique",
      slug: "accompagnez-votre-equilibre-glycemique",
      shortCode: "glyc01",
      short_code: "glyc01",
      description: "Formule naturelle",
      category: "Santé",
      images: ["/products/serum-eclat.png"],
      salePrice: 18500,
      costPrice: 5000,
      stock: 45,
      status: "active",
      productStatus: "active",
      published_to_storefront: true,
      variants: [],
    } as any;

    saveShopProductsList("kelio", [sampleProduct]);

    // Retrouve via legacy_id sans jamais planter
    const foundLegacy = getProductByShopAndSlugOrId({
      shopSlug: "kelio",
      slugOrId: "prod_imp_1795150846529_zyeuy",
    });
    expect(foundLegacy?.id).toBe("c8f6d031-521b-4b30-a902-96f9e4920002");

    // ID inexistant renvoie null (jamais de crash ni de repli erroné)
    const notFound = getProductByShopAndSlugOrId({
      shopSlug: "kelio",
      slugOrId: "prod_imp_inexistant_999",
    });
    expect(notFound).toBeNull();
  });

  it("4. ensureProductSlugAndShortCode préserve legacy_id et short_code existants", () => {
    const rawProd: Product = {
      id: "prod_imp_test_preservation",
      legacy_id: "prod_imp_test_preservation",
      name: "Savon Noir Éclat",
      title: "Savon Noir Éclat",
      slug: "savon-noir-eclat",
      shortCode: "sav01a",
      short_code: "sav01a",
      salePrice: 3500,
      costPrice: 1000,
      stock: 50,
      status: "active",
      productStatus: "active",
      variants: [],
      images: [],
    } as any;

    const ensured = ensureProductSlugAndShortCode(rawProd, []);
    expect(ensured.slug).toBe("savon-noir-eclat");
    expect(ensured.shortCode).toBe("sav01a");
    expect((ensured as any).legacy_id).toBe("prod_imp_test_preservation");
    expect(ensured.published_to_storefront).toBe(true);
  });
});

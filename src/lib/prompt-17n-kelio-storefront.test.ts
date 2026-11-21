import { describe, it, expect, beforeAll } from "vitest";
import {
  getShopProducts,
  findProductInShopRaw,
  getShopProductsRaw,
  saveShopProductsList,
} from "./products-store";
import { isProductVisibleOnStorefront } from "./stock-settings-store";
import { getProductPublicUrl } from "./storefront-urls";
import { getAllStores, registerStore } from "@/server/data/store-repository";
import { Product } from "@/server/data/types";

describe("Prompt 17-N : Affichage Catalogue et Fiche Produit Vitrine Kelio (Rôle Anonyme)", () => {
  beforeAll(() => {
    registerStore({
      id: "store_kelio_test",
      name: "Kelio",
      slug: "kelio",
      description: "Boutique Kelio Santé",
      country: "TG",
      countryName: "Togo",
      flag: "🇹🇬",
      currency: "XOF",
      whatsappNumber: "+22890000000",
      contactEmail: "contact@kelio.com",
      role: "owner",
      status: "active",
      orderCount: 0,
      productCount: 1,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const testGlycemie: any = {
      id: "c8f6d031-521b-4b30-a902-96f9e4920002",
      slug: "accompagnez-votre-equilibre-glycemique",
      title: "Accompagnez votre équilibre glycémique",
      shortCode: "glyc60",
      short_code: "glyc60",
      status: "active",
      productStatus: "active",
      published_to_storefront: true,
      salePrice: 18500,
      price: 18500,
      stock: 45,
      trackInventory: true,
      variants: [
        {
          id: "var_glyc_1",
          sku: "KEL-GLYC-60",
          title: "Boîte 60 gélules",
          price: 18500,
          stock: 45,
        },
      ],
      benefits: {
        items: [
          { id: "b1", title: "Régulation naturelle", description: "Aide au maintien d'une glycémie normale" },
          { id: "b2", title: "100% Naturel", description: "Extraits végétaux certifiés" },
          { id: "b3", title: "Paiement à la livraison", description: "Réglez à réception" },
        ],
      },
    };

    saveShopProductsList("kelio", [testGlycemie]);
  });

  it("1. La boutique 'kelio' est configurée et accessible", () => {
    const storeFromRepo = getAllStores().find((s) => s.slug === "kelio");
    expect(storeFromRepo).toBeDefined();
    expect(storeFromRepo?.name).toBe("Kelio");
    expect(storeFromRepo?.country).toBe("TG");
    expect(storeFromRepo?.currency).toBe("XOF");
  });

  it("2. Le catalogue de Kelio contient le produit actif et publié pour un visiteur anonyme", () => {
    const products = getShopProducts("kelio");
    expect(products.length).toBeGreaterThanOrEqual(1);

    const glycemie = products.find(
      (p) => p.slug === "accompagnez-votre-equilibre-glycemique"
    );
    expect(glycemie).toBeDefined();
    expect(glycemie?.status).toBe("active");
    expect(glycemie?.published_to_storefront).toBe(true);
    expect(glycemie?.deletedAt).toBeFalsy();
    expect(glycemie?.salePrice).toBe(18500);
    expect(glycemie?.stock).toBe(45);
    expect(glycemie?.variants?.length).toBeGreaterThanOrEqual(1);
  });

  it("3. Le produit est visible sur la vitrine publique selon les règles de stock", () => {
    const products = getShopProducts("kelio");
    const glycemie = products.find(
      (p) => p.slug === "accompagnez-votre-equilibre-glycemique"
    )!;

    const isVisible = isProductVisibleOnStorefront(glycemie, "kelio");
    expect(isVisible).toBe(true);
  });

  it("4. findProductInShopRaw résout le produit par slug, id et shortCode", () => {
    // Par slug
    const resBySlug = findProductInShopRaw(
      "kelio",
      "accompagnez-votre-equilibre-glycemique"
    );
    expect(resBySlug.product).toBeDefined();
    expect(resBySlug.isDeleted).toBe(false);
    expect(resBySlug.isUnpublished).toBe(false);
    expect(resBySlug.product?.title).toBe(
      "Accompagnez votre équilibre glycémique"
    );

    // Par id
    const resById = findProductInShopRaw(
      "kelio",
      "c8f6d031-521b-4b30-a902-96f9e4920002"
    );
    expect(resById.product).toBeDefined();
    expect(resById.product?.slug).toBe(
      "accompagnez-votre-equilibre-glycemique"
    );

    // Par short code
    const resByShort = findProductInShopRaw("kelio", "glyc60");
    expect(resByShort.product).toBeDefined();
    expect(resByShort.product?.slug).toBe(
      "accompagnez-votre-equilibre-glycemique"
    );
  });

  it("5. getProductPublicUrl génère l'URL canonique valide", () => {
    const products = getShopProducts("kelio");
    const glycemie = products.find(
      (p) => p.slug === "accompagnez-votre-equilibre-glycemique"
    )!;

    const publicUrl = getProductPublicUrl(glycemie, "kelio");
    expect(publicUrl).toBe(
      "/boutique/kelio/produits/accompagnez-votre-equilibre-glycemique"
    );
  });

  it("6. Bénéfices et variantes du produit sont correctement structurés", () => {
    const { product } = findProductInShopRaw(
      "kelio",
      "accompagnez-votre-equilibre-glycemique"
    );
    expect(product).toBeDefined();
    expect(product?.benefits).toBeDefined();
    expect(product?.benefits?.items.length).toBeGreaterThanOrEqual(3);
    expect(product?.variants?.[0].sku).toBe("KEL-GLYC-60");
    expect(product?.variants?.[0].price).toBe(18500);
  });
});

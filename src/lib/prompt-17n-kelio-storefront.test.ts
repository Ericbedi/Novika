import { describe, it, expect } from "vitest";
import {
  getShopProducts,
  findProductInShopRaw,
  getShopProductsRaw,
} from "./products-store";
import { isProductVisibleOnStorefront } from "./stock-settings-store";
import { getProductPublicUrl } from "./storefront-urls";
import { MOCK_STORES } from "@/mock-data/stores";
import { getAllStores } from "@/server/data/store-repository";

describe("Prompt 17-N : Affichage Catalogue et Fiche Produit Vitrine Kelio (Rôle Anonyme)", () => {
  it("1. La boutique 'kelio' est configurée et accessible", () => {
    const storeFromMock = MOCK_STORES.find((s) => s.slug === "kelio");
    expect(storeFromMock).toBeDefined();
    expect(storeFromMock?.name).toBe("Kelio");
    expect(storeFromMock?.country).toBe("TG");
    expect(storeFromMock?.currency).toBe("XOF");

    const storeFromRepo = getAllStores().find((s) => s.slug === "kelio");
    expect(storeFromRepo).toBeDefined();
    expect(storeFromRepo?.name).toBe("Kelio");
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

import { describe, it, expect, beforeEach } from "vitest";
import {
  getProductByShopAndSlugOrId,
  ensureUniqueProductSlug,
  saveShopProduct,
  getShopProducts,
  clearShopProductsMemory,
} from "./products-store";
import { Product } from "@/server/data/types";

describe("Prompt 13 : Identité des Produits & Intégrité du Catalogue", () => {
  const shopSlug = "test-store-abidjan";

  beforeEach(() => {
    clearShopProductsMemory();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("1. Unicité stricte des slugs : suffixage automatique -2, -3 en cas de collision", () => {
    const p1: Product = {
      id: "prod_a1",
      name: "Sérum Anti-Taches",
      slug: "serum-anti-taches",
      price: 15000,
      salePrice: 15000,
      stock: 20,
      productStatus: "active",
      category: "Cosmétique",
      description: "Description A",
      images: ["https://example.com/a.jpg"],
    } as any;

    saveShopProduct(shopSlug, p1);

    // Tentative de créer un 2ème produit avec le même slug
    const generatedSlug2 = ensureUniqueProductSlug(shopSlug, "serum-anti-taches");
    expect(generatedSlug2).toBe("serum-anti-taches-2");

    const p2: Product = {
      id: "prod_a2",
      name: "Sérum Anti-Taches Nouveau",
      slug: generatedSlug2,
      price: 18000,
      salePrice: 18000,
      stock: 10,
      productStatus: "active",
      category: "Cosmétique",
      description: "Description B",
      images: ["https://example.com/b.jpg"],
    } as any;
    saveShopProduct(shopSlug, p2);

    // Tentative d'un 3ème produit avec le même slug
    const generatedSlug3 = ensureUniqueProductSlug(shopSlug, "serum-anti-taches");
    expect(generatedSlug3).toBe("serum-anti-taches-3");
  });

  it("2. Zéro repli sur un autre produit : si B est demandé, renvoie B et JAMAIS A", () => {
    const prodA: Product = {
      id: "prod_alpha",
      name: "Produit Alpha",
      slug: "produit-alpha",
      price: 10000,
      salePrice: 10000,
      stock: 5,
      productStatus: "active",
      category: "Mode",
      description: "Alpha",
      images: ["https://example.com/alpha.jpg"],
    } as any;

    const prodB: Product = {
      id: "prod_beta",
      name: "Produit Bêta",
      slug: "produit-beta",
      price: 25000,
      salePrice: 25000,
      stock: 15,
      productStatus: "active",
      category: "Beauté",
      description: "Bêta",
      images: ["https://example.com/beta.jpg"],
    } as any;

    saveShopProduct(shopSlug, prodA);
    saveShopProduct(shopSlug, prodB);

    // Recherche de B
    const resultB = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "produit-beta",
      allowDraft: false,
    });

    expect(resultB).not.toBeNull();
    expect(resultB?.id).toBe("prod_beta");
    expect(resultB?.name).toBe("Produit Bêta");
    expect(resultB?.salePrice).toBe(25000);
    expect(resultB?.id).not.toBe("prod_alpha");

    // Recherche par ID de B
    const resultById = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "prod_beta",
      allowDraft: false,
    });
    expect(resultById?.slug).toBe("produit-beta");
  });

  it("3. Produit introuvable : renvoie STRICTEMENT null (zéro repli sur un produit par défaut)", () => {
    const resultUnknown = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "produit-inconnu-qui-nexiste-pas",
      allowDraft: false,
    });

    expect(resultUnknown).toBeNull();
  });

  it("4. Filtre de statut de publication : un brouillon est masqué en public mais visible en aperçu admin", () => {
    const draftProduct: Product = {
      id: "prod_draft",
      name: "Produit Brouillon Secret",
      slug: "produit-brouillon-secret",
      price: 30000,
      salePrice: 30000,
      stock: 10,
      productStatus: "draft",
      category: "Privé",
      description: "Brouillon en cours",
      images: [],
    } as any;

    saveShopProduct(shopSlug, draftProduct);

    // Accès public -> null
    const publicResult = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "produit-brouillon-secret",
      allowDraft: false,
    });
    expect(publicResult).toBeNull();

    // Aperçu admin (allowDraft = true) -> trouvé
    const adminResult = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "produit-brouillon-secret",
      allowDraft: true,
    });
    expect(adminResult).not.toBeNull();
    expect(adminResult?.id).toBe("prod_draft");
  });
});

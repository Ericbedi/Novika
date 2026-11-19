import { describe, it, expect, beforeEach } from "vitest";
import {
  clearShopProductsMemory,
  getShopProducts,
  getTrashProducts,
  getProductByShopAndSlugOrId,
  saveShopProduct,
  softDeleteProduct,
  restoreProduct,
  archiveProduct,
  hardDeleteProduct,
  emptyTrash,
  batchUpdateProductsStatus,
  getPendingOrdersCountForProduct,
} from "./products-store";
import { Product } from "@/server/data/types";

describe("Prompt 14-B : Gestion de la corbeille et suppression de produits", () => {
  const shopSlug = "test-store-14b";

  const sampleProduct: Product = {
    id: "prod_14b_001",
    name: "Savon Noir d'Afrique",
    slug: "savon-noir-afrique",
    description: "Savon naturel purifiant",
    category: "Beauté",
    collection: "Soins",
    salePrice: 5000,
    costPrice: 2000,
    stock: 25,
    status: "active",
    productStatus: "active",
    variants: [],
    quantityOffers: [],
    badgesConfig: {
      hasCountdown: false,
      countdownMinutes: 60,
      hasComparePrice: false,
      hasLowStockWarning: false,
      lowStockThreshold: 10,
      hasQuantityPacks: false,
    },
    images: ["/products/serum-eclat.png"],
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    clearShopProductsMemory();
    saveShopProduct(shopSlug, sampleProduct);
  });

  it("1. Déplacer dans la corbeille (Soft Delete) : masqué du catalogue actif mais présent dans getTrashProducts", () => {
    const res = softDeleteProduct(shopSlug, "prod_14b_001", "owner");
    expect(res.success).toBe(true);

    const activeList = getShopProducts(shopSlug);
    expect(activeList.some((p) => p.id === "prod_14b_001")).toBe(false);

    const trashList = getTrashProducts(shopSlug);
    expect(trashList.some((p) => p.id === "prod_14b_001")).toBe(true);
    expect(trashList[0].deletedAt).toBeDefined();
  });

  it("2. Vitrine publique : getProductByShopAndSlugOrId retourne null pour un produit en corbeille (404 en français)", () => {
    softDeleteProduct(shopSlug, "prod_14b_001", "owner");

    // Pour un visiteur public (allowDraft = false, includeDeleted = false)
    const publicProduct = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "savon-noir-afrique",
      allowDraft: false,
    });
    expect(publicProduct).toBeNull();

    // Même avec allowDraft = true (aperçu admin standard)
    const draftProduct = getProductByShopAndSlugOrId({
      shopSlug,
      slugOrId: "savon-noir-afrique",
      allowDraft: true,
      includeDeleted: false,
    });
    expect(draftProduct).toBeNull();
  });

  it("3. Restaurer un produit : il réapparaît dans le catalogue actif et quitte la corbeille", () => {
    softDeleteProduct(shopSlug, "prod_14b_001", "owner");
    expect(getShopProducts(shopSlug).length).toBe(0);

    const restoreRes = restoreProduct(shopSlug, "prod_14b_001", "owner");
    expect(restoreRes.success).toBe(true);

    const activeList = getShopProducts(shopSlug);
    expect(activeList.length).toBe(1);
    expect(activeList[0].id).toBe("prod_14b_001");
    expect(activeList[0].deletedAt).toBeNull();

    const trashList = getTrashProducts(shopSlug);
    expect(trashList.length).toBe(0);
  });

  it("4. Archiver un produit : statut archived sans le mettre à la corbeille", () => {
    const res = archiveProduct(shopSlug, "prod_14b_001", "admin");
    expect(res.success).toBe(true);

    const all = getShopProducts(shopSlug);
    expect(all[0].productStatus).toBe("archived");
    expect(all[0].deletedAt).toBeUndefined();
  });

  it("5. Sécurité : Co-admin et Closer ne peuvent PAS supprimer définitivement (Hard delete réservé à owner)", () => {
    softDeleteProduct(shopSlug, "prod_14b_001", "owner");

    const adminAttempt = hardDeleteProduct(shopSlug, "prod_14b_001", "SUPPRIMER", "admin");
    expect(adminAttempt.success).toBe(false);
    expect(adminAttempt.error).toContain("PROPRIÉTAIRE");

    const closerAttempt = hardDeleteProduct(shopSlug, "prod_14b_001", "SUPPRIMER", "closer");
    expect(closerAttempt.success).toBe(false);
  });

  it("6. Hard delete : validation stricte du texte de confirmation", () => {
    softDeleteProduct(shopSlug, "prod_14b_001", "owner");

    const badConfirm = hardDeleteProduct(shopSlug, "prod_14b_001", "mauvais_texte", "owner");
    expect(badConfirm.success).toBe(false);
    expect(badConfirm.error).toContain("Confirmation invalide");

    // Confirmation par 'SUPPRIMER' valide
    const goodConfirm = hardDeleteProduct(shopSlug, "prod_14b_001", "SUPPRIMER", "owner");
    expect(goodConfirm.success).toBe(true);

    // Le produit n'existe plus nulle part
    expect(getShopProducts(shopSlug, true).length).toBe(0);
  });

  it("7. Hard delete : libération du slug pour un nouveau produit", () => {
    // Supprimer définitivement prod_14b_001 avec le slug "savon-noir-afrique"
    hardDeleteProduct(shopSlug, "prod_14b_001", "SUPPRIMER", "owner");

    // Créer un nouveau produit avec le même slug souhaité
    const newProduct = saveShopProduct(shopSlug, {
      ...sampleProduct,
      id: "prod_14b_002",
      name: "Savon Noir d'Afrique",
      slug: "savon-noir-afrique",
    });

    // Le slug n'a pas été incrémenté en '-2' car l'ancien slug a été libéré
    expect(newProduct.slug).toBe("savon-noir-afrique");
  });

  it("8. Actions en lot (Batch actions) : suppression et restauration groupées", () => {
    saveShopProduct(shopSlug, {
      ...sampleProduct,
      id: "prod_14b_002",
      slug: "savon-noir-2",
    });

    // Suppression en lot
    const batchTrash = batchUpdateProductsStatus(
      shopSlug,
      ["prod_14b_001", "prod_14b_002"],
      "trash",
      "admin"
    );
    expect(batchTrash.success).toBe(true);
    expect(batchTrash.count).toBe(2);
    expect(getTrashProducts(shopSlug).length).toBe(2);
    expect(getShopProducts(shopSlug).length).toBe(0);

    // Restauration en lot
    const batchRestore = batchUpdateProductsStatus(
      shopSlug,
      ["prod_14b_001", "prod_14b_002"],
      "restore",
      "admin"
    );
    expect(batchRestore.success).toBe(true);
    expect(batchRestore.count).toBe(2);
    expect(getTrashProducts(shopSlug).length).toBe(0);
    expect(getShopProducts(shopSlug).length).toBe(2);
  });
});

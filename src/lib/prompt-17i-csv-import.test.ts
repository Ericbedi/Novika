import { describe, it, expect, beforeEach } from "vitest";
import { executeAutoCsvImport, rollbackImportBatch } from "./csv-import-engine";
import { getShopProductsRaw, saveShopProductsList, clearShopProductsMemory } from "./products-store";
import { Product } from "@/server/data/types";

describe("Prompt 17-I : Rétablissement de l'affichage immédiat des produits importés en CSV", () => {
  const storeSlug = "boutique-test-17i";
  const storeSlugOther = "boutique-autre-17i";

  beforeEach(() => {
    clearShopProductsMemory();
    saveShopProductsList(storeSlug, []);
    saveShopProductsList(storeSlugOther, []);
  });

  // 1. Import complet d'un fichier CSV de 20 produits (format Shopify)
  it("importe 20 produits Shopify et les rend immédiatement lisibles dans la boutique active", async () => {
    const shopifyHeaders = [
      "Handle",
      "Title",
      "Body (HTML)",
      "Vendor",
      "Product Category",
      "Type",
      "Tags",
      "Published",
      "Option1 Name",
      "Option1 Value",
      "Variant SKU",
      "Variant Price",
      "Variant Compare At Price",
      "Variant Inventory Qty",
      "Image Src",
    ];

    const rows: string[] = [];
    for (let i = 1; i <= 20; i++) {
      rows.push(
        `produit-${i},"Produit Test Numéro ${i}","<p>Description riche du produit ${i}</p>","Fournisseur Sahel","Santé & Beauté","Cosmétique","Nouveauté, Promo",TRUE,"Taille","Standard","SKU-${i}",${15000 + i * 500},${20000 + i * 500},${10 + i},"https://images.unsplash.com/photo-${i}"`
      );
    }

    const csvContent = [shopifyHeaders.join(","), ...rows].join("\n");

    const report = await executeAutoCsvImport({
      csvContent,
      fileName: "shopify_20_products.csv",
      fileSizeBytes: csvContent.length,
      storeSlug,
      userRole: "owner",
      existingProducts: [],
      duplicateStrategy: "skip",
      currency: "XOF",
    });

    // Écran de résultat et exactitude
    expect(report.importedCounts.products).toBe(20);
    expect(report.countsMatch).toBe(true);

    // Relire en persistance (Étape 2 & Critères d'acceptation)
    const stored = getShopProductsRaw(storeSlug);
    expect(stored.length).toBe(20);

    // Vérifier les attributs de chaque produit importé
    const first = stored.find((p) => p.slug === "produit-1");
    expect(first).toBeDefined();
    expect(first?.title).toBe("Produit Test Numéro 1");
    expect(first?.salePrice).toBe(15500);
    expect(first?.compareAtPrice).toBe(20500);
    expect(first?.productStatus).toBe("active"); // Complet = Actif par défaut
    expect(first?.shop_id).toBe(storeSlug);
    expect(first?.storeId).toBe(storeSlug);
    expect(first?.importBatchId).toBe(report.batchId);
  });

  // 2. Un produit sans catégorie ni type s'affiche quand même (pas d'exclusion)
  it("conserve et affiche les produits avec des champs optionnels vides (catégorie, type, fournisseur)", async () => {
    const csvContent =
      `Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty,Image Src\n` +
      `produit-minimal,"Produit Minimaliste Sans Categorie","<p>Description</p>","","","",,TRUE,"Option","Unique","SKU-MIN",12000,5,"https://images.unsplash.com/photo-1"\n`;

    const report = await executeAutoCsvImport({
      csvContent,
      fileName: "minimal.csv",
      fileSizeBytes: csvContent.length,
      storeSlug,
      userRole: "owner",
      existingProducts: [],
    });

    expect(report.importedCounts.products).toBe(1);

    const stored = getShopProductsRaw(storeSlug);
    expect(stored.length).toBe(1);
    expect(stored[0].title).toBe("Produit Minimaliste Sans Categorie");
    expect(stored[0].productStatus).toBe("active");
  });

  // 3. Ligne incomplète classée en brouillon avec indication des champs manquants
  it("classe en brouillon un produit incomplet et liste les champs manquants", async () => {
    const csvContent =
      `Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty,Image Src\n` +
      `produit-incomplet,"Produit Sans Prix","<p>Description</p>","Marque","Santé","Soin",,TRUE,"Option","Unique","SKU-INC",0,0,""\n`;

    const report = await executeAutoCsvImport({
      csvContent,
      fileName: "incomplet.csv",
      fileSizeBytes: csvContent.length,
      storeSlug,
      userRole: "owner",
      existingProducts: [],
    });

    const stored = getShopProductsRaw(storeSlug);
    expect(stored.length).toBe(1);
    expect(stored[0].productStatus).toBe("draft");
    expect(stored[0].missingFields).toContain("Prix de vente");
  });

  // 4. Isolation stricte entre boutiques
  it("garantit l'isolation entre boutiques : les produits de shop A ne polluent pas shop B", async () => {
    const csvContentA =
      `Handle,Title,Variant Price,Variant Inventory Qty\n` +
      `produit-a,"Produit De Boutique A",10000,10\n`;

    await executeAutoCsvImport({
      csvContent: csvContentA,
      fileName: "shop_a.csv",
      fileSizeBytes: csvContentA.length,
      storeSlug: storeSlug,
      userRole: "owner",
      existingProducts: [],
    });

    const prodsA = getShopProductsRaw(storeSlug);
    const prodsB = getShopProductsRaw(storeSlugOther);

    expect(prodsA.length).toBe(1);
    expect(prodsB.length).toBe(0);
    expect(prodsA[0].shop_id).toBe(storeSlug);
  });

  // 5. Annulation d'un lot d'import (Rollback 24 h)
  it("annule un lot d'importation sans toucher aux produits existants", async () => {
    // 1 produit préexistant
    const existingProd: Product = {
      id: "prod_existant_01",
      name: "Produit Historique",
      title: "Produit Historique",
      slug: "produit-historique",
      description: "Produit déjà en boutique",
      category: "Santé",
      collection: "Nouveautés",
      price: 25000,
      salePrice: 25000,
      costPrice: 10000,
      marginAmount: 15000,
      marginPercent: 60,
      stock: 50,
      status: "active",
      productStatus: "active",
      images: ["/test.jpg"],
      variants: [],
      quantityOffers: [],
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
    };
    saveShopProductsList(storeSlug, [existingProd]);

    // Import d'un nouveau lot de 2 produits
    const csvContent =
      `Handle,Title,Variant Price,Variant Inventory Qty\n` +
      `produit-lot-1,"Produit Lot 1",10000,10\n` +
      `produit-lot-2,"Produit Lot 2",12000,15\n`;

    const report = await executeAutoCsvImport({
      csvContent,
      fileName: "batch_test.csv",
      fileSizeBytes: csvContent.length,
      storeSlug,
      userRole: "owner",
      existingProducts: [existingProd],
    });

    expect(getShopProductsRaw(storeSlug).length).toBe(3);

    // Annulation du lot
    const rollback = rollbackImportBatch(report.batchId, getShopProductsRaw(storeSlug), storeSlug);
    expect(rollback.rolledBackCount).toBe(2);

    const remaining = getShopProductsRaw(storeSlug);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe("prod_existant_01");
  });
});

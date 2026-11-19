import { describe, it, expect } from "vitest";
import { parseCsv, stripBom, sanitizeFormulaInjection } from "./csv-parser";
import {
  detectCsvFormat,
  mapShopifyCsvRows,
  checkImageSsrf,
  parseAndRoundPrice,
  convertDraftToProduct,
} from "./shopify-csv-mapper";
import { sanitizeHtml, cleanHtmlToPlainText } from "./html-sanitizer";
import { rollbackImportBatch, executeAutoCsvImport } from "./csv-import-engine";
import { Product } from "@/server/data/types";

describe("Prompt 11 : Import CSV universel et format Shopify", () => {
  // 1. Parseur RFC 4180 avec champs multilignes
  it("gère les champs multilignes entre guillemets et les guillemets doublés", () => {
    const csvContent =
      `Handle,Title,"Body (HTML)"\n` +
      `savon-noir,"Savon Noir Authentique","<div>\n<p>Fabrication artisanale ""100% bio"".</p>\n</div>"\n`;

    const parsed = parseCsv(csvContent);
    expect(parsed.headers).toEqual(["Handle", "Title", "Body (HTML)"]);
    expect(parsed.rows.length).toBe(1);
    expect(parsed.rows[0][0]).toBe("savon-noir");
    expect(parsed.rows[0][1]).toBe("Savon Noir Authentique");
    expect(parsed.rows[0][2]).toContain('Fabrication artisanale "100% bio".');
    expect(parsed.rows[0][2]).toContain("\n");
  });

  // 2. Détection du format Shopify vs Novika
  it("détecte automatiquement le format Shopify par ses en-têtes officiels", () => {
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
      "Image Src",
    ];
    expect(detectCsvFormat(shopifyHeaders)).toBe("shopify");

    const novikaHeaders = ["identifiant", "titre", "description", "prix", "sku", "image_1"];
    expect(detectCsvFormat(novikaHeaders)).toBe("novika");

    const genericHeaders = ["Nom du produit", "Prix de vente", "Quantite en stock"];
    expect(detectCsvFormat(genericHeaders)).toBe("generic");
  });

  // 3. Regroupement multi-lignes par Handle (Shopify)
  it("regroupe les lignes avec le même Handle en un seul produit avec plusieurs variantes et images", () => {
    const headers = [
      "Handle",
      "Title",
      "Body (HTML)",
      "Vendor",
      "Type",
      "Tags",
      "Published",
      "Option1 Name",
      "Option1 Value",
      "Variant SKU",
      "Variant Price",
      "Variant Compare At Price",
      "Variant Inventory Qty",
      "Cost per item",
      "Image Src",
      "Image Position",
      "Variant Image",
    ];

    const rows = [
      // Ligne 1 : Variante M + Image 1
      [
        "t-shirt-lin",
        "T-Shirt en Lin Premium",
        "<p>Lin respirant de première qualité.</p>",
        "Sahel Elegance",
        "Vêtements",
        "lin, été, nouveauté",
        "TRUE",
        "Taille",
        "M",
        "TSH-LIN-M",
        "15000",
        "19000",
        "12",
        "5000",
        "https://images.unsplash.com/photo-1596755094514",
        "1",
        "https://images.unsplash.com/photo-1596755094514",
      ],
      // Ligne 2 : Variante L + Image 2
      [
        "t-shirt-lin",
        "",
        "",
        "",
        "",
        "",
        "",
        "Taille",
        "L",
        "TSH-LIN-L",
        "15000",
        "19000",
        "18",
        "5000",
        "https://images.unsplash.com/photo-1521572267360",
        "2",
        "https://images.unsplash.com/photo-1521572267360",
      ],
      // Ligne 3 : Variante XL sans nouvelle image
      [
        "t-shirt-lin",
        "",
        "",
        "",
        "",
        "",
        "",
        "Taille",
        "XL",
        "TSH-LIN-XL",
        "16000",
        "20000",
        "5",
        "5500",
        "",
        "",
        "",
      ],
      // Ligne 4 : Image supplémentaire (Position 3) sans variante
      [
        "t-shirt-lin",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "https://images.unsplash.com/photo-1503342217505",
        "3",
        "",
      ],
    ];

    const result = mapShopifyCsvRows(headers, rows, "XOF");
    expect(result.products.length).toBe(1);

    const prod = result.products[0];
    expect(prod.handle).toBe("t-shirt-lin");
    expect(prod.title).toBe("T-Shirt en Lin Premium");
    expect(prod.brand).toBe("Sahel Elegance");
    expect(prod.category).toBe("Vêtements");
    expect(prod.tags).toEqual(["lin", "été", "nouveauté"]);

    // 3 variantes enregistrées
    expect(prod.variants.length).toBe(3);
    expect(prod.variants[0].name).toBe("M");
    expect(prod.variants[0].sku).toBe("TSH-LIN-M");
    expect(prod.variants[0].price).toBe(15000);
    expect(prod.variants[0].compareAtPrice).toBe(19000);
    expect(prod.variants[0].stock).toBe(12);

    expect(prod.variants[1].name).toBe("L");
    expect(prod.variants[1].stock).toBe(18);

    expect(prod.variants[2].name).toBe("XL");
    expect(prod.variants[2].price).toBe(16000);

    // 3 images dans la galerie triées par position
    expect(prod.images.length).toBe(3);
    expect(prod.images[0].position).toBe(1);
    expect(prod.images[1].position).toBe(2);
    expect(prod.images[2].position).toBe(3);

    // Conversion en produit Novika complet : statut systématiquement en "draft"
    const finalProduct = convertDraftToProduct(prod, "lome-glow", "batch_test_01");
    expect(finalProduct.status).toBe("draft");
    expect(finalProduct.productStatus).toBe("draft");
    expect(finalProduct.stock).toBe(35); // 12 + 18 + 5
    expect(finalProduct.salePrice).toBe(15000); // prix le plus bas
    expect(finalProduct.compareAtPrice).toBe(20000);
  });

  // 4. Nettoyage strict du HTML et conservation de structure
  it("assainit le HTML en supprimant scripts et événements tout en conservant les balises de structure", () => {
    const dirtyHtml = `
      <div class="product-description">
        <h3>Conseils d'utilisation</h3>
        <script>alert("hack");</script>
        <p onclick="stealCookies()">Appliquer matin et soir sur peau propre.</p>
        <a href="javascript:void(0)">En savoir plus</a>
        <a href="https://novika.app" target="_blank">Lien sécurisé</a>
        <ul>
          <li>100% végétal 🌿</li>
          <li>Sans paraben</li>
        </ul>
      </div>
    `;

    const sanitized = sanitizeHtml(dirtyHtml);
    expect(sanitized.cleanHtml).not.toContain("<script");
    expect(sanitized.cleanHtml).not.toContain("alert");
    expect(sanitized.cleanHtml).not.toContain("onclick");
    expect(sanitized.cleanHtml).not.toContain("javascript:");
    expect(sanitized.cleanHtml).toContain("<h3>Conseils d'utilisation</h3>");
    expect(sanitized.cleanHtml).toContain("100% végétal 🌿");
    expect(sanitized.cleanHtml).toContain('rel="noopener noreferrer"');
    expect(sanitized.removedElementsCount).toBeGreaterThan(0);

    // Test conversion en texte brut propre
    const plainText = cleanHtmlToPlainText(sanitized.cleanHtml);
    expect(plainText).toContain("Conseils d'utilisation");
    expect(plainText).toContain("100% végétal 🌿");
    expect(plainText).not.toContain("<h3>");
  });

  // 5. Neutralisation des injections de formules Excel / Sheets
  it("neutralise toute valeur de cellule commençant par =, +, -, @", () => {
    expect(sanitizeFormulaInjection("=CMD|' /C calc'!A0")).toBe("'=CMD|' /C calc'!A0");
    expect(sanitizeFormulaInjection("+12345")).toBe("'+12345");
    expect(sanitizeFormulaInjection("-SUM(A1:A5)")).toBe("'-SUM(A1:A5)");
    expect(sanitizeFormulaInjection("@SUM(A1:A5)")).toBe("'@SUM(A1:A5)");
    expect(sanitizeFormulaInjection("Chemise blanche")).toBe("Chemise blanche");
  });

  // 6. Protection SSRF stricte sur les images
  it("bloque les URL internes, locales et privées (SSRF) ainsi que les formats SVG", () => {
    expect(checkImageSsrf("https://images.unsplash.com/photo-1").isSafe).toBe(true);
    expect(checkImageSsrf("http://localhost:3000/image.jpg").isSafe).toBe(false);
    expect(checkImageSsrf("https://127.0.0.1/evil.png").isSafe).toBe(false);
    expect(checkImageSsrf("https://169.254.169.254/latest/meta-data").isSafe).toBe(false);
    expect(checkImageSsrf("https://192.168.1.1/router.jpg").isSafe).toBe(false);
    expect(checkImageSsrf("https://example.com/vector.svg").isSafe).toBe(false);
  });

  // 7. Arrondi et devises entières africaines (XOF, XAF, GNF)
  it("convertit et arrondit les montants avec décimales pour les devises XOF et XAF en consignant un avertissement", () => {
    const res1 = parseAndRoundPrice("15000", "XOF");
    expect(res1.price).toBe(15000);
    expect(res1.wasRounded).toBe(false);

    const res2 = parseAndRoundPrice("14 999,50 FCFA", "XOF");
    expect(res2.price).toBe(15000);
    expect(res2.wasRounded).toBe(true);

    const res3 = parseAndRoundPrice("24.99", "XOF");
    expect(res3.price).toBe(25);
    expect(res3.wasRounded).toBe(true);
  });

  // 8. Exécution d'import complet automatique avec rapport et rollback
  it("exécute un import complet, génère le rapport comparatif et permet l'annulation par lot", async () => {
    const sampleCsv =
      `Handle,Title,Body (HTML),Vendor,Type,Variant Price,Variant SKU,Variant Inventory Qty,Image Src\n` +
      `savon-karite,Savon Karité Bio,<p>Pur beurre de karité</p>,Novika,Cosmétique,3500,SKU-SAVON,50,https://images.unsplash.com/photo-1596755094514\n` +
      `huile-coco,Huile de Coco Vierge,<p>100% pure</p>,Novika,Cosmétique,4500,SKU-COCO,30,https://images.unsplash.com/photo-1521572267360\n`;

    const report = await executeAutoCsvImport({
      csvContent: sampleCsv,
      fileName: "shopify_export_test.csv",
      fileSizeBytes: 200,
      storeSlug: "lome-glow",
      userRole: "owner",
      existingProducts: [],
      currency: "XOF",
    });

    expect(report.importedProducts.length).toBe(2);
    expect(report.importedCounts.products).toBe(2);
    expect(report.importedCounts.variants).toBe(2);
    expect(report.importedCounts.images).toBe(2);
    expect(report.countsMatch).toBe(true);
    expect(report.importedProducts[0].status).toBe("draft");
    expect(report.batchId).toMatch(/^batch_imp_/);

    // Test de l'annulation (Rollback)
    const existing = [...report.importedProducts, { id: "old_prod_1", slug: "old", status: "active" } as Product];
    const rollback = rollbackImportBatch(report.batchId, existing, "lome-glow");

    expect(rollback.rolledBackCount).toBe(2);
    expect(rollback.remainingProducts.length).toBe(1);
    expect(rollback.remainingProducts[0].id).toBe("old_prod_1");
  });
});

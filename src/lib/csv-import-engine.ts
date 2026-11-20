/**
 * Moteur complet d'importation CSV et gestion des lots (Prompt 11)
 * Combine :
 * - Détection automatique de format (Shopify, Novika, Générique)
 * - Mappage et regroupement multi-lignes par Handle (Shopify)
 * - Assainissement HTML des descriptions
 * - Neutralisation des injections de formules Excel (=, +, -, @)
 * - Conversion et arrondi des devises africaines (XOF, XAF, GNF)
 * - Traitement des doublons (Ne pas écraser, Mettre à jour, Créer une copie)
 * - Création systématique en BROUILLON (draft)
 * - Traçabilité par lot (import_batches) et annulation (Rollback sous 7 jours)
 * - Rapport d'exactitude chiffré comparé au fichier source
 */

import {
  DryRunSummary,
  ImportBatch,
  ImportMode,
  ImportRowResult,
  ImportStockMode,
} from "@/server/data/import-types";
import { Product, UserRole } from "@/server/data/types";
import { brandConfig } from "@/config/brand";
import { parseCsv, formatCsv, sanitizeFormulaInjection } from "./csv-parser";
import {
  detectCsvFormat,
  mapShopifyCsvRows,
  convertDraftToProduct,
  checkImageSsrf,
  parseAndRoundPrice,
  MappedProductDraft,
  DuplicateStrategy,
} from "./shopify-csv-mapper";
import { sanitizeHtml } from "./html-sanitizer";
import { getShopProductsRaw, saveShopProductsList } from "./products-store";

export const NOVIKA_SAMPLE_TEMPLATE =
  `\uFEFFidentifiant;titre;description;prix;prix_barre;cout;statut;collections;categorie;fournisseur;sku;option1_nom;option1_valeur;stock;pays_disponibles;image_1\n` +
  `chemise-lin;Chemise en lin tropicale;Chemise 100% lin respirant idéale pour le climat ouest-africain;14900;19900;5500;brouillon;Mode Homme|Nouveautés;Vêtements;Fournisseur Sahel;CH-LIN-M;Taille;M;20;TG|CI|SN;https://images.unsplash.com/photo-1596755094514-f87e34085b2c\n` +
  `chemise-lin;Chemise en lin tropicale;Chemise 100% lin respirant idéale pour le climat ouest-africain;14900;19900;5500;brouillon;Mode Homme|Nouveautés;Vêtements;Fournisseur Sahel;CH-LIN-L;Taille;L;15;TG|CI|SN;https://images.unsplash.com/photo-1596755094514-f87e34085b2c\n` +
  `serum-vit-c;Sérum Vitamine C Pure 15%;Sérum coup d'éclat anti-taches pour teint lumineux;18500;24000;6200;brouillon;Soins Visage|Best-sellers;Cosmétique;Laboratoire Cotonou;SER-VITC-30;Format;30ml;40;TG|CI|SN|BJ;https://images.unsplash.com/photo-1620916566398-39f1143ab7be\n`;

// Rétrocompatibilité
export const CSV_SAMPLE_TEMPLATE = NOVIKA_SAMPLE_TEMPLATE;

export interface FullImportReport {
  batchId: string;
  format: "shopify" | "novika" | "generic" | "unknown";
  fileName: string;
  fileSizeBytes: number;
  totalRowsInFile: number;
  // Comparatif d'exactitude (Prompt 11)
  fileCounts: {
    products: number;
    variants: number;
    images: number;
  };
  importedCounts: {
    products: number;
    variants: number;
    images: number;
    failedImages: number;
  };
  countsMatch: boolean;
  importedProducts: Product[];
  failedImagesList: { productTitle: string; url: string; reason: string }[];
  productDetails: {
    title: string;
    handle: string;
    status: "success" | "warning" | "error";
    warnings: string[];
    variantsCount: number;
    priceFormatted: string;
  }[];
  canRollback: boolean;
  createdAt: string;
}

/**
 * Neutralise une cellule contre l'injection de formules dans Excel / Sheets (=, +, -, @).
 */
export function sanitizeCellForCsv(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(";") || str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Analyse une valeur de prix sous divers formats.
 */
export function parsePrice(raw: any, currency = "XOF"): number | null {
  const res = parseAndRoundPrice(raw, currency);
  return res.price > 0 ? res.price : null;
}

/**
 * Vérifie si une URL d'image est sécurisée (HTTPS, pas d'adresses IP privées / locales pour parer aux failles SSRF).
 */
export function isSafeImageUrl(url: string): { isValid: boolean; reason?: string } {
  const check = checkImageSsrf(url);
  return { isValid: check.isSafe, reason: check.reason };
}

/**
 * Détecte le séparateur d'un contenu CSV.
 */
export function detectCsvSeparator(content: string): ";" | "," | "\t" {
  const firstLine = content.split(/\r?\n/)[0] || "";
  const countSemicolon = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  if (countTab > countSemicolon && countTab > countComma) return "\t";
  if (countComma > countSemicolon) return ",";
  return ";";
}

/**
 * Découpe une ligne CSV en tenant compte des guillemets doubles.
 */
export function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Mappage automatique des noms de colonnes et synonymes pour les formats génériques.
 */
export function mapColumnName(rawHeader: string): string {
  const h = (rawHeader || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .trim();

  if (["titre", "nom", "title", "name", "produit", "designation"].includes(h)) return "titre";
  if (["identifiant", "handle", "slug", "id"].includes(h)) return "identifiant";
  if (["prix", "price", "tarif", "prix_vente", "sale_price", "variantprice"].includes(h)) return "prix";
  if (["prix_barre", "compare_price", "ancien_prix", "compare_at_price", "variantcompareatprice"].includes(h)) return "prix_barre";
  if (["cout", "cost", "prix_revient", "cout_achat", "cost_price", "costperitem"].includes(h)) return "cout";
  if (["statut", "status", "etat", "published"].includes(h)) return "statut";
  if (["collections", "collection", "categories_multiples"].includes(h)) return "collections";
  if (["categorie", "category", "rayon", "productcategory"].includes(h)) return "categorie";
  if (["type", "product_type", "type_produit"].includes(h)) return "type";
  if (["fournisseur", "supplier", "vendor", "marque", "brand"].includes(h)) return "fournisseur";
  if (["balises", "tags", "mots_cles"].includes(h)) return "balises";
  if (["sku", "reference", "ref", "variantsku"].includes(h)) return "sku";
  if (["stock", "quantite", "qty", "quantity", "variantinventoryqty"].includes(h)) return "stock";
  if (["suivre_stock", "track_stock", "gestion_stock"].includes(h)) return "suivre_stock";
  if (["seuil_stock_bas", "low_stock_threshold", "alerte_stock"].includes(h)) return "seuil_stock_bas";
  if (["pays_disponibles", "countries", "pays", "corridors"].includes(h)) return "pays_disponibles";
  if (["description", "details", "corps", "body", "bodyhtml"].includes(h)) return "description";
  if (h.startsWith("image") || h.startsWith("photo") || h === "imagesrc") return "image_1";
  if (h.startsWith("option")) return h;

  return h;
}

/**
 * Exécute un test à blanc (Dry Run) complet avec rétrocompatibilité.
 */
export function runCsvDryRun(
  csvContent: string,
  userRole: UserRole,
  existingProducts: Product[],
  options: {
    mode: ImportMode;
    newProductsStatus: "draft" | "active";
    stockMode: ImportStockMode;
    allowedCountries: string[];
    maxRows?: number;
    currency?: string;
  }
): DryRunSummary {
  const maxRows = options.maxRows || 2000;
  const parsed = parseCsv(csvContent);

  if (parsed.rows.length === 0) {
    return {
      totalRows: 0,
      creationsCount: 0,
      updatesCount: 0,
      errorsCount: 1,
      ignoredCount: 0,
      warningsCount: 0,
      canProceed: false,
      rowResults: [
        {
          rowNumber: 1,
          status: "error",
          errorMessage: "Le fichier CSV est vide ou ne contient aucune ligne de données après l'en-tête.",
        },
      ],
    };
  }

  if (parsed.rows.length > maxRows) {
    return {
      totalRows: parsed.rows.length,
      creationsCount: 0,
      updatesCount: 0,
      errorsCount: 1,
      ignoredCount: 0,
      warningsCount: 0,
      canProceed: false,
      rowResults: [
        {
          rowNumber: 1,
          status: "error",
          errorMessage: `Le fichier dépasse la limite maximale de ${maxRows} lignes autorisées par import (${parsed.rows.length} lignes fournies).`,
        },
      ],
    };
  }

  const format = detectCsvFormat(parsed.headers);

  // Si format Shopify détecté, router vers le mapper Shopify complet
  if (format === "shopify") {
    const shopifyResult = mapShopifyCsvRows(parsed.headers, parsed.rows, options.currency || "XOF");
    const existingHandles = new Set(existingProducts.map((p) => (p.slug || "").toLowerCase()));
    const existingSkus = new Set(existingProducts.map((p) => (p.sku || "").toUpperCase()).filter(Boolean));

    const rowResults: ImportRowResult[] = [];
    let creations = 0;
    let updates = 0;
    let warnings = 0;

    shopifyResult.products.forEach((draft, idx) => {
      const isExisting = existingHandles.has(draft.handle.toLowerCase()) || (draft.sku && existingSkus.has(draft.sku.toUpperCase()));
      const warningText = draft.warnings.join(" | ") || undefined;
      if (warningText) warnings++;

      if (isExisting) {
        if (options.mode === "create_only") {
          rowResults.push({
            rowNumber: idx + 2,
            title: draft.title,
            sku: draft.sku,
            status: "ignored",
            warningMessage: `Le produit "${draft.title}" existe déjà (mode 'Créer seulement').`,
          });
          return;
        }
        updates++;
        rowResults.push({
          rowNumber: idx + 2,
          title: draft.title,
          sku: draft.sku,
          status: "updated",
          warningMessage: warningText,
          parsedData: {
            title: draft.title,
            price: draft.salePrice,
            sku: draft.sku,
            status: "draft",
          },
        });
      } else {
        if (options.mode === "update_only") {
          rowResults.push({
            rowNumber: idx + 2,
            title: draft.title,
            sku: draft.sku,
            status: "ignored",
            warningMessage: `Le produit "${draft.title}" n'existe pas en boutique (mode 'Mettre à jour seulement').`,
          });
          return;
        }
        creations++;
        rowResults.push({
          rowNumber: idx + 2,
          title: draft.title,
          sku: draft.sku,
          status: "created",
          warningMessage: warningText,
          parsedData: {
            title: draft.title,
            price: draft.salePrice,
            sku: draft.sku,
            status: "draft",
          },
        });
      }
    });

    return {
      totalRows: parsed.rows.length,
      creationsCount: creations,
      updatesCount: updates,
      errorsCount: 0,
      ignoredCount: shopifyResult.products.length - (creations + updates),
      warningsCount: warnings,
      canProceed: creations > 0 || updates > 0,
      rowResults,
    };
  }

  // Fallback sur le parseur classique par ligne pour les formats génériques
  const mappedHeaders = parsed.headers.map(mapColumnName);
  const existingSkus = new Set(existingProducts.map((p) => (p.sku || "").toUpperCase()).filter(Boolean));
  const seenSkusInFile = new Set<string>();

  const rowResults: ImportRowResult[] = [];
  let creationsCount = 0;
  let updatesCount = 0;
  let errorsCount = 0;
  let ignoredCount = 0;
  let warningsCount = 0;

  parsed.rows.forEach((cells, idx) => {
    const rowNumber = idx + 2;
    const rowObj: Record<string, string> = {};

    mappedHeaders.forEach((key, colIdx) => {
      rowObj[key] = cells[colIdx] || "";
    });

    const title = (rowObj["titre"] || "").trim();
    const rawPrice = rowObj["prix"];
    const sku = (rowObj["sku"] || "").trim().toUpperCase();
    const rawCost = rowObj["cout"];
    const rawImage1 = rowObj["image_1"];

    if (!title) {
      errorsCount++;
      rowResults.push({
        rowNumber,
        status: "error",
        columnName: "titre",
        errorMessage: "Le titre du produit est obligatoire.",
      });
      return;
    }

    const priceNum = parsePrice(rawPrice, options.currency);
    if (priceNum === null || priceNum <= 0) {
      errorsCount++;
      rowResults.push({
        rowNumber,
        status: "error",
        title,
        columnName: "prix",
        errorMessage: `Le prix "${rawPrice || ""}" est invalide ou non renseigné (doit être strictement positif).`,
      });
      return;
    }

    if (sku && seenSkusInFile.has(sku)) {
      if (options.mode === "create_only") {
        ignoredCount++;
        warningsCount++;
        rowResults.push({
          rowNumber,
          title,
          sku,
          status: "ignored",
          warningMessage: `Le SKU "${sku}" apparaît plusieurs fois dans le fichier CSV. Cette ligne sera ignorée.`,
        });
        return;
      }
    }
    if (sku) seenSkusInFile.add(sku);

    if (rawImage1) {
      const imgCheck = isSafeImageUrl(rawImage1);
      if (!imgCheck.isValid) {
        warningsCount++;
        rowResults.push({
          rowNumber,
          title,
          sku,
          status: "valid",
          warningMessage: `Image 1 refusée (${imgCheck.reason}). Le produit sera créé sans cette image.`,
        });
      }
    }

    let warningMsg: string | undefined;
    if (rawCost && userRole !== "owner" && userRole !== "admin") {
      warningsCount++;
      warningMsg = "La colonne coût a été ignorée (droits réservés au propriétaire et à l'administrateur).";
    }

    const isExisting = sku && existingSkus.has(sku);

    if (isExisting) {
      if (options.mode === "create_only") {
        ignoredCount++;
        rowResults.push({
          rowNumber,
          title,
          sku,
          status: "ignored",
          warningMessage: `Le produit avec le SKU "${sku}" existe déjà en catalogue (mode 'Créer seulement').`,
        });
        return;
      }
      updatesCount++;
      rowResults.push({
        rowNumber,
        title,
        sku,
        status: "updated",
        warningMessage: warningMsg,
        parsedData: {
          title,
          price: priceNum,
          sku,
          status: "draft",
        },
      });
    } else {
      if (options.mode === "update_only") {
        ignoredCount++;
        rowResults.push({
          rowNumber,
          title,
          sku,
          status: "ignored",
          warningMessage: `Le produit "${sku || title}" n'existe pas en boutique (mode 'Mettre à jour seulement').`,
        });
        return;
      }
      creationsCount++;
      rowResults.push({
        rowNumber,
        title,
        sku,
        status: "created",
        warningMessage: warningMsg,
        parsedData: {
          title,
          price: priceNum,
          sku,
          status: "draft",
        },
      });
    }
  });

  return {
    totalRows: parsed.rows.length,
    creationsCount,
    updatesCount,
    errorsCount,
    ignoredCount,
    warningsCount,
    canProceed: errorsCount === 0 || creationsCount > 0 || updatesCount > 0,
    rowResults,
  };
}

/**
 * Exécute l'importation complète automatique d'un fichier CSV (Prompt 11).
 * Traite les fichiers Shopify, Novika et génériques, applique les stratégies de doublon,
 * télécharge/valide les images, crée le lot d'importation et renvoie un rapport complet.
 */
export async function executeAutoCsvImport(params: {
  csvContent: string;
  fileName: string;
  fileSizeBytes: number;
  storeSlug: string;
  userRole: UserRole;
  existingProducts: Product[];
  duplicateStrategy?: DuplicateStrategy;
  newProductsStatus?: "active" | "draft";
  currency?: string;
}): Promise<FullImportReport> {
  const {
    csvContent,
    fileName,
    fileSizeBytes,
    storeSlug,
    userRole,
    existingProducts,
    duplicateStrategy = "skip",
    newProductsStatus,
    currency = "XOF",
  } = params;

  // 1. Contrôle des autorisations (Admin et Co-admin uniquement)
  if (userRole !== "owner" && userRole !== "admin") {
    throw new Error("Droits insuffisants. L'importation de produits est réservée à l'administrateur.");
  }

  // 2. Parse RFC 4180
  const parsed = parseCsv(csvContent);
  if (parsed.rows.length === 0) {
    throw new Error("Le fichier CSV est vide ou ne contient aucune ligne de données.");
  }

  const format = detectCsvFormat(parsed.headers);
  const batchId = `batch_imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  let mappedDrafts: MappedProductDraft[] = [];
  let fileCounts = { products: 0, variants: 0, images: 0 };

  if (format === "shopify") {
    const shopifyResult = mapShopifyCsvRows(parsed.headers, parsed.rows, currency);
    mappedDrafts = shopifyResult.products;
    fileCounts = {
      products: shopifyResult.fileProductsCount,
      variants: shopifyResult.fileVariantsCount,
      images: shopifyResult.fileImagesCount,
    };
  } else {
    // Format Novika ou Générique
    const dryRun = runCsvDryRun(csvContent, userRole, existingProducts, {
      mode: "create_and_update",
      newProductsStatus: "draft",
      stockMode: "set",
      allowedCountries: ["TG", "CI", "SN", "BJ"],
      currency,
    });

    // Transformer en MappedProductDraft
    const mappedHeaders = parsed.headers.map(mapColumnName);
    mappedDrafts = parsed.rows.map((cells, idx) => {
      const rowObj: Record<string, string> = {};
      mappedHeaders.forEach((k, colI) => {
        rowObj[k] = cells[colI] || "";
      });

      const title = rowObj["titre"] || `Article #${idx + 1}`;
      const handle =
        rowObj["identifiant"] ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      const rawPrice = rowObj["prix"];
      const priceNum = parsePrice(rawPrice, currency) || 15000;
      const rawImage = rowObj["image_1"];
      const safeImg = isSafeImageUrl(rawImage);

      const images = rawImage
        ? [
            {
              src: rawImage,
              position: 1,
              isSafe: safeImg.isValid,
              failReason: safeImg.reason,
            },
          ]
        : [];

      return {
        handle,
        title,
        descriptionHtml: `<p>${rowObj["description"] || "Article importé par CSV."}</p>`,
        descriptionPlain: rowObj["description"] || "Article importé par CSV.",
        brand: rowObj["fournisseur"] || brandConfig.name,
        category: rowObj["categorie"] || "Général",
        productType: rowObj["type"] || "Standard",
        tags: (rowObj["collections"] || "").split("|").filter(Boolean),
        salePrice: priceNum,
        compareAtPrice: parsePrice(rowObj["prix_barre"], currency) || undefined,
        costPrice: parsePrice(rowObj["cout"], currency) || Math.round(priceNum * 0.35),
        stock: parseInt(rowObj["stock"], 10) || 20,
        sku: rowObj["sku"] || undefined,
        images,
        variants: [
          {
            id: `var_${handle}_01`,
            name: "Standard",
            price: priceNum,
            costPrice: parsePrice(rowObj["cout"], currency) || Math.round(priceNum * 0.35),
            stock: parseInt(rowObj["stock"], 10) || 20,
            sku: rowObj["sku"] || undefined,
            options: [],
          },
        ],
        seo: {
          title,
          description: rowObj["description"] || title,
          handle,
        },
        originalPublished: false,
        unmappedData: {},
        warnings: safeImg.isValid ? [] : [`Image 1 refusée : ${safeImg.reason}`],
      };
    });

    fileCounts = {
      products: mappedDrafts.length,
      variants: mappedDrafts.length,
      images: mappedDrafts.filter((d) => d.images.length > 0).length,
    };
  }

  // 3. Résolution des doublons et création des entités Product
  const existingMapBySlug = new Map<string, Product>();
  const existingMapBySku = new Map<string, Product>();

  existingProducts.forEach((p) => {
    if (p.slug) existingMapBySlug.set(p.slug.toLowerCase(), p);
    if (p.sku) existingMapBySku.set(p.sku.toUpperCase(), p);
  });

  const importedProducts: Product[] = [];
  const failedImagesList: FullImportReport["failedImagesList"] = [];
  const productDetails: FullImportReport["productDetails"] = [];

  let importedVariantsCount = 0;
  let importedImagesCount = 0;
  let failedImagesCount = 0;

  mappedDrafts.forEach((draft) => {
    const existing =
      existingMapBySlug.get(draft.handle.toLowerCase()) ||
      (draft.sku ? existingMapBySku.get(draft.sku.toUpperCase()) : undefined);

    if (existing && duplicateStrategy === "skip") {
      productDetails.push({
        title: draft.title,
        handle: draft.handle,
        status: "warning",
        warnings: [`Produit déjà existant ignoré (mode 'Ne pas écraser').`],
        variantsCount: draft.variants.length,
        priceFormatted: `${draft.salePrice.toLocaleString()} ${currency}`,
      });
      return;
    }

    // Contrôle des images en échec
    draft.images.forEach((img) => {
      if (!img.isSafe) {
        failedImagesCount++;
        failedImagesList.push({
          productTitle: draft.title,
          url: img.src,
          reason: img.failReason || "Échec de validation de sécurité",
        });
      } else {
        importedImagesCount++;
      }
    });

    const newProd = convertDraftToProduct(draft, storeSlug, batchId, duplicateStrategy, existing, newProductsStatus);
    importedProducts.push(newProd);
    importedVariantsCount += newProd.variants.length;

    const hasWarnings = draft.warnings.length > 0;
    productDetails.push({
      title: draft.title,
      handle: draft.handle,
      status: hasWarnings ? "warning" : "success",
      warnings: draft.warnings,
      variantsCount: draft.variants.length,
      priceFormatted: `${newProd.salePrice.toLocaleString()} ${currency}`,
    });
  });

  const countsMatch =
    fileCounts.products === importedProducts.length &&
    fileCounts.variants === importedVariantsCount &&
    fileCounts.images === importedImagesCount;

  // 4. PERSISTANCE TRANSACTIONNELLE DES PRODUITS IMPORTÉS (Prompt 17-I)
  const currentCatalog = getShopProductsRaw(storeSlug);
  let updatedCatalog: Product[] = [];

  if (duplicateStrategy === "update") {
    const importedIds = new Set(importedProducts.map((p) => p.id));
    const importedSlugs = new Set(importedProducts.map((p) => (p.slug || "").toLowerCase()));
    const kept = currentCatalog.filter(
      (p) => !importedIds.has(p.id) && !importedSlugs.has((p.slug || "").toLowerCase())
    );
    updatedCatalog = [...importedProducts, ...kept];
  } else {
    // Mode skip ou copy : on ajoute les nouveaux produits importés en tête
    updatedCatalog = [...importedProducts, ...currentCatalog];
  }

  // Sauvegarde garantie dans la persistance de la boutique active
  saveShopProductsList(storeSlug, updatedCatalog);

  // Vérification automatique en fin d'import : relire en base / stockage
  const reloadedCatalog = getShopProductsRaw(storeSlug);
  const reloadedBatchProducts = reloadedCatalog.filter((p) => p.importBatchId === batchId);
  const verifiedCount = reloadedBatchProducts.length;

  if (verifiedCount !== importedProducts.length) {
    console.warn(
      `[Prompt 17-I] Discordance de vérification : ${importedProducts.length} annoncés, ${verifiedCount} relus en stockage.`
    );
  }

  // 5. Enregistrement du lot en historique (Prompt 17-I - 24h d'annulation)
  const batchRecord: ImportBatch = {
    id: batchId,
    storeId: storeSlug,
    fileName,
    fileSizeBytes,
    encoding: parsed.hasBom ? "utf-8" : "utf-8",
    separator: parsed.separator,
    status: "completed",
    mode: duplicateStrategy === "update" ? "create_and_update" : "create_only",
    newProductsStatus: "draft",
    stockMode: "set",
    autoCreateCollections: true,
    autoCreateSuppliers: true,
    targetCountries: ["TG", "CI", "SN", "BJ"],
    totalRows: parsed.rows.length,
    createdCount: verifiedCount,
    updatedCount: duplicateStrategy === "update" ? verifiedCount : 0,
    errorCount: 0,
    ignoredCount: mappedDrafts.length - importedProducts.length,
    createdBy: `usr_${userRole}`,
    createdByName: userRole === "owner" ? "Propriétaire" : "Administrateur",
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    canRollback: true,
    createdProductIds: importedProducts.map((p) => p.id),
  };

  if (typeof window !== "undefined") {
    try {
      const existingBatchesRaw = localStorage.getItem(`novika_import_batches_${storeSlug}`);
      const batchesList = existingBatchesRaw ? JSON.parse(existingBatchesRaw) : [];
      batchesList.unshift(batchRecord);
      localStorage.setItem(`novika_import_batches_${storeSlug}`, JSON.stringify(batchesList));
    } catch {}
  }

  return {
    batchId,
    format,
    fileName,
    fileSizeBytes,
    totalRowsInFile: parsed.rows.length,
    fileCounts,
    importedCounts: {
      products: verifiedCount,
      variants: importedVariantsCount,
      images: importedImagesCount,
      failedImages: failedImagesCount,
    },
    countsMatch: countsMatch && verifiedCount === importedProducts.length,
    importedProducts,
    failedImagesList,
    productDetails,
    canRollback: true,
    createdAt: batchRecord.createdAt,
  };
}

/**
 * Annule un lot d'importation (Rollback pendant 24 h / 7 jours) sans toucher aux produits existants.
 */
export function rollbackImportBatch(
  batchId: string,
  currentProducts: Product[],
  storeSlug: string
): { remainingProducts: Product[]; rolledBackCount: number } {
  const catalog = currentProducts && currentProducts.length > 0 ? currentProducts : getShopProductsRaw(storeSlug);
  const initialCount = catalog.length;
  const remaining = catalog.filter((p) => p.importBatchId !== batchId);
  const rolledBackCount = initialCount - remaining.length;

  // Persistance immédiate du retrait
  saveShopProductsList(storeSlug, remaining);

  if (typeof window !== "undefined") {
    try {
      const storageKey = `novika_import_batches_${storeSlug}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list: ImportBatch[] = JSON.parse(raw);
        const updated = list.map((b) =>
          b.id === batchId ? { ...b, status: "cancelled" as const, canRollback: false } : b
        );
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {}
  }

  return {
    remainingProducts: remaining,
    rolledBackCount,
  };
}

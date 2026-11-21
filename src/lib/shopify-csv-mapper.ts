/**
 * Mappeur et regroupeur de données CSV Shopify & universel (Prompt 11)
 * Reconnait l'intégralité du schéma d'exportation Shopify :
 * Handle, Title, Body (HTML), Vendor, Product Category, Type, Tags, Published,
 * Option1/2/3 Name/Value, Variant SKU, Variant Grams, Variant Inventory Qty,
 * Variant Price, Variant Compare At Price, Variant Barcode, Image Src, Image Position,
 * Image Alt Text, Variant Image, Cost per item, SEO Title, SEO Description, Status.
 *
 * Fonctionnalités fondamentales :
 * 1. Regroupement multi-lignes par Handle (1 Handle = 1 Produit avec ses variantes et sa galerie d'images)
 * 2. Importation stricte en BROUILLON (même si Published ou Status = TRUE/active)
 * 3. Conversion et arrondi précis des devises africaines (XOF, XAF, GNF) avec avertissements
 * 4. Respect des limites e-commerce (Prompt 05-V : max 3 options, max 100 variantes)
 * 5. Conservation intégrale des données non utilisées dans 'unmappedData'
 * 6. Protection SSRF sur les URL d'images
 */

import { Product, ProductVariant, UserRole } from "@/server/data/types";
import { cleanHtmlToPlainText } from "./html-sanitizer";
import { sanitizeProductDescription, HtmlSanitizeReport } from "./server-html-sanitizer";

export type CsvFormatType = "shopify" | "novika" | "generic" | "unknown";
export type DuplicateStrategy = "skip" | "update" | "copy";

export interface MappedProductDraft {
  handle: string;
  title: string;
  vendor?: string;
  descriptionHtml: string;
  descriptionPlain: string;
  rawBodyHtml?: string;
  sanitizationReport?: HtmlSanitizeReport;
  brand: string;
  category: string;
  productType: string;
  tags: string[];
  salePrice: number;
  compareAtPrice?: number;
  costPrice: number;
  stock: number;
  sku?: string;
  barcode?: string;
  weightGrams?: number;
  images: {
    src: string;
    position?: number;
    altText?: string;
    isSafe: boolean;
    failReason?: string;
  }[];
  variants: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    costPrice: number;
    stock: number;
    sku?: string;
    barcode?: string;
    weightGrams?: number;
    image?: string;
    options: { name: string; value: string }[];
  }[];
  seo: {
    title: string;
    description: string;
    handle: string;
  };
  originalPublished: boolean;
  unmappedData: Record<string, string>;
  warnings: string[];
}

export interface ParseAndMapResult {
  format: CsvFormatType;
  fileProductsCount: number;
  fileVariantsCount: number;
  fileImagesCount: number;
  products: MappedProductDraft[];
  globalWarnings: string[];
  unrecognizedColumns: string[];
}

/**
 * Normalise un nom d'en-tête (minuscules, sans accents, sans caractères spéciaux).
 */
export function normalizeHeader(header: string): string {
  return (header || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Détecte le format du fichier CSV en fonction de ses colonnes.
 */
export function detectCsvFormat(rawHeaders: string[]): CsvFormatType {
  const normalized = rawHeaders.map(normalizeHeader);
  const set = new Set(normalized);

  // Format Shopify : présence de 'handle' + ('title' ou 'bodyhtml' ou 'variantprice' ou 'variantsku' ou 'vendor')
  if (
    set.has("handle") &&
    (set.has("title") ||
      set.has("bodyhtml") ||
      set.has("variantprice") ||
      set.has("variantsku") ||
      set.has("vendor"))
  ) {
    return "shopify";
  }

  // Modèle Novika : présence de 'identifiant' et 'titre'
  if (set.has("identifiant") && (set.has("titre") || set.has("description") || set.has("prix"))) {
    return "novika";
  }

  // Format générique : présence de titre/nom et prix/price
  const hasTitleCol = normalized.some((h) =>
    h.includes("titre") || h.includes("title") || h.includes("nom") || h.includes("name") || h.includes("produit")
  );
  const hasPriceCol = normalized.some((h) =>
    h.includes("prix") || h.includes("price") || h.includes("tarif")
  );

  if (hasTitleCol && hasPriceCol) {
    return "generic";
  }

  return "unknown";
}

/**
 * Vérifie la sécurité d'une URL d'image contre les failles SSRF.
 */
export function checkImageSsrf(url: string): { isSafe: boolean; reason?: string } {
  if (!url || !url.trim()) return { isSafe: false, reason: "URL vide" };
  const clean = url.trim();

  // 1. Vérification du protocole : HTTP ou HTTPS obligatoire
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { isSafe: false, reason: "Format d'adresse URL invalide" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isSafe: false, reason: "Seuls les protocoles HTTP et HTTPS sont autorisés." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Rejet des extensions non autorisées (SVG formellement refusé pour risque XSS XML)
  const pathname = parsed.pathname.toLowerCase();
  if (pathname.endsWith(".svg")) {
    return { isSafe: false, reason: "Les fichiers SVG sont refusés pour des motifs de sécurité (XSS)." };
  }

  // 3. Rejet des hôtes locaux et adresses IP privées / métadonnées cloud (Protection SSRF)
  const forbiddenHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "metadata.google.internal",
    "instance-data",
  ];

  if (forbiddenHosts.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { isSafe: false, reason: "Adresses IP locales ou réseau interne interdits (SSRF)." };
  }

  // Détection des plages d'adresses IPv4 privées
  if (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^169\.254\./.test(hostname)
  ) {
    return { isSafe: false, reason: "Plage d'adresses IP privées interdite (SSRF)." };
  }

  return { isSafe: true };
}

/**
 * Analyse et convertit un prix dans la devise de la boutique (XOF, XAF, GNF : entiers sans décimales).
 * Consigne un avertissement si des décimales ont dû être arrondies.
 */
export function parseAndRoundPrice(
  raw: any,
  currency = "XOF"
): { price: number; wasRounded: boolean; originalText: string } {
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    return { price: 0, wasRounded: false, originalText: "" };
  }

  const originalText = String(raw).trim();
  // Supprimer les lettres (FCFA, XOF, USD, EUR...) et espaces insécables
  let str = originalText.replace(/[a-zA-Z]/g, "").replace(/[\s\u00A0]/g, "").trim();

  const isIntegerCurrency = ["XOF", "XAF", "GNF"].includes(currency.toUpperCase());

  // Remplacement des virgules ou points selon formats
  // Ex: 15.000,00 -> 15000.00 | 15 000 -> 15000 | 15,000 -> 15000
  let numericValue = 0;
  let wasRounded = false;

  if (str.includes(",") && str.includes(".")) {
    // Format français avec séparateur de milliers : 15.000,50 ou US : 15,000.50
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // 15.000,50
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // 15,000.50
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(",")) {
    // Ex: 15,000 (milliers) ou 15,50 (décimale)
    const parts = str.split(",");
    if (parts[1] && parts[1].length === 3 && isIntegerCurrency) {
      // Milliers : 15,000 -> 15000
      str = str.replace(",", "");
    } else {
      // Décimale : 15,50 -> 15.50
      str = str.replace(",", ".");
    }
  } else if (str.includes(".")) {
    const parts = str.split(".");
    if (parts[1] && parts[1].length === 3 && isIntegerCurrency) {
      // Milliers avec point : 15.000 -> 15000
      str = str.replace(".", "");
    }
  }

  const parsedFloat = parseFloat(str);
  if (isNaN(parsedFloat) || parsedFloat < 0) {
    return { price: 0, wasRounded: false, originalText };
  }

  if (isIntegerCurrency) {
    const rounded = Math.round(parsedFloat);
    if (parsedFloat !== rounded) {
      wasRounded = true;
    }
    numericValue = rounded;
  } else {
    numericValue = Math.round(parsedFloat * 100) / 100;
  }

  return { price: numericValue, wasRounded, originalText };
}

/**
 * Reconnait et groupe un export CSV Shopify en produits complets Novika.
 */
export function mapShopifyCsvRows(
  headers: string[],
  rows: string[][],
  currency = "XOF"
): ParseAndMapResult {
  const globalWarnings: string[] = [];
  const unrecognizedColumns: string[] = [];

  // 1. Indexation des colonnes
  const colIndexMap: Record<string, number> = {};
  const KNOWN_SHOPIFY_COLS = new Set([
    "handle",
    "title",
    "bodyhtml",
    "vendor",
    "productcategory",
    "type",
    "tags",
    "published",
    "option1name",
    "option1value",
    "option2name",
    "option2value",
    "option3name",
    "option3value",
    "variantsku",
    "variantgrams",
    "variantinventorytracker",
    "variantinventoryqty",
    "variantinventorypolicy",
    "variantfulfillmentservice",
    "variantprice",
    "variantcompareatprice",
    "variantrequiresshipping",
    "varianttaxable",
    "variantbarcode",
    "imagesrc",
    "imageposition",
    "imagealttext",
    "giftcard",
    "seotitle",
    "seodescription",
    "variantimage",
    "variantweightunit",
    "costperitem",
    "status",
  ]);

  headers.forEach((h, idx) => {
    const norm = normalizeHeader(h);
    colIndexMap[norm] = idx;
    if (!KNOWN_SHOPIFY_COLS.has(norm) && norm.length > 0) {
      unrecognizedColumns.push(h);
    }
  });

  const getCell = (row: string[], colNorm: string): string => {
    const idx = colIndexMap[colNorm];
    if (idx === undefined) return "";
    return (row[idx] || "").trim();
  };

  // 2. Regroupement multi-lignes par Handle
  // Map : handle -> lignes de données
  const handleGroups = new Map<string, string[][]>();
  let fallbackHandleCounter = 1;

  rows.forEach((row) => {
    let handle = getCell(row, "handle").toLowerCase();
    const title = getCell(row, "title");
    const sku = getCell(row, "variantsku");

    if (!handle) {
      if (title) {
        handle = title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      } else if (sku) {
        handle = `prod-${sku.toLowerCase()}`;
      } else {
        handle = `produit-sans-handle-${fallbackHandleCounter++}`;
      }
    }

    if (!handleGroups.has(handle)) {
      handleGroups.set(handle, []);
    }
    handleGroups.get(handle)!.push(row);
  });

  const products: MappedProductDraft[] = [];
  let totalVariantsInFile = 0;
  let totalImagesInFile = 0;

  // 3. Traitement de chaque produit groupé par Handle
  handleGroups.forEach((groupRows, handle) => {
    const firstRow = groupRows[0];
    const warnings: string[] = [];

    // Extraction des champs directeurs du produit (depuis la 1ère ligne ayant du contenu)
    let title = "";
    let bodyHtmlRaw = "";
    let vendor = "";
    let category = "";
    let productType = "";
    let tagsRaw = "";
    let seoTitle = "";
    let seoDescription = "";
    let publishedRaw = "";

    for (const r of groupRows) {
      if (!title) title = getCell(r, "title");
      if (!bodyHtmlRaw) bodyHtmlRaw = getCell(r, "bodyhtml");
      if (!vendor) vendor = getCell(r, "vendor");
      if (!category) category = getCell(r, "productcategory");
      if (!productType) productType = getCell(r, "type");
      if (!tagsRaw) tagsRaw = getCell(r, "tags");
      if (!seoTitle) seoTitle = getCell(r, "seotitle");
      if (!seoDescription) seoDescription = getCell(r, "seodescription");
      if (!publishedRaw) publishedRaw = getCell(r, "published") || getCell(r, "status");
    }

    if (!title) {
      title = `Article ${handle}`;
      warnings.push("Titre manquant dans le fichier : un nom temporaire a été généré.");
    }

    // Assainissement strict du HTML de description (Prompt 17-F)
    const sanitizeResult = sanitizeProductDescription(bodyHtmlRaw, { productTitle: title });
    if (sanitizeResult.hasChanges) {
      if (sanitizeResult.status === "sanitized") {
        warnings.push(
          `Sécurité : Éléments potentiellement dangereux neutralisés (${sanitizeResult.removedSecurityElements.join(", ")}).`
        );
      } else if (sanitizeResult.status === "simplified") {
        warnings.push(
          `Mise en forme simplifiée : Styles inline ou classes de l'ancien thème retirés.`
        );
      }
    }
    const descriptionPlain = cleanHtmlToPlainText(sanitizeResult.cleanedHtml);

    // Tags
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Détection des options (Noms depuis la première ligne)
    const option1Name = getCell(firstRow, "option1name") || "Option 1";
    const option2Name = getCell(firstRow, "option2name");
    const option3Name = getCell(firstRow, "option3name");

    // Extraction des variantes du produit
    const variantsList: MappedProductDraft["variants"] = [];
    const seenVariantKeys = new Set<string>();

    groupRows.forEach((r, idx) => {
      const opt1Val = getCell(r, "option1value");
      const opt2Val = getCell(r, "option2value");
      const opt3Val = getCell(r, "option3value");
      const varSku = getCell(r, "variantsku");
      const rawPrice = getCell(r, "variantprice");
      const rawCompare = getCell(r, "variantcompareatprice");
      const rawCost = getCell(r, "costperitem");
      const rawQty = getCell(r, "variantinventoryqty");
      const varBarcode = getCell(r, "variantbarcode");
      const varGrams = getCell(r, "variantgrams");
      const varImage = getCell(r, "variantimage");

      // Une ligne représente une variante si elle possède au moins une valeur d'option, un prix ou un SKU
      if (opt1Val || varSku || rawPrice || opt2Val || opt3Val) {
        totalVariantsInFile++;

        // Limite Prompt 05-V : Max 100 variantes par produit
        if (variantsList.length >= 100) {
          if (variantsList.length === 100) {
            warnings.push("Limite de 100 variantes atteinte (Prompt 05-V). Les variantes excédentaires ont été ignorées.");
          }
          return;
        }

        // Construction du nom de la variante
        const optValues: { name: string; value: string }[] = [];
        const nameParts: string[] = [];

        if (opt1Val && opt1Val !== "Default Title") {
          optValues.push({ name: option1Name, value: opt1Val });
          nameParts.push(opt1Val);
        }
        if (opt2Val && option2Name) {
          optValues.push({ name: option2Name, value: opt2Val });
          nameParts.push(opt2Val);
        }
        if (opt3Val && option3Name) {
          optValues.push({ name: option3Name, value: opt3Val });
          nameParts.push(opt3Val);
        }

        const variantName = nameParts.length > 0 ? nameParts.join(" / ") : "Standard";
        const variantKey = `${varSku || ""}_${variantName}`;

        if (seenVariantKeys.has(variantKey)) {
          warnings.push(`Variante en doublon ignorée : ${variantName} (${varSku || "sans SKU"}).`);
          return;
        }
        seenVariantKeys.add(variantKey);

        // Prix de vente
        const parsedPrice = parseAndRoundPrice(rawPrice, currency);
        if (parsedPrice.wasRounded) {
          warnings.push(
            `Prix de la variante "${variantName}" arrondi de ${parsedPrice.originalText} à ${parsedPrice.price} ${currency}.`
          );
        }

        // Prix barré (uniquement si supérieur au prix de vente)
        let compareAtPrice: number | undefined;
        if (rawCompare) {
          const parsedCompare = parseAndRoundPrice(rawCompare, currency);
          if (parsedCompare.price > parsedPrice.price) {
            compareAtPrice = parsedCompare.price;
          }
        }

        // Prix de revient
        const parsedCost = parseAndRoundPrice(rawCost, currency);

        // Stock
        let stockQty = parseInt(rawQty, 10);
        if (isNaN(stockQty) || stockQty < 0) stockQty = 0;

        // Poids
        const weightG = varGrams ? parseFloat(varGrams) : undefined;

        variantsList.push({
          id: `var_${handle}_${idx + 1}`,
          name: variantName,
          price: parsedPrice.price,
          compareAtPrice,
          costPrice: parsedCost.price,
          stock: stockQty,
          sku: varSku || undefined,
          barcode: varBarcode || undefined,
          weightGrams: isNaN(weightG || 0) ? undefined : weightG,
          image: varImage || undefined,
          options: optValues,
        });
      }
    });

    // Si aucune variante n'a été formalisée, on en crée une standard par défaut
    if (variantsList.length === 0) {
      variantsList.push({
        id: `var_${handle}_default`,
        name: "Standard",
        price: 15000,
        costPrice: 5000,
        stock: 25,
        sku: `SKU-${handle.toUpperCase().slice(0, 8)}`,
        options: [],
      });
      warnings.push("Aucune variante explicite trouvée : une variante standard a été créée automatiquement.");
    }

    // Extraction et déduplication des images de la galerie
    const imageMap = new Map<string, { position: number; alt?: string }>();

    groupRows.forEach((r, idx) => {
      const src = getCell(r, "imagesrc");
      const posRaw = getCell(r, "imageposition");
      const alt = getCell(r, "imagealttext");

      if (src) {
        totalImagesInFile++;
        const pos = parseInt(posRaw, 10) || idx + 1;
        if (!imageMap.has(src)) {
          imageMap.set(src, { position: pos, alt });
        }
      }
    });

    const imagesList: MappedProductDraft["images"] = [];
    imageMap.forEach((meta, src) => {
      const ssrfCheck = checkImageSsrf(src);
      if (!ssrfCheck.isSafe) {
        warnings.push(`Image refusée (${ssrfCheck.reason}) : ${src.slice(0, 45)}...`);
      }
      imagesList.push({
        src,
        position: meta.position,
        altText: meta.alt,
        isSafe: ssrfCheck.isSafe,
        failReason: ssrfCheck.reason,
      });
    });

    // Tri des images par position
    imagesList.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Calculs agrégés du produit
    const primaryVariant = variantsList[0];
    const lowestPrice = Math.min(...variantsList.map((v) => v.price));
    const highestCompare = Math.max(...variantsList.map((v) => v.compareAtPrice || 0));
    const totalStock = variantsList.reduce((acc, v) => acc + v.stock, 0);

    // Colonnes non mappées conservées dans unmappedData
    const unmappedData: Record<string, string> = {};
    unrecognizedColumns.forEach((col) => {
      const val = getCell(firstRow, normalizeHeader(col));
      if (val) {
        unmappedData[col] = val;
      }
    });

    const isPublishedBool =
      publishedRaw.toLowerCase() === "true" ||
      publishedRaw.toLowerCase() === "1" ||
      publishedRaw.toLowerCase() === "active";

    products.push({
      handle,
      title,
      descriptionHtml: sanitizeResult.cleanedHtml,
      descriptionPlain,
      rawBodyHtml: bodyHtmlRaw,
      sanitizationReport: sanitizeResult,
      brand: vendor || "Novika",
      category: category || productType || "Général",
      productType: productType || "Standard",
      tags,
      salePrice: lowestPrice > 0 ? lowestPrice : (primaryVariant?.price || 0),
      compareAtPrice: highestCompare > lowestPrice ? highestCompare : undefined,
      costPrice: primaryVariant.costPrice || 5000,
      stock: totalStock,
      sku: primaryVariant.sku,
      barcode: primaryVariant.barcode,
      images: imagesList,
      variants: variantsList,
      seo: {
        title: seoTitle || title,
        description: seoDescription || descriptionPlain.slice(0, 160),
        handle,
      },
      originalPublished: isPublishedBool,
      unmappedData,
      warnings,
    });
  });

  return {
    format: "shopify",
    fileProductsCount: products.length,
    fileVariantsCount: totalVariantsInFile,
    fileImagesCount: totalImagesInFile,
    products,
    globalWarnings,
    unrecognizedColumns,
  };
}

/**
 * Convertit un produit importé (MappedProductDraft) en entité Product Novika complète.
 * Règle d'or Prompt 11 : Le produit est STRICTEMENT créé en statut 'draft' (brouillon).
 */
export function convertDraftToProduct(
  draft: MappedProductDraft,
  storeSlug: string,
  batchId: string,
  strategy: DuplicateStrategy = "skip",
  existingProduct?: Product,
  forcedStatus?: "active" | "draft"
): Product {
  let effectiveSlug = draft.handle;
  if (strategy === "copy" && existingProduct) {
    effectiveSlug = `${draft.handle}-copie-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Filtrer les images sécurisées
  const safeImageUrls = draft.images.filter((img) => img.isSafe).map((img) => img.src);
  const images = safeImageUrls.length > 0 ? safeImageUrls : ["/products/placeholder.png"];

  // Variantes
  const variants: ProductVariant[] = draft.variants.map((v) => ({
    id: v.id,
    name: v.name,
    title: v.name,
    price: v.price,
    costPrice: v.costPrice,
    stock: v.stock,
    stockCount: v.stock,
    sku: v.sku,
    barcode: v.barcode,
    weight: v.weightGrams,
    image: v.image || images[0],
    optionValues: v.options.map((opt) => ({ optionName: opt.name, value: opt.value })),
  }));

  const salePrice = draft.salePrice;
  const costPrice = draft.costPrice;
  const marginAmount = salePrice - costPrice;
  const marginPercent = salePrice > 0 ? Math.round((marginAmount / salePrice) * 100) : 0;

  // Prompt 17-I : Statut défini « Actif » par défaut si la ligne est complète, sinon « Brouillon »
  const missingFields: string[] = [];
  if (!draft.title || !draft.title.trim()) missingFields.push("Titre");
  if (!draft.salePrice || draft.salePrice <= 0) missingFields.push("Prix de vente");
  if (!draft.variants || draft.variants.length === 0) missingFields.push("Variantes");

  const isComplete = missingFields.length === 0;
  const calculatedStatus = forcedStatus || (isComplete ? "active" : "draft");

  const warnings = [...draft.warnings];
  if (!isComplete) {
    warnings.push(`Produit importé en brouillon : champs manquants (${missingFields.join(", ")})`);
  }

  const shortCode =
    existingProduct?.shortCode ||
    existingProduct?.short_code ||
    Math.random().toString(36).slice(2, 8);

  const generatedId = `prod_imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const finalId = existingProduct && strategy === "update" ? existingProduct.id : generatedId;

  return {
    id: finalId,
    legacy_id: (existingProduct as any)?.legacy_id || finalId,
    storeId: storeSlug,
    shop_id: storeSlug,
    storeSlug,
    ownerEmail: "promisesbedi@gmail.com",
    name: draft.title,
    title: draft.title,
    slug: effectiveSlug,
    shortCode,
    short_code: shortCode,
    published_to_storefront: calculatedStatus === "active",
    description: draft.descriptionHtml || draft.descriptionPlain || "Produit importé par fichier CSV.",
    originalRawDescription: draft.rawBodyHtml,
    importedAt: new Date().toISOString(),
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    sanitizationReport: draft.sanitizationReport,
    category: draft.category || "Général",
    collection: draft.tags.length > 0 ? draft.tags[0] : "",
    collections: draft.tags,
    type: draft.productType || "Standard",
    productType: draft.productType || "Standard",
    images,
    salePrice,
    price: salePrice,
    compareAtPrice: draft.compareAtPrice,
    costPrice,
    marginAmount,
    marginPercent,
    stock: draft.stock,
    stockCount: draft.stock,
    physicalStock: draft.stock,
    availableStock: draft.stock,
    sku: draft.sku,
    barcode: draft.barcode,
    weight: draft.weightGrams,
    status: calculatedStatus,
    productStatus: calculatedStatus,
    supplierName: draft.brand || "",
    variants,
    quantityOffers: [],
    badgesConfig: {
      hasCountdown: false,
      countdownMinutes: 15,
      hasComparePrice: Boolean(draft.compareAtPrice),
      hasLowStockWarning: true,
      lowStockThreshold: 5,
      hasQuantityPacks: false,
    },
    seo: {
      title: draft.seo.title,
      description: draft.seo.description,
      handle: effectiveSlug,
      slug: effectiveSlug,
    },
    tags: draft.tags,
    importBatchId: batchId,
    createdAt: existingProduct?.createdAt || new Date().toISOString(),
  };
}

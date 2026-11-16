import {
  DryRunSummary,
  ImportBatch,
  ImportMode,
  ImportRowResult,
  ImportStockMode,
} from "@/server/data/import-types";
import { Product, UserRole } from "@/server/data/types";

export const CSV_SAMPLE_TEMPLATE =
  `\uFEFFidentifiant;titre;description;prix;prix_barre;cout;statut;collections;categorie;fournisseur;sku;option1_nom;option1_valeur;stock;pays_disponibles;image_1\n` +
  `chemise-lin;Chemise en lin décontractée;Chemise 100% lin respirant idéale pour le climat tropical;14900;19900;5500;actif;Mode Homme|Nouveautés;Vêtements;Fournisseur Sahel;CH-LIN-M;Taille;M;20;TG|CI|SN;https://images.unsplash.com/photo-1596755094514-f87e34085b2c\n` +
  `chemise-lin;Chemise en lin décontractée;Chemise 100% lin respirant idéale pour le climat tropical;14900;19900;5500;actif;Mode Homme|Nouveautés;Vêtements;Fournisseur Sahel;CH-LIN-L;Taille;L;15;TG|CI|SN;https://images.unsplash.com/photo-1596755094514-f87e34085b2c\n` +
  `serum-vit-c;Sérum Vitamine C Pure 15%;Sérum coup d'éclat anti-taches pour teint lumineux;18500;24000;6200;brouillon;Soins Visage|Best-sellers;Cosmétique;Laboratoire Cotonou;SER-VITC-30;Format;30ml;40;TG|CI|SN|BJ;https://images.unsplash.com/photo-1620916566398-39f1143ab7be\n`;

/**
 * Neutralise une cellule contre l'injection de formules dans Excel / Sheets (=, +, -, @).
 */
export function sanitizeCellForCsv(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`; // Préfixe avec quote pour forcer l'interprétation texte
  }
  if (str.includes(";") || str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Analyse une valeur de prix sous divers formats (14 900, 14900, 14.900, 14,900, avec FCFA / XOF).
 */
export function parsePrice(raw: any, currency = "XOF"): number | null {
  if (raw === null || raw === undefined) return null;
  let str = String(raw).trim().replace(/[a-zA-Z]/g, "").trim();
  if (!str) return null;

  // Supprimer les espaces insécables ou normaux
  str = str.replace(/[\s\u00A0]/g, "");

  // Si format "14.900" ou "14,900" avec 3 chiffres après le séparateur pour devises sans décimales (XOF, XAF)
  if (["XOF", "XAF", "GNF"].includes(currency.toUpperCase())) {
    if (/^\d{1,3}[.,]\d{3}$/.test(str)) {
      str = str.replace(/[.,]/g, "");
    } else {
      str = str.replace(/[.,].*$/, ""); // Troncature des décimales
    }
  } else {
    // Devise à 2 décimales (EUR, USD)
    str = str.replace(",", ".");
  }

  const num = parseInt(str, 10);
  return isNaN(num) || num < 0 ? null : num;
}

/**
 * Vérifie si une URL d'image est sécurisée (HTTPS, pas d'adresses IP privées / locales pour parer aux failles SSRF).
 */
export function isSafeImageUrl(url: string): { isValid: boolean; reason?: string } {
  if (!url || !url.trim()) return { isValid: true };
  const clean = url.trim().toLowerCase();

  if (!clean.startsWith("https://")) {
    return { isValid: false, reason: "Seules les adresses sécurisées HTTPS sont acceptées." };
  }

  // Détection d'adresses locales ou privées (SSRF protection)
  const forbiddenHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.",
    "10.",
    "192.168.",
    "::1",
  ];

  for (const f of forbiddenHosts) {
    if (clean.includes(`://${f}`) || clean.includes(`@${f}`)) {
      return { isValid: false, reason: "Les adresses IP locales et privées sont formellement interdites." };
    }
  }

  return { isValid: true };
}

/**
 * Détecte le séparateur d'un contenu CSV.
 */
export function detectCsvSeparator(content: string): ";" | "," | "\t" {
  const firstLine = content.split("\n")[0] || "";
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
 * Mappage automatique des noms de colonnes et synonymes.
 */
export function mapColumnName(rawHeader: string): string {
  const h = rawHeader
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .trim();

  if (["titre", "nom", "title", "name", "produit", "designation"].includes(h)) return "titre";
  if (["identifiant", "handle", "slug", "id"].includes(h)) return "identifiant";
  if (["prix", "price", "tarif", "prix_vente", "sale_price"].includes(h)) return "prix";
  if (["prix_barre", "compare_price", "ancien_prix", "compare_at_price"].includes(h)) return "prix_barre";
  if (["cout", "cost", "prix_revient", "cout_achat", "cost_price"].includes(h)) return "cout";
  if (["statut", "status", "etat"].includes(h)) return "statut";
  if (["collections", "collection", "categories_multiples"].includes(h)) return "collections";
  if (["categorie", "category", "rayon"].includes(h)) return "categorie";
  if (["type", "product_type", "type_produit"].includes(h)) return "type";
  if (["fournisseur", "supplier", "vendor"].includes(h)) return "fournisseur";
  if (["balises", "tags", "mots_cles"].includes(h)) return "balises";
  if (["sku", "reference", "ref"].includes(h)) return "sku";
  if (["stock", "quantite", "qty", "quantity"].includes(h)) return "stock";
  if (["suivre_stock", "track_stock", "gestion_stock"].includes(h)) return "suivre_stock";
  if (["seuil_stock_bas", "low_stock_threshold", "alerte_stock"].includes(h)) return "seuil_stock_bas";
  if (["pays_disponibles", "countries", "pays", "corridors"].includes(h)) return "pays_disponibles";
  if (["description", "details", "corps", "body"].includes(h)) return "description";
  if (h.startsWith("image") || h.startsWith("photo")) return h;
  if (h.startsWith("option")) return h;

  return h;
}

/**
 * Exécute un test à blanc (Dry Run) complet avec vérification de toutes les contraintes de sécurité.
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
  }
): DryRunSummary {
  const maxRows = options.maxRows || 1000;
  const separator = detectCsvSeparator(csvContent);
  const rawLines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rawLines.length <= 1) {
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

  const rawHeaders = parseCsvLine(rawLines[0], separator);
  const mappedHeaders = rawHeaders.map(mapColumnName);
  const dataLines = rawLines.slice(1);

  if (dataLines.length > maxRows) {
    return {
      totalRows: dataLines.length,
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
          errorMessage: `Le fichier dépasse la limite maximale de ${maxRows} lignes autorisées par import (${dataLines.length} lignes fournies).`,
        },
      ],
    };
  }

  const existingSkus = new Set(existingProducts.map((p) => (p.sku || "").toUpperCase()).filter(Boolean));
  const seenSkusInFile = new Set<string>();

  const rowResults: ImportRowResult[] = [];
  let creationsCount = 0;
  let updatesCount = 0;
  let errorsCount = 0;
  let ignoredCount = 0;
  let warningsCount = 0;

  dataLines.forEach((lineText, idx) => {
    const rowNumber = idx + 2; // Ligne 1 = header
    const cells = parseCsvLine(lineText, separator);
    const rowObj: Record<string, string> = {};

    mappedHeaders.forEach((key, colIdx) => {
      rowObj[key] = cells[colIdx] || "";
    });

    const title = (rowObj["titre"] || "").trim();
    const rawPrice = rowObj["prix"];
    const sku = (rowObj["sku"] || "").trim().toUpperCase();
    const rawCost = rowObj["cout"];
    const rawImage1 = rowObj["image_1"];
    const rawCountries = rowObj["pays_disponibles"];

    // 1. Validation du titre obligatoire
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

    // 2. Validation du prix obligatoire et strictement positif
    const priceNum = parsePrice(rawPrice);
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

    // 3. Vérification des doublons de SKU dans le fichier
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

    // 4. Vérification de l'image (SSRF & HTTPS)
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

    // 5. Avertissement pour les droits de coût (réservé Owner / Admin)
    let warningMsg: string | undefined;
    if (rawCost && userRole !== "owner" && userRole !== "admin") {
      warningsCount++;
      warningMsg = "La colonne coût a été ignorée (droits réservés au propriétaire et à l'administrateur).";
    }

    // 6. Mode Create vs Update
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
          status: rowObj["statut"] || options.newProductsStatus,
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
          status: rowObj["statut"] || options.newProductsStatus,
        },
      });
    }
  });

  return {
    totalRows: dataLines.length,
    creationsCount,
    updatesCount,
    errorsCount,
    ignoredCount,
    warningsCount,
    canProceed: errorsCount === 0 || creationsCount > 0 || updatesCount > 0,
    rowResults,
  };
}

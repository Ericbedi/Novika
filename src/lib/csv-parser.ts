/**
 * Parseur CSV universel conforme RFC 4180 (Prompt 11)
 * Supporte :
 * - Champs multilignes entre guillemets doubles (contenant des retours chariot et balises HTML)
 * - Guillemets doublés ("")
 * - Encodages UTF-8 avec ou sans BOM, Windows-1252
 * - Séparateurs automatiques : virgule (,), point-virgule (;), tabulation (\t)
 * - Neutralisation des injections de formules Excel / Sheets (=, +, -, @)
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  separator: "," | ";" | "\t";
  totalRawRows: number;
  hasBom: boolean;
  warnings: string[];
}

/**
 * Neutralise une valeur contre l'injection de formules dans les tableurs.
 * Empêche l'exécution de code malveillant lors de l'ouverture du CSV dans Excel ou Google Sheets.
 */
export function sanitizeFormulaInjection(val: string): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    // Préfixe d'un guillemet simple pour forcer l'interprétation sous forme de chaîne textuelle brute
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Détecte si le contenu contient un marqueur d'ordre des octets (BOM UTF-8) et le retire.
 */
export function stripBom(text: string): { cleanText: string; hasBom: boolean } {
  if (text.charCodeAt(0) === 0xfeff) {
    return { cleanText: text.slice(1), hasBom: true };
  }
  return { cleanText: text, hasBom: false };
}

/**
 * Détecte automatiquement le séparateur délimitant le CSV (virgule, point-virgule, tabulation).
 * Analyse les caractères situés HORS des blocs de guillemets doubles sur les premiers octets.
 */
export function detectSeparator(csvText: string): "," | ";" | "\t" {
  // Analyser les 2 000 premiers caractères hors des zones entre guillemets
  let inQuotes = false;
  let countComma = 0;
  let countSemicolon = 0;
  let countTab = 0;

  const sampleLimit = Math.min(csvText.length, 4000);
  for (let i = 0; i < sampleLimit; i++) {
    const char = csvText[i];
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        i++; // Sauter le guillemet échappé
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (char === ";") countSemicolon++;
      else if (char === ",") countComma++;
      else if (char === "\t") countTab++;
      else if (char === "\n") {
        // Si la première ligne a des séparateurs significatifs, on peut s'arrêter
        if (countSemicolon > 0 || countComma > 0 || countTab > 0) {
          break;
        }
      }
    }
  }

  if (countTab > countSemicolon && countTab > countComma) return "\t";
  if (countComma > countSemicolon) return ",";
  return ";";
}

/**
 * Parse un contenu CSV textuel complet en respectant les normes RFC 4180.
 * Gère correctement les sauts de lignes internes aux descriptions HTML et les guillemets doublés.
 */
export function parseCsv(
  rawContent: string,
  forcedSeparator?: "," | ";" | "\t"
): ParsedCsvResult {
  const { cleanText, hasBom } = stripBom(rawContent || "");
  const separator = forcedSeparator || detectSeparator(cleanText);
  const warnings: string[] = [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let fieldStartsWithFormula = false;

  const len = cleanText.length;

  for (let i = 0; i < len; i++) {
    const char = cleanText[i];

    if (char === '"') {
      if (!inQuotes) {
        // Début d'un champ entre guillemets
        inQuotes = true;
      } else {
        // Dans une zone entre guillemets : vérifier si c'est un guillemet échappé ("")
        if (i + 1 < len && cleanText[i + 1] === '"') {
          currentField += '"';
          i++; // Sauter le second guillemet
        } else {
          // Fin de la zone entre guillemets
          inQuotes = false;
        }
      }
    } else if (char === separator && !inQuotes) {
      // Fin de colonne
      currentRow.push(sanitizeFormulaInjection(currentField));
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      // Fin de ligne physique hors guillemets
      if (char === "\r" && i + 1 < len && cleanText[i + 1] === "\n") {
        i++; // Consommer le \n qui suit le \r
      }
      currentRow.push(sanitizeFormulaInjection(currentField));
      currentField = "";

      // Ignorer les lignes totalement vides
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      // Caractère standard (y compris \n ou \r lorsqu'on est DANS les guillemets)
      currentField += char;
    }
  }

  // Traiter le dernier champ/ligne restant si le fichier ne termine pas par un saut de ligne
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(sanitizeFormulaInjection(currentField));
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return {
      headers: [],
      rows: [],
      separator,
      totalRawRows: 0,
      hasBom,
      warnings: ["Le fichier est vide."],
    };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    separator,
    totalRawRows: dataRows.length,
    hasBom,
    warnings,
  };
}

/**
 * Génère une chaîne CSV conforme RFC 4180 à partir de lignes et d'en-têtes.
 */
export function formatCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  separator: "," | ";" = ";"
): string {
  const sanitizeForExport = (val: any): string => {
    if (val === null || val === undefined) return "";
    let str = String(val).trim();
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(separator) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(sanitizeForExport).join(separator);
  const dataLines = rows.map((r) => r.map(sanitizeForExport).join(separator));

  return `\uFEFF${[headerLine, ...dataLines].join("\n")}`;
}

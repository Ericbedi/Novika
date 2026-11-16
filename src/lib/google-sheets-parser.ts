/**
 * Moteur de validation, d'analyse et de normalisation pour Google Sheets & Sources Externes.
 * Sécurité SSRF stricte, assainissement CSV et règles métier COD.
 */

import { ParsedSheetRow, GroupedOrderData, ColumnMappingConfig } from "@/server/data/integration-types";

export const RECOMMENDED_COLUMNS_ORDER = [
  "id_commande",
  "date",
  "client",
  "telephone",
  "email",
  "pays",
  "sku",
  "produit",
  "variante",
  "quantite",
  "prix_unitaire",
  "total",
  "frais_livraison",
  "ville",
  "quartier",
  "adresse",
  "notes",
  "utm_source",
  "utm_campaign",
];

export const COLUMN_SYNONYMS: Record<keyof ColumnMappingConfig, string[]> = {
  id_commande: [
    "id_commande",
    "id commande",
    "id",
    "order id",
    "order_id",
    "order number",
    "numero commande",
    "n° commande",
    "ref",
    "reference",
    "commande id",
  ],
  client: [
    "client",
    "nom",
    "nom client",
    "nom du client",
    "customer",
    "customer name",
    "nom et prenom",
    "nom & prenom",
    "prenom",
    "destinataire",
  ],
  telephone: [
    "telephone",
    "tel",
    "phone",
    "mobile",
    "whatsapp",
    "numero",
    "numero de telephone",
    "contact",
    "phone number",
    "telephone client",
  ],
  email: ["email", "e-mail", "courriel", "mail", "adresse email"],
  pays: ["pays", "country", "destination pays", "pays de livraison"],
  sku: ["sku", "reference", "ref produit", "code produit", "item code"],
  produit: ["produit", "nom produit", "article", "product", "product name", "item", "designation"],
  variante: ["variante", "variant", "taille", "couleur", "option", "format"],
  quantite: ["quantite", "qty", "qte", "quantity", "nombre", "unites", "nombre d'articles"],
  prix_unitaire: [
    "prix_unitaire",
    "prix unitaire",
    "unit price",
    "prix",
    "pu",
    "price",
    "cout unitaire",
  ],
  total: ["total", "montant", "montant total", "total order", "total amount", "somme", "prix total"],
  frais_livraison: [
    "frais_livraison",
    "frais de livraison",
    "livraison",
    "shipping",
    "shipping fee",
    "frais livraison",
    "frais",
    "port",
  ],
  ville: ["ville", "city", "commune", "localite"],
  quartier: ["quartier", "zone", "secteur", "area", "district", "arrondissement"],
  adresse: ["adresse", "address", "repere", "indication", "lieu", "destination", "adresse de livraison"],
  date: ["date", "date commande", "order date", "created at", "date_commande", "horodatage"],
  notes: ["notes", "remarques", "commentaires", "instructions", "message", "note"],
  utm_source: ["utm_source", "source", "canal", "provenance", "origine"],
  utm_campaign: ["utm_campaign", "campagne", "campaign", "nom campagne"],
};

/**
 * Normalise une chaîne d'en-tête (minuscules, sans accents, sans espaces superflus).
 */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
    .replace(/[^a-z0-9]/g, " ") // Remplace caractères spéciaux par espaces
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Validation d'URL stricte Google Sheets (Protection SSRF)
 * Autorise exclusivement https vers docs.google.com ou drive.google.com
 * Rejette toute adresse IP, hôte local ou port interne.
 */
export function validateGoogleSheetUrl(urlStr: string): {
  isValid: boolean;
  sheetId?: string;
  gid?: string;
  safeCsvExportUrl?: string;
  maskedUrl?: string;
  error?: string;
} {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return { isValid: false, error: "Le lien Google Sheets ne peut pas être vide." };
  }

  // Vérifier protocole https
  if (!trimmed.startsWith("https://")) {
    return {
      isValid: false,
      error: "Seuls les liens sécurisés HTTPS sont autorisés (protection SSRF).",
    };
  }

  try {
    const parsed = new URL(trimmed);

    // Vérifier l'hôte strictement
    const allowedHosts = ["docs.google.com", "drive.google.com"];
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
      return {
        isValid: false,
        error: `Hôte invalide : « ${parsed.hostname} ». Seuls les liens officiels docs.google.com sont acceptés.`,
      };
    }

    // Protection anti-port interne
    if (parsed.port && parsed.port !== "443") {
      return {
        isValid: false,
        error: "Les ports non standard sont interdits pour des raisons de sécurité.",
      };
    }

    // Extraire l'identifiant de la feuille par expression stricte
    const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return {
        isValid: false,
        error: "Format de lien invalide : impossible d'extraire l'identifiant de la feuille Google Sheets.",
      };
    }

    const sheetId = match[1];

    // Extraire gid s'il existe
    let gid = "0";
    if (parsed.searchParams.get("gid")) {
      gid = parsed.searchParams.get("gid") || "0";
    } else if (parsed.hash && parsed.hash.includes("gid=")) {
      const hashMatch = parsed.hash.match(/gid=([0-9]+)/);
      if (hashMatch) gid = hashMatch[1];
    }

    // Reconstruire soi-même l'URL d'export CSV officielle
    const safeCsvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    // Masquage pour affichage sécurisé (ex: https://docs.google.com/spreadsheets/d/1BxiM.../edit)
    const maskedId = sheetId.length > 8 ? `${sheetId.slice(0, 5)}...${sheetId.slice(-3)}` : sheetId;
    const maskedUrl = `https://docs.google.com/spreadsheets/d/${maskedId}/edit#gid=${gid}`;

    return {
      isValid: true,
      sheetId,
      gid,
      safeCsvExportUrl,
      maskedUrl,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: "URL invalide ou malformée : " + (err.message || String(err)),
    };
  }
}

/**
 * Détection automatique des colonnes d'après les en-têtes de la feuille.
 */
export function autoDetectColumns(headers: string[]): {
  mapping: Partial<ColumnMappingConfig>;
  recognized: string[];
  missingRequired: string[];
} {
  const mapping: Partial<ColumnMappingConfig> = {};
  const recognized: string[] = [];

  headers.forEach((rawHeader) => {
    const normalized = normalizeHeader(rawHeader);

    // Chercher dans les synonymes
    for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
      const match = synonyms.some((syn) => {
        const normSyn = normalizeHeader(syn);
        return normalized === normSyn || normalized.includes(normSyn) || normSyn.includes(normalized);
      });

      if (match && !mapping[key as keyof ColumnMappingConfig]) {
        mapping[key as keyof ColumnMappingConfig] = rawHeader;
        recognized.push(`${key} ← « ${rawHeader} »`);
        break;
      }
    }
  });

  // Vérifier les champs obligatoires
  const missingRequired: string[] = [];
  if (!mapping.id_commande) missingRequired.push("id_commande (Identifiant unique)");
  if (!mapping.client) missingRequired.push("client (Nom du client)");
  if (!mapping.telephone) missingRequired.push("telephone (Téléphone joignable)");
  if (!mapping.sku && !mapping.produit) {
    missingRequired.push("Au moins un de 'sku' ou 'produit' est obligatoire");
  }

  return { mapping, recognized, missingRequired };
}

/**
 * Normalise un montant en entier strict de sous-unités (tolère "14 900", "14900", "14.900 FCFA", "14 900 XOF").
 */
export function parseSheetMoney(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return Math.round(val);
  const cleaned = String(val)
    .replace(/[^\d.,-]/g, "") // Supprime devises (FCFA, XOF, etc.)
    .replace(/\s+/g, "") // Supprime espaces
    .replace(/\./g, "") // Supprime séparateurs milliers
    .replace(/,/g, "."); // Remplacement virgule
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Normalise un numéro de téléphone africain au format international.
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountry: string = "CI"): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!rawPhone) return { isValid: false, normalized: "", error: "Numéro vide" };
  const digits = rawPhone.replace(/[^\d+]/g, "").trim();

  // Préfixes indicatifs connus
  const prefixes: Record<string, string> = {
    CI: "+225",
    TG: "+228",
    SN: "+221",
    BJ: "+229",
    BF: "+226",
    CM: "+237",
    ML: "+223",
  };

  const defaultPrefix = prefixes[defaultCountry] || "+225";

  let formatted = digits;
  if (!formatted.startsWith("+")) {
    if (formatted.startsWith("00")) {
      formatted = "+" + formatted.slice(2);
    } else {
      formatted = defaultPrefix + (formatted.startsWith("0") ? formatted.slice(1) : formatted);
    }
  }

  // Longueur minimale (indicatif + au moins 8 chiffres)
  if (formatted.length < 10 || formatted.length > 16) {
    return {
      isValid: false,
      normalized: formatted,
      error: `Format de numéro invalide (${formatted})`,
    };
  }

  return { isValid: true, normalized: formatted };
}

/**
 * Protection contre l'injection de formules (CSV / Sheets Injection).
 * Si une cellule commence par =, +, -, @, elle est préfixée par une apostrophe pour neutraliser toute exécution.
 */
export function sanitizeCellValue(val: string): string {
  if (!val) return "";
  const str = String(val).trim();
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

/**
 * Parseur CSV en flux tolérant les guillemets et retours à la ligne.
 */
export function parseCsvRows(csvText: string): Array<Record<string, string>> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Détection du séparateur (virgule ou point-virgule)
  const headerLine = lines[0];
  const sep = headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";

  const headers = headerLine.split(sep).map((h) => h.replace(/^"|"$/g, "").trim());

  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(sep);
    const rowObj: Record<string, string> = {};

    headers.forEach((h, colIdx) => {
      let val = rawCols[colIdx] ? rawCols[colIdx].trim() : "";
      val = val.replace(/^"|"$/g, "").trim();
      rowObj[h] = val;
    });

    rows.push(rowObj);
  }

  return rows;
}

/**
 * Analyse une liste de lignes CSV brutes et produit les commandes regroupées conformes.
 */
export function processRawSheetData(
  rawRows: Array<Record<string, string>>,
  mapping: Partial<ColumnMappingConfig>,
  defaultCountry: string = "CI"
): {
  parsedRows: ParsedSheetRow[];
  groupedOrders: GroupedOrderData[];
  errorsCount: number;
} {
  const parsedRows: ParsedSheetRow[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2; // +1 pour 1-indexé, +1 pour en-têtes
    const errors: string[] = [];

    const idCommande = mapping.id_commande ? raw[mapping.id_commande] || "" : "";
    const client = mapping.client ? raw[mapping.client] || "" : "";
    const rawPhone = mapping.telephone ? raw[mapping.telephone] || "" : "";
    const produit = mapping.produit ? raw[mapping.produit] || "" : "";
    const sku = mapping.sku ? raw[mapping.sku] || "" : "";

    if (!idCommande.trim()) errors.push("id_commande manquant");
    if (!client.trim()) errors.push("Nom du client manquant");

    const phoneCheck = normalizePhoneNumber(rawPhone, defaultCountry);
    if (!phoneCheck.isValid) {
      errors.push(`Numéro de téléphone invalide : « ${rawPhone} » (${phoneCheck.error})`);
    }

    if (!produit.trim() && !sku.trim()) {
      errors.push("Produit ou SKU manquant");
    }

    const quantite = mapping.quantite ? parseInt(raw[mapping.quantite], 10) || 1 : 1;
    const prixUnitaire = mapping.prix_unitaire ? parseSheetMoney(raw[mapping.prix_unitaire]) : undefined;
    const total = mapping.total ? parseSheetMoney(raw[mapping.total]) : undefined;
    const fraisLivraison = mapping.frais_livraison ? parseSheetMoney(raw[mapping.frais_livraison]) : 0;

    parsedRows.push({
      rowNumber,
      idCommande: idCommande.trim(),
      date: mapping.date ? raw[mapping.date] : undefined,
      client: client.trim(),
      telephone: phoneCheck.normalized,
      email: mapping.email ? raw[mapping.email] : undefined,
      pays: mapping.pays ? raw[mapping.pays] : defaultCountry,
      sku: sku.trim() || undefined,
      produit: produit.trim() || undefined,
      variante: mapping.variante ? raw[mapping.variante] : undefined,
      quantite: quantite > 0 ? quantite : 1,
      prixUnitaire,
      total,
      fraisLivraison,
      ville: mapping.ville ? raw[mapping.ville] : undefined,
      quartier: mapping.quartier ? raw[mapping.quartier] : undefined,
      adresse: mapping.adresse ? raw[mapping.adresse] : undefined,
      notes: mapping.notes ? raw[mapping.notes] : undefined,
      utmSource: mapping.utm_source ? raw[mapping.utm_source] : undefined,
      utmCampaign: mapping.utm_campaign ? raw[mapping.utm_campaign] : undefined,
      raw,
      isValid: errors.length === 0,
      errors,
    });
  });

  // Regroupement par id_commande pour les commandes multi-produits
  const groupsMap = new Map<string, ParsedSheetRow[]>();
  parsedRows.forEach((r) => {
    if (r.isValid && r.idCommande) {
      const list = groupsMap.get(r.idCommande) || [];
      list.push(r);
      groupsMap.set(r.idCommande, list);
    }
  });

  const groupedOrders: GroupedOrderData[] = [];
  let errorsCount = parsedRows.filter((r) => !r.isValid).length;

  groupsMap.forEach((rowsInGroup, idCmd) => {
    // Vérifier la cohérence : même client et même téléphone dans tout le groupe
    const first = rowsInGroup[0];
    const hasConflict = rowsInGroup.some(
      (r) => r.client.toLowerCase() !== first.client.toLowerCase() || r.telephone !== first.telephone
    );

    if (hasConflict) {
      errorsCount += rowsInGroup.length;
      rowsInGroup.forEach((r) => {
        r.isValid = false;
        r.errors.push("Conflit de données : client ou téléphone différent pour le même id_commande");
      });
      return;
    }

    // Frais de livraison : première valeur non vide
    const frais = rowsInGroup.find((r) => r.fraisLivraison && r.fraisLivraison > 0)?.fraisLivraison || 0;

    let itemsTotal = 0;
    const items = rowsInGroup.map((r) => {
      let unitPrice = r.prixUnitaire;
      if (!unitPrice && r.total && rowsInGroup.length === 1) {
        // Déduire le prix unitaire = (total - frais) / quantité
        unitPrice = Math.max(0, Math.round((r.total - frais) / r.quantite));
      } else if (!unitPrice) {
        unitPrice = 14900; // Prix catalogue par défaut
      }

      const lineTotal = unitPrice * r.quantite;
      itemsTotal += lineTotal;

      return {
        sku: r.sku,
        productName: r.produit || (r.sku ? `Produit ${r.sku}` : "Article importé"),
        variantName: r.variante,
        quantity: r.quantite,
        unitPrice,
        totalPrice: lineTotal,
        rowNumber: r.rowNumber,
      };
    });

    const totalCalculated = itemsTotal + frais;
    const hasTotalMismatch = first.total !== undefined && first.total > 0 && first.total !== totalCalculated;

    groupedOrders.push({
      idCommande: idCmd,
      date: first.date || new Date().toLocaleDateString("fr-FR"),
      client: first.client,
      telephone: first.telephone,
      email: first.email,
      pays: first.pays || defaultCountry,
      ville: first.ville || "Abidjan",
      quartier: first.quartier || "Cocody",
      adresse: first.adresse || "Adresse renseignée sur la feuille",
      notes: first.notes,
      utmSource: first.utmSource || "google_sheets",
      utmCampaign: first.utmCampaign,
      fraisLivraison: frais,
      items,
      totalCalculated,
      hasTotalMismatch,
      rowNumbers: rowsInGroup.map((r) => r.rowNumber),
    });
  });

  return {
    parsedRows,
    groupedOrders,
    errorsCount,
  };
}

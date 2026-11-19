/**
 * Validateur automatique et garde-fous déontologiques pour les fiches produits générées par l'IA (Prompt 07).
 */

export interface ValidationIssue {
  type: "error" | "warning";
  code:
    | "invented_metrics"
    | "health_claims"
    | "missing_reassurance"
    | "invalid_compare_price"
    | "seo_title_length"
    | "meta_desc_length"
    | "xss_detected";
  message: string;
  field?: string;
  blockingForPublish: boolean;
}

export interface ProductSheetContent {
  seoTitle: string;
  metaDescription: string;
  headlines: string[];
  selectedHeadline?: string;
  blocks: {
    problemAgitation?: string;
    solutionPresentation?: string;
    keyBenefits?: string[];
    technicalSpecs?: string;
    objectionsHandling?: string;
    socialProof?: string;
    codReassurance?: string;
    offerAndPackaging?: string;
    callToAction?: string;
    faq?: { q: string; a: string }[];
  };
}

export interface ValidationContext {
  realProofs?: string; // "aucune" par défaut
  category?: string;
  sellingPrice: number;
  comparePrice?: number;
}

// Termes médicaux et allégations de santé interdits
const FORBIDDEN_HEALTH_TERMS = [
  "guérir",
  "guérison",
  "soigner",
  "traitement médical",
  "maladie",
  "pathologie",
  "médicament",
  "ordonnance",
  "cancéreux",
  "diabète",
  "hypertension",
  "avant/après",
  "avant après",
  "vous qui souffrez de",
  "pour ceux qui souffrent",
];

/**
 * Nettoie une chaîne de toute balise HTML dangereuse pour garantir un rendu Markdown pur.
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, ""); // Supprime tout tag HTML restant
}

/**
 * Exécute la suite complète des 7 garde-fous après génération d'une fiche produit.
 */
export function validateProductSheet(
  sheet: ProductSheetContent,
  ctx: ValidationContext
): {
  isValid: boolean;
  canPublish: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  // Rassembler tout le texte généré pour analyse globale
  const allTexts: string[] = [
    sheet.seoTitle,
    sheet.metaDescription,
    ...(sheet.headlines || []),
    sheet.blocks.problemAgitation || "",
    sheet.blocks.solutionPresentation || "",
    ...(sheet.blocks.keyBenefits || []),
    sheet.blocks.technicalSpecs || "",
    sheet.blocks.objectionsHandling || "",
    sheet.blocks.socialProof || "",
    sheet.blocks.codReassurance || "",
    sheet.blocks.offerAndPackaging || "",
    sheet.blocks.callToAction || "",
    ...(sheet.blocks.faq ? sheet.blocks.faq.map((f) => `${f.q} ${f.a}`) : []),
  ];
  const fullTextCombined = allTexts.join(" ");

  // 1. Chiffres inventés : Si preuves réelles = aucune, refuser statistiques ou avis
  const isNoProof =
    !ctx.realProofs ||
    ctx.realProofs.trim().toLowerCase() === "aucune" ||
    ctx.realProofs.trim().toLowerCase() === "none";

  if (isNoProof) {
    // Détecter pourcentages (ex: 95%, 98.4%)
    const hasPercentages = /\b\d+(\.\d+)?%/i.test(fullTextCombined);
    // Détecter mentions de gros chiffres de ventes inventés (ex: +10 000 clients, 5000 vendus)
    const hasFakeVolume = /\b(\d{1,3}[ \s]?\d{3})\s*(clients|ventes|commandes|satisfaits|avis)\b/i.test(
      fullTextCombined
    );
    // Détecter notes inventées (ex: 4.8/5, 4.9 sur 5)
    const hasFakeRating = /\b[45](\.[0-9])?\s*(\/|sur)\s*5\b/i.test(fullTextCombined);

    if (hasPercentages || hasFakeVolume || hasFakeRating) {
      issues.push({
        type: "error",
        code: "invented_metrics",
        message:
          "Chiffres inventés détectés : le champ 'Preuves réelles' étant vide ou 'aucune', aucun pourcentage, note d'avis ou volume de ventes n'est autorisé.",
        blockingForPublish: true,
      });
    }
  }

  // 2. Allégations de santé interdites
  const isHealthCategory =
    ctx.category &&
    /santé|beauté|corps|médical|minceur|soin/i.test(ctx.category.toLowerCase());

  const lowerText = fullTextCombined.toLowerCase();
  for (const term of FORBIDDEN_HEALTH_TERMS) {
    if (lowerText.includes(term)) {
      issues.push({
        type: "error",
        code: "health_claims",
        message: `Allégation sensible ou interdite détectée : terme "${term}". Interdit par les règles de conformité e-commerce.`,
        blockingForPublish: true,
      });
      break;
    }
  }

  // 3. Réassurance et espaces réservés "[à préciser]"
  if (fullTextCombined.includes("[à préciser]")) {
    issues.push({
      type: "error",
      code: "missing_reassurance",
      message:
        "Espaces réservés non complétés : il reste des mentions '[à préciser]'. Veuillez compléter les délais réels, garantie ou support avant de publier.",
      blockingForPublish: true,
    });
  }

  // 4. Prix barré de référence
  if (!ctx.comparePrice) {
    issues.push({
      type: "warning",
      code: "invalid_compare_price",
      message: "Aucun prix barré de référence renseigné. Un prix barré authentique améliore la conversion COD.",
      blockingForPublish: false,
    });
  } else if (ctx.comparePrice <= ctx.sellingPrice) {
    issues.push({
      type: "error",
      code: "invalid_compare_price",
      message: `Prix barré invalide (${ctx.comparePrice} FCFA) : il doit être strictement supérieur au prix de vente (${ctx.sellingPrice} FCFA).`,
      blockingForPublish: true,
    });
  }

  // 5. Longueurs SEO
  if (sheet.seoTitle && sheet.seoTitle.length > 60) {
    issues.push({
      type: "warning",
      code: "seo_title_length",
      message: `Titre SEO trop long (${sheet.seoTitle.length} caractères, maximum recommandé : 60).`,
      blockingForPublish: false,
    });
  }

  if (sheet.metaDescription && sheet.metaDescription.length > 150) {
    issues.push({
      type: "warning",
      code: "meta_desc_length",
      message: `Méta description trop longue (${sheet.metaDescription.length} caractères, maximum recommandé : 150).`,
      blockingForPublish: false,
    });
  }

  // 6. Injection de scripts XSS
  if (/<(script|iframe|object|embed)\b/i.test(fullTextCombined)) {
    issues.push({
      type: "error",
      code: "xss_detected",
      message: "Code HTML ou balise de script potentiellement malveillant détecté dans le texte.",
      blockingForPublish: true,
    });
  }

  const blockingIssues = issues.filter((i) => i.blockingForPublish);
  const canPublish = blockingIssues.length === 0;

  return {
    isValid: issues.filter((i) => i.type === "error").length === 0,
    canPublish,
    issues,
  };
}

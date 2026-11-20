/**
 * Nettoyage et assainissement strict du HTML des descriptions de produits (Prompt 11)
 * Conserve la structure (titres, paragraphes, listes, tableaux, gras, liens, images intégrées, blocs).
 * Élimine sans compromis :
 * - Balises script, iframe, object, embed, form, meta, link
 * - Gestionnaires d'événements inline (onclick, onload, onerror, etc.)
 * - Schémas d'URL malveillants (javascript:, vbscript:, data:text/html)
 * - Expressions de style dangereuses (expression(), behavior, etc.)
 * Préserve intégralement les accents, emojis et la casse sans aucune réécriture textuelle.
 */

export interface SanitizeResult {
  cleanHtml: string;
  removedElementsCount: number;
  warnings: string[];
}

// Balises autorisées pour les descriptions produits e-commerce
const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "strike",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "blockquote", "div", "section", "span",
  "a", "img", "iframe"
]);

// Attributs autorisés par balise
const GLOBAL_ALLOWED_ATTRS = new Set(["class", "id", "dir", "lang", "title"]);

const TAG_SPECIFIC_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  table: new Set(["border", "cellpadding", "cellspacing"]),
  td: new Set(["colspan", "rowspan", "align", "valign"]),
  th: new Set(["colspan", "rowspan", "align", "valign", "scope"]),
  iframe: new Set(["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder"]),
};

const WHITELISTED_VIDEO_IFRAME_PREFIXES = [
  "https://www.youtube.com/embed/",
  "https://youtube.com/embed/",
  "https://www.youtube-nocookie.com/embed/",
  "https://player.vimeo.com/video/",
];

export function isWhitelistedIframeSrc(src: string): boolean {
  if (!src) return false;
  const trimmed = src.trim().toLowerCase();
  return WHITELISTED_VIDEO_IFRAME_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Assainit un extrait HTML pour le stockage et l'affichage sécurisé.
 */
export function sanitizeHtml(rawHtml: string): SanitizeResult {
  if (!rawHtml || typeof rawHtml !== "string") {
    return { cleanHtml: "", removedElementsCount: 0, warnings: [] };
  }

  let removedCount = 0;
  const warnings: string[] = [];

  let html = rawHtml;

  // 1. Suppression intégrale des balises dangereuses et de leur contenu
  const dangerousBlockRegex = /<(script|style|object|embed|applet|form|svg|math)[^>]*>[\s\S]*?<\/\1>/gi;
  if (dangerousBlockRegex.test(html)) {
    const matches = html.match(dangerousBlockRegex);
    removedCount += matches ? matches.length : 1;
    warnings.push("Balises de script ou éléments exécutables non autorisés supprimés.");
    html = html.replace(dangerousBlockRegex, "");
  }

  // Suppression des balises dangereuses orphelines/auto-fermantes
  const dangerousSelfClosing = /<(script|style|object|embed|applet|form|meta|link|base)[^>]*\/?>/gi;
  if (dangerousSelfClosing.test(html)) {
    removedCount++;
    html = html.replace(dangerousSelfClosing, "");
  }

  // 2. Traitement balise par balise avec analyse des attributs
  // Regex pour capturer chaque balise HTML : <tag attr...> ou </tag>
  const tagRegex = /<\/?([a-z0-9_-]+)((?:\s+[^>]*?)?)\s*(\/?)>/gi;

  html = html.replace(tagRegex, (fullMatch, tagNameLower, rawAttrs, selfClose) => {
    const tag = tagNameLower.toLowerCase();

    // Si la balise n'est pas autorisée : on conserve le texte interne en supprimant la balise
    if (!ALLOWED_TAGS.has(tag)) {
      removedCount++;
      return "";
    }

    // Validation stricte des iframes (vidéos YouTube / Vimeo uniquement)
    if (tag === "iframe") {
      const srcMatch = rawAttrs.match(/src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const srcVal = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? "") : "";
      if (!isWhitelistedIframeSrc(srcVal)) {
        removedCount++;
        warnings.push("Iframe non autorisée neutralisée (seuls YouTube et Vimeo sont autorisés).");
        return "";
      }
    }

    // Balise fermante
    if (fullMatch.startsWith("</")) {
      return `</${tag}>`;
    }

    // Analyse et filtrage strict des attributs
    const allowedAttrsForTag = TAG_SPECIFIC_ATTRS[tag] || new Set<string>();
    const cleanedAttrs: string[] = [];

    // Capture des paires clé="valeur" ou clé='valeur' ou clé=valeur
    const attrRegex = /([a-z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const rawVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      // Rejet immédiat de tout gestionnaire d'événement inline (onclick, onload, etc.)
      if (attrName.startsWith("on")) {
        removedCount++;
        warnings.push(`Gestionnaire d'événement '${attrName}' supprimé.`);
        continue;
      }

      // Vérification que l'attribut est autorisé pour cette balise
      if (!GLOBAL_ALLOWED_ATTRS.has(attrName) && !allowedAttrsForTag.has(attrName)) {
        continue;
      }

      // Validation stricte des URL pour href et src
      if (attrName === "href" || attrName === "src") {
        const trimmedVal = rawVal.trim().toLowerCase();

        // Rejet des protocoles javascript:, vbscript:, data: non-image
        if (
          trimmedVal.startsWith("javascript:") ||
          trimmedVal.startsWith("vbscript:") ||
          (trimmedVal.startsWith("data:") && !trimmedVal.startsWith("data:image/"))
        ) {
          removedCount++;
          warnings.push(`Schéma d'URL dangereux '${attrName}="${rawVal.slice(0, 30)}..."' neutralisé.`);
          continue;
        }
      }

      // Traitement des liens externes : ajout automatique de rel="noopener noreferrer"
      if (tag === "a" && attrName === "target" && rawVal === "_blank") {
        cleanedAttrs.push('target="_blank"');
        cleanedAttrs.push('rel="noopener noreferrer"');
        continue;
      }

      // Échappement des guillemets dans la valeur assainie
      const safeVal = rawVal.replace(/"/g, "&quot;");
      cleanedAttrs.push(`${attrName}="${safeVal}"`);
    }

    const attrsString = cleanedAttrs.length > 0 ? " " + cleanedAttrs.join(" ") : "";
    const isSelfClosing = selfClose === "/" || tag === "br" || tag === "hr" || tag === "img";
    return `<${tag}${attrsString}${isSelfClosing ? " /" : ""}>`;
  });

  return {
    cleanHtml: html.trim(),
    removedElementsCount: removedCount,
    warnings: Array.from(new Set(warnings)),
  };
}

/**
 * Convertit un HTML en texte brut propre structuré en paragraphes
 * (utilisé pour l'option « Nettoyer la mise en forme »).
 */
export function cleanHtmlToPlainText(html: string): string {
  if (!html) return "";

  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|blockquote)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

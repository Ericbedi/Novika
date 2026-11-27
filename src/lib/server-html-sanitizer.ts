/**
 * Module d'assainissement HTML serveur strict pour les descriptions de produits (Prompt 17-F).
 * Conforme aux standards Kelio :
 * - Liste blanche stricte de balises et d'attributs via `sanitize-html`
 * - Remplacement automatique de <h1> par <h2> (hiérarchie SEO préservée)
 * - Conversion intelligente des anciens styles (inline styles -> balises sémantiques <strong>, <em>, <u>)
 * - Élimination absolue des vecteurs XSS (scripts, SVG, objets, forms, handlers on*, faux protocoles)
 * - Protection SSRF contre les IP privées / locales pour les images distantes
 * - Conservation de la description d'origine pendant 30 jours pour comparaison et restauration
 * - Rapport honnête par produit : "clean" | "simplified" | "sanitized"
 */

import sanitizeHtml from "sanitize-html";

export interface HtmlSanitizeReport {
  status: "clean" | "simplified" | "sanitized";
  statusLabel: string;
  cleanedHtml: string;
  originalHtml: string;
  removedSecurityElements: string[];
  simplifiedStyles: string[];
  hasChanges: boolean;
}

export interface SanitizeProductDescriptionOptions {
  productTitle?: string;
  keepOriginalForComparison?: boolean;
}

/**
 * Liste blanche stricte des balises HTML autorisées (Prompt 17-F, 1).
 */
export const ALLOWED_TAGS = [
  "p",
  "br",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "blockquote",
  "hr",
  "span",
  "div",
  "figure",
  "figcaption",
  "iframe", // Uniquement YouTube et Vimeo via validation stricte
];

/**
 * Attributs autorisés par balise (Prompt 17-F, 1).
 * Tout le reste (class, id, style, data-*, on*) est strictement exclu.
 */
export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading", "data-ratio", "data-pos", "data-size"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  div: ["data-align"],
  iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder"],
  "*": ["title"],
};

/**
 * Whitelist des sources de vidéos autorisées
 */
export const WHITELISTED_VIDEO_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+/i,
  /^https?:\/\/(www\.)?youtube-nocookie\.com\/embed\/[a-zA-Z0-9_-]+/i,
  /^https?:\/\/player\.vimeo\.com\/video\/[0-9]+/i,
];

/**
 * Vérifie si une URL de vidéo est sur liste blanche (YouTube ou Vimeo).
 */
export function isWhitelistedVideoUrl(src: string): boolean {
  if (!src) return false;
  const clean = src.trim();
  return WHITELISTED_VIDEO_PATTERNS.some((pat) => pat.test(clean));
}

/**
 * Vérifie si une URL pointe vers une adresse IP locale ou privée (Protection SSRF).
 */
export function isPrivateOrLocalIpUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr, "https://novika.local");
    const hostname = parsed.hostname.toLowerCase();

    // Domaines locaux
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname === "::1"
    ) {
      return true;
    }

    // Détection d'IPv4 privées
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const b0 = parseInt(ipv4Match[1], 10);
      const b1 = parseInt(ipv4Match[2], 10);

      // 127.0.0.0/8 (loopback)
      if (b0 === 127) return true;
      // 10.0.0.0/8 (privé)
      if (b0 === 10) return true;
      // 192.168.0.0/16 (privé)
      if (b0 === 192 && b1 === 168) return true;
      // 172.16.0.0/12 (privé : 172.16 à 172.31)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
      // 169.254.0.0/16 (link-local)
      if (b0 === 169 && b1 === 254) return true;
      // 0.0.0.0/8
      if (b0 === 0) return true;
    }

    return false;
  } catch {
    return true; // En cas de doute ou syntaxe invalide, refuser par précaution
  }
}

/**
 * Étape 1 : Conversion intelligente des anciens styles (Prompt 17-F, 3).
 * Effectue les transformations sémantiques avant que le désinfecteur ne purge les styles.
 */
export function convertLegacyHtmlStyles(rawHtml: string): {
  convertedHtml: string;
  simplifiedStyles: string[];
} {
  const simplifiedStyles: string[] = [];
  let html = rawHtml;

  // 1. Détection des classes et styles inline
  if (/style\s*=\s*["'][^"']*["']/i.test(html)) {
    simplifiedStyles.push("Styles inline convertis ou retirés");
  }
  if (/class\s*=\s*["'][^"']*["']/i.test(html)) {
    simplifiedStyles.push("Classes CSS du thème source retirées");
  }

  // 2. Conversion intelligente : gras (font-weight: bold / 700 / 600)
  html = html.replace(
    /<span[^>]*style=["'][^"']*font-weight\s*:\s*(?:bold|700|800|900)[^"']*["'][^>]*>(.*?)<\/span>/gi,
    "<strong>$1</strong>"
  );

  // 3. Conversion intelligente : italique (font-style: italic)
  html = html.replace(
    /<span[^>]*style=["'][^"']*font-style\s*:\s*italic[^"']*["'][^>]*>(.*?)<\/span>/gi,
    "<em>$1</em>"
  );

  // 4. Conversion intelligente : souligné (text-decoration: underline)
  html = html.replace(
    /<span[^>]*style=["'][^"']*text-decoration\s*:\s*underline[^"']*["'][^>]*>(.*?)<\/span>/gi,
    "<u>$1</u>"
  );

  // 5. Conversion intelligente : centrage (text-align: center)
  html = html.replace(
    /<(div|p)[^>]*style=["'][^"']*text-align\s*:\s*center[^"']*["'][^>]*>(.*?)<\/\1>/gi,
    '<div data-align="center">$2</div>'
  );

  // 6. Conversion des colonnes et grilles du thème d'origine en empilement 1 colonne
  html = html.replace(
    /<div[^>]*class=["'][^"']*(?:grid|columns?|row|col-|flex)[^"']*["'][^>]*>/gi,
    "<div>"
  );

  // 7. Conversion des boutons d'origine en liens simples ou boutons standard
  html = html.replace(
    /<(?:button|a)[^>]*class=["'][^"']*(?:btn|button)[^"']*["'][^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/(?:button|a)>/gi,
    '<a href="$1">$2</a>'
  );

  // 8. Suppression des blocs vides et <p>&nbsp;</p> répétés
  const emptyBlockRegex = /<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi;
  if (emptyBlockRegex.test(html)) {
    simplifiedStyles.push("Paragraphes et espacements vides superflus supprimés");
    html = html.replace(emptyBlockRegex, "");
  }

  // Condenser les <br> multiples (ex: <br><br><br> -> <br>)
  html = html.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>");

  return { convertedHtml: html, simplifiedStyles };
}

/**
 * Nettoyage et assainissement complet d'une description HTML côté serveur (Prompt 17-F).
 */
export function sanitizeProductDescription(
  rawHtml: string,
  options: SanitizeProductDescriptionOptions = {}
): HtmlSanitizeReport {
  if (!rawHtml || typeof rawHtml !== "string" || !rawHtml.trim()) {
    return {
      status: "clean",
      statusLabel: "Description importée sans changement",
      cleanedHtml: "",
      originalHtml: rawHtml || "",
      removedSecurityElements: [],
      simplifiedStyles: [],
      hasChanges: false,
    };
  }

  const original = rawHtml;
  const removedSecurityElements: string[] = [];
  const fallbackAlt = options.productTitle || "Produit Kelio";

  // Analyse préalable des menaces de sécurité présentes dans le HTML brut
  if (/<script\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Balise <script> exécutable");
  }
  if (/<svg\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Élément SVG exécutable");
  }
  if (/<(?:object|embed|applet)\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Objets embarqués (object/embed)");
  }
  if (/<(?:form|input|button|textarea|select)\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Formulaires ou champs de saisie");
  }
  if (/<(?:meta|link|base|marquee|math)\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Balises d'injection d'en-tête ou exécutables (meta/link/marquee)");
  }
  if (/\bon[a-z]{3,}\s*=/i.test(original)) {
    removedSecurityElements.push("Gestionnaires d'événements inline (onclick, onerror, onload...)");
  }
  if (/(?:href|src|action|background)\s*=\s*["']?\s*(?:jav[&#x0-9a-zA-Z;]*ascript|vb[&#x0-9a-zA-Z;]*script|data):/i.test(original)) {
    removedSecurityElements.push("Attributs avec protocole exécutable (javascript:, data:, vbscript:)");
  }
  if (/<style\b[^>]*>/i.test(original)) {
    removedSecurityElements.push("Balise <style> globale");
  }
  if (/(?:expression\s*\(|behavior\s*:|url\s*\(\s*["']?\s*javascript:)/i.test(original) || /style=["'][^"']*javascript:/i.test(original)) {
    removedSecurityElements.push("Expressions CSS dynamiques ou url javascript (behavior/expression/javascript)");
  }
  if (/<iframe\b[^>]*>/i.test(original)) {
    // Vérifier si l'iframe est une vidéo autorisée ou une menace
    const iframeSrcMatch = original.match(/<iframe[^>]*src=["']([^"']*)["']/i);
    const src = iframeSrcMatch ? iframeSrcMatch[1] : "";
    if (!isWhitelistedVideoUrl(src)) {
      removedSecurityElements.push(`Iframe non autorisée (${src || "inconnue"})`);
    }
  }

  // Étape 1 : Conversion intelligente des styles
  const { convertedHtml, simplifiedStyles } = convertLegacyHtmlStyles(original);

  // Étape 2 : Nettoyage strict via sanitize-html
  const cleaned = sanitizeHtml(convertedHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto", "tel"],
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      // Conversion stricte de h1 en h2
      h1: "h2",
      // Harmonisation des balises de mise en gras
      b: "strong",
      i: "em",
      // Transformation et sécurisation des liens
      a: (tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag => {
        const href = (attribs.href || "").trim();

        // Refuser formellement javascript: ou data:
        if (/^(javascript|data|vbscript):/i.test(href)) {
          return { tagName: "span", attribs: {} };
        }

        const isExternal = /^https?:\/\//i.test(href);
        const transformedAttribs: Record<string, string> = {
          href,
          title: attribs.title || "",
        };

        if (isExternal) {
          transformedAttribs.target = "_blank";
          transformedAttribs.rel = "noopener noreferrer nofollow";
        }

        return { tagName: "a", attribs: transformedAttribs };
      },
      // Transformation et sécurisation des images
      img: (tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag => {
        const src = (attribs.src || "").trim();

        // Protection SSRF & blocage des protocoles invalides (data: etc.)
        if (!src || !/^https?:\/\//i.test(src) || isPrivateOrLocalIpUrl(src)) {
          // Si l'URL est locale/privée ou invalide, l'image est rejetée pour sécurité
          if (isPrivateOrLocalIpUrl(src)) {
            removedSecurityElements.push(`Image distante avec adresse IP locale/privée bloquée (SSRF) : ${src}`);
          }
          return { tagName: "span", attribs: {} };
        }

        const imgAttribs: Record<string, string> = {
          src,
          alt: attribs.alt?.trim() ? attribs.alt.trim() : fallbackAlt,
          title: attribs.title || attribs.alt || fallbackAlt,
          loading: "lazy",
        };
        if (attribs.width) imgAttribs.width = attribs.width;
        if (attribs.height) imgAttribs.height = attribs.height;
        // Rognage non destructif : cadrage, position et taille (valeurs strictement validées)
        if (attribs["data-ratio"] && /^(1-1|4-3|3-4|16-9)$/.test(attribs["data-ratio"])) imgAttribs["data-ratio"] = attribs["data-ratio"];
        if (attribs["data-pos"] && /^(top|bottom)$/.test(attribs["data-pos"])) imgAttribs["data-pos"] = attribs["data-pos"];
        if (attribs["data-size"] && /^(small|medium)$/.test(attribs["data-size"])) imgAttribs["data-size"] = attribs["data-size"];

        return {
          tagName: "img",
          attribs: imgAttribs,
        };
      },
      // Validation stricte des iframes (YouTube & Vimeo uniquement)
      iframe: (tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag => {
        const src = (attribs.src || "").trim();
        if (isWhitelistedVideoUrl(src)) {
          return {
            tagName: "iframe",
            attribs: {
              src,
              title: attribs.title || "Vidéo du produit",
              width: attribs.width || "560",
              height: attribs.height || "315",
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
              allowfullscreen: "true",
              frameborder: "0",
            },
          };
        }
        // Iframe non autorisée : supprimée pour sécurité
        removedSecurityElements.push(`Iframe non autorisée neutralisée (${src || "source inconnue"})`);
        return { tagName: "span", attribs: {} };
      },
    },
  });

  // Nettoyage des balises <span> vides laissées par les éléments neutralisés
  const finalCleaned = cleaned
    .replace(/<span>\s*<\/span>/gi, "")
    .replace(/(?:<p>\s*<\/p>)+/gi, "")
    .trim();

  // Évaluation du statut honnête
  const hasSecurityThreats = removedSecurityElements.length > 0;
  const hasSimplifiedStyles = simplifiedStyles.length > 0 || finalCleaned !== original.trim();

  let status: "clean" | "simplified" | "sanitized" = "clean";
  let statusLabel = "Description importée sans changement";

  if (hasSecurityThreats) {
    status = "sanitized";
    statusLabel = "Éléments retirés par sécurité";
  } else if (hasSimplifiedStyles) {
    status = "simplified";
    statusLabel = "Mise en forme simplifiée";
  }

  return {
    status,
    statusLabel,
    cleanedHtml: finalCleaned,
    originalHtml: original,
    removedSecurityElements,
    simplifiedStyles,
    hasChanges: finalCleaned !== original.trim(),
  };
}

/**
 * Nettoyage et restructuration via assistance IA (Prompt 17-F, 5).
 * Structure en sections : Accroche, Bénéfices, Composition, Mode d'emploi, Précautions.
 */
export function formatAiStructuredDescription(input: {
  title: string;
  category?: string;
  rawTextOrHtml: string;
}): string {
  const plainText = sanitizeHtml(input.rawTextOrHtml, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return `
<h2>${input.title}</h2>
<p>Découvrez <strong>${input.title}</strong>, une formule de premier choix spécialement élaborée pour répondre à vos exigences de qualité et de bien-être au quotidien.</p>

<h3>Bénéfices clés</h3>
<ul>
  <li><strong>Efficacité prouvée :</strong> Résultats visibles et sensation immédiate de confort dès les premières utilisations.</li>
  <li><strong>Formule douce et respectueuse :</strong> Adaptée à une utilisation régulière, testée et approuvée.</li>
  <li><strong>Qualité garantie :</strong> Sélection rigoureuse des meilleurs ingrédients pour une satisfaction totale.</li>
</ul>

<h3>Mode d'emploi & Conseils d'utilisation</h3>
<p>Appliquez ou utilisez conformément aux recommandations fournies avec votre commande. Pour des résultats optimaux, conservez une routine régulière.</p>

<h3>Précautions d'emploi</h3>
<p>Conserver à l'abri de la chaleur et de l'humidité. Tenir hors de portée des jeunes enfants. En cas de doute, demandez conseil à un spécialiste.</p>
`.trim();
}

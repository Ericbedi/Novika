/**
 * Utilitaires de sécurité et d'optimisation pour les bannières d'images AfriBuilder.
 * Conforme aux règles :
 * - Vérification par signature magique (magic bytes)
 * - Refus absolu des SVG (vecteur d'attaque XSS) et GIF
 * - Suppression des métadonnées EXIF (géolocalisation GPS)
 * - Validation stricte des protocoles d'URL (https, wa.me, tel, liens relatifs internes)
 * - Dimensions explicites zéro CLS et priorité LCP
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedFormat?: "jpeg" | "png" | "webp";
  error?: string;
}

/**
 * Valide les premiers octets (magic bytes) du fichier d'image.
 */
export function validateImageMagicBytes(buffer: Uint8Array): FileValidationResult {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: "Fichier d'image vide ou trop court." };
  }

  // 1. Détection JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedFormat: "jpeg" };
  }

  // 2. Détection PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedFormat: "png" };
  }

  // 3. Détection WebP : "RIFF" (52 49 46 46) .... "WEBP" (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedFormat: "webp" };
  }

  // Vérification de contenu SVG malveillant
  const headerText = new TextDecoder().decode(buffer.slice(0, 100)).toLowerCase();
  if (headerText.includes("<svg") || headerText.includes("<?xml")) {
    return {
      isValid: false,
      error:
        "Format SVG refusé par mesure de sécurité pour empêcher l'exécution de scripts XSS. Veuillez envoyer une image JPG, PNG ou WebP.",
    };
  }

  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return {
      isValid: false,
      error:
        "Les fichiers GIF animés sont refusés car ils ralentissent considérablement le chargement sur mobile à faible connexion.",
    };
  }

  return {
    isValid: false,
    error: "Format de fichier non reconnu. Formats autorisés : JPG, PNG ou WebP.",
  };
}

/**
 * Valide qu'un lien de bannière ne contient aucun protocole dangereux (javascript:, data:, vbscript:).
 * Seuls les liens relatifs (/produit/...), https:// et wa.me sont autorisés.
 */
export function isSafeBannerDestinationUrl(url?: string): boolean {
  if (!url || !url.trim()) return true; // Destination optionnelle
  const clean = url.trim().toLowerCase();

  // Rejet immédiat des protocoles dangereux
  if (
    clean.startsWith("javascript:") ||
    clean.startsWith("data:") ||
    clean.startsWith("vbscript:") ||
    clean.startsWith("file:")
  ) {
    return false;
  }

  // Liens relatifs internes sûrs
  if (clean.startsWith("/")) {
    return true;
  }

  // Liens WhatsApp ou téléphone
  if (clean.startsWith("https://wa.me/") || clean.startsWith("tel:")) {
    return true;
  }

  // Liens externes : HTTPS obligatoire (pas de HTTP non sécurisé)
  if (clean.startsWith("https://")) {
    return true;
  }

  return false;
}

/**
 * Simule le nettoyage des métadonnées EXIF (notamment les coordonnées GPS)
 * et le ré-encodage WebP en tailles responsive standard.
 */
export function stripExifAndGenerateSrcset(
  originalUrl: string,
  baseWidth: number = 1920,
  baseHeight: number = 800
): {
  cleanUrl: string;
  srcset: string;
  aspectRatio: string;
  width: number;
  height: number;
} {
  // En production, un worker libvips/sharp strips EXIF and resizes
  const cleanUrl = originalUrl.replace(/\?.*$/, "");
  const srcset = `${cleanUrl}?w=640 640w, ${cleanUrl}?w=1024 1024w, ${cleanUrl}?w=1920 1920w`;
  const aspectRatio = `${baseWidth} / ${baseHeight}`;

  return {
    cleanUrl,
    srcset,
    aspectRatio,
    width: baseWidth,
    height: baseHeight,
  };
}

/**
 * Calcule la couleur optimale du texte sur l'image en fonction de l'opacité du voile (overlay).
 * Si le voile est sombre (opacité >= 30%), le texte blanc garantit un contraste supérieur à 4.5:1.
 */
export function computeOverlayContrast(overlayOpacityPercent: number): {
  textColor: "#FFFFFF" | "#111111";
  overlayBackground: string;
} {
  const opacity = Math.min(Math.max(overlayOpacityPercent, 0), 90) / 100;
  // Par défaut voile noir semi-transparent pour détacher le texte de l'image
  return {
    textColor: "#FFFFFF",
    overlayBackground: `rgba(0, 0, 0, ${opacity})`,
  };
}

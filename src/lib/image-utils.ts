/**
 * Utilitaires de traitement des images et vidéos produit pour Novika (Prompt 15).
 * - Validation format (JPG, PNG, WebP, AVIF) et taille (max 5 Mo).
 * - Nettoyage des métadonnées EXIF (notamment géolocalisation GPS) via Canvas HTML5.
 * - Analyse et génération d'URL d'intégration vidéo (YouTube, Vimeo, MP4).
 */

export const MAX_PRODUCT_IMAGES = 20;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un fichier image avant traitement ou envoi.
 */
export function validateProductImageFile(file: {
  name: string;
  size: number;
  type: string;
}): ImageValidationResult {
  if (!file) {
    return { valid: false, error: "Aucun fichier fourni." };
  }

  // Vérification de la taille (max 5 Mo)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Le fichier « ${file.name} » (${sizeInMb} Mo) dépasse la limite autorisée de 5 Mo.`,
    };
  }

  // Vérification du type MIME
  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp|avif)$/i.test(file.name);

  if (!isAllowedType) {
    return {
      valid: false,
      error: `Le format du fichier « ${file.name} » n'est pas supporté. Formats acceptés : JPG, PNG, WebP, AVIF.`,
    };
  }

  return { valid: true };
}

/**
 * Analyse une URL vidéo (YouTube, Vimeo ou MP4 direct).
 */
export function parseVideoUrl(url: string): {
  type: "youtube" | "vimeo" | "mp4" | "invalid";
  embedUrl?: string;
  directUrl?: string;
} {
  if (!url || typeof url !== "string") {
    return { type: "invalid" };
  }

  const cleanUrl = url.trim();

  // YouTube : watch?v=, youtu.be/, shorts/, embed/
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    let videoId = "";
    if (cleanUrl.includes("watch?v=")) {
      videoId = cleanUrl.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (cleanUrl.includes("youtu.be/")) {
      videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (cleanUrl.includes("youtube.com/shorts/")) {
      videoId = cleanUrl.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
    } else if (cleanUrl.includes("youtube.com/embed/")) {
      videoId = cleanUrl.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }

    if (videoId) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
        directUrl: cleanUrl,
      };
    }
  }

  // Vimeo
  if (cleanUrl.includes("vimeo.com")) {
    const match = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    const videoId = match ? match[1] : cleanUrl.split("/").filter(Boolean).pop();
    if (videoId && /^\d+$/.test(videoId)) {
      return {
        type: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        directUrl: cleanUrl,
      };
    }
  }

  // Fichier MP4 / WebM direct
  if (/\.(mp4|webm|mov)($|\?)/i.test(cleanUrl) || cleanUrl.startsWith("data:video/")) {
    return {
      type: "mp4",
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
    };
  }

  return { type: "invalid" };
}

/**
 * Nettoie les métadonnées EXIF (GPS, appareil, date) d'une image en la redessinant
 * sur un Canvas HTML5 vierge et l'exporte en dataURL propre.
 * Fonctionne dans le navigateur, retourne le dataURL de base si le canvas est indisponible.
 */
export async function stripExifAndProcessImage(
  file: File,
  maxDimension = 2000,
  quality = 0.92
): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // Environnement Node/SSR
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Lecture du fichier impossible"));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Redimensionnement si dépasse maxDimension pour optimiser les performances
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback : renvoyer le dataURL brut sans canvas
            resolve(dataUrl);
            return;
          }

          // Redessiner l'image sur le canvas (supprime automatiquement TOUS les tags EXIF GPS)
          ctx.drawImage(img, 0, 0, width, height);

          // Exporter au format webp ou jpeg
          const exportType = file.type === "image/png" ? "image/png" : "image/webp";
          const cleanDataUrl = canvas.toDataURL(exportType, quality);
          resolve(cleanDataUrl);
        } catch {
          // Si le canvas échoue, renvoyer le dataUrl lu
          resolve(dataUrl);
        }
      };

      img.onerror = () => reject(new Error("Image corrompue ou illisible"));
      img.src = dataUrl;
    };

    reader.onerror = () => reject(new Error("Échec de lecture du fichier"));
    reader.readAsDataURL(file);
  });
}

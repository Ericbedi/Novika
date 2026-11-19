/**
 * Configuration de l'intégration IA Gemini pour Novika.
 * La clé API GEMINI_API_KEY est strictement réservée au serveur (jamais exposée côté client).
 */

export const AI_CONFIG = {
  // Nom du modèle multimodal (réglable)
  DEFAULT_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  FALLBACK_MODEL: "gemini-1.5-flash",

  // Quotas par boutique
  DEFAULT_MONTHLY_QUOTA: 50, // 50 fiches produits générées par mois par défaut

  // Limites de sécurité
  MAX_IMAGES: 6,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 Mo par image
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],

  // Protection requêtes externes (SSRF)
  MAX_EXTERNAL_PAGE_SIZE_BYTES: 2 * 1024 * 1024, // 2 Mo max
  EXTERNAL_FETCH_TIMEOUT_MS: 5000, // 5s max
  MAX_GENERATION_TIMEOUT_MS: 30000, // 30s max
} as const;

/**
 * Obtient la clé API Gemini de manière sécurisée côté serveur.
 * Lève une exception si elle est absente ou si elle est appelée par erreur côté client.
 */
export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "Sécurité critique : La clé API Gemini ne doit JAMAIS être accédée depuis le navigateur."
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    // Clé de développement / fallback sécurisé pour tests locaux
    return process.env.NOV_GEMINI_KEY || "";
  }
  return key;
}

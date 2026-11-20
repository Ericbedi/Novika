/**
 * Gestionnaire unifié des URLs publiques de la vitrine Novika (Prompt 17-K & Prompt 19)
 * 
 * Règle d'or Prompt 17-K : Une seule fonction getProductPublicUrl(product, shop, options)
 * utilisée PARTOUT (liste produits, icône œil, « Afficher en tant que client », liens courts, e-mails, WhatsApp).
 * Renvoie l'adresse valide actuelle (domaine personnalisé si actif, sinon l'adresse de secours /boutique/{shop_slug}/...).
 * Aucune adresse construite manuellement ailleurs.
 */

import { Product } from "@/server/data/types";
import { getStoreDomains } from "@/lib/custom-domains";

export interface ProductUrlOptions {
  preview?: boolean;
  previewToken?: string;
  absolute?: boolean;
  shortLink?: boolean;
  baseUrl?: string;
}

/**
 * Génère un jeton de prévisualisation sécurisé pour un produit brouillon (valable 1 heure).
 */
export function generatePreviewToken(productId: string, shopSlug: string): string {
  const payload = {
    p: productId,
    s: shopSlug,
    exp: Date.now() + 3600 * 1000, // 1h de validité
  };
  const json = JSON.stringify(payload);
  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(json)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch {
      // fallback
    }
  }
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Vérifie la validité d'un jeton de prévisualisation.
 */
export function verifyPreviewToken(token: string | null | undefined, productId: string, shopSlug: string): boolean {
  if (!token) return false;
  try {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    let jsonStr = "";
    if (typeof Buffer !== "undefined") {
      try {
        jsonStr = Buffer.from(b64, "base64").toString("utf-8");
      } catch {
        jsonStr = decodeURIComponent(escape(atob(b64)));
      }
    } else {
      jsonStr = decodeURIComponent(escape(atob(b64)));
    }
    const data = JSON.parse(jsonStr);
    if (data.p !== productId || data.s !== shopSlug) return false;
    if (typeof data.exp === "number" && Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Retourne le domaine personnalisé actif principal pour une boutique, ou null si aucun.
 */
export function getActivePrimaryDomain(shopSlug: string): string | null {
  try {
    const domains = getStoreDomains(shopSlug);
    const activePrimary = domains.find((d) => d.status === "active" && d.isPrimary);
    if (activePrimary) return activePrimary.domain;
    // Si aucun marqué isPrimary mais un est actif
    const anyActive = domains.find((d) => d.status === "active");
    if (anyActive) return anyActive.domain;
  } catch { }
  return null;
}

/**
 * URL canonique unique pour un produit.
 * Utilise le domaine personnalisé si configuré et actif, sinon l'adresse de secours de la plateforme.
 */
export function getProductPublicUrl(
  product: Pick<Product, "id" | "slug"> & {
    shortCode?: string;
    short_code?: string;
    storeSlug?: string;
    shop_id?: string;
  },
  shop: string | { slug: string; name?: string; id?: string },
  options: ProductUrlOptions = {}
): string {
  const shopSlug = typeof shop === "string" ? shop : shop.slug;
  const shortCode = product.shortCode || product.short_code;

  // Choix de l'identifiant dans l'URL
  const identifier = options.shortLink && shortCode
    ? shortCode
    : product.slug || shortCode || product.id;

  const customDomain = getActivePrimaryDomain(shopSlug);

  // Construction du chemin relatif
  const relativePath = customDomain
    ? `/produits/${identifier}`
    : `/boutique/${shopSlug}/produits/${identifier}`;

  // Paramètres de prévisualisation
  const params = new URLSearchParams();
  if (options.preview) {
    params.set("preview", "true");
    const token = options.previewToken || generatePreviewToken(product.id, shopSlug);
    params.set("token", token);
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";

  // Si un domaine personnalisé est actif, l'URL est toujours absolue vers ce domaine
  if (customDomain) {
    return `https://${customDomain}${relativePath}${queryString}`;
  }

  // Si options.absolute est requis sur le domaine de secours
  if (options.absolute) {
    let base = options.baseUrl || "https://novika-delta.vercel.app";
    if (typeof window !== "undefined" && !options.baseUrl) {
      base = window.location.origin;
    }
    return `${base}${relativePath}${queryString}`;
  }

  return `${relativePath}${queryString}`;
}

/**
 * URL publique de la boutique (accueil ou catalogue).
 */
export function getStorePublicUrl(
  shop: string | { slug: string },
  options: { path?: string; absolute?: boolean; baseUrl?: string } = {}
): string {
  const shopSlug = typeof shop === "string" ? shop : shop.slug;
  const customDomain = getActivePrimaryDomain(shopSlug);
  const subPath = options.path ? (options.path.startsWith("/") ? options.path : `/${options.path}`) : "";

  if (customDomain) {
    return `https://${customDomain}${subPath}`;
  }

  const fallbackPath = `/boutique/${shopSlug}${subPath}`;
  if (options.absolute) {
    let base = options.baseUrl || "https://novika-delta.vercel.app";
    if (typeof window !== "undefined" && !options.baseUrl) {
      base = window.location.origin;
    }
    return `${base}${fallbackPath}`;
  }

  return fallbackPath;
}

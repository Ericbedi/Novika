import { Product } from "@/server/data/types";
import { MOCK_PRODUCTS } from "@/mock-data/products";

/**
 * Gestionnaire unifié de catalogue et d'intégrité produit par boutique (Prompt 13 - Étape 2).
 * RÈGLES STRICTES :
 * - Aucun repli vers un autre produit ou produit par défaut.
 * - Unicité absolue des slugs par boutique (suffixage auto -2, -3 en cas de collision).
 * - Vérification stricte du statut publié pour la vitrine publique.
 */

// Cache en mémoire pour exécution côté serveur et tests Node/Vitest
const memoryStoreProducts = new Map<string, Product[]>();

export function clearShopProductsMemory(): void {
  memoryStoreProducts.clear();
}

export function getShopStorageKey(shopSlug: string): string {
  return `novika_store_products_${shopSlug}`;
}

/**
 * Récupère tous les produits d'une boutique donnée.
 */
export function getShopProducts(shopSlug: string): Product[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(getShopStorageKey(shopSlug));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erreur de lecture du catalogue local:", e);
    }
  }

  if (memoryStoreProducts.has(shopSlug)) {
    return memoryStoreProducts.get(shopSlug)!;
  }

  // La boutique de démo fondatrice 'lome-glow' dispose de son jeu de départ
  if (shopSlug === "lome-glow") {
    return MOCK_PRODUCTS;
  }

  return [];
}

/**
 * Récupère un produit spécifique dans une boutique par son id ou son slug.
 * Retourne null si le produit n'existe pas ou n'est pas actif (sauf allowDraft).
 * JAMAIS de repli sur un autre produit.
 */
export function getProductByShopAndSlugOrId({
  shopSlug,
  slugOrId,
  allowDraft = false,
}: {
  shopSlug: string;
  slugOrId: string;
  allowDraft?: boolean;
}): Product | null {
  if (!shopSlug || !slugOrId) return null;

  const products = getShopProducts(shopSlug);

  // Normalisation de l'identifiant recherché
  const target = slugOrId.trim().toLowerCase();

  const found = products.find((p) => {
    const idMatch = p.id && p.id.toLowerCase() === target;
    const slugMatch = p.slug && p.slug.toLowerCase() === target;
    return idMatch || slugMatch;
  });

  if (!found) {
    return null; // Zéro repli sur un autre produit
  }

  // Vérifier la publication pour les accès publics
  if (!allowDraft) {
    const isActive =
      found.productStatus === "active" ||
      (found.status === "in_stock" && found.productStatus !== "draft" && found.productStatus !== "archived") ||
      (!found.productStatus && !found.status); // rétro-compatibilité
    if (!isActive) {
      return null;
    }
  }

  return found;
}

/**
 * Garantit l'unicité du slug dans la boutique (Prompt 13 - Étape 2).
 * En cas de collision avec un autre produit, génère un suffixe (-2, -3...).
 */
export function ensureUniqueProductSlug(
  shopSlug: string,
  baseSlug: string,
  currentProductId?: string
): string {
  const normalized = baseSlug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "produit";

  const products = getShopProducts(shopSlug);
  const existingSlugs = new Set(
    products
      .filter((p) => !currentProductId || p.id !== currentProductId)
      .map((p) => p.slug?.toLowerCase())
      .filter(Boolean)
  );

  if (!existingSlugs.has(normalized)) {
    return normalized;
  }

  let counter = 2;
  while (existingSlugs.has(`${normalized}-${counter}`)) {
    counter++;
  }
  return `${normalized}-${counter}`;
}

/**
 * Sauvegarde ou met à jour un produit pour une boutique donnée.
 */
export function saveShopProduct(shopSlug: string, product: Product): Product {
  const products = getShopProducts(shopSlug);
  const productId = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalSlug = ensureUniqueProductSlug(shopSlug, product.slug || product.name || "produit", productId);

  const updatedProduct: Product = {
    ...product,
    id: productId,
    slug: finalSlug,
  };

  const existingIndex = products.findIndex((p) => p.id === productId);
  let updatedList: Product[];

  if (existingIndex >= 0) {
    updatedList = [...products];
    updatedList[existingIndex] = updatedProduct;
  } else {
    updatedList = [updatedProduct, ...products];
  }

  memoryStoreProducts.set(shopSlug, updatedList);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getShopStorageKey(shopSlug), JSON.stringify(updatedList));
    } catch (e) {
      console.error("Erreur de sauvegarde locale du produit:", e);
    }
  }

  return updatedProduct;
}

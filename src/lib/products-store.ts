import { Product, UserRole, Order } from "@/server/data/types";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_ORDERS } from "@/mock-data/orders";
import {
  canTrashProduct,
  canArchiveProduct,
  canHardDeleteProduct,
  canBatchManageProducts,
} from "@/config/permissions";

/**
 * Gestionnaire unifié de catalogue et d'intégrité produit par boutique (Prompt 13 - Étape 2 & Prompt 14-B).
 * RÈGLES STRICTES :
 * - Aucun repli vers un autre produit ou produit par défaut.
 * - Unicité absolue des slugs par boutique (suffixage auto -2, -3 en cas de collision).
 * - Vérification stricte du statut publié pour la vitrine publique.
 * - Soft delete via deletedAt (Corbeille avec rétention 30 jours, masqué immédiatement de la vitrine et de la recherche).
 * - Hard delete réservé exclusivement au propriétaire (owner), avec vérification des commandes en cours et libération du slug.
 */

// Cache en mémoire pour exécution côté serveur et tests Node/Vitest
const memoryStoreProducts = new Map<string, Product[]>();

export function clearShopProductsMemory(): void {
  memoryStoreProducts.clear();
}

export function getShopStorageKey(shopSlug: string): string {
  return `novika_store_products_${shopSlug}`;
}

export interface ProductAuditLog {
  id: string;
  timestamp: string;
  shopSlug: string;
  userId?: string;
  userRole?: string;
  action: "trash" | "restore" | "archive" | "unarchive" | "hard_delete" | "batch_update" | "empty_trash";
  productIds: string[];
  productNames?: string[];
  count: number;
  details?: string;
}

export function logProductAuditEvent(
  shopSlug: string,
  event: Omit<ProductAuditLog, "id" | "timestamp" | "shopSlug">
): void {
  const log: ProductAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    shopSlug,
    ...event,
  };

  if (typeof window !== "undefined") {
    try {
      const key = `novika_audit_logs_${shopSlug}`;
      const saved = localStorage.getItem(key);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(log);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 200)));
    } catch {}

    try {
      fetch("/api/logs/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Purge automatique après 30 jours des produits dans la corbeille (Prompt 14-B).
 */
export function purgeExpiredTrash(shopSlug: string, maxDays: number = 30): number {
  const products = getShopProductsRaw(shopSlug);
  const now = Date.now();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

  const validProducts: Product[] = [];
  let purgedCount = 0;

  for (const prod of products) {
    if (prod.deletedAt) {
      const deletedTime = new Date(prod.deletedAt).getTime();
      if (!isNaN(deletedTime) && now - deletedTime > maxAgeMs) {
        purgedCount++;
        continue;
      }
    }
    validProducts.push(prod);
  }

  if (purgedCount > 0) {
    saveShopProductsList(shopSlug, validProducts);
    logProductAuditEvent(shopSlug, {
      action: "batch_update",
      productIds: [],
      count: purgedCount,
      details: `Purge automatique de ${purgedCount} produit(s) expirés dans la corbeille (> ${maxDays} jours)`,
    });
  }

  return purgedCount;
}

/**
 * Récupération brute de tous les produits stockés (y compris corbeille).
 */
function getShopProductsRaw(shopSlug: string): Product[] {
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

  if (shopSlug === "lome-glow") {
    return MOCK_PRODUCTS;
  }

  return [];
}

/**
 * Sauvegarde la liste complète des produits d'une boutique.
 */
function saveShopProductsList(shopSlug: string, products: Product[]): void {
  memoryStoreProducts.set(shopSlug, products);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getShopStorageKey(shopSlug), JSON.stringify(products));
    } catch (e) {
      console.error("Erreur de sauvegarde de la liste de produits:", e);
    }
  }
}

/**
 * Récupère tous les produits d'une boutique donnée.
 * Par défaut, filtre les produits placés dans la corbeille (deletedAt != null).
 */
export function getShopProducts(shopSlug: string, includeTrash: boolean = false): Product[] {
  // Purge transparente au chargement
  purgeExpiredTrash(shopSlug, 30);

  const raw = getShopProductsRaw(shopSlug);
  if (includeTrash) {
    return raw;
  }
  return raw.filter((p) => !p.deletedAt);
}

/**
 * Récupère uniquement les produits placés dans la corbeille (Prompt 14-B).
 */
export function getTrashProducts(shopSlug: string): Product[] {
  const raw = getShopProductsRaw(shopSlug);
  return raw.filter((p) => p.deletedAt != null);
}

/**
 * Récupère un produit spécifique dans une boutique par son id ou son slug.
 * Retourne null si le produit n'existe pas, est dans la corbeille, ou n'est pas actif (sauf allowDraft).
 * JAMAIS de repli sur un autre produit.
 */
export function getProductByShopAndSlugOrId({
  shopSlug,
  slugOrId,
  allowDraft = false,
  includeDeleted = false,
}: {
  shopSlug: string;
  slugOrId: string;
  allowDraft?: boolean;
  includeDeleted?: boolean;
}): Product | null {
  if (!shopSlug || !slugOrId) return null;

  const products = getShopProductsRaw(shopSlug);
  const target = slugOrId.trim().toLowerCase();

  const found = products.find((p) => {
    const idMatch = p.id && p.id.toLowerCase() === target;
    const slugMatch = p.slug && p.slug.toLowerCase() === target;
    return idMatch || slugMatch;
  });

  if (!found) {
    return null; // Zéro repli sur un autre produit
  }

  // Règle stricte Prompt 14-B : Dès qu'un produit est dans la corbeille (soft delete),
  // il disparaît immédiatement de la vitrine et du catalogue public (retourne null -> 404).
  if (found.deletedAt && !includeDeleted) {
    return null;
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
 * Les slugs des produits définitivement supprimés sont libérés.
 */
export function ensureUniqueProductSlug(
  shopSlug: string,
  baseSlug: string,
  currentProductId?: string
): string {
  const normalized =
    baseSlug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "produit";

  // Ne pas entrer en collision avec les produits existants (actifs ou en corbeille)
  const products = getShopProductsRaw(shopSlug);
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
  const products = getShopProductsRaw(shopSlug);
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

  saveShopProductsList(shopSlug, updatedList);
  return updatedProduct;
}

/**
 * Vérifie si des commandes en cours (non livrées, non annulées) contiennent un produit (Prompt 14-B).
 */
export function getPendingOrdersCountForProduct(shopSlug: string, productId: string): number {
  let allOrders: Order[] = [];
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`novika_store_orders_${shopSlug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          allOrders = parsed;
        }
      }
    } catch {}
  }
  if (allOrders.length === 0 && shopSlug === "lome-glow") {
    allOrders = MOCK_ORDERS;
  }

  const targetId = productId.trim().toLowerCase();
  return allOrders.filter((o) => {
    const isPending = o.status !== "delivered" && o.status !== "cancelled";
    if (!isPending) return false;
    return (o.items || []).some((item) => {
      const iId = (item.productId || item.id || "").toLowerCase();
      return iId === targetId;
    });
  }).length;
}

/**
 * Déplace un produit dans la corbeille (Soft Delete) - Prompt 14-B.
 */
export function softDeleteProduct(
  shopSlug: string,
  productId: string,
  role: UserRole = "owner"
): { success: boolean; product?: Product; error?: string } {
  if (!canTrashProduct(role)) {
    return { success: false, error: "Action non autorisée : droits insuffisants pour supprimer un produit." };
  }

  const products = getShopProductsRaw(shopSlug);
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return { success: false, error: "Produit introuvable." };
  }

  const target = products[index];
  const updated: Product = {
    ...target,
    deletedAt: new Date().toISOString(),
  };

  const updatedList = [...products];
  updatedList[index] = updated;
  saveShopProductsList(shopSlug, updatedList);

  logProductAuditEvent(shopSlug, {
    action: "trash",
    userRole: role,
    productIds: [productId],
    productNames: [target.name || target.title || "Produit"],
    count: 1,
    details: `Produit "${target.name || target.title}" déplacé dans la corbeille`,
  });

  return { success: true, product: updated };
}

/**
 * Restaure un produit depuis la corbeille (Prompt 14-B).
 */
export function restoreProduct(
  shopSlug: string,
  productId: string,
  role: UserRole = "owner"
): { success: boolean; product?: Product; error?: string } {
  if (!canTrashProduct(role)) {
    return { success: false, error: "Action non autorisée : droits insuffisants pour restaurer un produit." };
  }

  const products = getShopProductsRaw(shopSlug);
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return { success: false, error: "Produit introuvable." };
  }

  const target = products[index];
  const updated: Product = {
    ...target,
    deletedAt: null,
  };

  const updatedList = [...products];
  updatedList[index] = updated;
  saveShopProductsList(shopSlug, updatedList);

  logProductAuditEvent(shopSlug, {
    action: "restore",
    userRole: role,
    productIds: [productId],
    productNames: [target.name || target.title || "Produit"],
    count: 1,
    details: `Produit "${target.name || target.title}" restauré depuis la corbeille`,
  });

  return { success: true, product: updated };
}

/**
 * Archive un produit (Prompt 14-B).
 */
export function archiveProduct(
  shopSlug: string,
  productId: string,
  role: UserRole = "owner"
): { success: boolean; product?: Product; error?: string } {
  if (!canArchiveProduct(role)) {
    return { success: false, error: "Action non autorisée : droits insuffisants pour archiver un produit." };
  }

  const products = getShopProductsRaw(shopSlug);
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return { success: false, error: "Produit introuvable." };
  }

  const target = products[index];
  const updated: Product = {
    ...target,
    productStatus: "archived",
    archivedAt: new Date().toISOString(),
  };

  const updatedList = [...products];
  updatedList[index] = updated;
  saveShopProductsList(shopSlug, updatedList);

  logProductAuditEvent(shopSlug, {
    action: "archive",
    userRole: role,
    productIds: [productId],
    productNames: [target.name || target.title || "Produit"],
    count: 1,
    details: `Produit "${target.name || target.title}" archivé`,
  });

  return { success: true, product: updated };
}

/**
 * Supprime définitivement un produit (Hard Delete) - Prompt 14-B.
 * - Réservé STRICTEMENT au propriétaire (owner).
 * - Confirmation explicite requise (nom du produit ou 'SUPPRIMER').
 * - BLOQUÉ si des commandes en cours contiennent ce produit.
 * - Libère le slug.
 * - Préserve les snapshots des commandes passées.
 */
export function hardDeleteProduct(
  shopSlug: string,
  productId: string,
  confirmationText: string,
  role: UserRole = "owner"
): { success: boolean; error?: string } {
  if (!canHardDeleteProduct(role)) {
    return {
      success: false,
      error: "Suppression définitive réservée exclusivement au PROPRIÉTAIRE de la boutique.",
    };
  }

  const products = getShopProductsRaw(shopSlug);
  const target = products.find((p) => p.id === productId);
  if (!target) {
    return { success: false, error: "Produit introuvable." };
  }

  const prodName = (target.name || target.title || "").trim();
  const inputConfirm = confirmationText.trim().toLowerCase();

  const isConfirmed =
    inputConfirm === "supprimer" ||
    (prodName.length > 0 && inputConfirm === prodName.toLowerCase());

  if (!isConfirmed) {
    return {
      success: false,
      error: `Confirmation invalide : veuillez saisir "${prodName}" ou "SUPPRIMER" pour confirmer.`,
    };
  }

  // Vérification de protection : Commandes en cours
  const pendingOrdersCount = getPendingOrdersCountForProduct(shopSlug, productId);
  if (pendingOrdersCount > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${pendingOrdersCount} commande(s) en cours contiennent ce produit. Traitez ou annulez ces commandes d'abord, ou conservez le produit dans la corbeille.`,
    };
  }

  // Suppression définitive de la liste
  const updatedList = products.filter((p) => p.id !== productId);
  saveShopProductsList(shopSlug, updatedList);

  logProductAuditEvent(shopSlug, {
    action: "hard_delete",
    userRole: role,
    productIds: [productId],
    productNames: [prodName],
    count: 1,
    details: `Produit "${prodName}" définitivement supprimé (slug ${target.slug} libéré)`,
  });

  return { success: true };
}

/**
 * Vide complètement la corbeille (Prompt 14-B).
 * - Réservé exclusivement au propriétaire (owner).
 */
export function emptyTrash(
  shopSlug: string,
  role: UserRole = "owner"
): { success: boolean; purgedCount: number; error?: string } {
  if (!canHardDeleteProduct(role)) {
    return {
      success: false,
      purgedCount: 0,
      error: "Action réservée exclusivement au PROPRIÉTAIRE de la boutique.",
    };
  }

  const products = getShopProductsRaw(shopSlug);
  const trashed = products.filter((p) => p.deletedAt != null);

  if (trashed.length === 0) {
    return { success: true, purgedCount: 0 };
  }

  // Vérifier si des articles en corbeille ont des commandes en cours
  let blockedCount = 0;
  const toKeep: Product[] = [];
  const toPurge: Product[] = [];

  for (const p of products) {
    if (!p.deletedAt) {
      toKeep.push(p);
      continue;
    }
    const pending = getPendingOrdersCountForProduct(shopSlug, p.id);
    if (pending > 0) {
      blockedCount++;
      toKeep.push(p);
    } else {
      toPurge.push(p);
    }
  }

  saveShopProductsList(shopSlug, toKeep);

  logProductAuditEvent(shopSlug, {
    action: "empty_trash",
    userRole: role,
    productIds: toPurge.map((p) => p.id),
    productNames: toPurge.map((p) => p.name || p.title || "Produit"),
    count: toPurge.length,
    details: `Corbeille vidée : ${toPurge.length} produit(s) supprimé(s) définitivement` +
      (blockedCount > 0 ? ` (${blockedCount} conservé(s) en raison de commandes en cours)` : ""),
  });

  if (blockedCount > 0) {
    return {
      success: true,
      purgedCount: toPurge.length,
      error: `${blockedCount} produit(s) n'ont pas pu être supprimés car ils figurent dans des commandes en cours.`,
    };
  }

  return { success: true, purgedCount: toPurge.length };
}

/**
 * Actions en lot sur les produits (Prompt 14-B).
 * - Limite max 100 produits par lot.
 * - Supporte : "publish", "unpublish", "archive", "trash", "restore", "hard_delete".
 */
export function batchUpdateProductsStatus(
  shopSlug: string,
  productIds: string[],
  action: "publish" | "unpublish" | "archive" | "trash" | "restore" | "hard_delete",
  role: UserRole = "owner"
): { success: boolean; count: number; error?: string } {
  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0 };
  }

  // Contrôle des droits
  if (action === "hard_delete") {
    if (!canHardDeleteProduct(role)) {
      return { success: false, count: 0, error: "Suppression définitive en lot réservée au propriétaire." };
    }
  } else {
    if (!canBatchManageProducts(role)) {
      return { success: false, count: 0, error: "Action en lot non autorisée pour votre rôle." };
    }
  }

  // Limite 100 par lot (Prompt 14-B)
  const targetIds = new Set(productIds.slice(0, 100));
  const products = getShopProductsRaw(shopSlug);

  let modifiedCount = 0;
  let blockedCount = 0;

  if (action === "hard_delete") {
    const remainingProducts: Product[] = [];
    const deletedNames: string[] = [];

    for (const prod of products) {
      if (targetIds.has(prod.id)) {
        const pending = getPendingOrdersCountForProduct(shopSlug, prod.id);
        if (pending > 0) {
          blockedCount++;
          remainingProducts.push(prod);
        } else {
          modifiedCount++;
          deletedNames.push(prod.name || prod.title || prod.id);
        }
      } else {
        remainingProducts.push(prod);
      }
    }

    saveShopProductsList(shopSlug, remainingProducts);

    logProductAuditEvent(shopSlug, {
      action: "batch_update",
      userRole: role,
      productIds: Array.from(targetIds),
      productNames: deletedNames,
      count: modifiedCount,
      details: `Suppression définitive en lot de ${modifiedCount} produit(s)` +
        (blockedCount > 0 ? ` (${blockedCount} bloqués par des commandes en cours)` : ""),
    });

    return {
      success: true,
      count: modifiedCount,
      error: blockedCount > 0 ? `${blockedCount} produit(s) n'ont pas pu être supprimés (commandes en cours).` : undefined,
    };
  }

  const updatedList = products.map((prod) => {
    if (!targetIds.has(prod.id)) return prod;
    modifiedCount++;

    switch (action) {
      case "publish":
        return { ...prod, productStatus: "active" as const, deletedAt: null };
      case "unpublish":
        return { ...prod, productStatus: "draft" as const };
      case "archive":
        return { ...prod, productStatus: "archived" as const, archivedAt: new Date().toISOString() };
      case "trash":
        return { ...prod, deletedAt: new Date().toISOString() };
      case "restore":
        return { ...prod, deletedAt: null };
      default:
        return prod;
    }
  });

  saveShopProductsList(shopSlug, updatedList);

  logProductAuditEvent(shopSlug, {
    action: "batch_update",
    userRole: role,
    productIds: Array.from(targetIds),
    count: modifiedCount,
    details: `Action en lot "${action}" appliquée sur ${modifiedCount} produit(s)`,
  });

  return { success: true, count: modifiedCount };
}

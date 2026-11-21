/**
 * Moteur et gestionnaire de réglages de stock par boutique (Prompt 16-b).
 * - Réglage 1 : Visibilité des produits en rupture ("show_badge" ou "hide") + surcharge produit.
 * - Réglage 2 : Moment de réservation ("on_order_received" ou "on_closer_confirmation").
 * - Réservation atomique, verrouillage, libération sur annulation/timeout, statut "pending_stock".
 * - Isolation multi-boutique, vérification des rôles (owner/admin) et journal d'audit.
 */

import {
  Product,
  StoreStockSettings,
  OutOfStockVisibilityOption,
  StockReservationTimingOption,
  UserRole,
} from "@/server/data/types";
import { canManageStockSettings } from "@/config/permissions";
import { getShopProductsRaw, saveShopProductsList, saveShopProduct } from "@/lib/products-store";

export interface StockAuditLog {
  id: string;
  storeSlug: string;
  timestamp: string;
  performedBy: string;
  userRole?: string;
  action: "update_stock_settings" | "reserve_stock" | "release_stock" | "stock_exhausted" | "fulfill_stock";
  details: string;
  previousSettings?: Partial<StoreStockSettings>;
  newSettings?: Partial<StoreStockSettings>;
}

export interface ActiveStockReservation {
  id: string;
  storeSlug: string;
  orderNumber: string;
  productId: string;
  quantity: number;
  reservedAt: number; // timestamp ms
  expiresAt: number; // timestamp ms
  timing: StockReservationTimingOption;
  isConfirmed: boolean;
}

// Magasin en mémoire (pour exécution SSR, API routes et tests Node/Vitest)
const memoryStockSettings = new Map<string, StoreStockSettings>();
const memoryReservations = new Map<string, ActiveStockReservation[]>();
const memoryAuditLogs = new Map<string, StockAuditLog[]>();

export const DEFAULT_STOCK_SETTINGS: StoreStockSettings = {
  storeSlug: "default",
  outOfStockVisibility: "show_badge",
  reservationTiming: "on_order_received",
  reservationTimeoutHours: 48,
};

export function clearStockSettingsMemory(): void {
  memoryStockSettings.clear();
  memoryReservations.clear();
  memoryAuditLogs.clear();
}

/**
 * Récupère les réglages de stock d'une boutique (avec fallback sur les valeurs par défaut).
 */
export function getStockSettings(storeSlug: string): StoreStockSettings {
  if (memoryStockSettings.has(storeSlug)) {
    return memoryStockSettings.get(storeSlug)!;
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`novika_stock_settings_${storeSlug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const settings: StoreStockSettings = {
          storeSlug,
          outOfStockVisibility: parsed.outOfStockVisibility || "show_badge",
          reservationTiming: parsed.reservationTiming || "on_order_received",
          reservationTimeoutHours: Number(parsed.reservationTimeoutHours) || 48,
          updatedAt: parsed.updatedAt,
          updatedBy: parsed.updatedBy,
        };
        memoryStockSettings.set(storeSlug, settings);
        return settings;
      }
    } catch {}
  }

  const defaultSetting: StoreStockSettings = {
    ...DEFAULT_STOCK_SETTINGS,
    storeSlug,
  };
  memoryStockSettings.set(storeSlug, defaultSetting);
  return defaultSetting;
}

/**
 * Met à jour les réglages de stock d'une boutique avec vérification des permissions (Prompt 16-b).
 * Réservé à owner et admin.
 */
export function updateStockSettings(
  storeSlug: string,
  updates: Partial<StoreStockSettings>,
  user?: { id?: string; name?: string; role?: UserRole }
): { success: boolean; settings: StoreStockSettings; error?: string } {
  const role = user?.role || "owner";
  if (!canManageStockSettings(role)) {
    return {
      success: false,
      settings: getStockSettings(storeSlug),
      error: "Action non autorisée. Seuls les administrateurs propriétaires et co-administrateurs peuvent modifier les réglages de stock.",
    };
  }

  const current = getStockSettings(storeSlug);

  const newVisibility: OutOfStockVisibilityOption =
    updates.outOfStockVisibility === "hide" ? "hide" : "show_badge";
  const newTiming: StockReservationTimingOption =
    updates.reservationTiming === "on_closer_confirmation"
      ? "on_closer_confirmation"
      : "on_order_received";

  const newTimeout = Math.max(1, Math.min(168, Number(updates.reservationTimeoutHours) || 48));

  const updated: StoreStockSettings = {
    ...current,
    storeSlug,
    outOfStockVisibility: newVisibility,
    reservationTiming: newTiming,
    reservationTimeoutHours: newTimeout,
    updatedAt: new Date().toISOString(),
    updatedBy: user?.name || "Administrateur",
  };

  memoryStockSettings.set(storeSlug, updated);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`novika_stock_settings_${storeSlug}`, JSON.stringify(updated));
    } catch {}
  }

  // Journal d'audit strict
  logStockAuditEvent(storeSlug, {
    action: "update_stock_settings",
    performedBy: user?.name || "Administrateur",
    userRole: role,
    details: `Réglages mis à jour : Visibilité rupture = ${newVisibility}, Réservation = ${newTiming}, Expiration = ${newTimeout}h`,
    previousSettings: current,
    newSettings: updated,
  });

  return { success: true, settings: updated };
}

/**
 * Journalise une action liée aux réglages ou aux mouvements de réservation de stock.
 */
export function logStockAuditEvent(
  storeSlug: string,
  event: Omit<StockAuditLog, "id" | "timestamp" | "storeSlug">
): void {
  const log: StockAuditLog = {
    id: `stk_aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    storeSlug,
    ...event,
  };

  const list = memoryAuditLogs.get(storeSlug) || [];
  list.unshift(log);
  memoryAuditLogs.set(storeSlug, list.slice(0, 100));

  if (typeof window !== "undefined") {
    try {
      const key = `novika_stock_audit_logs_${storeSlug}`;
      const saved = localStorage.getItem(key);
      const items = saved ? JSON.parse(saved) : [];
      items.unshift(log);
      localStorage.setItem(key, JSON.stringify(items.slice(0, 100)));
    } catch {}
  }
}

export function getStockAuditLogs(storeSlug: string): StockAuditLog[] {
  if (memoryAuditLogs.has(storeSlug)) {
    return memoryAuditLogs.get(storeSlug)!;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`novika_stock_audit_logs_${storeSlug}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
  }
  return [];
}

/**
 * Détermine si un produit doit apparaître publiquement sur la vitrine (Catalogue, Collections, Recherche).
 * RÈGLE PROMPT 16-b :
 * - Si produit en stock (> 0) : TOUJOURS visible.
 * - Si produit en rupture (<= 0) :
 *    - Surcharge "always_show" -> visible avec mention rupture.
 *    - Surcharge "always_hide" -> masqué.
 *    - Surcharge "store_default" ou non définie -> suit outOfStockVisibility de la boutique.
 */
export function isProductVisibleOnStorefront(
  product: Product,
  storeSlug?: string,
  customSettings?: StoreStockSettings
): boolean {
  // 1. Éliminations obligatoires : corbeille (soft delete), brouillon, archivé, masqué manuellement
  if (product.deletedAt) return false;
  if (product.hiddenFromCatalog) return false;
  if (product.productStatus === "draft" || product.productStatus === "archived") return false;

  // 2. Calcul du stock disponible effectif
  const effectiveStock =
    product.availableStock !== undefined
      ? product.availableStock
      : product.stockCount !== undefined
      ? product.stockCount
      : product.stock !== undefined
      ? product.stock
      : 0;

  // Si le produit est en stock, il est toujours visible
  if (effectiveStock > 0) {
    return true;
  }

  // 3. Produit en rupture : application de la politique
  const override = product.outOfStockVisibilityOverride || "store_default";

  if (override === "always_show") {
    return true; // Option A forcée pour ce produit
  }
  if (override === "always_hide") {
    return false; // Option B forcée pour ce produit
  }

  // Suivre le réglage de la boutique
  const settings = customSettings || getStockSettings(storeSlug || "default");
  return settings.outOfStockVisibility === "show_badge";
}

/**
 * Vérifie si une fiche produit directe (/boutique/[store]/produit/[id]) doit afficher l'écran spécial
 * « Produit indisponible pour le moment » plutôt que la fiche d'achat normale.
 */
export function shouldDisplayUnavailableScreen(
  product: Product,
  storeSlug?: string,
  customSettings?: StoreStockSettings
): boolean {
  if (product.deletedAt) return false; // Renvoie 404 normale
  if (product.productStatus === "draft" || product.productStatus === "archived") return false;

  const effectiveStock =
    product.availableStock !== undefined
      ? product.availableStock
      : product.stockCount !== undefined
      ? product.stockCount
      : product.stock !== undefined
      ? product.stock
      : 0;

  // Si en stock, la fiche normale est affichée
  if (effectiveStock > 0) return false;

  // Si en rupture, vérifier si la politique est de masquer de la vitrine
  const override = product.outOfStockVisibilityOverride || "store_default";
  if (override === "always_hide") return true;
  if (override === "always_show") return false;

  const settings = customSettings || getStockSettings(storeSlug || "default");
  return settings.outOfStockVisibility === "hide";
}

/**
 * Logique atomique de réservation de stock pour une commande (Prompt 16-b Réglage 2).
 */
export function reserveStockForOrder(params: {
  storeSlug: string;
  productId: string;
  quantity: number;
  orderNumber: string;
  isCloserConfirmation?: boolean;
}): {
  success: boolean;
  error?: string;
  orderStatus: "pending" | "confirmed" | "pending_stock" | "rejected_out_of_stock";
  reserved: boolean;
  availableStockRemaining: number;
} {
  const { storeSlug, productId, quantity, orderNumber, isCloserConfirmation = false } = params;
  const settings = getStockSettings(storeSlug);

  const products = getShopProductsRaw(storeSlug);
  const prod = products.find((p) => p.id === productId || p.slug === productId);

  if (!prod) {
    return {
      success: true,
      orderStatus: "pending",
      reserved: false,
      availableStockRemaining: 99,
    };
  }

  const physicalStock = prod.physicalStock !== undefined ? prod.physicalStock : (prod.stock || 0);
  const currentReserved = prod.reservedStock || 0;
  const availableStock = Math.max(0, physicalStock - currentReserved);

  // OPTION B : Réservation à la confirmation par la closeuse
  if (settings.reservationTiming === "on_closer_confirmation" && !isCloserConfirmation) {
    // À la réception de la commande : enregistrement sans réservation
    // Vérification douce de disponibilité
    return {
      success: true,
      orderStatus: "pending",
      reserved: false,
      availableStockRemaining: availableStock,
    };
  }

  // Cas où la réservation doit s'effectuer (soit Option A à la réception, soit Option B à la confirmation)
  if (availableStock < quantity) {
    if (isCloserConfirmation) {
      // Échec de confirmation pour stock insuffisant -> bascule en "En attente de stock"
      logStockAuditEvent(storeSlug, {
        action: "stock_exhausted",
        performedBy: "Closeuse",
        details: `Commande #${orderNumber} refusée à la confirmation pour stock insuffisant (${quantity} demandé(s), ${availableStock} disponible(s)). Passage en 'En attente de stock'.`,
      });

      return {
        success: false,
        error: "Stock disponible insuffisant pour confirmer cette commande.",
        orderStatus: "pending_stock",
        reserved: false,
        availableStockRemaining: availableStock,
      };
    } else {
      // Option A à la réception : refus direct de la commande (concurrence sur la dernière pièce)
      return {
        success: false,
        error: "Désolé, ce produit vient d'être épuisé ou le stock disponible est insuffisant.",
        orderStatus: "rejected_out_of_stock",
        reserved: false,
        availableStockRemaining: availableStock,
      };
    }
  }

  // Stock suffisant : réservation atomique
  const newReserved = currentReserved + quantity;
  const newAvailable = Math.max(0, physicalStock - newReserved);

  prod.physicalStock = physicalStock;
  prod.reservedStock = newReserved;
  prod.availableStock = newAvailable;
  prod.stock = newAvailable;
  if (newAvailable === 0) {
    prod.stockStatus = "out_of_stock";
  }

  saveShopProduct(storeSlug, prod);

  // Enregistrement de la réservation active
  const reservations = memoryReservations.get(storeSlug) || [];
  const timeoutMs = (settings.reservationTimeoutHours || 48) * 3600 * 1000;
  reservations.push({
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    storeSlug,
    orderNumber,
    productId: prod.id,
    quantity,
    reservedAt: Date.now(),
    expiresAt: Date.now() + timeoutMs,
    timing: settings.reservationTiming,
    isConfirmed: isCloserConfirmation,
  });
  memoryReservations.set(storeSlug, reservations);

  logStockAuditEvent(storeSlug, {
    action: "reserve_stock",
    performedBy: isCloserConfirmation ? "Closeuse" : "Système (Commande reçue)",
    details: `Réservation de ${quantity} unité(s) pour la commande #${orderNumber} (${prod.name}). Stock dispo restant : ${newAvailable}.`,
  });

  return {
    success: true,
    orderStatus: isCloserConfirmation ? "confirmed" : "pending",
    reserved: true,
    availableStockRemaining: newAvailable,
  };
}

/**
 * Libère une réservation de stock en cas d'annulation, de rejet ou d'expiration (Prompt 16-b).
 */
export function releaseReservedStock(params: {
  storeSlug: string;
  productId: string;
  quantity: number;
  orderNumber?: string;
  reason?: string;
}): void {
  const { storeSlug, productId, quantity, orderNumber, reason } = params;

  const products = getShopProductsRaw(storeSlug);
  const prod = products.find((p) => p.id === productId || p.slug === productId);

  if (!prod) return;

  const physicalStock = prod.physicalStock !== undefined ? prod.physicalStock : (prod.stock || 0);
  const currentReserved = prod.reservedStock || 0;
  const newReserved = Math.max(0, currentReserved - quantity);
  const newAvailable = Math.max(0, physicalStock - newReserved);

  prod.reservedStock = newReserved;
  prod.availableStock = newAvailable;
  prod.stock = newAvailable;
  if (newAvailable > 0 && prod.stockStatus === "out_of_stock") {
    prod.stockStatus = "in_stock";
  }

  saveShopProduct(storeSlug, prod);

  // Retrait de la réservation en mémoire
  if (orderNumber) {
    const list = memoryReservations.get(storeSlug) || [];
    memoryReservations.set(
      storeSlug,
      list.filter((r) => r.orderNumber !== orderNumber)
    );
  }

  logStockAuditEvent(storeSlug, {
    action: "release_stock",
    performedBy: "Système",
    details: `Libération de ${quantity} unité(s) réservée(s) pour la commande #${orderNumber || "inconnue"}. Raison : ${reason || "Clôture / Annulation"}. Nouveau dispo : ${newAvailable}.`,
  });
}

/**
 * Décrémente le stock physique ET le stock réservé lors de la livraison effective (Prompt 16-b).
 */
export function fulfillDeliveredOrderStock(params: {
  storeSlug: string;
  productId: string;
  quantity: number;
  orderNumber?: string;
}): void {
  const { storeSlug, productId, quantity, orderNumber } = params;

  const products = getShopProductsRaw(storeSlug);
  const prod = products.find((p) => p.id === productId || p.slug === productId);

  if (!prod) return;

  const currentPhysical = prod.physicalStock !== undefined ? prod.physicalStock : (prod.stock || 0);
  const currentReserved = prod.reservedStock || 0;

  const newPhysical = Math.max(0, currentPhysical - quantity);
  const newReserved = Math.max(0, currentReserved - quantity);
  const newAvailable = Math.max(0, newPhysical - newReserved);

  prod.physicalStock = newPhysical;
  prod.reservedStock = newReserved;
  prod.availableStock = newAvailable;
  prod.stock = newAvailable;
  if (newAvailable === 0) {
    prod.stockStatus = "out_of_stock";
  }

  saveShopProduct(storeSlug, prod);

  if (orderNumber) {
    const list = memoryReservations.get(storeSlug) || [];
    memoryReservations.set(
      storeSlug,
      list.filter((r) => r.orderNumber !== orderNumber)
    );
  }

  logStockAuditEvent(storeSlug, {
    action: "fulfill_stock",
    performedBy: "Livreur / Confirmation",
    details: `Livraison effectuée pour #${orderNumber || "N/A"}. Sortie physique de ${quantity} unité(s). En main : ${newPhysical}, Réservé : ${newReserved}, Dispo : ${newAvailable}.`,
  });
}

/**
 * Purge les réservations expirées pour les commandes non confirmées dépassant la durée max (Option A).
 */
export function releaseExpiredStockReservations(storeSlug: string): {
  releasedCount: number;
  releasedQuantity: number;
} {
  const reservations = memoryReservations.get(storeSlug) || [];
  const now = Date.now();
  const valid: ActiveStockReservation[] = [];
  let releasedCount = 0;
  let releasedQuantity = 0;

  for (const res of reservations) {
    if (!res.isConfirmed && res.expiresAt < now) {
      releaseReservedStock({
        storeSlug,
        productId: res.productId,
        quantity: res.quantity,
        orderNumber: res.orderNumber,
        reason: "Expiration délai de réservation (dépassement limite en heures)",
      });
      releasedCount++;
      releasedQuantity += res.quantity;
    } else {
      valid.push(res);
    }
  }

  memoryReservations.set(storeSlug, valid);
  return { releasedCount, releasedQuantity };
}

/**
 * Modèle de message WhatsApp prêt à l'emploi en un clic pour les commandes en attente de stock.
 */
export function generatePendingStockWhatsAppUrl(params: {
  customerPhone: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  storeName?: string;
}): string {
  const { customerPhone, customerName, orderNumber, productName, storeName = "Novika" } = params;
  const firstName = customerName.trim().split(" ")[0] || "cher client";
  const message = `Bonjour ${firstName}, l'équipe ${storeName} vous remercie pour votre commande #${orderNumber} (${productName}).\n\nCe produit est temporairement en cours de réapprovisionnement express. Souhaitez-vous que nous maintenions votre commande prioritaire pour livraison dès réassort, ou préférez-vous découvrir un produit alternatif ?`;
  const cleanPhone = customerPhone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

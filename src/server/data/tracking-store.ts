/**
 * Magasin de données et logique métier pour le suivi de commande en direct par étapes (Prompt 05-T).
 *
 * SÉCURITÉ & ISOLATION STRICTE :
 * - Aucune table ni colonne GPS / géolocalisation.
 * - Token 128-bit aléatoire sécurisé (crypto.randomBytes(16)).
 * - Expiration après 30 jours pour les commandes livrées ou annulées.
 * - Projection publique étanche : élimine rigoureusement téléphone, adresse complète, marges et notes.
 * - Validation des rôles et assignations pour chaque transition de statut (permissions.ts).
 */

import crypto from "crypto";
import { UserRole } from "./types";
import { canTransitionOrderStatus } from "@/config/permissions";
import {
  TrackingStatus,
  TrackingPublicOrder,
  TrackingInternalOrder,
  TrackingStep,
  TRACKING_NORMAL_STATUSES,
  TRACKING_STATUS_CONFIG,
  OrderStatusAuditEntry,
} from "./tracking-types";
import {
  reserveStockForOrder,
  fulfillDeliveredOrderStock,
  releaseReservedStock,
} from "@/lib/stock-settings-store";

// Magasin en mémoire partagé (simulant la base de données PostgreSQL / Supabase)
const TRACKING_ORDERS_STORE: Map<string, TrackingInternalOrder> = new Map();

/**
 * Génère un jeton aléatoire cryptographique d'au moins 128 bits (32 caractères hexadécimaux).
 * Conforme à Prompt 05-T : non devinable, jamais le numéro de commande seul.
 */
export function generateTrackingToken(): string {
  return `tok_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Génère un code de confirmation aléatoire à 4 chiffres pour la preuve de livraison.
 */
export function generate4DigitProofCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Construit la frise chronologique normale (6 étapes) et marque l'état courant / passé.
 */
function buildTimeline(status: TrackingStatus, historyDateMap: Map<TrackingStatus, string>): TrackingStep[] {
  const isSpecial = TRACKING_STATUS_CONFIG[status].isSpecial;

  // Indice de l'étape courante dans les étapes normales
  let currentIdx = TRACKING_NORMAL_STATUSES.indexOf(status as (typeof TRACKING_NORMAL_STATUSES)[number]);
  if (currentIdx === -1) {
    // Si statut spécial (injoignable, reportée, annulée, retournée), l'étape active se situe après la confirmation ou préparation
    currentIdx = 2; // Préparée / En attente
  }

  return TRACKING_NORMAL_STATUSES.map((stepKey, idx) => {
    const config = TRACKING_STATUS_CONFIG[stepKey];
    const timestamp = historyDateMap.get(stepKey);
    const completed = !isSpecial ? idx < currentIdx : idx <= currentIdx;
    const current = !isSpecial ? idx === currentIdx : false;

    return {
      status: stepKey,
      label: config.shortLabel,
      timestamp,
      completed,
      current,
      message: current ? config.description : undefined,
    };
  });
}

/**
 * Vérifie si le jeton est expiré (30 jours après livraison ou annulation).
 */
export function isTrackingTokenExpired(order: TrackingInternalOrder): boolean {
  if (!order.expiresAt) return false;
  return new Date(order.expiresAt).getTime() < Date.now();
}

/**
 * Transforme une commande interne en vue publique sécurisée (Security Invoker / DTO public).
 * RÈGLE ABSOLUE Prompt 05-T :
 * - Publics : numéro de commande, prénom du client, produits (nom, quantité, image), statut, frise, ville, prénom du livreur (si autorisé), agence et suivi, logo/couleurs boutique, WhatsApp.
 * - STRICTEMENT JAMAIS PUBLICS : téléphone du client, adresse complète, prix d'achat, marges, notes internes.
 */
export function projectToPublicTrackingOrder(order: TrackingInternalOrder): TrackingPublicOrder | null {
  // Si le jeton est expiré, la réponse doit être neutre (équivalent 404 Lien introuvable)
  if (isTrackingTokenExpired(order)) {
    return null;
  }

  const historyDateMap = new Map<TrackingStatus, string>();
  for (const h of order.history) {
    historyDateMap.set(h.status, `${h.date} à ${h.time}`);
  }

  const currentConfig = TRACKING_STATUS_CONFIG[order.status];
  const normalIdx = TRACKING_NORMAL_STATUSES.indexOf(order.status as (typeof TRACKING_NORMAL_STATUSES)[number]);
  const currentStepIndex = normalIdx >= 0 ? normalIdx : 2;

  const timeline = buildTimeline(order.status, historyDateMap);

  // Minimisation stricte PII (K1) : e.g. "Prénom Nom" -> "Prénom N.", "+2250700000000" -> "+225 •• •• •• 00"
  const names = (order.customerFullName || order.customerFirstName || "").trim().split(" ");
  const maskedCustomerName = names.length > 1
    ? `${names[0]} ${names[names.length - 1][0].toUpperCase()}.`
    : names[0] || "Client";

  let maskedCustomerPhone = order.customerPhone || "";
  if (maskedCustomerPhone.length > 6) {
    const prefix = maskedCustomerPhone.slice(0, 4);
    const suffix = maskedCustomerPhone.slice(-2);
    maskedCustomerPhone = `${prefix} •• •• •• ${suffix}`;
  }

  return {
    token: order.token,
    orderNumber: order.orderNumber,
    customerFirstName: order.customerFirstName,
    maskedCustomerName,
    maskedCustomerPhone,
    status: order.status,
    statusLabel: currentConfig.label,
    statusDescription: currentConfig.description,
    currentStepIndex,
    timeline,
    history: order.history,
    city: order.city,
    country: order.country,
    shopName: "Lomé Glow Cosmétique",
    shopLogo: "/icons/brand-logo.png",
    shopWhatsapp: "+22890000000",
    themeColor: "#E05A47",
    items: order.items,
    // Prénom du livreur UNIQUEMENT si l'administrateur l'autorise (showCourierName: true)
    courierFirstName: order.showCourierName && order.assignedRiderName ? order.assignedRiderName.split(" ")[0] : undefined,
    agencyName: order.assignedAgencyName,
    agencyTrackingNumber: order.agencyTrackingNumber,
    requiresProofCode: order.enableProofOfDelivery,
    proofCodeForCustomer: order.enableProofOfDelivery ? order.proofCode : undefined,
    expiresAt: order.expiresAt,
    isExpired: false,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Recherche une commande par son jeton secret non devinable.
 */
export function getTrackingOrderByToken(token: string): TrackingPublicOrder | null {
  if (!token || token.length < 16) return null;
  const internal = TRACKING_ORDERS_STORE.get(token);
  if (!internal) return null;
  return projectToPublicTrackingOrder(internal);
}

/**
 * Recherche une commande interne (accès serveur authentifié uniquement).
 */
export function getInternalTrackingOrder(tokenOrId: string): TrackingInternalOrder | null {
  // Recherche par token
  if (TRACKING_ORDERS_STORE.has(tokenOrId)) {
    return TRACKING_ORDERS_STORE.get(tokenOrId)!;
  }
  // Recherche par orderId
  for (const order of TRACKING_ORDERS_STORE.values()) {
    if (order.id === tokenOrId || order.orderNumber === tokenOrId) {
      return order;
    }
  }
  return null;
}

/**
 * Transitionne le statut d'une commande avec contrôle de permissions strict côté serveur (Prompt 05-T).
 */
export function updateOrderStatusWithAudit(params: {
  tokenOrId: string;
  targetStatus: TrackingStatus;
  userId: string;
  userName: string;
  userRole: UserRole;
  proofCodeEntered?: string;
  reason?: string;
}): { success: boolean; error?: string; order?: TrackingPublicOrder; auditEntry?: OrderStatusAuditEntry } {
  const { tokenOrId, targetStatus, userId, userName, userRole, proofCodeEntered, reason } = params;

  const order = getInternalTrackingOrder(tokenOrId);
  if (!order) {
    return { success: false, error: "Commande introuvable" };
  }

  // 1. Vérification d'assignation pour les livreurs / agences
  const isAssignedToUser =
    userRole === "rider" || userRole === "courier"
      ? order.assignedRiderId === userId
      : userRole === "agency"
      ? order.assignedAgencyId === userId
      : true;

  // 2. Contrôle de permission via src/config/permissions.ts
  const isAllowed = canTransitionOrderStatus(userRole, targetStatus, isAssignedToUser);
  if (!isAllowed) {
    return {
      success: false,
      error: `Action non autorisée : Votre rôle (${userRole}) ne dispose pas des droits pour passer la commande en statut "${targetStatus}".`,
    };
  }

  // 3. Option Preuve de livraison (Prompt 05-T # Preuve de livraison)
  if (targetStatus === "delivered" && order.enableProofOfDelivery) {
    if (!proofCodeEntered || proofCodeEntered.trim() !== order.proofCode) {
      return {
        success: false,
        error: "Code de confirmation à 4 chiffres incorrect. Veuillez saisir le code remis par le client.",
      };
    }
  }

  const fromStatus = order.status;
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeFormatted = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // 4. Logique de Stock & Réservation (Prompt 16-b)
  const storeSlug = (order as any).storeSlug || order.shopId || "lome-glow";
  const orderProductId = (order as any).productId || order.items?.[0]?.id || "prod_1";
  const orderQty = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1;

  if (targetStatus === "confirmed") {
    // Vérification et réservation ferme lors de la confirmation par la closeuse
    const reserveRes = reserveStockForOrder({
      storeSlug,
      productId: orderProductId,
      quantity: orderQty,
      orderNumber: order.orderNumber,
      isCloserConfirmation: true,
    });

    if (!reserveRes.success && reserveRes.orderStatus === "pending_stock") {
      order.status = "pending_stock";
      order.updatedAt = now.toISOString();

      const pendingStockHistoryItem = {
        id: `hist_${Date.now()}`,
        status: "pending_stock" as TrackingStatus,
        label: TRACKING_STATUS_CONFIG["pending_stock"].label,
        date: dateFormatted,
        time: timeFormatted,
        note: "Stock insuffisant : confirmation closeuse refusée. Commande basculée en attente de stock prioritaire.",
      };
      order.history.unshift(pendingStockHistoryItem);

      return {
        success: false,
        error: "Stock insuffisant : la dernière unité a été prise par une autre commande. La commande a été basculée en statut 'En attente de stock'.",
        order: order as any,
      };
    }
  } else if (targetStatus === "delivered") {
    // Commande livrée : décrémente stock physique et solde la réservation
    fulfillDeliveredOrderStock({
      storeSlug,
      productId: orderProductId,
      quantity: orderQty,
      orderNumber: order.orderNumber,
    });
  } else if (targetStatus === "cancelled" || (targetStatus as string) === "rejected") {
    // Commande annulée ou rejetée : libération du stock réservé
    releaseReservedStock({
      storeSlug,
      productId: orderProductId,
      quantity: orderQty,
      orderNumber: order.orderNumber,
      reason: reason || "Annulation / Rejet",
    });
  }

  order.status = targetStatus;
  order.updatedAt = now.toISOString();

  // Si livrée ou annulée, expiration automatique fixée à 30 jours
  if (targetStatus === "delivered") {
    order.deliveredAt = now.toISOString();
    order.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (targetStatus === "cancelled") {
    order.cancelledAt = now.toISOString();
    order.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Ajout à l'historique de la commande
  const newHistoryItem = {
    id: `hist_${Date.now()}`,
    status: targetStatus,
    label: TRACKING_STATUS_CONFIG[targetStatus].label,
    date: dateFormatted,
    time: timeFormatted,
    note: reason,
  };
  order.history.unshift(newHistoryItem);

  // Ajout au journal d'audit strict
  const auditEntry: OrderStatusAuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.id,
    timestamp: now.toISOString(),
    userId,
    userName,
    role: userRole,
    fromStatus,
    toStatus: targetStatus,
    reason,
  };
  order.auditLogs.unshift(auditEntry);

  const publicOrder = projectToPublicTrackingOrder(order);

  return {
    success: true,
    order: publicOrder || undefined,
    auditEntry,
  };
}

/**
 * Génère le message WhatsApp officiel avec modèle paramétrable (Prompt 05-T # Où le client reçoit le lien) :
 * « Bonjour {prénom}, votre commande {numéro} est {statut}. Suivez-la ici : {lien} »
 */
export function generateWhatsAppTrackingUrl(params: {
  phone: string;
  customerFirstName: string;
  orderNumber: string;
  statusLabel: string;
  trackingToken: string;
  origin?: string;
}): string {
  const { phone, customerFirstName, orderNumber, statusLabel, trackingToken, origin = "" } = params;
  const trackingLink = `${origin}/suivi/${trackingToken}`;
  const message = `Bonjour ${customerFirstName}, votre commande ${orderNumber} est ${statusLabel}. Suivez-la ici : ${trackingLink}`;
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// =========================================================================
// Initialisation des données de démonstration conformes à la spécification
// =========================================================================

function seedDemoTrackingOrders() {
  // Aucune commande de démonstration
}

// Jeu d'essai désactivé - source de vérité unique = Supabase
// seedDemoTrackingOrders();

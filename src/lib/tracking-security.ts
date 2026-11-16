import crypto from "crypto";
import { PublicTrackingData } from "@/server/data/vague1-types";
import { Order } from "@/server/data/types";

/**
 * Génère un jeton public cryptographiquement fort (32 octets = 64 caractères hex).
 */
export function generateSecureTrackingToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashTrackingToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Hache le jeton pour le stockage sécurisé en base (protection en cas de fuite de la base).
 */
export function hashTrackingToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Masquage strict PII (Personally Identifiable Information) pour la page publique de suivi.
 * Ne divulgue jamais le nom complet, le téléphone complet ni l'adresse physique complète.
 */
export function maskCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "Client";
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1]?.charAt(0).toUpperCase() || "";
  return `${firstName} ${lastInitial}.`;
}

export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 8) return "••••••••";
  // Conserver l'indicatif et les 2 premiers chiffres + 2 derniers chiffres
  const prefix = clean.slice(0, clean.length - 6);
  const suffix = clean.slice(-2);
  return `${prefix} •• •• ${suffix}`;
}

export function sanitizePublicLocation(city: string, _fullAddress: string): string {
  // Conserver uniquement la Ville / Commune / Quartier général, jamais l'adresse de livraison précise (villa, carrefour, étage)
  return city || "Afrique";
}

/**
 * Convertit une commande AfriBuilder en vue publique de suivi sécurisée.
 */
export function buildPublicTrackingData(
  order: Order,
  storeInfo: { name: string; phone: string }
): PublicTrackingData {
  let mappedStatus: PublicTrackingData["status"] = "pending";
  if (order.status === "pending") mappedStatus = "pending";
  else if (order.status === "scheduled") mappedStatus = "confirmed";
  else if (order.status === "unreachable" || order.status === "postponed") mappedStatus = "postponed";
  else if (order.status === "delivered") mappedStatus = "delivered";
  else if (order.status === "rejected" || order.status === "cancelled") mappedStatus = "cancelled";

  return {
    orderNumber: order.orderNumber,
    status: mappedStatus,
    statusReason: order.notes || (order as any).statusReason,
    createdAt: order.createdAt,
    estimatedDelivery: order.scheduledDate || "Dans les 24h à 48h ouvrées",
    storeName: storeInfo.name,
    storePhone: storeInfo.phone,
    customerInitials: maskCustomerName(order.customerName),
    maskedPhone: maskPhoneNumber(order.customerPhone),
    destinationCity: sanitizePublicLocation(order.city, order.deliveryAddress),
    items: order.items.map((it) => ({
      productName: it.productName,
      variant: it.variant,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      image: it.image,
    })),
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    currency: order.currency || "XOF",
    paymentMethod: "cod",
  };
}

// Limitation de débit anti-énumération en mémoire pour les consultations publiques
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkTrackingRateLimit(ipOrKey: string, maxRequests = 30, windowSeconds = 60): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ipOrKey);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ipOrKey, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Bloqué par limitation de débit
  }

  record.count++;
  return true;
}

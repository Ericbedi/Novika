import { Product } from "@/server/data/types";
import {
  OrderFormSubmissionPayload,
  OrderFormRecalculatedOrder,
  OrderFormSettings,
  QuantityOffer,
} from "@/server/data/product-page-types";
import { generateSecureTrackingToken } from "@/lib/tracking-security";
import { getZoneByCity } from "@/mock-data/shipping-zones";

// Idempotency store pour éviter les doubles clics
const processedIdempotencyKeys = new Set<string>();

// Historique des commandes pour détection de doublons (24h)
interface RecentOrderRecord {
  phone: string;
  productId: string;
  createdAt: number; // timestamp
}
const recentOrdersCache: RecentOrderRecord[] = [
  {
    phone: "+2250748291102",
    productId: "prod_coffee",
    createdAt: Date.now() - 3 * 3600 * 1000,
  },
];

/**
 * Vérifie si une commande identique existe déjà dans les dernières 24 heures.
 */
export function checkOrder24hDuplicate(
  phone: string,
  productId: string
): { isDuplicate: boolean; warningMessage?: string } {
  const cleanPhone = phone.replace(/\D/g, "");
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;

  const found = recentOrdersCache.find(
    (r) => r.createdAt > oneDayAgo && r.productId === productId && r.phone.replace(/\D/g, "") === cleanPhone
  );

  if (found) {
    return {
      isDuplicate: true,
      warningMessage:
        "Vous avez déjà passé une commande pour cet article aujourd'hui. Souhaitez-vous modifier votre commande existante ou confirmer un second colis ?",
    };
  }

  return { isDuplicate: false };
}

/**
 * RECALCUL STRICT CÔTÉ SERVEUR :
 * RÈGLE ABSOLUE : La livraison est 100% GRATUITE pour le client sur toute la plateforme.
 * Les frais de livraison client sont STRICTEMENT ÉGAUX À 0 FCFA.
 * Ne fait JAMAIS confiance aux montants financiers envoyés par le navigateur client.
 */
export function recalculateOrderOnServer(
  payload: OrderFormSubmissionPayload,
  product: Product,
  settings: OrderFormSettings,
  availableOffers: QuantityOffer[]
): {
  success: boolean;
  error?: string;
  recalculatedOrder?: OrderFormRecalculatedOrder & {
    zoneType?: "local" | "expedition" | "not_served";
    paymentMode?: "cod" | "prepaid" | "cod_pickup";
    carrierName?: string;
    pickupPointName?: string;
  };
} {
  // 1. Détection Anti-robot Honeypot
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return {
      success: false,
      error: "Soumission suspecte rejetée par les défenses anti-robot.",
    };
  }

  // 2. Détection Anti Double-Clic (Clé d'idempotence)
  if (payload.idempotencyKey && processedIdempotencyKeys.has(payload.idempotencyKey)) {
    return {
      success: false,
      error: "Cette commande a déjà été traitée (anti double-clic activé).",
    };
  }

  // 3. Validation des champs obligatoires
  if (!payload.customerName.trim()) {
    return { success: false, error: "Le nom et prénom sont obligatoires." };
  }
  if (!payload.customerPhone.trim() || payload.customerPhone.replace(/\D/g, "").length < 8) {
    return { success: false, error: "Un numéro de téléphone joignable valide est obligatoire." };
  }
  if (!payload.city.trim()) {
    return { success: false, error: "La ville de livraison est obligatoire." };
  }
  if (!payload.address.trim()) {
    return { success: false, error: "L'adresse ou point de repère de livraison est obligatoire." };
  }

  // 4. Vérification de la zone de livraison
  const zone = getZoneByCity(payload.city, "TG");
  if (zone && zone.zoneType === "not_served") {
    return {
      success: false,
      error: "Désolé, la livraison est actuellement indisponible dans cette ville.",
    };
  }

  // 5. Case d'engagement obligatoire
  if (settings.requireCommitmentCheckbox && !payload.commitmentChecked) {
    return {
      success: false,
      error: "Veuillez cocher la case confirmant votre engagement.",
    };
  }

  // 6. Calcul strict côté serveur des articles et quantités
  let quantity = 1;
  const productPrice = product.price || product.salePrice;
  let unitPrice = productPrice;
  let savingsAmount = 0;
  let subtotal = productPrice;

  if (payload.quantityOfferId) {
    const selectedOffer = availableOffers.find((o) => o.id === payload.quantityOfferId);
    if (selectedOffer) {
      quantity = selectedOffer.quantity;
      unitPrice = selectedOffer.unitPrice;
      subtotal = selectedOffer.totalPrice;
      savingsAmount = selectedOffer.savingsAmount;
    }
  }

  // 7. RÈGLE ABSOLUE PLATEFORME : Frais de livraison client TOUJOURS ÉGAUX À 0
  const shippingFee = 0;
  const totalAmount = subtotal; // Le client ne paie QUE le montant des produits

  // Numéro de commande sécurisé
  const orderNumber = `CMD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Enregistrement de l'idempotence
  if (payload.idempotencyKey) {
    processedIdempotencyKeys.add(payload.idempotencyKey);
  }

  // Enregistrement dans le cache récent pour détection de doublon 24h
  recentOrdersCache.push({
    phone: payload.customerPhone,
    productId: product.id,
    createdAt: Date.now(),
  });

  // Génération du jeton de suivi client sécurisé (K1)
  const tracking = generateSecureTrackingToken();

  // Déterminer le mode de paiement et statut initial
  const isExpedition = zone?.zoneType === "expedition";
  const paymentMode = zone?.paymentMode || (isExpedition ? "prepaid" : "cod");
  const initialStatus = paymentMode === "prepaid" ? "en_attente_paiement" : "a_traiter";

  // Message WhatsApp pré-rempli pour la boutique
  const prodTitle = product.title || product.name;
  const paymentNotice = paymentMode === "prepaid" ? "Payé d'avance / En attente" : "Paiement à la livraison";
  const waText = encodeURIComponent(
    `Bonjour ! Je viens de commander ${quantity}x "${prodTitle}" sur votre boutique (Commande #${orderNumber}). Montant : ${totalAmount.toLocaleString("fr-FR")} FCFA (Livraison Gratuite). Ville : ${payload.city}, ${payload.address}. Mode : ${paymentNotice}.`
  );
  const whatsAppConfirmationUrl = `https://wa.me/22890123456?text=${waText}`;

  return {
    success: true,
    recalculatedOrder: {
      orderNumber,
      productTitle: prodTitle,
      quantity,
      unitPrice,
      subtotal,
      shippingFee: 0, // Toujours 0 FCFA pour le client
      savingsAmount,
      totalAmount,
      currency: "FCFA",
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      city: payload.city.trim(),
      address: payload.address.trim(),
      trackingToken: tracking.rawToken,
      trackingUrl: `/suivi/${tracking.rawToken}`,
      whatsAppConfirmationUrl,
      createdAt: "À l'instant",
      zoneType: zone?.zoneType || "local",
      paymentMode,
      carrierName: zone?.carrierId ? "UTB Relais Express" : undefined,
    },
  };
}

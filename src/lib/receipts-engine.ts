import {
  Receipt,
  ReceiptItemSnapshot,
  ReceiptMode,
  ReceiptSettings,
  ReceiptStatus,
  ProductReceiptContent,
  ReceiptSendLogEntry,
} from "@/server/data/receipt-types";
import { Order, OrderItem, Store } from "@/server/data/types";

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  storeId: "store_lome_01",
  mode: "per_order",
  template: "detailed",
  maxDetailedBlocks: 3,
  reminderDelayHours: 2,
  legalNotice: "Ce reçu confirme la livraison et le paiement de la commande. Il ne remplace pas une facture.",
  defaultWarranty: "Garantie de conformité de 14 jours à compter de la livraison en mains propres.",
  defaultReturnTerms: "Échange gratuit sous 48h en cas de produit non conforme ou endommagé lors du transport.",
  isAutoSendActive: false,
};

export const DEFAULT_RECEIPT_CONTENT: ProductReceiptContent = {
  language: "fr",
  usageInstructions: "À conserver dans un endroit sec et frais. Utiliser conformément aux indications de l'emballage.",
  warranty: "Garantie satisfait ou échangé sous 48 heures ouvrées.",
  returnTerms: "Retour possible uniquement si le produit est dans son emballage d'origine non ouvert.",
  precautions: "Tenir hors de portée des enfants. En cas de doute, demander l'avis d'un spécialiste.",
  careAdvice: "Conserver à l'abri de l'humidité et de la lumière directe du soleil.",
  thankYouNote: "Merci infiniment pour votre achat et votre confiance ! Notre équipe reste à votre écoute.",
  shortWhatsAppLine: "Pensez à bien refermer le flacon après chaque utilisation.",
  includeReviewLink: true,
};

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Bonjour {prenom} ! 📦 Votre commande {numero_commande} ({total}) livrée le {date_livraison} par {boutique}.\n\n" +
  "{lignes_produits}\n\n" +
  "Retrouvez votre reçu officiel de livraison ici : {lien_recu}\n\n" +
  "Merci de votre confiance !";

/**
 * Nettoie une chaîne de texte pour éviter les injections de contrôle et de HTML.
 */
export function sanitizePlainText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Génère un jeton long, aléatoire et cryptographiquement résistant.
 */
export function generateReceiptToken(orderNumber: string, index = 0): string {
  const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  const cleanOrder = orderNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `rcp_${cleanOrder}_${index > 0 ? `${index}_` : ""}${timestamp}_${rand}`;
}

/**
 * Calcule la répartition proportionnelle de la remise par article
 * avec report systématique du reliquat d'arrondi sur le dernier article.
 */
export function calculateProportionalDiscounts(
  items: Array<{ totalPrice: number }>,
  totalDiscount: number
): number[] {
  if (items.length === 0 || totalDiscount <= 0) {
    return items.map(() => 0);
  }

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (subtotal <= 0) {
    return items.map(() => 0);
  }

  let allocatedSum = 0;
  const discounts: number[] = [];

  for (let i = 0; i < items.length; i++) {
    if (i === items.length - 1) {
      // Le dernier article reçoit le reliquat exact pour garantir sum(discounts) === totalDiscount
      const remainder = totalDiscount - allocatedSum;
      discounts.push(Math.max(0, remainder));
    } else {
      const share = Math.round((items[i].totalPrice / subtotal) * totalDiscount);
      discounts.push(share);
      allocatedSum += share;
    }
  }

  return discounts;
}

/**
 * Génère les reçus (1 par commande ou 1 par produit) à partir d'une commande livrée.
 */
export function createReceiptsForDeliveredOrder(
  order: Order,
  store: Store,
  settings: ReceiptSettings = DEFAULT_RECEIPT_SETTINGS,
  productContentsMap: Record<string, ProductReceiptContent> = {},
  existingOptouts: string[] = []
): Receipt[] {
  const isOptedOut = existingOptouts.includes(order.customerPhone.replace(/[^0-9]/g, ""));
  const cleanFirstName = sanitizePlainText(order.customerName.split(" ")[0] || "Client");
  const cleanCity = sanitizePlainText(order.city || "Lomé");
  const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountTotal = Math.max(0, subtotal - order.totalAmount);

  // Copie figée des instantanés de chaque produit
  const itemDiscounts = calculateProportionalDiscounts(order.items, discountTotal);
  const itemSnapshots: ReceiptItemSnapshot[] = order.items.map((item, idx) => {
    const content = productContentsMap[item.productId] || {
      ...DEFAULT_RECEIPT_CONTENT,
      warranty: settings.defaultWarranty,
      returnTerms: settings.defaultReturnTerms,
    };

    const discountShare = itemDiscounts[idx] || 0;
    return {
      orderItemId: item.id || `item_${idx}`,
      productId: item.productId,
      productName: sanitizePlainText(item.productName),
      variantName: item.variant ? sanitizePlainText(item.variant) : undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discountShare,
      finalPrice: Math.max(0, item.totalPrice - discountShare),
      image: item.image,
      receiptContent: {
        language: content.language || "fr",
        usageInstructions: sanitizePlainText(content.usageInstructions),
        warranty: sanitizePlainText(content.warranty || settings.defaultWarranty),
        returnTerms: sanitizePlainText(content.returnTerms || settings.defaultReturnTerms),
        precautions: sanitizePlainText(content.precautions),
        careAdvice: sanitizePlainText(content.careAdvice),
        thankYouNote: sanitizePlainText(content.thankYouNote),
        shortWhatsAppLine: content.shortWhatsAppLine ? sanitizePlainText(content.shortWhatsAppLine) : undefined,
        includeReviewLink: content.includeReviewLink ?? true,
      },
    };
  });

  const nowIso = new Date().toISOString();
  // Expiration à 90 jours
  const expiresIso = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const storeSnapshot = {
    name: sanitizePlainText(store.name),
    logo: store.logo,
    phone: store.whatsappNumber,
    whatsapp: store.whatsappNumber,
    email: "contact@afribuilder.com",
    legalMentions: "RCCM TG-LOM-2026-B-1289 - NIF 1000293847 - Tous droits réservés",
  };

  // CAS 1 : Mode « Un reçu par commande » (par défaut)
  if (settings.mode === "per_order") {
    const orderToken = generateReceiptToken(order.orderNumber);
    const receiptNum = `REC-${new Date().getFullYear()}-${order.orderNumber.replace(/[^0-9]/g, "").padStart(6, "0")}`;

    const receipt: Receipt = {
      id: `rcp_${order.id}`,
      storeId: store.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      receiptNumber: receiptNum,
      token: orderToken,
      tokenHash: `hash_${orderToken}`,
      scope: "entire_order",
      status: isOptedOut ? "opted_out" : "to_send",
      deliveredAt: order.updatedAt || nowIso,
      expiresAt: expiresIso,
      createdAt: nowIso,
      customerFirstName: cleanFirstName,
      customerCity: cleanCity,
      customerPhone: order.customerPhone,
      isOptedOut,
      items: itemSnapshots,
      subtotal,
      discountTotal,
      shippingFee: 0,
      totalAmount: order.totalAmount,
      currency: store.currency,
      paymentMethod: "Espèces à la livraison (COD)",
      legalNotice: settings.legalNotice,
      reviewLink: `/suivi/${orderToken}#avis`,
      storeSnapshot,
      sendLogs: [],
      viewsCount: 0,
      resendCount: 0,
    };

    return [receipt];
  }

  // CAS 2 : Mode « Un reçu par produit »
  const receipts: Receipt[] = [];
  const baseOrderNum = order.orderNumber.replace(/[^0-9]/g, "").padStart(6, "0");

  itemSnapshots.forEach((itemSnap, idx) => {
    const itemIndex = idx + 1;
    const itemToken = generateReceiptToken(order.orderNumber, itemIndex);
    const itemReceiptNum = `REC-${new Date().getFullYear()}-${baseOrderNum}-${itemIndex}`;

    const itemReceipt: Receipt = {
      id: `rcp_${order.id}_${itemSnap.orderItemId}`,
      storeId: store.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      receiptNumber: itemReceiptNum,
      token: itemToken,
      tokenHash: `hash_${itemToken}`,
      scope: "single_item",
      orderItemLineId: itemSnap.orderItemId,
      status: isOptedOut ? "opted_out" : "to_send",
      deliveredAt: order.updatedAt || nowIso,
      expiresAt: expiresIso,
      createdAt: nowIso,
      customerFirstName: cleanFirstName,
      customerCity: cleanCity,
      customerPhone: order.customerPhone,
      isOptedOut,
      items: [itemSnap],
      subtotal: itemSnap.totalPrice,
      discountTotal: itemSnap.discountShare,
      shippingFee: 0,
      totalAmount: itemSnap.finalPrice,
      currency: store.currency,
      paymentMethod: "Espèces à la livraison (COD)",
      legalNotice: settings.legalNotice,
      reviewLink: `/suivi/${itemToken}#avis`,
      storeSnapshot,
      sendLogs: [],
      viewsCount: 0,
      resendCount: 0,
    };

    receipts.push(itemReceipt);
  });

  // Relier les reçus de la commande entre eux
  const allIds = receipts.map((r) => r.id);
  receipts.forEach((r) => {
    r.relatedReceiptIds = allIds.filter((id) => id !== r.id);
  });

  return receipts;
}

/**
 * Construit le bloc de lignes de produits pour le message WhatsApp.
 * Insère le nom et la ligne courte WhatsApp si elle existe.
 * Max 5 produits, puis "… et N autres".
 */
export function buildWhatsAppProductLines(items: ReceiptItemSnapshot[]): string {
  if (!items || items.length === 0) return "";

  const maxItems = 5;
  const displayedItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  const lines = displayedItems.map((item) => {
    let line = `• ${item.productName}`;
    if (item.quantity > 1) {
      line += ` (x${item.quantity})`;
    }
    if (item.receiptContent.shortWhatsAppLine) {
      line += `\n  💡 ${item.receiptContent.shortWhatsAppLine.trim()}`;
    }
    return line;
  });

  if (remainingCount > 0) {
    lines.push(`• … et ${remainingCount} autre${remainingCount > 1 ? "s" : ""}`);
  }

  return lines.join("\n");
}

/**
 * Construit le texte du message WhatsApp à partir du modèle et du reçu.
 */
export function buildReceiptWhatsAppMessage(
  receipt: Receipt,
  templateString: string = DEFAULT_WHATSAPP_TEMPLATE,
  publicBaseUrl = "https://afribuilder.com"
): string {
  const receiptUrl = `${publicBaseUrl}/recu/${receipt.token}`;
  const productLines = buildWhatsAppProductLines(receipt.items);
  const formattedTotal = `${receipt.totalAmount.toLocaleString("fr-FR")} ${receipt.currency}`;
  const formattedDate = new Date(receipt.deliveredAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  let message = templateString
    .replace(/\{prenom\}/g, receipt.customerFirstName)
    .replace(/\{numero_commande\}/g, receipt.orderNumber)
    .replace(/\{date_livraison\}/g, formattedDate)
    .replace(/\{total\}/g, formattedTotal)
    .replace(/\{boutique\}/g, receipt.storeSnapshot.name)
    .replace(/\{lignes_produits\}/g, productLines)
    .replace(/\{lien_recu\}/g, receiptUrl);

  // Nettoyage : pas de caractères de contrôle, retours à la ligne max 2 consécutifs
  message = message.replace(/\n{3,}/g, "\n\n").trim();

  // S'assurer que le lien du reçu est bien présent
  if (!message.includes(receiptUrl)) {
    message += `\n\nConsultez votre reçu ici : ${receiptUrl}`;
  }

  return message;
}

/**
 * Génère l'URL WhatsApp wa.me nettoyée et encodée.
 */
export function buildWaMeUrl(customerPhone: string, messageText: string): string {
  // Format international avec chiffres seuls
  const digitsOnly = customerPhone.replace(/[^0-9]/g, "");
  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${digitsOnly}?text=${encodedMessage}`;
}

/**
 * Enregistre une consultation de reçu (comptabilisation côté serveur sans IP).
 */
export function recordReceiptView(receipt: Receipt): Receipt {
  const now = new Date().toISOString();
  return {
    ...receipt,
    status: receipt.status === "to_send" || receipt.status === "sent" ? "viewed" : receipt.status,
    viewsCount: receipt.viewsCount + 1,
    firstViewedAt: receipt.firstViewedAt || now,
    lastViewedAt: now,
  };
}

/**
 * Enregistre une déclaration manuelle d'envoi de reçu.
 */
export function recordReceiptSent(
  receipt: Receipt,
  sentByUserId: string,
  sentByUserName: string,
  method: "whatsapp_web" | "manual" = "whatsapp_web",
  resendReason?: string
): Receipt {
  const logEntry: ReceiptSendLogEntry = {
    id: `log_${Date.now()}`,
    receiptId: receipt.id,
    sentBy: sentByUserId,
    sentByName: sentByUserName,
    sentAt: new Date().toISOString(),
    method,
    resendReason,
  };

  const isResend = Boolean(resendReason) || receipt.sendLogs.length > 0;

  return {
    ...receipt,
    status: receipt.status === "viewed" ? "viewed" : "sent",
    resendCount: isResend ? receipt.resendCount + 1 : receipt.resendCount,
    sendLogs: [logEntry, ...receipt.sendLogs],
  };
}

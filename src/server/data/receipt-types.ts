export interface ProductReceiptContent {
  productId?: string;
  language: string; // "fr" | "en" | "ar"
  usageInstructions: string; // Conseils d'utilisation
  warranty: string; // Garantie spécifique
  returnTerms: string; // Conditions de retour ou d'échange spécifiques
  precautions: string; // Précautions d'emploi ou composition
  careAdvice: string; // Conseil d'entretien
  thankYouNote: string; // Remerciement personnalisé
  shortWhatsAppLine?: string; // Ligne WhatsApp courte (140 car max)
  includeReviewLink: boolean; // Case à cocher : lien pour donner son avis
}

export type ReceiptMode = "per_order" | "per_product";
export type ReceiptTemplateType = "compact" | "detailed";

export interface ReceiptSettings {
  storeId: string;
  mode: ReceiptMode; // "per_order" (défaut) | "per_product"
  template: ReceiptTemplateType;
  maxDetailedBlocks: number; // Max blocs détaillés par reçu
  reminderDelayHours: number; // Délai de rappel si non envoyé (ex: 2h)
  legalNotice: string; // "Ce reçu confirme la livraison et le paiement de la commande. Il ne remplace pas une facture."
  defaultWarranty: string;
  defaultReturnTerms: string;
  primaryColor?: string;
  isAutoSendActive: boolean; // TOUJOURS false (API auto désactivée)
}

export type ReceiptStatus =
  | "to_send" // À envoyer
  | "sent" // Envoyé (déclaration manuelle)
  | "viewed" // Consulté par le client
  | "cancelled" // Annulé
  | "no_whatsapp" // Pas de WhatsApp
  | "invalid_number" // Numéro invalide
  | "opted_out"; // Client ne souhaite pas de messages

export interface ReceiptItemSnapshot {
  orderItemId: string;
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountShare: number; // Quote-part de remise imputée
  finalPrice: number; // totalPrice - discountShare
  image?: string;
  receiptContent: ProductReceiptContent; // Copie figée dans l'instantané
}

export interface ReceiptSendLogEntry {
  id: string;
  receiptId: string;
  sentBy: string; // User ID
  sentByName: string; // Nom de l'agent (closer, admin, etc.)
  sentAt: string;
  method: "whatsapp_web" | "manual";
  resendReason?: string;
  note?: string;
}

export interface Receipt {
  id: string;
  storeId: string;
  orderId: string;
  orderNumber: string;
  receiptNumber: string; // ex: REC-2026-000123 ou REC-2026-000123-1
  token: string; // Jeton public unique long et sécurisé
  tokenHash: string; // SHA-256
  scope: "entire_order" | "single_item";
  orderItemLineId?: string; // ID de la ligne si scope === "single_item"
  parentReceiptId?: string;
  relatedReceiptIds?: string[];
  status: ReceiptStatus;
  deliveredAt: string;
  expiresAt: string;
  createdAt: string;
  
  // Client (prénom et ville uniquement, sans adresse complète ni téléphone en clair dans le reçu public)
  customerFirstName: string;
  customerCity: string;
  customerPhone: string; // format international e.g. "+22890123456"
  isOptedOut: boolean;

  // Lignes & Financier
  items: ReceiptItemSnapshot[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number; // 0 (Livraison gratuite)
  totalAmount: number;
  currency: string;
  paymentMethod: "Espèces à la livraison (COD)" | "Mobile Money";

  // Textes & Mentions
  legalNotice: string;
  reviewLink?: string;

  // Instantané boutique
  storeSnapshot: {
    name: string;
    logo?: string;
    phone: string;
    whatsapp: string;
    email: string;
    legalMentions: string;
  };

  // Suivi envois et consultations (sans aucune IP enregistrée)
  sendLogs: ReceiptSendLogEntry[];
  viewsCount: number;
  firstViewedAt?: string;
  lastViewedAt?: string;
  resendCount: number; // Max 3
}

export interface ReceiptMessageTemplate {
  id: string;
  storeId: string;
  language: string;
  template: string; // variables: {prenom}, {numero_commande}, {date_livraison}, {total}, {boutique}, {lien_recu}, {lignes_produits}
}

export interface MessageOptout {
  id: string;
  storeId: string;
  phone: string;
  optedOutBy: string;
  optedOutByName: string;
  optedOutAt: string;
  reason?: string;
}

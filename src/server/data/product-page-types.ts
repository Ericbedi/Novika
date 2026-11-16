/**
/**
 * Types TypeScript pour les Formulaires de Commande Standard, Modèles de Page Produit,
 * Bannières défilantes, Palettes de couleurs et Avis clients.
 */

export interface QuantityOffer {
  id: string;
  productId: string;
  quantity: number;
  label: string; // Ex: "Pack Découverte (1 boîte)", "Pack Duo Recommandé (2 boîtes)"
  badge?: string; // Ex: "Le plus populaire", "Meilleure offre (-30%)"
  unitPrice: number; // en FCFA
  totalPrice: number; // en FCFA
  savingsAmount: number; // en FCFA
  isDefault?: boolean;
}

export interface OrderFormSettings {
  id: string;
  storeId: string;
  title: string; // "Remplissez le formulaire pour confirmer votre commande"
  warningText?: string; // "Réservé aux personnes disponibles pour recevoir et payer..."
  isWarningEnabled: boolean;
  offerBadgeText: string; // "Offre Spéciale COD"
  requireCommitmentCheckbox: boolean;
  commitmentCheckboxText: string; // "Je confirme être disponible et prêt à payer à la réception"
  reassuranceMicrotexts: string[]; // ["Vous vérifiez avant de payer", "Nous vous appelons pour confirmer sous 15 min"]
  showEmailField: boolean;
  showDistrictField: boolean;
  showDeliveryInstructions: boolean;
  showDeliveryPrecision?: boolean;
  servedCountries: string[]; // ["TG", "CI", "SN", "BJ"]
  shippingFeesByCity: Record<string, number>; // { "Lomé": 1500, "Abidjan": 2000, "Cotonou": 1500 }
  abandonedCartCaptureEnabled: boolean;
  abandonedCartConsentNotice: string;
}

export type ProductPageSectionId =
  | "countdown_banner"
  | "header_purchase"
  | "reassurance_banner"
  | "use_cases"
  | "quick_proofs"
  | "product_promise"
  | "problem_solution"
  | "quantity_offers_repeat"
  | "detailed_benefits"
  | "how_to_use"
  | "warranties_delivery"
  | "faq"
  | "legal_disclaimer"
  | "customer_reviews"
  | "order_form_repeat";

export interface ProductPageSection {
  id: ProductPageSectionId;
  title: string;
  isEnabled: boolean;
  order: number;
  content: Record<string, any>;
}

export interface ProductThemePalette {
  id: string;
  productId: string;
  primary: string; // #RRGGBB
  hover: string; // #RRGGBB
  contrastText: "#FFFFFF" | "#111111"; // Contrôle de contraste WCAG AA >= 4.5:1
  softBg: string; // Teinte douce hex
  border: string; // Bordure subtile hex
  accent: string; // Couleur d'accentuation COD
  isDerivedFromImage: boolean;
  sourceImageUrl?: string;
}

export interface ShopGuarantee {
  id: string;
  storeId: string;
  type: "cod" | "inspection" | "delivery_time" | "money_back" | "phone_confirmation";
  title: string;
  shortDescription: string;
  fullTerms: string;
  iconName: string;
  isEnabled: boolean;
  displayOrder: number;
}

export interface ShopBannerItem {
  id: string;
  storeId: string;
  type: "guarantee" | "verified_review" | "custom_announcement";
  content: string; // Max 100 caractères
  authorName?: string;
  authorCity?: string;
  rating?: number;
  guaranteeRefId?: string;
  isEnabled: boolean;
  isVerifiedBuyer?: boolean;
}

export interface ReviewToken {
  id: string;
  tokenHash: string;
  rawToken?: string;
  orderId: string;
  storeId: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface ProductReview {
  id: string;
  storeId: string;
  productId: string;
  orderId?: string;
  isVerifiedBuyer: boolean; // Lié à une commande livrée réelle
  rating: number; // 1 à 5 étoiles
  customerName: string;
  customerCity: string;
  comment: string;
  photoUrls?: string[];
  status: "published" | "pending_moderation" | "rejected";
  moderationNotes?: string;
  createdAt: string;
  sellerReply?: {
    id: string;
    comment: string;
    repliedAt: string;
    repliedByName: string;
  };
}

export interface OrderFormSubmissionPayload {
  storeSlug: string;
  productId: string;
  quantityOfferId?: string;
  variantId?: string;
  customerName: string;
  customerPhone: string;
  isWhatsApp: boolean;
  country: string;
  city: string;
  district?: string;
  address: string;
  deliveryPrecision?: string;
  email?: string;
  commitmentChecked: boolean;
  honeypot?: string; // Champ anti-robot
  idempotencyKey: string;
}

export interface OrderFormRecalculatedOrder {
  orderNumber: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippingFee: number;
  savingsAmount: number;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  trackingToken: string;
  trackingUrl: string;
  whatsAppConfirmationUrl: string;
  createdAt: string;
}

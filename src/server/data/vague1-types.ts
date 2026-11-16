export type DeliveryProofType = "none" | "code" | "photo";

export interface TrackingTokenInfo {
  id: string;
  orderId: string;
  orderNumber: string;
  tokenHash: string; // SHA-256 hashed token
  rawToken: string; // only used during generation
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  lastAccessedAt?: string;
  isRevoked: boolean;
}

export interface PublicTrackingData {
  orderNumber: string;
  status: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "postponed" | "cancelled" | "rejected";
  statusReason?: string;
  createdAt: string;
  estimatedDelivery?: string;
  storeName: string;
  storePhone: string;
  customerInitials: string; // e.g. "Awa T."
  maskedPhone: string; // e.g. "+225 07 •• •• 02"
  destinationCity: string; // e.g. "Abidjan (Cocody)" - NO full street address
  items: Array<{
    productName: string;
    variant?: string;
    quantity: number;
    unitPrice: number;
    image?: string;
  }>;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentMethod: "cod" | "online";
}

export interface DeliveryProofRecord {
  id: string;
  orderId: string;
  storeId: string;
  proofType: DeliveryProofType;
  codeEntered?: string;
  photoUrl?: string;
  riderId: string;
  riderName: string;
  hasRiderConsentForGeo: boolean;
  latitude?: number;
  longitude?: number;
  verifiedAt: string;
  status: "verified" | "failed";
  failureReason?: string;
}

export interface DeliveryCodeRecord {
  id: string;
  orderId: string;
  codeHash: string;
  expiresAt: string;
  attemptsCount: number;
  maxAttempts: number;
  isVerified: boolean;
  isLocked: boolean;
  createdAt: string;
}

export interface QuickOrderDraft {
  id: string;
  storeId: string;
  rawSourceText: string;
  extractedData: {
    customerName: string;
    customerPhone: string;
    productName: string;
    variantName?: string;
    quantity: number;
    city: string;
    address: string;
    notes?: string;
    unitPrice?: number;
  };
  matchedProductId?: string;
  matchedVariantId?: string;
  confidenceScore: number; // 0 to 1
  isPotentialDuplicate: boolean;
  duplicateDetails?: string;
  status: "draft" | "validated" | "rejected";
  createdBy: string;
  createdAt: string;
  validatedAt?: string;
  createdOrderId?: string;
}

export type MessageTemplateCategory = "pricing" | "availability" | "confirmation" | "followup" | "delivery_tracking";

export interface MessageTemplate {
  id: string;
  storeId: string;
  title: string;
  category: MessageTemplateCategory;
  bodyTemplate: string;
  variables: string[]; // e.g. ["client", "produit", "montant", "lien_suivi", "boutique"]
  isDefault: boolean;
  createdAt: string;
}

export interface OfflineAction {
  id: string;
  idempotencyKey: string;
  storeId: string;
  userId: string;
  actionType: "mark_delivered" | "mark_delivery_failure" | "assign_rider" | "update_status";
  payload: Record<string, any>;
  clientTimestamp: string;
  serverSyncedAt?: string;
  status: "pending" | "synced" | "conflict_skipped" | "failed";
  errorMessage?: string;
}

export type StorefrontThemeId = "banner_hero" | "visual_gallery" | "editorial" | "express_cod" | "minimal_modern";

export interface StorefrontTheme {
  id: StorefrontThemeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  previewThumbnail: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  layoutStyle: "hero_banner" | "grid_masonry" | "split_editorial" | "sticky_conversion" | "zen_minimal";
  features: string[];
}

export interface PlanBillingTier {
  id: "usage" | "starter" | "pro" | "scale";
  name: string;
  billingPeriod: "monthly" | "yearly";
  priceMonthly: number;
  priceYearlyDiscounted: number; // 20% discount
  currency: string;
  deliveredOrdersIncluded: number;
  overageFeePerDelivered: number; // e.g. 150 FCFA
  freeInitialOrders: number; // 20 free orders for usage
  maxStores: number;
  maxMembers: number;
  aiCreditsMonthly: number;
  features: string[];
  isPopular?: boolean;
}

export interface StoreUsageMetrics {
  storeId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  planId: "usage" | "starter" | "pro" | "scale";
  deliveredOrdersCount: number;
  receivedOrdersCount: number; // recorded for information only, NEVER billed
  deliveredOrdersBillable: number;
  freeOrdersRemaining: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  storesCount: number;
  storesLimit: number;
  membersCount: number;
  membersLimit: number;
  currentCycleInvoiceAmount: number;
  isOverQuota: boolean;
}

/**
 * Définition des types métier de la plateforme AfriBuilder.
 */

export const ORDER_STATUSES = [
  "pending", // À traiter (bleu)
  "confirmed", // Confirmée
  "prepared", // Préparée
  "unreachable", // Injoignable / Je vous reviens (orange)
  "scheduled", // Programmée (violet)
  "postponed", // Reportée (jaune)
  "delivered", // Livrée (vert)
  "rejected", // Rejetée (rouge - refus client)
  "rejected_invalid_number", // Rejetée - numéro invalide
  "lost_unreachable", // Perdue - injoignable (cadence épuisée)
  "cancelled", // Annulée (avant expédition)
  "pending_stock", // En attente de stock (Prompt 16-b)
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "À traiter",
  confirmed: "Confirmée",
  prepared: "Préparée",
  unreachable: "Injoignable / Je vous reviens",
  scheduled: "Programmée",
  postponed: "Reportée",
  delivered: "Livrée",
  rejected: "Rejetée",
  rejected_invalid_number: "Rejetée – numéro invalide",
  lost_unreachable: "Perdue – injoignable",
  cancelled: "Annulée",
  pending_stock: "En attente de stock",
};

export type UserRole = "owner" | "admin" | "manager" | "closer" | "rider" | "courier" | "agency";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: "Admin",
  admin: "Admin",
  manager: "Admin",
  closer: "Closeur",
  rider: "Livreur",
  courier: "Livreur",
  agency: "Agence de livraison",
};

export interface Store {
  id: string;
  name: string;
  slug: string;
  country: string; // ISO 3166-1 alpha-2 (54 pays africains)
  countryName: string;
  flag: string;
  currency: string; // ISO 4217 (XOF, XAF, NGN, GHS, KES, ZAR, etc.)
  whatsappNumber: string;
  logo?: string;
  role: UserRole;
  status?: "active" | "inactive" | "archived" | "pending_deletion";
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  country: "BJ" | "CI" | "SN" | "TG";
  city: string;
  district?: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  currency?: string;
  status: OrderStatus;
  statusReason?: string;
  scheduledDate?: string;
  assignedCloser?: {
    id: string;
    name: string;
  };
  assignedRider?: {
    id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
  history?: StatusHistoryEntry[];
  notes?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
  followupCount?: number;
  rescheduleCount?: number;
  rejectionReason?: string;
  isReopenedByAdmin?: boolean;
  reopenCount?: number;
}

export * from "./followups-types";

export interface ProductCustomField {
  id: string;
  key: string;
  label: string;
  type: "short_text" | "long_text" | "number" | "choice" | "boolean";
  value: string;
  isPinned?: boolean;
}

export interface ProductOption {
  id: string;
  name: string; // Taille, Couleur, Pointure, Matière...
  values: string[];
}

export interface ProductAuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface ProductVariant {
  id: string;
  name?: string;
  title?: string;
  price: number;
  costPrice?: number;
  stock: number;
  stockCount?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  image?: string;
  optionValues?: { optionName: string; value: string }[];
}

export interface ProductMediaItem {
  id: string;
  url: string;
  alt?: string;
  variantId?: string;
  isPrimary?: boolean;
}

export interface QuantityOffer {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  badgeText?: string;
  isDefault?: boolean;
  savingsAmount?: number;
  label?: string;
  badge?: string;
}

// Prompt 17-L : Bénéfices du produit (modifiable et personnalisable)
export interface ProductBenefitItem {
  id: string;
  icon?: string; // "check" | "sparkles" | "shield" | "heart" | "zap" | "star" | "leaf" | "smile" | "flame" | "clock"
  title: string;
  description?: string;
}

export interface ProductBenefitsBlock {
  enabled?: boolean;
  title?: string; // par défaut "Pourquoi vous allez l'aimer"
  items: ProductBenefitItem[];
  footerNote?: string;
}

export interface ProductBadgesConfig {
  hasCountdown: boolean;
  countdownMinutes: number;
  hasComparePrice: boolean;
  hasLowStockWarning: boolean;
  lowStockThreshold: number;
  hasQuantityPacks: boolean;
}

export type ProductStatus = "active" | "draft" | "archived";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type AbcClass = "A" | "B" | "C";

// Prompt 16-b : Réglages de stock par boutique et par produit
export type OutOfStockVisibilityOption = "show_badge" | "hide";
export type StockReservationTimingOption = "on_order_received" | "on_closer_confirmation";
export type OutOfStockProductOverride = "store_default" | "always_show" | "always_hide";

export interface StoreStockSettings {
  storeSlug: string;
  outOfStockVisibility: OutOfStockVisibilityOption;
  reservationTiming: StockReservationTimingOption;
  reservationTimeoutHours: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Product {
  id: string;
  legacy_id?: string;
  legacyId?: string;
  trackInventory?: boolean;
  storeId?: string;
  shop_id?: string;
  storeSlug?: string;
  ownerEmail?: string;
  name: string;
  title?: string;
  slug: string;
  shortCode?: string; // Prompt 17-K : Code court alphanumérique (ex. 6 caractères) unique par boutique
  short_code?: string; // Alias pour compatibilité snake_case
  published_to_storefront?: boolean; // Prompt 17-K : État explicite de publication sur la vitrine
  description: string;
  missingFields?: string[];
  category: string;
  collection: string;
  collections?: string[];
  type?: string;
  productType?: string;
  images: string[];
  mediaItems?: ProductMediaItem[];
  videoUrl?: string;
  outOfStockVisibilityOverride?: OutOfStockProductOverride;
  salePrice: number;
  price?: number;
  compareAtPrice?: number;
  costPrice: number; // Prix de revient obligatoire pour le calcul du bénéfice net
  marginAmount?: number; // Calculé : salePrice - costPrice
  marginPercent?: number; // Calculé : ((salePrice - costPrice) / salePrice) * 100
  chargeTax?: boolean;
  trackQuantity?: boolean;
  trackStock?: boolean;
  sku?: string;
  barcode?: string;
  lowStockThreshold?: number;
  isPhysical?: boolean;
  weight?: number; // en grammes
  weightKg?: number;
  publishedChannels?: string[];
  stock: number; // Correspond à availableStock
  stockCount?: number;
  physicalStock?: number;
  reservedStock?: number;
  availableStock?: number;
  inTransitStock?: number;
  daysOfStock?: number; // jours de stock restants
  salesVelocity?: number; // unités livrées / jour
  abcClass?: AbcClass; // A = 80% des ventes, B = 15%, C = 5%
  status: "in_stock" | "out_of_stock" | "active" | "draft" | "archived";
  productStatus?: ProductStatus;
  stockStatus?: StockStatus;
  supplierId?: string;
  supplierName?: string;
  hasActivePO?: boolean; // Badge "Réappro en cours"
  hiddenFromCatalog?: boolean; // Option discrétion : Masquer du catalogue public (accessible uniquement par lien direct / tunnel ads)
  variants: ProductVariant[];
  quantityOffers: QuantityOffer[];
  showQuantityOffers?: boolean; // Prompt 17-L : Réglage d'affichage des offres de quantité (masqué par défaut)
  benefits?: ProductBenefitsBlock; // Prompt 17-L : Bloc modifiable des bénéfices du produit
  badgesConfig?: ProductBadgesConfig;
  salesSummary?: {
    unitsSold: number;
    unitsDelivered: number;
    deliveryRate: number; // %
    netSales: number; // FCFA
  };
  seo?: {
    title: string;
    description: string;
    handle?: string;
    slug?: string;
  };
  tags?: string[];
  template?: string;
  receiptContent?: any;
  customFields?: ProductCustomField[];
  productOptions?: ProductOption[];
  dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number };
  unitPriceLabel?: string;
  continueSellingWhenOutOfStock?: boolean;
  inventoryLocation?: string;
  auditTrail?: ProductAuditEntry[];
  importBatchId?: string;
  originalRawDescription?: string; // Prompt 17-F : Description d'origine conservée 30 jours
  importedAt?: string; // Date d'importation initiale
  sanitizationReport?: {
    status: "clean" | "simplified" | "sanitized";
    statusLabel: string;
    removedSecurityElements: string[];
    simplifiedStyles: string[];
    hasChanges: boolean;
  };
  deletedAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  date: string;
  category: "ads" | "shipping" | "salary" | "packaging" | "software" | "other";
  categoryLabel: string;
  notes?: string;
}

export interface CashbookEntry {
  id: string;
  date: string;
  type: "entry" | "expense" | "withdrawal";
  label: string;
  amount: number;
  category: string;
  notes?: string;
  impactsNetProfit: boolean; // Les retraits ne comptent pas dans le résultat net !
}

export interface FinancePeriodSummary {
  collectedRevenue: number; // Encaissé
  deliveredCount: number;
  productCost: number; // Coût produits = prix de revient × livrées
  adSpend: number; // Frais de pub
  shippingCost: number; // Frais de livraison
  otherExpenses: number; // Autres dépenses
  netProfit: number; // Résultat net = Encaissé - Coûts
  profitMargin: number; // en %
}

export interface CloserClosingStats {
  closerId: string;
  closerName: string;
  assignedOrders: number;
  confirmedOrders: number;
  confirmationRate: number; // en %
  deliveredOrders: number;
  deliveryRate: number; // en %
  deliveredRevenue: number;
}

export interface UtmCampaignStats {
  campaign: string;
  source: string;
  visitors: number;
  orders: number;
  conversionRate: number;
  revenue: number;
  adSpend: number;
  roas: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  unitsSold: number;
  revenue: number;
  stock: number;
  changePercent: number;
}

export interface DashboardKpi {
  visitors: {
    value: number;
    delta: number;
    isUpGood: boolean;
  };
  totalSales: {
    value: number; // en FCFA
    delta: number;
    isUpGood: boolean;
  };
  deliveredSales: {
    value: number; // en FCFA (CA encaissé)
    delta: number;
    isUpGood: boolean;
  };
  ordersCount: {
    value: number;
    delta: number;
    isUpGood: boolean;
  };
  conversionRate: {
    value: number; // en % (ex: 3.4%)
    delta: number;
    isUpGood: boolean;
  };
  pendingOrdersCount: number;
  todayDeliveriesCount: number;
}

export interface ChartDayData {
  date: string;
  dayLabel: string;
  visitors: number;
  totalSales: number;
  deliveredSales: number;
  orders: number;
  deliveredCount: number;
  adSpend: number;
  productCost: number;
  shippingCost: number;
  netProfit: number;
  realCpa: number;
}

export interface StatusDistributionItem {
  status: OrderStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  country?: "BJ" | "CI" | "SN" | "TG";
  agencyId?: string;
  agencyName?: string;
  active: boolean;
  joinedAt: string;
  inviteLink?: string;
}

export interface DeliveryAgency {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  country: "BJ" | "CI" | "SN" | "TG";
  city: string;
  zonesCovered: string[];
  ridersCount: number;
  deliveryRate: number; // Taux de livraison en %
  activeOrdersCount: number;
  pendingRemittance: number; // Montant des espèces encaissées en attente de reversement (FCFA)
  totalDeliveredAmount: number; // CA total livré (FCFA)
  feesDue: number; // Frais dus à l'agence (FCFA)
  active: boolean;
  invitedAt: string;
}

export interface DeliveryRate {
  id: string;
  country: "BJ" | "CI" | "SN" | "TG";
  city: string;
  zone: string;
  entityType: "agency" | "rider";
  entityId: string;
  entityName: string;
  standardFee: number; // ex: 1500 FCFA
  expressFee?: number; // ex: 2500 FCFA
  suburbFee?: number; // ex: 3000 FCFA
  updatedAt: string;
}

export type RemittanceStatus = "pending" | "confirmed" | "disputed";

export interface Remittance {
  id: string;
  reference: string; // Ex: REV-2026-084
  date: string;
  entityType: "agency" | "rider";
  entityId: string;
  entityName: string;
  phone: string;
  city: string;
  country: "BJ" | "CI" | "SN" | "TG";
  ordersCount: number;
  collectedAmount: number; // Encaissé (FCFA)
  deliveryFees: number; // Frais de livraison déduits (FCFA)
  remittedAmount: number; // Remis / Versé au propriétaire (FCFA)
  discrepancy: number; // Écart = Encaissé - Frais - Remis
  status: RemittanceStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  notes?: string;
}

/* ======================================================== */
/* NOUVEAUX TYPES PROMPT 5.C — PAGES COMPLÉMENTAIRES */
/* ======================================================== */

export type DeliveryStatus = "pending" | "in_progress" | "delivered" | "failed" | "returned";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  delivered: "Livrée",
  failed: "Échec de livraison",
  returned: "Retour expéditeur",
};

export interface Delivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  country: "BJ" | "CI" | "SN" | "TG";
  itemsSummary: string;
  amountToCollect: number; // Espèces à encaisser en FCFA
  status: DeliveryStatus;
  failureReason?: string;
  riderId: string;
  riderName: string;
  scheduledTime: string; // Ex : "Aujourd'hui entre 14h et 16h"
  completedAt?: string;
  shippingFeePaid: number; // Frais payés au livreur par le vendeur
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  city: string;
  country: "BJ" | "CI" | "SN" | "TG";
  zonesCovered: string[];
  defaultFee: number; // Frais par course en FCFA
  activeDeliveriesCount: number;
  completedDeliveriesCount: number;
  rating: number;
  active: boolean;
}

export interface FollowupOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  totalAmount: number;
  city: string;
  status: OrderStatus;
  followupReason: "unreachable" | "callback" | "postponed_due";
  followupReasonLabel: string;
  attemptsCount: number;
  lastFollowupAt: string;
  scheduledDate?: string;
  notes?: string;
}

export interface AbandonedCart {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  variant?: string;
  estimatedAmount: number;
  city: string;
  country: "BJ" | "CI" | "SN" | "TG";
  startedAt: string;
  timeAgo: string;
  recovered: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  country: "BJ" | "CI" | "SN" | "TG";
  city: string;
  address: string;
  ordersCount: number;
  totalSpent: number; // en FCFA
  lastOrderDate: string;
  status: "vip" | "regular" | "new" | "risk";
  notes?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number; // % de remise ou FCFA fixes
  minOrderAmount?: number;
  usageLimit: number;
  usageCount: number;
  expiresAt: string;
  active: boolean;
}

export interface UpsellOffer {
  id: string;
  title: string;
  productId: string;
  productName: string;
  offerPrice: number;
  originalPrice: number;
  active: boolean;
}

export interface StorePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  updatedAt: string;
}

export interface OnlineStoreConfig {
  theme: {
    primaryColor: string;
    buttonColor: string;
    bannerUrl?: string;
    tagline: string;
  };
  checkoutForm: {
    fields: {
      name: boolean;
      phone: boolean;
      country: boolean;
      city: boolean;
      address: boolean;
      notes: boolean;
    };
    position: "bottom" | "side";
    buttonCtaText: string;
  };
  discountCodes: DiscountCode[];
  upsells: UpsellOffer[];
  pages: StorePage[];
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  delta: number; // +10 ou -2
  previousStock: number;
  newStock: number;
  reason:
  | "restock"
  | "damage"
  | "loss"
  | "physical_sale"
  | "correction"
  | "purchase_receipt"
  | "customer_return"
  | "delivery";
  reasonLabel: string;
  date: string;
  author: string;
}

/* ======================================================== */
/* MODULE PRODUITS, STOCK, FOURNISSEURS, ACHATS, COLLECTIONS */
/* ======================================================== */

export interface Supplier {
  id: string;
  name: string;
  country: string; // Ex: Chine 🇨🇳, Côte d'Ivoire 🇨🇮, Togo 🇹🇬
  countryCode: string;
  contactName: string;
  phone: string;
  email: string;
  currency: "XOF" | "USD" | "EUR" | "CNY";
  leadTimeDays: number; // Délai annoncé en jours (ex: 18j)
  moq: number; // Quantité minimale de commande
  paymentTerms: string; // Ex: "30% acompte, 70% à l'embarquement"
  notes?: string;
  scorecard: {
    actualLeadTimeDays: number; // Délai moyen réel constaté
    defectRatePercent: number; // Taux de défauts %
    totalOrdersCount: number; // Nb bons d'achat
    lastPurchaseDate: string;
  };
  productsSupplied?: {
    productId: string;
    productName: string;
    unitCost: number; // en FCFA
    moq: number;
  }[];
}

export type SupplierProduct = NonNullable<Supplier["productsSupplied"]>[number];

export type PurchaseOrderStatus =
  | "draft" // Brouillon
  | "ordered" // Commandé
  | "shipped" // Expédié (en transit)
  | "partially_received" // Reçu partiellement
  | "received" // Reçu
  | "cancelled"; // Annulé

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Brouillon",
  ordered: "Commandé",
  shipped: "Expédié (En transit)",
  partially_received: "Reçu partiellement",
  received: "Reçu",
  cancelled: "Annulé",
};

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityDefective: number;
  unitCost: number; // Coût unitaire brut fournisseur (FCFA)
  landedCostShare: number; // Quote-part des frais d'approche (fret, douane, transitaire)
  finalUnitLandedCost: number; // Coût unitaire rendu entrepôt (PUMP)
}

export interface PurchaseOrderEvent {
  id: string;
  date: string;
  status: PurchaseOrderStatus;
  description: string;
  author: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // Ex: PO-001
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  estimatedArrivalDate: string;
  actualArrivalDate?: string;
  trackingNumber?: string;
  carrier?: string; // Ex: Maersk, DHL, Bolloré Logistics
  destinationLocation: string; // Ex: Entrepôt Principal Lomé
  items: PurchaseOrderItem[];
  landedCosts: {
    shipping: number; // Fret maritime ou aérien (FCFA)
    customs: number; // Droits de douane & taxes (FCFA)
    agentFee: number; // Commission transitaire / agent d'achat (FCFA)
    totalLanded: number; // Total frais d'approche
  };
  totalItemsCost: number; // Coût brut des marchandises
  totalCostWithLanded: number; // Coût total = marchandises + approche
  notes?: string;
  events: PurchaseOrderEvent[];
}

export interface StockLevel {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  location: string; // Ex: "Entrepôt Lomé", "Hub Abidjan"
  physicalStock: number; // Physique réel en rayon
  reservedStock: number; // Réservé pour commandes programmées
  availableStock: number; // Disponible à la vente = physique - réservé
  inTransitStock: number; // En transit (achats expédiés)
  daysOfStock: number; // Jours restants = disponible ÷ vitesse
  salesVelocity: number; // Unités livrées / jour
  status: "in_stock" | "low_stock" | "out_of_stock";
  hasActivePO: boolean; // Badge "Réappro en cours"
  reorderPoint: number;
  suggestedQuantity: number;
}

export interface ReorderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  supplierId: string;
  supplierName: string;
  supplierLeadTimeDays: number;
  salesVelocity: number; // Vitesse de vente (unités/jour)
  availableStock: number;
  inTransitStock: number;
  daysOfStock: number;
  safetyStockDays: number; // Marge de sécurité
  targetCoverageDays: number; // Couverture cible
  reorderPoint: number; // Point de commande = vitesse * (délai + marge)
  suggestedQuantity: number; // Quantité conseillée = vitesse * (délai + couverture) - dispo - transit
  unitCost: number;
  totalEstimatedCost: number;
}

export interface CollectionRule {
  field: "category" | "tag" | "price";
  operator: "equals" | "greater_than" | "contains";
  value: string;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  image?: string;
  type: "manual" | "automated";
  rules?: CollectionRule[];
  productsCount: number;
  position: number;
  published: boolean;
  updatedAt: string;
}

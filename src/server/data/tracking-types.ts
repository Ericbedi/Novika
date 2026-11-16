/**
 * Types pour le système de suivi de commande en direct par étapes (Prompt 05-T).
 *
 * RÈGLE ABSOLUE DE SÉCURITÉ :
 * - UNIQUEMENT le suivi par étapes.
 * - STRICTEMENT AUCUN GPS, aucune coordonnée, aucune carte, aucune demande de géolocalisation.
 * - Token 128-bit unguessable, expire 30 jours après livraison ou annulation.
 * - Projection publique étanche : JAMAIS de téléphone, JAMAIS d'adresse complète, JAMAIS de marges ou notes internes.
 */

import { UserRole } from "./types";

export const TRACKING_NORMAL_STATUSES = [
  "received",
  "confirmed",
  "prepared",
  "handed_over",
  "in_transit",
  "delivered",
] as const;

export const TRACKING_SPECIAL_STATUSES = [
  "unreachable",
  "postponed",
  "cancelled",
  "returned",
] as const;

export const ALL_TRACKING_STATUSES = [
  ...TRACKING_NORMAL_STATUSES,
  ...TRACKING_SPECIAL_STATUSES,
] as const;

export type TrackingStatus = (typeof ALL_TRACKING_STATUSES)[number];

export const TRACKING_STATUS_CONFIG: Record<
  TrackingStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeVariant: "default" | "success" | "warning" | "destructive" | "info";
    isSpecial: boolean;
  }
> = {
  received: {
    label: "Commande reçue",
    shortLabel: "Reçue",
    description: "Votre commande a été enregistrée avec succès et transmise à notre équipe.",
    badgeVariant: "info",
    isSpecial: false,
  },
  confirmed: {
    label: "Commande confirmée",
    shortLabel: "Confirmée",
    description: "Votre commande a été vérifiée et confirmée par notre équipe commerciale.",
    badgeVariant: "info",
    isSpecial: false,
  },
  prepared: {
    label: "Colis préparé",
    shortLabel: "Préparée",
    description: "Vos articles ont été minutieusement emballés et étiquetés pour l'expédition.",
    badgeVariant: "info",
    isSpecial: false,
  },
  handed_over: {
    label: "Remise au transporteur",
    shortLabel: "Remise",
    description: "Le colis a été confié à notre coursier ou à notre agence de livraison partenaire.",
    badgeVariant: "warning",
    isSpecial: false,
  },
  in_transit: {
    label: "En cours de livraison",
    shortLabel: "En livraison",
    description: "Le livreur est actuellement en route vers votre localité.",
    badgeVariant: "warning",
    isSpecial: false,
  },
  delivered: {
    label: "Commande livrée",
    shortLabel: "Livrée",
    description: "Votre colis a été remis avec succès. Merci pour votre confiance !",
    badgeVariant: "success",
    isSpecial: false,
  },
  unreachable: {
    label: "Client injoignable",
    shortLabel: "Injoignable",
    description: "Notre équipe a tenté de vous joindre sans succès. Une nouvelle tentative est prévue sous peu.",
    badgeVariant: "warning",
    isSpecial: true,
  },
  postponed: {
    label: "Livraison reportée",
    shortLabel: "Reportée",
    description: "La livraison a été reportée à une date ultérieure convenue avec vous.",
    badgeVariant: "warning",
    isSpecial: true,
  },
  cancelled: {
    label: "Commande annulée",
    shortLabel: "Annulée",
    description: "Cette commande a été annulée. Contactez le service client pour toute question.",
    badgeVariant: "destructive",
    isSpecial: true,
  },
  returned: {
    label: "Colis retourné",
    shortLabel: "Retournée",
    description: "Le colis n'a pas pu être remis et a été retourné à la boutique.",
    badgeVariant: "destructive",
    isSpecial: true,
  },
};

export interface TrackingStep {
  status: TrackingStatus;
  label: string;
  timestamp?: string; // Date et heure locales formatées
  completed: boolean;
  current: boolean;
  message?: string;
}

export interface TrackingHistoryItem {
  id: string;
  status: TrackingStatus;
  label: string;
  date: string;
  time: string;
  note?: string;
}

export interface TrackingPublicItem {
  id: string;
  name: string;
  quantity: number;
  image?: string;
  variant?: string;
}

/**
 * Vue publique sécurisée (Security Invoker / DTO public).
 * RÈGLE ABSOLUE Prompt 05-T : Ne contient JAMAIS le téléphone du client,
 * JAMAIS l'adresse complète (uniquement la ville), JAMAIS le prix d'achat,
 * JAMAIS les marges ou notes internes.
 */
export interface TrackingPublicOrder {
  token: string;
  orderNumber: string;
  customerFirstName: string;
  maskedCustomerName?: string;
  maskedCustomerPhone?: string;
  status: TrackingStatus;
  statusLabel: string;
  statusDescription: string;
  currentStepIndex: number; // 0..5 pour les étapes normales
  timeline: TrackingStep[];
  history: TrackingHistoryItem[];
  city: string;
  country: string;
  shopName: string;
  shopLogo?: string;
  shopWhatsapp: string;
  themeColor?: string;
  items: TrackingPublicItem[];
  courierFirstName?: string; // Affiché UNIQUEMENT si l'admin l'autorise (showCourierName: true)
  agencyName?: string;
  agencyTrackingNumber?: string;
  requiresProofCode: boolean; // Si option preuve activée
  proofCodeForCustomer?: string; // Code à 4 chiffres visible par le client sur sa page de suivi
  expiresAt: string; // ISO 8601
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Journal d'audit de modification de statut
 */
export interface OrderStatusAuditEntry {
  id: string;
  orderId: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  fromStatus: TrackingStatus;
  toStatus: TrackingStatus;
  reason?: string;
}

/**
 * Entité complète stockée côté serveur
 */
export interface TrackingInternalOrder {
  id: string;
  shopId: string;
  token: string;
  orderNumber: string;
  customerFullName: string;
  customerFirstName: string;
  customerPhone: string; // STRICTEMENT INTERNE
  deliveryAddress: string; // STRICTEMENT INTERNE
  city: string;
  country: string;
  status: TrackingStatus;
  assignedCloserId?: string;
  assignedCloserName?: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedAgencyId?: string;
  assignedAgencyName?: string;
  agencyTrackingNumber?: string;
  purchaseCost?: number; // STRICTEMENT INTERNE
  profitMargin?: number; // STRICTEMENT INTERNE
  internalNotes?: string; // STRICTEMENT INTERNE
  showCourierName: boolean; // Réglage boutique
  enableProofOfDelivery: boolean; // Option admin
  proofCode?: string; // Code à 4 chiffres (ex: "4829")
  items: TrackingPublicItem[];
  history: TrackingHistoryItem[];
  auditLogs: OrderStatusAuditEntry[];
  deliveredAt?: string;
  cancelledAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

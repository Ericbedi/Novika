export interface BetaInvitation {
  id: string;
  code: string; // Ex: "AFRI-LOME-2026", "VIP-COTONOU"
  organizationName?: string;
  recipientEmail?: string;
  maxUses: number;
  timesUsed: number;
  expiresAt: string; // ISO date
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface BetaWaitlistEntry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  country: string;
  businessType: string; // "cosmetique" | "mode" | "electronique" | "sante" | "autre"
  monthlyOrdersEstimated: string; // "1-50" | "50-200" | "200-1000" | "1000+"
  status: "pending" | "invited" | "rejected";
  appliedAt: string;
}

export interface PlatformFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: "payment" | "automation" | "ai" | "channels" | "advanced";
  isEnabledGlobally: boolean;
  allowlistStoreIds: string[]; // Boutiques autorisées si globalement inactif
  rolloutPercentage: number; // 0 à 100%
  updatedAt: string;
  updatedBy: string;
}

export interface EmergencyKillSwitches {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  blockSignups: boolean;
  blockOrders: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface SupportAccessGrant {
  id: string;
  shopId: string;
  grantedByUserId: string;
  grantedToAdminId: string;
  reason: string;
  expiresAt: string; // Horodatage précis d'expiration
  revokedAt?: string;
  createdAt: string;
}

export interface PlatformAuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string; // Ex: "feature_flag_toggle", "invitation_created", "support_impersonation", "kill_switch_activated"
  targetResource: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

// ==========================================
// EXTENSIONS APPROBATION STRICTE BÊTA-TESTEURS
// ==========================================

export interface BetaCohort {
  id: string;
  name: string;
  maxCapacity: number;
  currentCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export type AccessRequestStatus =
  | "pending_verification"
  | "verified_pending_approval"
  | "approved"
  | "rejected";

export interface AccessRequest {
  id: string;
  originalEmail: string;
  canonicalEmail: string;
  fullName: string;
  country: string;
  whatsapp: string;
  productType: string;
  monthlyOrdersEstimated: string;
  status: AccessRequestStatus;
  cohortId?: string;
  requestedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
  ipHash?: string;
}

export type StrictInvitationStatus =
  | "pending_verification"
  | "verified"
  | "approved"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "activated"
  | "expired"
  | "revoked";

export interface StrictBetaInvitation {
  id: string;
  tokenHash: string;
  originalEmail: string;
  canonicalEmail: string;
  fullName?: string;
  country?: string;
  cohortId: string;
  status: StrictInvitationStatus;
  resendCount: number; // max 3
  lastSentAt: string;
  deliveredAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  activatedAt?: string;
  revokedAt?: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  note?: string;
}

export interface EmailOtp {
  id: string;
  purpose: "request_verification" | "invitation_activation";
  canonicalEmail: string;
  codeHash: string;
  plainCodeForDemo?: string; // Code d'exemple visible en démo / test
  attempts: number; // max 5
  maxAttempts: number;
  expiresAt: string; // 10 min
  consumedAt?: string;
  createdAt: string;
}

export interface EmailDeliveryEvent {
  id: string;
  invitationId?: string;
  recipientEmail: string;
  eventType: "delivered" | "bounce_permanent" | "bounce_transient" | "complaint";
  provider: "resend" | "postmark" | "mock";
  rawDetails?: string;
  timestamp: string;
}

export interface BatchValidationItem {
  raw: string;
  fullName?: string;
  email: string;
  canonicalEmail: string;
  country?: string;
  isValid: boolean;
  isDuplicate: boolean;
  isDisposable: boolean;
  typoSuggestion?: string;
  error?: string;
}


/**
 * Types TypeScript pour l'inscription, la vérification d'email,
 * les contrôles de sécurité et l'état de session utilisateur.
 */

export interface SignupPayload {
  fullName: string;
  email: string;
  country: string; // Ex: "TG", "CI", "SN", "BJ"
  phone: string;
  password: string;
  instagramHandle?: string;
  acceptTerms: boolean;
  honeypot?: string;
}

export interface EmailVerificationToken {
  id: string;
  email: string;
  codeHash: string; // Code à 6 chiffres haché
  rawCode?: string; // Utilisé uniquement en mock / envoi transactionnel
  expiresAt: string; // Validité 10 minutes
  attemptsLeft: number; // Max 5 tentatives
  isVerified: boolean;
  verifiedAt?: string;
  resendCooldownUntil: string;
}

export interface UserSession {
  userId: string;
  fullName: string;
  email: string;
  country: string;
  phone: string;
  isEmailVerified: boolean;
  role: "owner" | "admin" | "closer" | "rider" | "agency";
  storeSlug: string;
  createdAt: string;
}

export interface EmailCheckResult {
  isValid: boolean;
  normalizedEmail: string;
  isDisposable: boolean;
  suggestedCorrection?: string; // Ex: si l'utilisateur saisit "user@gmial.com", suggérer "user@gmail.com"
  error?: string;
}

export interface UnverifiedAccountRestrictions {
  canPublishStore: boolean; // false si non vérifié
  canInviteMembers: boolean; // false si non vérifié
  canConnectIntegrations: boolean; // false si non vérifié
  canExportData: boolean; // false si non vérifié
}

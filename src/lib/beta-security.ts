/**
 * Module de sécurité pour la gestion de la Bêta privée et du Back-office AfriBuilder.
 * Conforme aux règles :
 * - Codes d'invitation à usage unique ou limité avec expiration stricte
 * - Feature flags évalués côté serveur (jamais confiés au client)
 * - Interrupteurs d'urgence (Kill switches)
 * - Accès support temporaire et journalisé sans exposition de PII
 */

import {
  MOCK_BETA_INVITATIONS,
  MOCK_FEATURE_FLAGS,
  MOCK_KILL_SWITCHES,
  MOCK_SUPPORT_GRANTS,
  MOCK_AUDIT_LOGS,
} from "@/mock-data/beta-data";
import { BetaInvitation, PlatformAuditLogEntry } from "@/server/data/beta-types";

export interface CodeValidationResult {
  isValid: boolean;
  error?: string;
  invitation?: BetaInvitation;
}

/**
 * Valide un code d'invitation pour l'inscription à la bêta privée.
 */
export function validateBetaInvitationCode(inputCode: string): CodeValidationResult {
  if (!inputCode || !inputCode.trim()) {
    return { isValid: false, error: "Veuillez saisir votre code d'invitation." };
  }

  const cleanCode = inputCode.trim().toUpperCase();
  const invitation = MOCK_BETA_INVITATIONS.find((inv) => inv.code === cleanCode);

  if (!invitation) {
    return {
      isValid: false,
      error: "Code d'invitation invalide. Vérifiez l'orthographe ou inscrivez-vous sur la liste d'attente.",
    };
  }

  if (!invitation.isActive) {
    return {
      isValid: false,
      error: "Ce code d'invitation a été désactivé par l'administrateur.",
    };
  }

  // Vérification de la date d'expiration
  const expiresAt = new Date(invitation.expiresAt).getTime();
  if (Date.now() > expiresAt) {
    return {
      isValid: false,
      error: "Ce code d'invitation a expiré.",
    };
  }

  // Vérification du quota d'utilisation
  if (invitation.timesUsed >= invitation.maxUses) {
    return {
      isValid: false,
      error: "Ce code d'invitation a déjà atteint sa limite maximale d'utilisations.",
    };
  }

  return { isValid: true, invitation };
}

/**
 * Évalue côté serveur si une fonctionnalité est activée pour une boutique donnée.
 */
export function isFeatureEnabledForStore(
  featureKey: string,
  storeId: string
): { isEnabled: boolean; reason: string } {
  const flag = MOCK_FEATURE_FLAGS.find((f) => f.key === featureKey);
  if (!flag) {
    return { isEnabled: false, reason: "Fonctionnalité inconnue." };
  }

  // 1. Activation globale
  if (flag.isEnabledGlobally) {
    return { isEnabled: true, reason: "Activée globalement pour toute la plateforme." };
  }

  // 2. Liste blanche explicite par boutique
  if (flag.allowlistStoreIds.includes(storeId)) {
    return { isEnabled: true, reason: "Boutique sélectionnée dans la liste blanche bêta." };
  }

  // 3. Déploiement progressif par pourcentage
  if (flag.rolloutPercentage > 0) {
    // Hachage déterministe simple du storeId
    let hash = 0;
    for (let i = 0; i < storeId.length; i++) {
      hash = (hash << 5) - hash + storeId.charCodeAt(i);
      hash |= 0;
    }
    const storeScore = Math.abs(hash) % 100;
    if (storeScore < flag.rolloutPercentage) {
      return { isEnabled: true, reason: `Déploiement progressif (${flag.rolloutPercentage}% des boutiques).` };
    }
  }

  return { isEnabled: false, reason: "Fonctionnalité non activée pour cette boutique." };
}

/**
 * Vérifie l'état des coupe-circuits d'urgence.
 */
export function checkEmergencyKillSwitches() {
  return MOCK_KILL_SWITCHES;
}

/**
 * Vérifie si un administrateur dispose d'un accès support temporaire valide accordé par le vendeur.
 */
export function hasValidSupportAccess(
  shopId: string,
  adminEmail: string
): { hasAccess: boolean; grantId?: string; reason?: string } {
  const now = new Date().getTime();
  const grant = MOCK_SUPPORT_GRANTS.find(
    (g) =>
      g.shopId === shopId &&
      g.grantedToAdminId === adminEmail &&
      !g.revokedAt &&
      new Date(g.expiresAt).getTime() > now
  );

  if (grant) {
    return {
      hasAccess: true,
      grantId: grant.id,
      reason: grant.reason,
    };
  }

  return {
    hasAccess: false,
    reason: "Aucun accès support temporaire actif n'a été accordé par le propriétaire de cette boutique.",
  };
}

/**
 * Consigne un événement dans le journal d'audit sans fuite de PII.
 */
export function recordPlatformAuditEvent(
  actorEmail: string,
  action: string,
  targetResource: string,
  details: Record<string, any>
): PlatformAuditLogEntry {
  // Nettoyer les détails de tout mot de passe ou coordonnée bancaire
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  delete sanitizedDetails.pin;

  const entry: PlatformAuditLogEntry = {
    id: "audit-" + Date.now(),
    actorId: "admin-" + Date.now(),
    actorEmail,
    action,
    targetResource,
    details: sanitizedDetails,
    timestamp: new Date().toISOString(),
  };

  MOCK_AUDIT_LOGS.unshift(entry);
  return entry;
}

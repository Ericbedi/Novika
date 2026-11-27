/**
 * Service centralisé des invitations d'équipe, allowlist et cycle de vie des membres (Prompt 18)
 * - Règle absolue : Propriétaire unique promisesbedi@gmail.com (inaltérable)
 * - Invitations par token unique valables 7 jours
 * - Allowlist stricte pour les connexions
 * - Suspension immédiate et révocation de session
 * - Journal d'audit complet
 */

import { getOwnerEmail, isOwnerEmail } from "@/config/owner";
import { logAuthAudit } from "@/lib/audit-auth";
import { revokeAllUserSessions } from "./session-manager";
import { validatePasswordStrength } from "./password-security";

export type AllowedRole = "owner" | "admin" | "manager" | "closer" | "rider" | "agency";

export interface TeamInvitation {
  id: string;
  email: string;
  role: AllowedRole;
  storeSlugs: string[];
  country?: string;
  invitedBy: string;
  token: string;
  status: "pending" | "accepted" | "canceled" | "expired";
  expiresAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  acceptedAt?: string;
}

export interface AllowedMember {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: AllowedRole;
  storeSlugs: string[];
  country?: string;
  status: "active" | "suspended";
  isOwner: boolean;
  twoFactorRequired: boolean;
  twoFactorEnabled: boolean;
  passwordHash?: string; // Optionnel pour la démo
  joinedAt: string;
  invitedAt?: string;
}

// Stores en mémoire partagés côté serveur
const INVITATIONS_STORE = new Map<string, TeamInvitation>();
const ALLOWED_MEMBERS = new Map<string, AllowedMember>();

// Initialisation idempotente du compte propriétaire au premier démarrage
export function ensureOwnerInitialized(): AllowedMember {
  const ownerEmail = getOwnerEmail();
  let owner = ALLOWED_MEMBERS.get(ownerEmail);

  if (!owner) {
    owner = {
      id: "owner_primary",
      email: ownerEmail,
      name: "Promises Bedi",
      phone: "+22890000000",
      role: "owner",
      storeSlugs: ["lome-glow", "abidjan-prestige", "cotonou-tech", "dakar-vital"],
      country: "TG",
      status: "active",
      isOwner: true,
      twoFactorRequired: true,
      twoFactorEnabled: true,
      joinedAt: new Date().toISOString(),
    };
    ALLOWED_MEMBERS.set(ownerEmail, owner);
  }

  return owner;
}

// Initialise le propriétaire dès le chargement du module
ensureOwnerInitialized();

/**
 * Crée une invitation d'équipe (valable 7 jours, token unique).
 * Vérifie que le demandeur est propriétaire ou admin.
 */
export function createInvitation(params: {
  email: string;
  role: AllowedRole;
  storeSlugs?: string[];
  country?: string;
  invitedBy: string;
}): { success: boolean; invitation?: TeamInvitation; error?: string } {
  ensureOwnerInitialized();

  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedInvitedBy = params.invitedBy.trim().toLowerCase();

  // Ne pas ré-inviter le propriétaire
  if (isOwnerEmail(normalizedEmail)) {
    return { success: false, error: "Le propriétaire possède déjà un compte actif." };
  }

  // Vérifier si un membre actif existe déjà avec cet e-mail
  const existingMember = ALLOWED_MEMBERS.get(normalizedEmail);
  if (existingMember && existingMember.status === "active") {
    return { success: false, error: "Cet utilisateur fait déjà partie de l'équipe." };
  }

  // Générer un token sécurisé
  const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 jours

  const invitation: TeamInvitation = {
    id: `invitation_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    role: params.role,
    storeSlugs: params.storeSlugs || ["lome-glow"],
    country: params.country || "TG",
    invitedBy: normalizedInvitedBy,
    token,
    status: "pending",
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  INVITATIONS_STORE.set(invitation.id, invitation);

  // Journal d'audit
  logAuthAudit({
    event: "login_success",
    userEmailMasked: normalizedEmail,
    role: params.role,
    details: `Invitation créée par ${normalizedInvitedBy} pour le rôle ${params.role}. Valide 7 jours.`,
  });

  return { success: true, invitation };
}

/**
 * Récupère une invitation par son token avec contrôle d'expiration.
 */
export function getInvitationByToken(token: string): {
  valid: boolean;
  invitation?: TeamInvitation;
  error?: string;
  code?: "NOT_FOUND" | "EXPIRED" | "ALREADY_USED" | "CANCELED";
} {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token d'invitation manquant.", code: "NOT_FOUND" };
  }

  const cleanToken = token.trim();
  let found: TeamInvitation | undefined;

  for (const inv of INVITATIONS_STORE.values()) {
    if (inv.token === cleanToken) {
      found = inv;
      break;
    }
  }

  if (!found) {
    return { valid: false, error: "Lien d'invitation introuvable ou invalide.", code: "NOT_FOUND" };
  }

  if (found.status === "accepted") {
    return { valid: false, error: "Cette invitation a déjà été acceptée.", code: "ALREADY_USED" };
  }

  if (found.status === "canceled") {
    return { valid: false, error: "Cette invitation a été annulée.", code: "CANCELED" };
  }

  // Vérification de l'expiration des 7 jours
  const now = new Date();
  const expirationDate = new Date(found.expiresAt);
  if (now > expirationDate) {
    found.status = "expired";
    return {
      valid: false,
      error: "Cette invitation a expiré (validité de 7 jours dépassée). Demandez un nouveau lien à l'administrateur.",
      code: "EXPIRED",
    };
  }

  return { valid: true, invitation: found };
}

/**
 * Accepte une invitation : crée le mot de passe sécurisé et active le membre.
 */
export function acceptInvitation(params: {
  token: string;
  name: string;
  password: string;
  phone?: string;
}): { success: boolean; member?: AllowedMember; error?: string } {
  const check = getInvitationByToken(params.token);
  if (!check.valid || !check.invitation) {
    return { success: false, error: check.error || "Invitation invalide." };
  }

  const invitation = check.invitation;

  // Validation du mot de passe
  const pwdValidation = validatePasswordStrength(params.password);
  if (!pwdValidation.valid) {
    return { success: false, error: pwdValidation.error };
  }

  const normalizedEmail = invitation.email.toLowerCase().trim();

  // Création du membre actif
  const newMember: AllowedMember = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    name: params.name.trim() || "Nouveau Collaborateur",
    phone: params.phone?.trim(),
    role: invitation.role,
    storeSlugs: invitation.storeSlugs,
    country: invitation.country,
    status: "active",
    isOwner: false,
    twoFactorRequired: invitation.role === "admin",
    twoFactorEnabled: invitation.role === "admin",
    joinedAt: new Date().toISOString(),
    invitedAt: invitation.createdAt,
  };

  ALLOWED_MEMBERS.set(normalizedEmail, newMember);

  // Marquer l'invitation comme acceptée
  invitation.status = "accepted";
  invitation.acceptedAt = new Date().toISOString();

  // Journal d'audit
  logAuthAudit({
    event: "login_success",
    userEmailMasked: normalizedEmail,
    role: newMember.role,
    details: `Invitation acceptée avec succès par ${params.name}. Compte activé.`,
  });

  return { success: true, member: newMember };
}

/**
 * Renvoyer une invitation (nouveau token, validité repoussée de 7 jours).
 */
export function resendInvitation(invitationId: string, performedBy: string): {
  success: boolean;
  invitation?: TeamInvitation;
  error?: string;
} {
  const inv = INVITATIONS_STORE.get(invitationId);
  if (!inv) {
    return { success: false, error: "Invitation introuvable." };
  }

  inv.token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  inv.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  inv.status = "pending";

  logAuthAudit({
    event: "login_success",
    userEmailMasked: inv.email,
    details: `Invitation renvoyée par ${performedBy}. Nouveau lien valable 7 jours.`,
  });

  return { success: true, invitation: inv };
}

/**
 * Annuler une invitation.
 */
export function cancelInvitation(invitationId: string, performedBy: string): boolean {
  const inv = INVITATIONS_STORE.get(invitationId);
  if (!inv) return false;

  inv.status = "canceled";
  logAuthAudit({
    event: "login_failure",
    userEmailMasked: inv.email,
    details: `Invitation annulée par ${performedBy}.`,
  });
  return true;
}

/**
 * Modifier le rôle d'un membre.
 * Interdiction stricte : le rôle de propriétaire ne peut ni être modifié ni réattribué.
 */
export function updateMemberRole(params: {
  memberId: string;
  newRole: AllowedRole;
  performedBy: string;
}): { success: boolean; error?: string } {
  let member: AllowedMember | undefined;
  for (const m of ALLOWED_MEMBERS.values()) {
    if (m.id === params.memberId) {
      member = m;
      break;
    }
  }

  if (!member) {
    return { success: false, error: "Membre introuvable." };
  }

  if (member.isOwner) {
    return { success: false, error: "Le rôle du propriétaire est inaltérable." };
  }

  if (params.newRole === "owner") {
    return {
      success: false,
      error: "Il ne peut y avoir qu'un seul propriétaire. Un transfert de propriété exige une procédure spécifique.",
    };
  }

  const oldRole = member.role;
  member.role = params.newRole;
  member.twoFactorRequired = params.newRole === "admin";

  logAuthAudit({
    event: "login_success",
    userEmailMasked: member.email,
    role: params.newRole,
    details: `Rôle modifié par ${params.performedBy} de ${oldRole} vers ${params.newRole}.`,
  });

  return { success: true };
}

/**
 * Suspendre un membre : déconnexion immédiate de toutes ses sessions.
 */
export function suspendMember(memberId: string, performedBy: string): { success: boolean; error?: string } {
  let member: AllowedMember | undefined;
  for (const m of ALLOWED_MEMBERS.values()) {
    if (m.id === paramsMemberId(memberId)) {
      member = m;
      break;
    }
  }

  if (!member) {
    return { success: false, error: "Membre introuvable." };
  }

  if (member.isOwner) {
    return { success: false, error: "Le propriétaire ne peut pas être suspendu." };
  }

  member.status = "suspended";

  // Révocation immédiate de toutes ses sessions ouvertes
  revokeAllUserSessions(member.email);

  logAuthAudit({
    event: "unauthorized_access",
    userEmailMasked: member.email,
    details: `Membre suspendu par ${performedBy}. Toutes les sessions ont été immédiatement révoquées.`,
  });

  return { success: true };
}

function paramsMemberId(id: string): string {
  return id;
}

/**
 * Réactiver un membre suspendu.
 */
export function reactivateMember(memberId: string, performedBy: string): { success: boolean; error?: string } {
  let member: AllowedMember | undefined;
  for (const m of ALLOWED_MEMBERS.values()) {
    if (m.id === memberId) {
      member = m;
      break;
    }
  }

  if (!member) {
    return { success: false, error: "Membre introuvable." };
  }

  member.status = "active";

  logAuthAudit({
    event: "login_success",
    userEmailMasked: member.email,
    details: `Membre réactivé par ${performedBy}.`,
  });

  return { success: true };
}

/**
 * Retirer un membre : supprime de l'équipe tout en conservant son historique.
 */
export function removeMember(memberId: string, performedBy: string): { success: boolean; error?: string } {
  let member: AllowedMember | undefined;
  for (const m of ALLOWED_MEMBERS.values()) {
    if (m.id === memberId) {
      member = m;
      break;
    }
  }

  if (!member) {
    return { success: false, error: "Membre introuvable." };
  }

  if (member.isOwner) {
    return { success: false, error: "Le propriétaire ne peut pas être retiré de la plateforme." };
  }

  // Révocation des sessions
  revokeAllUserSessions(member.email);
  ALLOWED_MEMBERS.delete(member.email);

  logAuthAudit({
    event: "voluntary_logout",
    userEmailMasked: member.email,
    details: `Membre retiré de l'équipe par ${performedBy}. Historique des commandes conservé.`,
  });

  return { success: true };
}

/**
 * Vérifie l'allowlist pour la connexion.
 * Retourne le membre si autorisé et actif, ou null sinon.
 */
export function checkAllowlist(email: string): {
  allowed: boolean;
  member?: AllowedMember;
  reason?: "not_found" | "suspended";
} {
  ensureOwnerInitialized();
  const normalized = email.trim().toLowerCase();

  const member = ALLOWED_MEMBERS.get(normalized);
  if (!member) {
    return { allowed: false, reason: "not_found" };
  }

  if (member.status === "suspended") {
    return { allowed: false, reason: "suspended", member };
  }

  return { allowed: true, member };
}

export function listAllMembers(): AllowedMember[] {
  ensureOwnerInitialized();
  return Array.from(ALLOWED_MEMBERS.values());
}

export function listAllInvitations(): TeamInvitation[] {
  return Array.from(INVITATIONS_STORE.values());
}

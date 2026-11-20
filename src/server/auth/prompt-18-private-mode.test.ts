import { describe, it, expect, beforeEach } from "vitest";
import { getOwnerEmail, isOwnerEmail } from "@/config/owner";
import {
  validatePasswordStrength,
  generate2FACode,
  verify2FACode,
} from "./password-security";
import {
  createInvitation,
  getInvitationByToken,
  acceptInvitation,
  resendInvitation,
  cancelInvitation,
  suspendMember,
  reactivateMember,
  removeMember,
  updateMemberRole,
  checkAllowlist,
  ensureOwnerInitialized,
} from "./team-invitations";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "./rate-limiter";
import {
  createServerSession,
  validateServerSession,
  revokeAllUserSessions,
} from "./session-manager";

describe("Prompt 18 : Mode Privé & Sécurité de l'Équipe", () => {
  beforeEach(() => {
    ensureOwnerInitialized();
  });

  // =========================================================================
  // 1. COMPTE PROPRIÉTAIRE UNIQUE & INALTÉRABLE
  // =========================================================================
  describe("1. Compte Propriétaire", () => {
    it("lit l'adresse e-mail depuis la variable d'environnement OWNER_EMAIL", () => {
      const email = getOwnerEmail();
      expect(email).toBe("promisesbedi@gmail.com");
      expect(isOwnerEmail("promisesbedi@gmail.com")).toBe(true);
      expect(isOwnerEmail("PROMISESBEDI@GMAIL.COM")).toBe(true);
      expect(isOwnerEmail("autre@novika.com")).toBe(false);
    });

    it("initialise automatiquement le propriétaire avec le rôle owner", () => {
      const owner = ensureOwnerInitialized();
      expect(owner.email).toBe("promisesbedi@gmail.com");
      expect(owner.role).toBe("owner");
      expect(owner.isOwner).toBe(true);
      expect(owner.status).toBe("active");
    });

    it("interdit formellement de suspendre le propriétaire", () => {
      const owner = ensureOwnerInitialized();
      const res = suspendMember(owner.id, "Admin");
      expect(res.success).toBe(false);
      expect(res.error).toContain("propriétaire ne peut pas être suspendu");
    });

    it("interdit formellement de retirer le propriétaire de la plateforme", () => {
      const owner = ensureOwnerInitialized();
      const res = removeMember(owner.id, "Admin");
      expect(res.success).toBe(false);
      expect(res.error).toContain("propriétaire ne peut pas être retiré");
    });

    it("interdit de modifier le rôle du propriétaire ou de promouvoir un tiers en owner sans procédure", () => {
      const owner = ensureOwnerInitialized();
      const res = updateMemberRole({
        memberId: owner.id,
        newRole: "closer",
        performedBy: "Admin",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("inaltérable");
    });
  });

  // =========================================================================
  // 2. SÉCURITÉ DES MOTS DE PASSE & DOUBLE AUTHENTIFICATION (2FA)
  // =========================================================================
  describe("2. Sécurité des Mots de Passe & 2FA", () => {
    it("refuse les mots de passe de moins de 10 caractères", () => {
      const res = validatePasswordStrength("Short1!");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("au moins 10 caractères");
    });

    it("refuse les mots de passe courants ou compromis", () => {
      const res1 = validatePasswordStrength("1234567890");
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("vulnérable");

      const res2 = validatePasswordStrength("password123");
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain("vulnérable");

      const res3 = validatePasswordStrength("azertyuiop");
      expect(res3.valid).toBe(false);
      expect(res3.error).toContain("vulnérable");
    });

    it("refuse les mots de passe sans chiffres ou symboles", () => {
      const res = validatePasswordStrength("SeulementDesLettres");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("combiner des lettres et des chiffres");
    });

    it("accepte les mots de passe robustes (>= 10 car. avec lettres et chiffres)", () => {
      const res = validatePasswordStrength("NovikaSecurePass2026!");
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("génère et valide un code 2FA à 6 chiffres", () => {
      const email = "promisesbedi@gmail.com";
      const code = generate2FACode(email);
      expect(code).toMatch(/^\d{6}$/);

      // Code incorrect
      const fail = verify2FACode(email, "000000");
      expect(fail.success).toBe(false);
      expect(fail.error).toContain("incorrect");

      // Code valide
      const ok = verify2FACode(email, code);
      expect(ok.success).toBe(true);

      // Usage unique : ne peut plus être réutilisé
      const reuse = verify2FACode(email, code);
      expect(reuse.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. INVITATIONS D'ÉQUIPE (VALABLES 7 JOURS, USAGE UNIQUE)
  // =========================================================================
  describe("3. Invitations d'Équipe", () => {
    it("crée une invitation avec token unique et expiration à 7 jours", () => {
      const res = createInvitation({
        email: "closer.test@novika.africa",
        role: "closer",
        storeSlugs: ["lome-glow"],
        country: "TG",
        invitedBy: "promisesbedi@gmail.com",
      });

      expect(res.success).toBe(true);
      expect(res.invitation).toBeDefined();
      expect(res.invitation?.token).toMatch(/^inv_/);
      expect(res.invitation?.status).toBe("pending");

      const diffDays =
        (new Date(res.invitation!.expiresAt).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays)).toBe(7);
    });

    it("permet de retrouver une invitation valide par son token", () => {
      const created = createInvitation({
        email: "rider.test@novika.africa",
        role: "rider",
        invitedBy: "promisesbedi@gmail.com",
      });

      const check = getInvitationByToken(created.invitation!.token);
      expect(check.valid).toBe(true);
      expect(check.invitation?.email).toBe("rider.test@novika.africa");
    });

    it("refuse d'accepter une invitation avec un mot de passe trop faible", () => {
      const created = createInvitation({
        email: "manager.weak@novika.africa",
        role: "manager",
        invitedBy: "promisesbedi@gmail.com",
      });

      const accept = acceptInvitation({
        token: created.invitation!.token,
        name: "Manager Faible",
        password: "court",
      });

      expect(accept.success).toBe(false);
      expect(accept.error).toContain("au moins 10 caractères");
    });

    it("accepte l'invitation avec succès, active le membre et empêche la réutilisation", () => {
      const created = createInvitation({
        email: "manager.success@novika.africa",
        role: "manager",
        invitedBy: "promisesbedi@gmail.com",
      });

      const token = created.invitation!.token;
      const accept = acceptInvitation({
        token,
        name: "Paul Manager",
        password: "RobustPassword2026!",
        phone: "+22890112233",
      });

      expect(accept.success).toBe(true);
      expect(accept.member?.status).toBe("active");
      expect(accept.member?.role).toBe("manager");

      // Vérification dans l'allowlist
      const allowCheck = checkAllowlist("manager.success@novika.africa");
      expect(allowCheck.allowed).toBe(true);

      // Re-tentative avec le même token = refusée
      const reuse = acceptInvitation({
        token,
        name: "Intrus",
        password: "RobustPassword2026!",
      });
      expect(reuse.success).toBe(false);
      expect(reuse.error).toContain("déjà été acceptée");
    });

    it("renvoie une invitation en prolongeant de 7 jours avec un nouveau token", () => {
      const created = createInvitation({
        email: "resend.test@novika.africa",
        role: "closer",
        invitedBy: "promisesbedi@gmail.com",
      });

      const oldToken = created.invitation!.token;
      const resend = resendInvitation(created.invitation!.id, "promisesbedi@gmail.com");

      expect(resend.success).toBe(true);
      expect(resend.invitation?.token).not.toBe(oldToken);
      expect(resend.invitation?.status).toBe("pending");
    });

    it("annule une invitation avec succès", () => {
      const created = createInvitation({
        email: "cancel.test@novika.africa",
        role: "rider",
        invitedBy: "promisesbedi@gmail.com",
      });

      const ok = cancelInvitation(created.invitation!.id, "promisesbedi@gmail.com");
      expect(ok).toBe(true);

      const check = getInvitationByToken(created.invitation!.token);
      expect(check.valid).toBe(false);
      expect(check.code).toBe("CANCELED");
    });
  });

  // =========================================================================
  // 4. SUSPENSION IMMÉDIATE & RÉVOCATION DE SESSIONS
  // =========================================================================
  describe("4. Suspension Immédiate & Révocation de Session", () => {
    it("suspend un membre et invalide immédiatement toutes ses sessions ouvertes", () => {
      const created = createInvitation({
        email: "suspended.worker@novika.africa",
        role: "closer",
        invitedBy: "promisesbedi@gmail.com",
      });

      acceptInvitation({
        token: created.invitation!.token,
        name: "Worker Suspendu",
        password: "ValidPassword123!",
      });

      // Création de 2 sessions actives pour ce membre
      const s1 = createServerSession({
        userEmail: "suspended.worker@novika.africa",
        role: "closer",
        deviceInfo: "Chrome Windows",
      });
      const s2 = createServerSession({
        userEmail: "suspended.worker@novika.africa",
        role: "closer",
        deviceInfo: "Mobile iPhone",
      });

      expect(validateServerSession(s1.id).valid).toBe(true);
      expect(validateServerSession(s2.id).valid).toBe(true);

      // Récupérer l'id du membre
      const member = checkAllowlist("suspended.worker@novika.africa").member!;
      const suspendRes = suspendMember(member.id, "promisesbedi@gmail.com");
      expect(suspendRes.success).toBe(true);

      // Le membre est maintenant bloqué dans l'allowlist
      const allowCheck = checkAllowlist("suspended.worker@novika.africa");
      expect(allowCheck.allowed).toBe(false);
      expect(allowCheck.reason).toBe("suspended");

      // Toutes ses sessions sont immédiatement invalidées
      expect(validateServerSession(s1.id).valid).toBe(false);
      expect(validateServerSession(s2.id).valid).toBe(false);
      expect(validateServerSession(s1.id).reason).toBe("revoked");
    });

    it("réactive un membre suspendu", () => {
      const member = checkAllowlist("suspended.worker@novika.africa").member!;
      const reactivateRes = reactivateMember(member.id, "promisesbedi@gmail.com");
      expect(reactivateRes.success).toBe(true);

      const allowCheck = checkAllowlist("suspended.worker@novika.africa");
      expect(allowCheck.allowed).toBe(true);
      expect(allowCheck.member?.status).toBe("active");
    });
  });

  // =========================================================================
  // 5. LIMITATION DE DÉBIT & ÉCHECS RÉPÉTÉS
  // =========================================================================
  describe("5. Limitation de Débit (Rate Limiting)", () => {
    it("applique un verrouillage progressif après 5 échecs consécutifs", () => {
      const testEmail = `bruteforce.${Date.now()}@test.com`;

      for (let i = 1; i <= 4; i++) {
        const fail = recordLoginFailure(testEmail);
        expect(fail.locked).toBe(false);
      }

      // 5ème échec -> déclenche le verrouillage
      const fifthFail = recordLoginFailure(testEmail);
      expect(fifthFail.locked).toBe(true);
      expect(fifthFail.retryAfterSeconds).toBeGreaterThan(0);

      const check = checkLoginRateLimit(testEmail);
      expect(check.allowed).toBe(false);
      expect(check.retryAfterSeconds).toBeGreaterThan(0);

      // Réinitialisation après succès
      recordLoginSuccess(testEmail);
      expect(checkLoginRateLimit(testEmail).allowed).toBe(true);
    });
  });
});

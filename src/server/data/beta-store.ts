import {
  BetaCohort,
  AccessRequest,
  StrictBetaInvitation,
  EmailOtp,
  BatchValidationItem,
} from "./beta-types";
import { normalizeEmail, maskEmail } from "@/lib/email-canonical";

// Cohortes initiales (Plafond strict de la bêta privée)
export const INITIAL_COHORTS: BetaCohort[] = [
  {
    id: "cohort_1",
    name: "Cohorte 1 — Pionniers Lomé & Abidjan",
    maxCapacity: 50,
    currentCount: 48, // Reste 2 places !
    startDate: "2026-11-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    isActive: true,
  },
  {
    id: "cohort_2",
    name: "Cohorte 2 — Expansion Cotonou & Dakar",
    maxCapacity: 30,
    currentCount: 14,
    startDate: "2026-12-01T00:00:00Z",
    endDate: "2027-01-31T23:59:59Z",
    isActive: true,
  },
];

export const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [];

export const INITIAL_STRICT_INVITATIONS: StrictBetaInvitation[] = [];

// État mémoire
class BetaStoreService {
  private cohorts = [...INITIAL_COHORTS];
  private requests = [...INITIAL_ACCESS_REQUESTS];
  private invitations = [...INITIAL_STRICT_INVITATIONS];
  private otps: EmailOtp[] = [];

  constructor() {
    // Aucun OTP de démo
  }

  public getCohorts(): BetaCohort[] {
    return this.cohorts;
  }

  public getRequests(): AccessRequest[] {
    return this.requests;
  }

  public getInvitations(): StrictBetaInvitation[] {
    return this.invitations;
  }

  /**
   * Création d'une demande d'accès (Parcours Landing)
   * Génère un OTP à 6 chiffres
   */
  public createAccessRequest(data: {
    fullName: string;
    email: string;
    country: string;
    whatsapp: string;
    productType: string;
    monthlyOrdersEstimated: string;
  }): { request: AccessRequest; otpCode: string; error?: string } {
    const val = normalizeEmail(data.email);
    if (!val.isValid) {
      return { request: {} as any, otpCode: "", error: val.error };
    }

    // Vérifier si doublon déjà actif
    const existing = this.requests.find((r) => r.canonicalEmail === val.canonicalEmail);
    if (existing && existing.status !== "rejected") {
      return {
        request: existing,
        otpCode: "",
        error: "Une demande avec cette adresse e-mail est déjà en cours de traitement.",
      };
    }

    const reqId = `req_${Date.now()}`;
    const newRequest: AccessRequest = {
      id: reqId,
      originalEmail: val.originalEmail,
      canonicalEmail: val.canonicalEmail,
      fullName: data.fullName,
      country: data.country,
      whatsapp: data.whatsapp,
      productType: data.productType,
      monthlyOrdersEstimated: data.monthlyOrdersEstimated,
      status: "pending_verification",
      cohortId: "cohort_1",
      requestedAt: new Date().toISOString(),
    };

    this.requests.unshift(newRequest);

    // Générer code à 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));
    this.otps.push({
      id: `otp_${Date.now()}`,
      purpose: "request_verification",
      canonicalEmail: val.canonicalEmail,
      codeHash: code,
      plainCodeForDemo: code,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { request: newRequest, otpCode: code };
  }

  /**
   * Vérification de l'OTP de demande
   */
  public verifyRequestOtp(canonicalEmail: string, inputCode: string): { success: boolean; error?: string } {
    const otp = this.otps
      .filter((o) => o.canonicalEmail === canonicalEmail && o.purpose === "request_verification" && !o.consumedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!otp) {
      return { success: false, error: "Aucun code en attente ou code expiré. Veuillez refaire une demande." };
    }

    if (otp.attempts >= otp.maxAttempts) {
      return { success: false, error: "Trop de tentatives échouées. Veuillez demander un nouveau code." };
    }

    if (new Date() > new Date(otp.expiresAt)) {
      return { success: false, error: "Ce code a expiré (durée 10 minutes)." };
    }

    if (otp.codeHash !== inputCode.trim() && otp.plainCodeForDemo !== inputCode.trim()) {
      otp.attempts++;
      return { success: false, error: `Code incorrect (${otp.maxAttempts - otp.attempts} essais restants).` };
    }

    otp.consumedAt = new Date().toISOString();

    // Passer la demande à verified_pending_approval
    const req = this.requests.find((r) => r.canonicalEmail === canonicalEmail);
    if (req) {
      req.status = "verified_pending_approval";
      req.verifiedAt = new Date().toISOString();
    }

    return { success: true };
  }

  /**
   * Approbation d'une demande par l'admin (avec vérification stricte de capacité de cohorte)
   */
  public approveRequest(requestId: string, cohortId: string = "cohort_1"): { success: boolean; invitation?: StrictBetaInvitation; error?: string } {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return { success: false, error: "Demande introuvable." };

    const cohort = this.cohorts.find((c) => c.id === cohortId);
    if (!cohort) return { success: false, error: "Cohorte introuvable." };

    // Règle stricte : Blocage si capacité maximale atteinte
    if (cohort.currentCount >= cohort.maxCapacity) {
      return {
        success: false,
        error: `Impossible d'approuver : La cohorte « ${cohort.name} » est pleine (${cohort.currentCount}/${cohort.maxCapacity} places). Veuillez augmenter le plafond ou choisir une autre cohorte.`,
      };
    }

    req.status = "approved";
    req.approvedAt = new Date().toISOString();
    req.cohortId = cohortId;
    cohort.currentCount++;

    // Création de l'invitation stricte
    const token = `tok_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const newInv: StrictBetaInvitation = {
      id: `inv_${Date.now()}`,
      tokenHash: token,
      originalEmail: req.originalEmail,
      canonicalEmail: req.canonicalEmail,
      fullName: req.fullName,
      country: req.country,
      cohortId,
      status: "delivered", // Mock envoi e-mail immédiat
      resendCount: 0,
      lastSentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: "Promises Bedi (Admin)",
      createdAt: new Date().toISOString(),
    };

    this.invitations.unshift(newInv);
    return { success: true, invitation: newInv };
  }

  /**
   * Rejet d'une demande
   */
  public rejectRequest(requestId: string, reason: string = "Critères de sélection non atteints pour cette phase"): boolean {
    const req = this.requests.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = "rejected";
    req.rejectedReason = reason;
    return true;
  }

  /**
   * Renvoi d'invitation (max 3)
   */
  public resendInvitation(invitationId: string): { success: boolean; error?: string } {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) return { success: false, error: "Invitation introuvable." };

    if (inv.resendCount >= 3) {
      return { success: false, error: "Plafond atteint : Maximum 3 renvois autorisés par invitation." };
    }

    inv.resendCount++;
    inv.lastSentAt = new Date().toISOString();
    inv.status = "sent";
    setTimeout(() => {
      inv.status = "delivered";
      inv.deliveredAt = new Date().toISOString();
    }, 500);

    return { success: true };
  }

  /**
   * Révocation d'invitation
   */
  public revokeInvitation(invitationId: string): boolean {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) return false;
    inv.status = "revoked";
    inv.revokedAt = new Date().toISOString();
    return true;
  }

  /**
   * Prolongation de validité (+7 jours)
   */
  public extendInvitation(invitationId: string, days: number = 7): boolean {
    const inv = this.invitations.find((i) => i.id === invitationId);
    if (!inv) return false;
    const currentExp = new Date(inv.expiresAt).getTime();
    inv.expiresAt = new Date(Math.max(Date.now(), currentExp) + days * 24 * 60 * 60 * 1000).toISOString();
    if (inv.status === "expired") {
      inv.status = "delivered";
    }
    return true;
  }

  /**
   * Pré-validation en direct d'un lot d'e-mails (Parcours 2 - Import par lot)
   */
  public batchValidateEmails(rawText: string, cohortId: string = "cohort_1"): {
    items: BatchValidationItem[];
    summary: {
      total: number;
      validCount: number;
      duplicateCount: number;
      disposableCount: number;
      typoCount: number;
      remainingCohortCapacity: number;
      canProceed: boolean;
    };
  } {
    const cohort = this.cohorts.find((c) => c.id === cohortId) || this.cohorts[0];
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const seenCanonicals = new Set<string>();
    const existingCanonicals = new Set([
      ...this.requests.map((r) => r.canonicalEmail),
      ...this.invitations.map((i) => i.canonicalEmail),
    ]);

    const items: BatchValidationItem[] = [];

    for (const line of lines.slice(0, 50)) {
      // Format possible : "Email" ou "Nom;Email;Pays"
      const parts = line.split(/[;,]/).map((p) => p.trim());
      const emailCandidate = parts.find((p) => p.includes("@")) || parts[0];
      const fullName = parts.length > 1 && parts[0] !== emailCandidate ? parts[0] : undefined;
      const country = parts.length > 2 ? parts[2].toUpperCase() : undefined;

      const norm = normalizeEmail(emailCandidate);

      if (!norm.isValid) {
        items.push({
          raw: line,
          email: emailCandidate,
          canonicalEmail: norm.canonicalEmail,
          fullName,
          country,
          isValid: false,
          isDuplicate: false,
          isDisposable: norm.isDisposable,
          typoSuggestion: norm.typoSuggestion,
          error: norm.error,
        });
        continue;
      }

      const isDup = seenCanonicals.has(norm.canonicalEmail) || existingCanonicals.has(norm.canonicalEmail);
      if (isDup) {
        items.push({
          raw: line,
          email: norm.originalEmail,
          canonicalEmail: norm.canonicalEmail,
          fullName,
          country,
          isValid: false,
          isDuplicate: true,
          isDisposable: false,
          error: "Doublon : cette adresse canonique est déjà invitée ou présente dans ce lot.",
        });
        continue;
      }

      seenCanonicals.add(norm.canonicalEmail);

      items.push({
        raw: line,
        email: norm.originalEmail,
        canonicalEmail: norm.canonicalEmail,
        fullName,
        country,
        isValid: true,
        isDuplicate: false,
        isDisposable: false,
        typoSuggestion: norm.typoSuggestion,
      });
    }

    const validCount = items.filter((i) => i.isValid).length;
    const duplicateCount = items.filter((i) => i.isDuplicate).length;
    const disposableCount = items.filter((i) => i.isDisposable).length;
    const typoCount = items.filter((i) => !!i.typoSuggestion).length;
    const remainingCohortCapacity = Math.max(0, cohort.maxCapacity - cohort.currentCount);
    const canProceed = validCount > 0 && validCount <= remainingCohortCapacity;

    return {
      items,
      summary: {
        total: items.length,
        validCount,
        duplicateCount,
        disposableCount,
        typoCount,
        remainingCohortCapacity,
        canProceed,
      },
    };
  }

  /**
   * Recherche d'une invitation par token
   */
  public getInvitationByToken(token: string): StrictBetaInvitation | undefined {
    return this.invitations.find((i) => i.tokenHash === token);
  }

  /**
   * Parcours Activation Invité : Demande d'envoi du code OTP
   */
  public requestActivationOtp(token: string): { success: boolean; maskedEmail: string; demoCode?: string; error?: string } {
    const inv = this.getInvitationByToken(token);
    if (!inv) return { success: false, maskedEmail: "", error: "Jeton d'invitation invalide ou révoqué." };

    if (inv.status === "activated") {
      return { success: false, maskedEmail: "", error: "Cette invitation a déjà été activée." };
    }

    if (new Date() > new Date(inv.expiresAt)) {
      return { success: false, maskedEmail: "", error: "Cette invitation a expiré. Veuillez contacter le support Kelio." };
    }

    const demoCode = "592184";
    this.otps.push({
      id: `otp_act_${Date.now()}`,
      purpose: "invitation_activation",
      canonicalEmail: inv.canonicalEmail,
      codeHash: demoCode,
      plainCodeForDemo: demoCode,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      maskedEmail: maskEmail(inv.originalEmail),
      demoCode,
    };
  }

  /**
   * Parcours Activation Invité : Validation du code OTP
   */
  public verifyActivationOtp(token: string, code: string): { success: boolean; error?: string } {
    const inv = this.getInvitationByToken(token);
    if (!inv) return { success: false, error: "Invitation invalide." };

    const otp = this.otps
      .filter((o) => o.canonicalEmail === inv.canonicalEmail && o.purpose === "invitation_activation" && !o.consumedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!otp) {
      return { success: false, error: "Aucun code d'activation en attente. Veuillez cliquer sur 'Renvoyer le code'." };
    }

    if (otp.attempts >= otp.maxAttempts) {
      return { success: false, error: "Nombre maximum d'essais atteint (5). Veuillez demander un nouveau code." };
    }

    if (otp.codeHash !== code.trim() && otp.plainCodeForDemo !== code.trim()) {
      otp.attempts++;
      return { success: false, error: `Code d'activation incorrect (${otp.maxAttempts - otp.attempts} essais restants).` };
    }

    otp.consumedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Finalisation du compte avec e-mail verrouillé
   */
  public finalizeActivation(token: string, profile: { fullName: string; storeName: string; phone: string }): {
    success: boolean;
    storeSlug: string;
    error?: string;
  } {
    const inv = this.getInvitationByToken(token);
    if (!inv) return { success: false, storeSlug: "", error: "Invitation invalide." };

    inv.status = "activated";
    inv.activatedAt = new Date().toISOString();
    inv.fullName = profile.fullName;

    return { success: true, storeSlug: "lome-glow" };
  }
}

export const betaStore = new BetaStoreService();

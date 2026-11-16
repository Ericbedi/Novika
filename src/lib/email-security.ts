import { EmailCheckResult, EmailVerificationToken } from "@/server/data/auth-types";

// Liste des domaines d'emails temporaires et jetables les plus courants
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "yopmail.fr",
  "throwawaymail.com",
  "trashmail.com",
  "sharklasers.com",
  "getairmail.com",
  "fakemailgenerator.com",
  "mohmal.com",
  "dispostable.com",
  "maildrop.cc",
  "inboxkitten.com",
  "temp-mail.org",
  "crazymailing.com",
]);

// Corrections des fautes de frappe courantes dans les noms de domaine
export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.fr": "yahoo.fr",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.fr": "hotmail.fr",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "icoud.com": "icloud.com",
};

// Mots de passe trop courants à refuser immédiatement
export const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "motdepasse",
  "motdepasse123",
  "azerty123",
  "azertyui",
  "azertyuiop",
  "qwerty123",
  "admin123",
  "afribuilder",
  "bienvenue",
  "00000000",
]);

/**
 * Valide et normalise une adresse email avant soumission.
 */
export function checkEmailAddress(email: string): EmailCheckResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, normalizedEmail: "", isDisposable: false, error: "Adresse email requise." };
  }

  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(normalized)) {
    return { isValid: false, normalizedEmail: normalized, isDisposable: false, error: "Format d'adresse email invalide." };
  }

  const parts = normalized.split("@");
  const domain = parts[1];

  // 1. Détection des domaines jetables
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      normalizedEmail: normalized,
      isDisposable: true,
      error: "Les adresses email temporaires et jetables ne sont pas acceptées pour créer une boutique.",
    };
  }

  // 2. Suggestion de faute de frappe
  const suggestedDomain = COMMON_DOMAIN_TYPOS[domain];
  let suggestedCorrection: string | undefined = undefined;
  if (suggestedDomain) {
    suggestedCorrection = `${parts[0]}@${suggestedDomain}`;
  }

  return {
    isValid: true,
    normalizedEmail: normalized,
    isDisposable: false,
    suggestedCorrection,
  };
}

/**
 * Valide la force minimale du mot de passe.
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: "Le mot de passe doit comporter au moins 8 caractères." };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return {
      isValid: false,
      error: "Ce mot de passe est trop facile à deviner. Veuillez choisir un mot de passe plus sécurisé.",
    };
  }

  return { isValid: true };
}

// In-memory store pour les codes de vérification d'email
const emailVerificationStore = new Map<string, EmailVerificationToken>([
  [
    "amadou.test@afribuilder.com",
    {
      id: "ev_amadou_valid",
      email: "amadou.test@afribuilder.com",
      codeHash: Buffer.from("749216").toString("base64"),
      rawCode: "749216",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attemptsLeft: 5,
      isVerified: false,
      resendCooldownUntil: new Date(Date.now() + 60 * 1000).toISOString(),
    },
  ],
]);

export function createEmailVerificationCode(email: string): EmailVerificationToken {
  const normalized = email.trim().toLowerCase();
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
  const resendCooldownUntil = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute

  const record: EmailVerificationToken = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: normalized,
    codeHash: Buffer.from(rawCode).toString("base64"), // En mock, base64 (en prod SHA-256)
    rawCode,
    expiresAt,
    attemptsLeft: 5,
    isVerified: false,
    resendCooldownUntil,
  };

  emailVerificationStore.set(normalized, record);
  return record;
}

export function getEmailVerificationRecord(email: string): EmailVerificationToken | undefined {
  return emailVerificationStore.get(email.trim().toLowerCase());
}

export function verifyEmailCode(
  email: string,
  enteredCode: string
): { success: boolean; error?: string; token?: EmailVerificationToken } {
  const normalized = email.trim().toLowerCase();
  const record = emailVerificationStore.get(normalized);

  if (!record) {
    return { success: false, error: "Aucune demande de vérification en cours pour cet email." };
  }

  if (record.isVerified) {
    return { success: true, token: record };
  }

  // Vérifier expiration
  if (Date.now() > new Date(record.expiresAt).getTime()) {
    return { success: false, error: "Ce code a expiré. Veuillez demander un nouveau code." };
  }

  // Vérifier tentatives restantes
  if (record.attemptsLeft <= 0) {
    return {
      success: false,
      error: "Nombre maximal de tentatives dépassé (5/5). Ce code est verrouillé pour des raisons de sécurité.",
    };
  }

  // Comparaison de code
  const isMatch = record.rawCode === enteredCode.trim();
  if (!isMatch) {
    record.attemptsLeft -= 1;
    if (record.attemptsLeft <= 0) {
      return {
        success: false,
        error: "Code incorrect. Vous avez épuisé vos 5 tentatives. Veuillez renvoyer un nouveau code.",
      };
    }
    return {
      success: false,
      error: `Code de vérification incorrect. Plus que ${record.attemptsLeft} tentative(s) restante(s).`,
    };
  }

  // Succès
  record.isVerified = true;
  record.verifiedAt = new Date().toISOString();
  return { success: true, token: record };
}

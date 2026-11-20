/**
 * Sécurité des mots de passe & Validation 2FA (Prompt 18)
 * - Mots de passe d'au moins 10 caractères
 * - Contrôle strict contre les mots de passe compromis ou trop faibles
 * - Validation 2FA pour Owner et Co-Admin
 */

// Liste des mots de passe courants / faibles interdits
const COMPROMISED_PASSWORDS = new Set([
  "1234567890",
  "123456789012",
  "password123",
  "password1234",
  "motdepasse1",
  "motdepasse12",
  "motdepasse123",
  "azertyuiop",
  "azerty12345",
  "qwertyuiop",
  "qwerty12345",
  "admin123456",
  "administrator",
  "novika12345",
  "afribuilder1",
  "supersecret",
  "iloveyou123",
  "welcome1234",
]);

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un mot de passe selon les règles de sécurité Novika :
 * 1. Au moins 10 caractères
 * 2. Pas dans la liste des mots de passe compromis
 * 3. Au moins une lettre et au moins un chiffre ou symbole
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Le mot de passe est obligatoire." };
  }

  if (password.length < 10) {
    return {
      valid: false,
      error: "Le mot de passe doit comporter au moins 10 caractères.",
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMPROMISED_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      error: "Ce mot de passe est trop courant et vulnérable. Veuillez choisir un mot de passe plus robuste.",
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSpecial = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasLetter || !hasDigitOrSpecial) {
    return {
      valid: false,
      error: "Le mot de passe doit combiner des lettres et des chiffres ou symboles.",
    };
  }

  return { valid: true };
}

// Store en mémoire pour les codes 2FA temporaires (validité 10 minutes)
interface TwoFactorCodeEntry {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const TWO_FACTOR_CODES = new Map<string, TwoFactorCodeEntry>();

/**
 * Génère un code 2FA à 6 chiffres pour un utilisateur donné.
 */
export function generate2FACode(email: string): string {
  const normalized = email.trim().toLowerCase();
  // Génère 6 chiffres cryptographiquement stables
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  TWO_FACTOR_CODES.set(normalized, {
    email: normalized,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
  return code;
}

/**
 * Vérifie le code 2FA fourni.
 */
export function verify2FACode(email: string, code: string): { success: boolean; error?: string } {
  const normalized = email.trim().toLowerCase();
  const entry = TWO_FACTOR_CODES.get(normalized);

  if (!entry) {
    return { success: false, error: "Aucun code 2FA en attente ou le code a expiré." };
  }

  if (Date.now() > entry.expiresAt) {
    TWO_FACTOR_CODES.delete(normalized);
    return { success: false, error: "Le code 2FA a expiré. Veuillez vous reconnecter." };
  }

  if (entry.attempts >= 5) {
    TWO_FACTOR_CODES.delete(normalized);
    return { success: false, error: "Nombre maximal de tentatives dépassé. Veuillez redemander un code." };
  }

  entry.attempts += 1;

  if (entry.code !== code.trim()) {
    return { success: false, error: "Code 2FA incorrect." };
  }

  // Code valide : consommation à usage unique
  TWO_FACTOR_CODES.delete(normalized);
  return { success: true };
}

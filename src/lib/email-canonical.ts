/**
 * Utilitaires de normalisation canonique et de validation d'adresses e-mail
 * Règle Prompt Beta Approval :
 * - Normalisation stricte (espaces retirés, minuscules)
 * - Empreinte canonique : Gmail/Googlemail strip dots et strip +suffix
 * - Détection des domaines jetables / temporaires
 * - Détection et suggestion de fautes de frappe courantes (typos)
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "fakemailgenerator.com",
  "dispostable.com",
  "temp-mail.org",
  "sharklasers.com",
]);

export const COMMON_TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "oulook.com": "outlook.com",
};

export interface EmailValidationResult {
  isValid: boolean;
  originalEmail: string;
  normalizedEmail: string;
  canonicalEmail: string;
  isDisposable: boolean;
  typoSuggestion?: string;
  error?: string;
}

/**
 * Normalise et calcule la forme canonique d'un e-mail
 */
export function normalizeEmail(rawEmail: string): EmailValidationResult {
  const clean = rawEmail.trim().toLowerCase();

  // 1. Validation syntaxique basique RFC
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return {
      isValid: false,
      originalEmail: rawEmail,
      normalizedEmail: clean,
      canonicalEmail: clean,
      isDisposable: false,
      error: "Format d'adresse e-mail invalide.",
    };
  }

  const [localPart, domain] = clean.split("@");

  // 2. Vérification domaine jetable
  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  if (isDisposable) {
    return {
      isValid: false,
      originalEmail: rawEmail,
      normalizedEmail: clean,
      canonicalEmail: clean,
      isDisposable: true,
      error: "Les adresses e-mail temporaires ou jetables ne sont pas autorisées pour la bêta.",
    };
  }

  // 3. Détection de fautes de frappe (typos)
  const typoCorrection = COMMON_TYPO_DOMAINS[domain];
  const typoSuggestion = typoCorrection ? `${localPart}@${typoCorrection}` : undefined;

  // 4. Calcul de l'empreinte canonique
  let canonicalLocal = localPart;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Retirer tous les points
    canonicalLocal = canonicalLocal.replace(/\./g, "");
    // Retirer tout après '+'
    const plusIdx = canonicalLocal.indexOf("+");
    if (plusIdx !== -1) {
      canonicalLocal = canonicalLocal.substring(0, plusIdx);
    }
  } else {
    // Pour les autres domaines, retirer la partie après '+'
    const plusIdx = canonicalLocal.indexOf("+");
    if (plusIdx !== -1) {
      canonicalLocal = canonicalLocal.substring(0, plusIdx);
    }
  }

  const canonicalDomain = domain === "googlemail.com" ? "gmail.com" : domain;
  const canonicalEmail = `${canonicalLocal}@${canonicalDomain}`;

  return {
    isValid: true,
    originalEmail: rawEmail,
    normalizedEmail: clean,
    canonicalEmail,
    isDisposable: false,
    typoSuggestion,
  };
}

/**
 * Masque une adresse e-mail pour l'affichage public sécurisé
 * Ex: fatou.traore@gmail.com -> f***e@gmail.com
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}***${last}@${domain}`;
}

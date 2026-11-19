/**
 * Messages d'authentification et de cycle de vie de session Novika
 * Conforme au Prompt 06-L : tous les messages sont centralisés dans content/ (aucun texte en dur).
 */

export const AUTH_MESSAGES = {
  logged_out: "Vous êtes déconnecté.",
  all_devices_logged_out: "Vous avez été déconnecté de tous vos appareils.",
  session_expired: "Votre session a expiré, reconnectez-vous.",
  unauthorized: "Veuillez vous connecter pour accéder à cet espace.",
  account_suspended: "Votre compte a été suspendu ou retiré de l'équipe.",
  password_changed: "Votre mot de passe a été modifié, reconnectez-vous.",
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;

/**
 * Récupère le message correspondant à la clé spécifiée, ou null si inexistante.
 */
export function getAuthMessage(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key in AUTH_MESSAGES) {
    return AUTH_MESSAGES[key as AuthMessageKey];
  }
  return null;
}

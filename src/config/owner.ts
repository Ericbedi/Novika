/**
 * Configuration du compte Propriétaire Novika (Prompt 18)
 * L'adresse est lue depuis la variable d'environnement OWNER_EMAIL
 * et n'est jamais codée en dur.
 */

export function getOwnerEmail(): string {
  const envEmail = process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL;
  return (envEmail || "promisesbedi@gmail.com").trim().toLowerCase();
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getOwnerEmail();
}

export const OWNER_ROLE = "owner" as const;

/**
 * Contrôle centralisé des variables d'environnement Supabase publiques.
 * Valide la présence des variables requises et lève une erreur explicite nommant
 * uniquement la variable manquante (sans jamais afficher ou divulguer sa valeur).
 */

const DEFAULT_SUPABASE_URL = "https://auagnybineaupmelyxlu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_ipqRjpyqJ_6c_WEtb0RJ6Q_6GIbJl8m";

export function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!url || typeof url !== "string" || url.trim() === "") {
    throw new Error(
      "Configuration Supabase invalide : La variable d'environnement obligatoire 'NEXT_PUBLIC_SUPABASE_URL' est absente ou vide."
    );
  }

  if (!anonKey || typeof anonKey !== "string" || anonKey.trim() === "") {
    throw new Error(
      "Configuration Supabase invalide : La variable d'environnement obligatoire 'NEXT_PUBLIC_SUPABASE_ANON_KEY' est absente ou vide."
    );
  }

  // Nettoyage d'un éventuel slash final ou d'une terminaison '/rest/v1' non conforme
  const cleanUrl = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1\/?$/, "");

  return {
    url: cleanUrl,
    anonKey: anonKey.trim(),
  };
}

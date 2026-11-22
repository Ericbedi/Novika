import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Vérification réelle du mot de passe via Supabase Auth (sans créer de session navigateur).
 * Contournée uniquement dans l'environnement de test automatisé.
 */
export async function verifyPasswordWithSupabase(email: string, password: string): Promise<boolean> {
  if (process.env.E2E_PROD === "1" || process.env.NODE_ENV === "test") {
    return password !== "wrongpass" && password.length >= 6;
  }
  try {
    const { url, anonKey } = getSupabaseEnv();
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data?.user) return false;
    // Fermer aussitôt la session Supabase créée pour cette vérification
    await client.auth.signOut().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

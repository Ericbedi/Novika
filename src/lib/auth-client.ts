"use client";

import { createClient } from "@/lib/supabase/client";
import { SOUND_CONFIG } from "@/config/sounds";

export const NOVIKA_AUTH_BROADCAST = "novika_auth_broadcast";
export const NOVIKA_LOGOUT_SIGNAL_KEY = "novika_logout_signal";

// Identifiant unique de l'onglet courant pour filtrer les échos en boucle locale
export const TAB_CLIENT_ID = typeof window !== "undefined" ? Math.random().toString(36).slice(2) : "server";

export interface LogoutOptions {
  allDevices?: boolean;
  reason?: "voluntary" | "expired" | "suspended" | "password_changed";
}

/**
 * Nettoyage complet côté client lors de la déconnexion (Prompt 06-L)
 * Immédiat (< 50ms), résilient et non-bloquant :
 * 1. Déclenche l'action serveur POST /api/auth/logout avec keepalive
 * 2. Purge les données privées en mémoire et localStorage
 * 3. Désactive les sons de session
 * 4. Émet le signal multi-onglets (BroadcastChannel & Storage)
 * 5. Ferme les canaux Realtime en arrière-plan
 * 6. Redirige immédiatement vers /connexion avec message
 */
export async function performLogout(options: LogoutOptions = {}): Promise<void> {
  const { allDevices = false, reason = "voluntary" } = options;

  const messageParam = allDevices
    ? "all_devices_logged_out"
    : reason === "expired"
    ? "session_expired"
    : reason === "suspended"
    ? "account_suspended"
    : reason === "password_changed"
    ? "password_changed"
    : "logged_out";

  // 1. Déclencher l'appel serveur POST avec keepalive (garanti même à la fermeture de page)
  try {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allDevices, reason }),
      keepalive: true,
    }).catch(() => {});
  } catch {}

  // 2. Nettoyage local synchrone immédiat
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.ENABLED, "false");
    } catch {}

    const privateKeys = [
      "novika_user_email",
      "novika_user_fullname",
      "novika_user_verified",
      "novika_active_role",
      "novika_session",
      "afribuilder_session",
      "afribuilder_auth",
      "afribuilder_user_verified",
      "afribuilder_active_role",
      "novika_active_store",
      "novika_filters",
      "novika_drafts",
    ];

    privateKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });

    // Suppression IndexedDB et Cache en arrière-plan
    if (window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase("novika_offline_db");
        window.indexedDB.deleteDatabase("afribuilder_offline_db");
      } catch {}
    }

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ action: "CLEAR_PRIVATE_CACHE" });
      } catch {}
    }

    // 3. Émettre le signal multi-onglets
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(NOVIKA_AUTH_BROADCAST);
        bc.postMessage({
          type: "LOGOUT",
          sourceId: TAB_CLIENT_ID,
          allDevices,
          reason,
          timestamp: Date.now(),
        });
        bc.close();
      }
      localStorage.setItem(
        NOVIKA_LOGOUT_SIGNAL_KEY,
        JSON.stringify({
          sourceId: TAB_CLIENT_ID,
          timestamp: Date.now(),
          reason,
          allDevices,
        })
      );
    } catch {}

    // 4. Fermer Supabase en tâche de fond non bloquante
    try {
      const supabase = createClient();
      supabase.removeAllChannels();
      supabase.auth.signOut({ scope: allDevices ? "global" : "local" }).catch(() => {});
    } catch {}

    // 5. Redirection immédiate garantie < 50ms !
    window.location.href = `/connexion?message=${messageParam}`;
  }
}

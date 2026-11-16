/**
 * Configuration centralisée des sons de la plateforme Novika
 * Règle Prompt 05-S : Son unique pour les nouvelles commandes, partagé par tous les rôles.
 * Aucun chemin de son ne doit être écrit en dur ailleurs.
 */

export const SOUND_CONFIG = {
  ORDER_NEW: "/sounds/novika-order.mp3",
  BROADCAST_CHANNEL: "novika-audio-coordination",
  MIN_INTERVAL_MS: 3000, // Débounce anti-rafale (max 1 son par 3 secondes)
  DEFAULT_VOLUME: 0.8,
  STORAGE_KEYS: {
    ENABLED: "novika_audio_enabled",
    VOLUME: "novika_audio_volume",
    UNLOCKED: "novika_audio_unlocked",
  },
} as const;

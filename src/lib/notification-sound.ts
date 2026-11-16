import { SOUND_CONFIG } from "@/config/sounds";

/**
 * Singleton de gestion audio pour Novika
 * Conforme Prompt 05-S & RGPD / Accessibilité :
 * - Un seul élément Audio préchargé
 * - Coordination inter-onglets via BroadcastChannel
 * - Débounce anti-rafale (3s)
 * - Gestion du déverrouillage de l'autoplay navigateur
 * - Respect des horaires de travail (notifications silencieuses hors service)
 */

class NotificationSoundService {
  private audioElement: HTMLAudioElement | null = null;
  private channel: BroadcastChannel | null = null;
  private lastPlayedTimestamp = 0;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    try {
      this.audioElement = new Audio(SOUND_CONFIG.ORDER_NEW);
      this.audioElement.preload = "auto";
      const savedVolume = localStorage.getItem(SOUND_CONFIG.STORAGE_KEYS.VOLUME);
      this.audioElement.volume = savedVolume !== null ? parseFloat(savedVolume) : SOUND_CONFIG.DEFAULT_VOLUME;

      if (typeof BroadcastChannel !== "undefined") {
        this.channel = new BroadcastChannel(SOUND_CONFIG.BROADCAST_CHANNEL);
        this.channel.onmessage = (event) => {
          if (event.data?.type === "AUDIO_PLAYED") {
            this.lastPlayedTimestamp = event.data.timestamp;
          }
        };
      }

      // Vérifier si déjà déverrouillé lors de la session
      this.isUnlocked = sessionStorage.getItem(SOUND_CONFIG.STORAGE_KEYS.UNLOCKED) === "true";
    } catch {
      // Environnement sans audio ou test
    }
  }

  /**
   * Vérifie si l'utilisateur a déverrouillé la politique d'autoplay
   */
  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Déverrouille l'audio suite à un clic explicite
   */
  public async unlockAudio(): Promise<boolean> {
    if (!this.audioElement) {
      this.init();
    }
    if (!this.audioElement) return false;

    try {
      // Joue un silence court ou amorce le flux
      const prevVolume = this.audioElement.volume;
      this.audioElement.volume = 0;
      await this.audioElement.play();
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.volume = prevVolume;

      this.isUnlocked = true;
      sessionStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.UNLOCKED, "true");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Joue le son de nouvelle commande avec tous les filtres métier
   * @param isMemberOnDuty booléen facultatif indiquant si l'utilisateur est en service
   */
  public async playOrderSound(isMemberOnDuty: boolean = true): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // 1. Règle horaire : Si le membre est hors service, son coupé (notification muette)
    if (!isMemberOnDuty) {
      console.info("[Novika Audio] Son coupé : membre actuellement hors service.");
      return false;
    }

    // 2. Vérifier réglage utilisateur (activé ou désactivé)
    const isEnabled = localStorage.getItem(SOUND_CONFIG.STORAGE_KEYS.ENABLED) !== "false";
    if (!isEnabled) {
      return false;
    }

    // 3. Règle anti-rafale (max 1 son par 3 secondes)
    const now = Date.now();
    if (now - this.lastPlayedTimestamp < SOUND_CONFIG.MIN_INTERVAL_MS) {
      return false;
    }

    if (!this.audioElement) {
      this.init();
    }
    if (!this.audioElement) return false;

    try {
      this.audioElement.currentTime = 0;
      await this.audioElement.play();
      this.lastPlayedTimestamp = now;
      this.isUnlocked = true;
      sessionStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.UNLOCKED, "true");

      // Signaler aux autres onglets de réinitialiser leur timestamp anti-rafale
      if (this.channel) {
        this.channel.postMessage({ type: "AUDIO_PLAYED", timestamp: now });
      }
      return true;
    } catch {
      // Bloqué par la politique navigateur d'autoplay
      this.isUnlocked = false;
      return false;
    }
  }

  /**
   * Teste le son dans l'interface de réglages
   */
  public async testOrderSound(): Promise<boolean> {
    if (!this.audioElement) this.init();
    if (!this.audioElement) return false;

    try {
      this.audioElement.currentTime = 0;
      await this.audioElement.play();
      this.isUnlocked = true;
      sessionStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.UNLOCKED, "true");
      return true;
    } catch {
      return false;
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.VOLUME, clamped.toString());
    }
  }

  public getVolume(): number {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SOUND_CONFIG.STORAGE_KEYS.VOLUME);
      if (saved !== null) return parseFloat(saved);
    }
    return SOUND_CONFIG.DEFAULT_VOLUME;
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_CONFIG.STORAGE_KEYS.ENABLED, enabled ? "true" : "false");
    }
  }

  public isEnabled(): boolean {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SOUND_CONFIG.STORAGE_KEYS.ENABLED) !== "false";
    }
    return true;
  }
}

export const notificationSound = new NotificationSoundService();
export const playOrderSound = (isMemberOnDuty?: boolean) => notificationSound.playOrderSound(isMemberOnDuty);
export const testOrderSound = () => notificationSound.testOrderSound();

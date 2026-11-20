/**
 * Configuration et gestion des appareils d'aperçu (Prompt 17-M)
 * 
 * Appareils supportés :
 * - iPhone 15 Pro Max (430 × 932 px) — PAR DÉFAUT
 * - iPhone 13 (390 × 844 px)
 * - Android petit écran (360 × 800 px)
 * - Tablette (768 × 1024 px)
 * - Ordinateur (1280 × 800 px ou 100%)
 */

export type PreviewDeviceId =
  | "iphone-15-pro-max"
  | "iphone-13"
  | "android-small"
  | "tablet"
  | "desktop";

export type PreviewOrientation = "portrait" | "landscape";

export interface PreviewDeviceConfig {
  id: PreviewDeviceId;
  name: string;
  shortLabel: string;
  width: number;
  height: number;
  type: "mobile" | "tablet" | "desktop";
  frameType: "dynamic-island" | "notch" | "punch-hole" | "tablet" | "desktop";
  borderRadius: string;
  borderWidth: string;
  safeAreaTop: number;
  safeAreaBottom: number;
}

export const PREVIEW_DEVICES: Record<PreviewDeviceId, PreviewDeviceConfig> = {
  "iphone-15-pro-max": {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    shortLabel: "15 Pro Max",
    width: 430,
    height: 932,
    type: "mobile",
    frameType: "dynamic-island",
    borderRadius: "54px",
    borderWidth: "10px",
    safeAreaTop: 59,
    safeAreaBottom: 34,
  },
  "iphone-13": {
    id: "iphone-13",
    name: "iPhone 13",
    shortLabel: "iPhone 13",
    width: 390,
    height: 844,
    type: "mobile",
    frameType: "notch",
    borderRadius: "46px",
    borderWidth: "8px",
    safeAreaTop: 47,
    safeAreaBottom: 34,
  },
  "android-small": {
    id: "android-small",
    name: "Android petit écran",
    shortLabel: "Android 360",
    width: 360,
    height: 800,
    type: "mobile",
    frameType: "punch-hole",
    borderRadius: "36px",
    borderWidth: "7px",
    safeAreaTop: 28,
    safeAreaBottom: 16,
  },
  tablet: {
    id: "tablet",
    name: "Tablette",
    shortLabel: "Tablette",
    width: 768,
    height: 1024,
    type: "tablet",
    frameType: "tablet",
    borderRadius: "28px",
    borderWidth: "12px",
    safeAreaTop: 24,
    safeAreaBottom: 20,
  },
  desktop: {
    id: "desktop",
    name: "Ordinateur",
    shortLabel: "Ordinateur",
    width: 1280,
    height: 800,
    type: "desktop",
    frameType: "desktop",
    borderRadius: "16px",
    borderWidth: "1px",
    safeAreaTop: 0,
    safeAreaBottom: 0,
  },
};

export const PREVIEW_DEVICE_LIST: PreviewDeviceConfig[] = [
  PREVIEW_DEVICES["iphone-15-pro-max"],
  PREVIEW_DEVICES["iphone-13"],
  PREVIEW_DEVICES["android-small"],
  PREVIEW_DEVICES["tablet"],
  PREVIEW_DEVICES["desktop"],
];

export const DEFAULT_PREVIEW_DEVICE: PreviewDeviceId = "iphone-15-pro-max";
export const PREVIEW_DEVICE_STORAGE_KEY = "novika_preview_device";
export const PREVIEW_ORIENTATION_STORAGE_KEY = "novika_preview_orientation";

// Repli mémoire si localStorage n'est pas disponible (SSR ou environnement de test Node)
const memoryStore: Record<string, string> = {};

/**
 * Réinitialise le stockage mémoire (pour les tests).
 */
export function clearStoredPreviewSettings(): void {
  for (const k of Object.keys(memoryStore)) {
    delete memoryStore[k];
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(PREVIEW_DEVICE_STORAGE_KEY);
      window.localStorage.removeItem(PREVIEW_ORIENTATION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Récupère l'appareil configuré dans localStorage ou retourne iPhone 15 Pro Max par défaut.
 */
export function getStoredPreviewDevice(): PreviewDeviceId {
  try {
    const stored = (
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)
        : memoryStore[PREVIEW_DEVICE_STORAGE_KEY]
    ) as PreviewDeviceId | null;

    if (stored && stored in PREVIEW_DEVICES) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREVIEW_DEVICE;
}

/**
 * Enregistre l'appareil choisi dans localStorage.
 */
export function setStoredPreviewDevice(deviceId: PreviewDeviceId): void {
  try {
    memoryStore[PREVIEW_DEVICE_STORAGE_KEY] = deviceId;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(PREVIEW_DEVICE_STORAGE_KEY, deviceId);
    }
  } catch {
    memoryStore[PREVIEW_DEVICE_STORAGE_KEY] = deviceId;
  }
}

/**
 * Récupère l'orientation choisie dans localStorage ou retourne portrait par défaut.
 */
export function getStoredPreviewOrientation(): PreviewOrientation {
  try {
    const stored = (
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(PREVIEW_ORIENTATION_STORAGE_KEY)
        : memoryStore[PREVIEW_ORIENTATION_STORAGE_KEY]
    ) as PreviewOrientation | null;

    if (stored === "portrait" || stored === "landscape") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "portrait";
}

/**
 * Enregistre l'orientation dans localStorage.
 */
export function setStoredPreviewOrientation(orientation: PreviewOrientation): void {
  try {
    memoryStore[PREVIEW_ORIENTATION_STORAGE_KEY] = orientation;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(PREVIEW_ORIENTATION_STORAGE_KEY, orientation);
    }
  } catch {
    memoryStore[PREVIEW_ORIENTATION_STORAGE_KEY] = orientation;
  }
}

/**
 * Calcule les dimensions effectives selon l'orientation choisie.
 */
export function getEffectiveDimensions(
  device: PreviewDeviceConfig,
  orientation: PreviewOrientation
): { width: number; height: number; isRotated: boolean } {
  if (device.type === "desktop") {
    return { width: device.width, height: device.height, isRotated: false };
  }
  if (orientation === "landscape") {
    return { width: device.height, height: device.width, isRotated: true };
  }
  return { width: device.width, height: device.height, isRotated: false };
}

/**
 * Ouvre l'URL dans une nouvelle fenêtre/onglet redimensionné à la taille exacte de l'appareil.
 */
export function openInNewWindowAtSize(
  url: string,
  width: number,
  height: number,
  title?: string
): Window | null {
  if (typeof window === "undefined") return null;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes`;
  return window.open(url, title || "_blank", features);
}

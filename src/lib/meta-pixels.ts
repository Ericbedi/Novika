import { createHash } from "crypto";

// Prompt 05-Px : Jusqu'à 3 pixels Facebook (Meta) par boutique
// Sécurité : Validation stricte 15-16 chiffres, non-doublons, isolation multi-boutique,
// masquage du jeton CAPI, audit log et conformité vie privée (hachage SHA-256).

export interface ShopPixel {
  id: string;
  storeSlug: string;
  name: string;
  pixelId: string; // 15 à 16 chiffres uniquement
  isActive: boolean;
  applyToAllProducts: boolean;
  productIds: string[];
  capiEnabled: boolean;
  capiToken?: string; // Jamais renvoyé en clair au navigateur
  capiTokenSaved?: boolean;
  capiTrigger: "on_order" | "on_delivery";
  testEventCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePixelSettings {
  storeSlug: string;
  orderEventToSend: "Purchase" | "Lead"; // Par défaut "Purchase"
}

export interface PixelAuditLog {
  id: string;
  storeSlug: string;
  action: "create" | "update" | "delete" | "toggle_active";
  pixelId: string;
  pixelName: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

// Validation de l'ID du Pixel Meta : uniquement des chiffres, 15 à 16 caractères
export function validatePixelId(pixelId: string): { isValid: boolean; error?: string } {
  const clean = pixelId.trim();
  if (!clean) {
    return { isValid: false, error: "L'identifiant du pixel est requis." };
  }
  if (!/^\d+$/.test(clean)) {
    return {
      isValid: false,
      error: "L'identifiant du pixel ne doit contenir que des chiffres (aucun espace ni lettre).",
    };
  }
  if (clean.length < 15 || clean.length > 16) {
    return {
      isValid: false,
      error: "L'identifiant du pixel Meta doit comporter exactement 15 ou 16 chiffres.",
    };
  }
  return { isValid: true };
}

// Vérification de la limite de 3 pixels et des doublons
export function canAddPixel(
  existingPixels: ShopPixel[],
  newPixelId: string,
  ignorePixelInternalId?: string
): { allowed: boolean; error?: string } {
  const otherPixels = ignorePixelInternalId
    ? existingPixels.filter((p) => p.id !== ignorePixelInternalId)
    : existingPixels;

  if (otherPixels.length >= 3) {
    return {
      allowed: false,
      error: "Maximum 3 pixels par boutique atteint. Supprimez un pixel existant pour en ajouter un nouveau.",
    };
  }

  const isDuplicate = otherPixels.some((p) => p.pixelId === newPixelId.trim());
  if (isDuplicate) {
    return {
      allowed: false,
      error: "Cet identifiant de pixel est déjà configuré sur cette boutique. Les doublons sont refusés.",
    };
  }

  return { allowed: true };
}

// Hachage normalisé SHA-256 pour les données de correspondance avancée CAPI (Meta Advanced Matching)
export function hashUserData(value: string, type: "email" | "phone" | "text" = "text"): string {
  if (!value) return "";
  let normalized = value.trim().toLowerCase();

  if (type === "phone") {
    // Normalisation téléphone : supprimer tous les espaces, tirets et le + initial
    normalized = normalized.replace(/\D/g, "");
  }

  return createHash("sha256").update(normalized).digest("hex");
}

// Données initiales par boutique pour la démonstration et les tests
const INITIAL_PIXELS: Record<string, ShopPixel[]> = {
  "lome-glow": [
    {
      id: "pix_tg_01",
      storeSlug: "lome-glow",
      name: "Pixel Togo – Montres & Santé",
      pixelId: "109283746501928",
      isActive: true,
      applyToAllProducts: true,
      productIds: [],
      capiEnabled: true,
      capiToken: "EAAG...mockEncryptedSecretTokenLome01",
      capiTokenSaved: true,
      capiTrigger: "on_order",
      testEventCode: "TEST98231",
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-15T08:30:00.000Z",
    },
    {
      id: "pix_tg_02",
      storeSlug: "lome-glow",
      name: "Pixel Retargeting Beauté",
      pixelId: "982341098456123",
      isActive: true,
      applyToAllProducts: false,
      productIds: ["prod_02"],
      capiEnabled: false,
      capiTokenSaved: false,
      capiTrigger: "on_delivery",
      createdAt: "2026-11-05T14:20:00.000Z",
      updatedAt: "2026-11-12T16:45:00.000Z",
    },
  ],
  "abidjan-bio": [
    {
      id: "pix_ci_01",
      storeSlug: "abidjan-bio",
      name: "Pixel Abidjan BioSanté",
      pixelId: "450192837465019",
      isActive: true,
      applyToAllProducts: true,
      productIds: [],
      capiEnabled: true,
      capiToken: "EAAG...mockEncryptedSecretTokenAbidjan01",
      capiTokenSaved: true,
      capiTrigger: "on_order",
      testEventCode: "TEST_ABJ_44",
      createdAt: "2026-11-08T09:15:00.000Z",
      updatedAt: "2026-11-14T11:00:00.000Z",
    },
  ],
};

// Réglages globaux par boutique
const INITIAL_SETTINGS: Record<string, StorePixelSettings> = {
  "lome-glow": {
    storeSlug: "lome-glow",
    orderEventToSend: "Purchase",
  },
  "abidjan-bio": {
    storeSlug: "abidjan-bio",
    orderEventToSend: "Purchase",
  },
};

// Journal d'audit en mémoire
const AUDIT_LOGS: PixelAuditLog[] = [
  {
    id: "aud_01",
    storeSlug: "lome-glow",
    action: "create",
    pixelId: "109283746501928",
    pixelName: "Pixel Togo – Montres & Santé",
    performedBy: "promises@afribuilder.com (Admin)",
    timestamp: "2026-11-01T10:00:00.000Z",
    details: "Création initiale avec API de conversions",
  },
];

// Magasin en mémoire (thread-safe en Node / Next API)
class MetaPixelsStore {
  private pixels: Record<string, ShopPixel[]> = { ...INITIAL_PIXELS };
  private settings: Record<string, StorePixelSettings> = { ...INITIAL_SETTINGS };
  private auditLogs: PixelAuditLog[] = [...AUDIT_LOGS];

  getPixels(storeSlug: string, maskSecret: boolean = true): ShopPixel[] {
    const list = this.pixels[storeSlug] || [];
    if (!maskSecret) return list;
    // Règle de sécurité : Le jeton CAPI n'est JAMAIS renvoyé au client
    return list.map((p) => ({
      ...p,
      capiToken: undefined,
      capiTokenSaved: Boolean(p.capiToken && p.capiToken.length > 0),
    }));
  }

  getSettings(storeSlug: string): StorePixelSettings {
    return this.settings[storeSlug] || { storeSlug, orderEventToSend: "Purchase" };
  }

  updateSettings(storeSlug: string, orderEventToSend: "Purchase" | "Lead"): StorePixelSettings {
    const s = { storeSlug, orderEventToSend };
    this.settings[storeSlug] = s;
    return s;
  }

  addPixel(storeSlug: string, data: Omit<ShopPixel, "id" | "storeSlug" | "createdAt" | "updatedAt">, performedBy: string = "Admin"): { success: boolean; pixel?: ShopPixel; error?: string } {
    const current = this.pixels[storeSlug] || [];
    const check = canAddPixel(current, data.pixelId);
    if (!check.allowed) {
      return { success: false, error: check.error };
    }

    const val = validatePixelId(data.pixelId);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    const newPixel: ShopPixel = {
      ...data,
      id: `pix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      storeSlug,
      capiTokenSaved: Boolean(data.capiToken && data.capiToken.trim().length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.pixels[storeSlug]) {
      this.pixels[storeSlug] = [];
    }
    this.pixels[storeSlug].push(newPixel);

    // Audit log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      storeSlug,
      action: "create",
      pixelId: newPixel.pixelId,
      pixelName: newPixel.name,
      performedBy,
      timestamp: new Date().toISOString(),
      details: `Ajout d'un pixel (${newPixel.applyToAllProducts ? "Tous les produits" : `${newPixel.productIds.length} produits`})`,
    });

    return {
      success: true,
      pixel: {
        ...newPixel,
        capiToken: undefined,
      },
    };
  }

  updatePixel(storeSlug: string, pixelIdInternal: string, updates: Partial<ShopPixel>, performedBy: string = "Admin"): { success: boolean; pixel?: ShopPixel; error?: string } {
    const current = this.pixels[storeSlug] || [];
    const idx = current.findIndex((p) => p.id === pixelIdInternal);
    if (idx === -1) {
      return { success: false, error: "Pixel introuvable." };
    }

    if (updates.pixelId) {
      const val = validatePixelId(updates.pixelId);
      if (!val.isValid) {
        return { success: false, error: val.error };
      }
      const check = canAddPixel(current, updates.pixelId, pixelIdInternal);
      if (!check.allowed) {
        return { success: false, error: check.error };
      }
    }

    const existing = current[idx];
    const updated: ShopPixel = {
      ...existing,
      ...updates,
      capiToken: updates.capiToken !== undefined ? (updates.capiToken || existing.capiToken) : existing.capiToken,
      capiTokenSaved: updates.capiToken !== undefined ? Boolean(updates.capiToken && updates.capiToken.length > 0) : existing.capiTokenSaved,
      updatedAt: new Date().toISOString(),
    };

    current[idx] = updated;

    // Audit log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      storeSlug,
      action: updates.isActive !== undefined && Object.keys(updates).length === 1 ? "toggle_active" : "update",
      pixelId: updated.pixelId,
      pixelName: updated.name,
      performedBy,
      timestamp: new Date().toISOString(),
      details: `Mise à jour (Actif: ${updated.isActive})`,
    });

    return {
      success: true,
      pixel: {
        ...updated,
        capiToken: undefined,
      },
    };
  }

  deletePixel(storeSlug: string, pixelIdInternal: string, performedBy: string = "Admin"): { success: boolean; error?: string } {
    const current = this.pixels[storeSlug] || [];
    const target = current.find((p) => p.id === pixelIdInternal);
    if (!target) {
      return { success: false, error: "Pixel introuvable." };
    }

    this.pixels[storeSlug] = current.filter((p) => p.id !== pixelIdInternal);

    // Audit log
    this.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      storeSlug,
      action: "delete",
      pixelId: target.pixelId,
      pixelName: target.name,
      performedBy,
      timestamp: new Date().toISOString(),
      details: "Suppression définitive du pixel",
    });

    return { success: true };
  }

  getAuditLogs(storeSlug: string): PixelAuditLog[] {
    return this.auditLogs.filter((a) => a.storeSlug === storeSlug);
  }
}

export const metaPixelsStore = new MetaPixelsStore();

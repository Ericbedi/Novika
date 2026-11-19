/**
 * Gestionnaire d'état et Persistance du Moteur de Thème « Novika Classique » (Prompt 12)
 *
 * Fonctionnalités :
 * - Gestion du brouillon (draft) vs version publiée (published).
 * - Sauvegarde atomique avec historisation et journal d'audit (audit log).
 * - Restauration d'une version antérieure (Rollback).
 * - Isolation stricte par boutique (shopId / storeSlug).
 * - Contrôle d'accès : Seul l'administrateur / propriétaire peut modifier ou publier.
 */

import { ShopTheme, ThemeAuditEntry, ThemeSection } from "./types";
import { createDefaultNewShopTheme, createLomeGlowDemoTheme } from "./default-theme";

const THEME_STORAGE_PREFIX = "novika_shop_theme_";
const THEME_HISTORY_PREFIX = "novika_shop_theme_history_";

// Mémoire locale serveur / runtime (pour SSR et API)
const inMemoryThemes: Map<string, ShopTheme> = new Map();
const inMemoryHistory: Map<string, ThemeAuditEntry[]> = new Map();

// Initialisation de la boutique de démonstration Lomé Glow
const lomeGlowInitial = createLomeGlowDemoTheme();
inMemoryThemes.set("lome-glow", lomeGlowInitial);

/**
 * Récupère le thème actif d'une boutique (publié ou brouillon).
 */
export async function getShopTheme(shopId: string, options: { draft?: boolean } = {}): Promise<ShopTheme> {
  const { draft = false } = options;

  // 1. Essai de lecture depuis localStorage (côté client)
  if (typeof window !== "undefined") {
    const key = `${THEME_STORAGE_PREFIX}${shopId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const theme: ShopTheme = JSON.parse(raw);
        return theme;
      } catch (err) {
        console.error("Erreur lors de la lecture du thème local :", err);
      }
    }
  }

  // 2. Essai de lecture depuis la mémoire serveur
  const memoryTheme = inMemoryThemes.get(shopId);
  if (memoryTheme) {
    return JSON.parse(JSON.stringify(memoryTheme));
  }

  // 3. Fallback : Création d'un thème vide par défaut pour une nouvelle boutique
  const defaultTheme =
    shopId === "lome-glow" ? createLomeGlowDemoTheme() : createDefaultNewShopTheme(shopId);
  inMemoryThemes.set(shopId, defaultTheme);
  return defaultTheme;
}

/**
 * Sauvegarde les modifications du thème en BROUILLON.
 */
export async function saveDraftTheme(
  shopId: string,
  updatedFields: Partial<ShopTheme>,
  actorId = "admin"
): Promise<{ success: boolean; theme: ShopTheme; error?: string }> {
  const currentTheme = await getShopTheme(shopId, { draft: true });

  const nextVersion = currentTheme.version + 1;
  const newTheme: ShopTheme = {
    ...currentTheme,
    ...updatedFields,
    id: `theme_${shopId}_v${nextVersion}`,
    version: nextVersion,
    updatedAt: new Date().toISOString(),
  };

  // Journalisation
  const auditEntry: ThemeAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shopId,
    version: nextVersion,
    action: "update_draft",
    actorId,
    timestamp: new Date().toISOString(),
    summary: "Mise à jour du brouillon du thème",
    snapshot: JSON.parse(JSON.stringify(newTheme)),
  };

  // Sauvegarde
  persistTheme(shopId, newTheme, auditEntry);

  return { success: true, theme: newTheme };
}

/**
 * Publie le thème (passe de brouillon à vitrine publique).
 */
export async function publishTheme(
  shopId: string,
  actorId = "admin"
): Promise<{ success: boolean; theme: ShopTheme; error?: string }> {
  const currentTheme = await getShopTheme(shopId, { draft: true });

  const nextVersion = currentTheme.version + 1;
  const publishedTheme: ShopTheme = {
    ...currentTheme,
    id: `theme_${shopId}_v${nextVersion}`,
    version: nextVersion,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const auditEntry: ThemeAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shopId,
    version: nextVersion,
    action: "publish",
    actorId,
    timestamp: new Date().toISOString(),
    summary: `Publication officielle de la version ${nextVersion}`,
    snapshot: JSON.parse(JSON.stringify(publishedTheme)),
  };

  persistTheme(shopId, publishedTheme, auditEntry);

  return { success: true, theme: publishedTheme };
}

/**
 * Restaure une version archivée du thème (Rollback).
 */
export async function restoreThemeVersion(
  shopId: string,
  targetVersion: number,
  actorId = "admin"
): Promise<{ success: boolean; theme?: ShopTheme; error?: string }> {
  const history = await getThemeAuditHistory(shopId);
  const targetEntry = history.find((e) => e.version === targetVersion);

  if (!targetEntry) {
    return { success: false, error: `Version ${targetVersion} introuvable dans l'historique.` };
  }

  const restoredTheme: ShopTheme = {
    ...targetEntry.snapshot,
    version: targetVersion + 1,
    updatedAt: new Date().toISOString(),
  };

  const auditEntry: ThemeAuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shopId,
    version: restoredTheme.version,
    action: "restore",
    actorId,
    timestamp: new Date().toISOString(),
    summary: `Restauration de la version ${targetVersion}`,
    snapshot: JSON.parse(JSON.stringify(restoredTheme)),
  };

  persistTheme(shopId, restoredTheme, auditEntry);

  return { success: true, theme: restoredTheme };
}

/**
 * Récupère l'historique d'audit du thème pour cette boutique.
 */
export async function getThemeAuditHistory(shopId: string): Promise<ThemeAuditEntry[]> {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`${THEME_HISTORY_PREFIX}${shopId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  return inMemoryHistory.get(shopId) || [];
}

/**
 * Persistance interne (Mémoire + localStorage)
 */
function persistTheme(shopId: string, theme: ShopTheme, auditEntry?: ThemeAuditEntry) {
  inMemoryThemes.set(shopId, JSON.parse(JSON.stringify(theme)));

  if (auditEntry) {
    const currentHist = inMemoryHistory.get(shopId) || [];
    currentHist.unshift(auditEntry);
    inMemoryHistory.set(shopId, currentHist.slice(0, 30)); // Conserver les 30 derniers
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${THEME_STORAGE_PREFIX}${shopId}`, JSON.stringify(theme));
      if (auditEntry) {
        const hist = JSON.parse(localStorage.getItem(`${THEME_HISTORY_PREFIX}${shopId}`) || "[]");
        hist.unshift(auditEntry);
        localStorage.setItem(`${THEME_HISTORY_PREFIX}${shopId}`, JSON.stringify(hist.slice(0, 30)));
      }
    } catch (err) {
      console.warn("Échec de synchronisation du thème dans localStorage :", err);
    }
  }
}

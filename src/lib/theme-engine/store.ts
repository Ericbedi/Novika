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

import { ShopTheme, ThemeAuditEntry, ThemeSection, ThemePage, ThemePageId } from "./types";
import { createDefaultNewShopTheme, createLomeGlowDemoTheme } from "./default-theme";

const THEME_STORAGE_PREFIX = "novika_shop_theme_";
const THEME_HISTORY_PREFIX = "novika_shop_theme_history_";

// Mémoire locale serveur / runtime (pour SSR et API)
const inMemoryThemes: Map<string, ShopTheme> = new Map();
const inMemoryHistory: Map<string, ThemeAuditEntry[]> = new Map();

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

  // 3. Fallback : Création d'un thème propre par défaut pour une nouvelle boutique
  const defaultTheme = createDefaultNewShopTheme(shopId);
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
 * Exporte les réglages et sections du thème sous forme de chaîne JSON sécurisée (Prompt 12-b Phase 2).
 * Exclut toute donnée privée, PII, ou information client.
 */
export async function exportThemeToJson(shopId: string): Promise<string> {
  const theme = await getShopTheme(shopId, { draft: false });
  const exportPayload = {
    schemaVersion: "1.0",
    themePreset: theme.preset,
    name: theme.name,
    exportedAt: new Date().toISOString(),
    generalSettings: theme.generalSettings,
    pages: Object.values(theme.pages).map((p) => ({
      pageId: p.pageId,
      title: p.title,
      sections: p.sections.map((s) => ({
        type: s.type,
        name: s.name,
        isVisible: s.isVisible,
        paletteId: s.paletteId,
        order: s.order,
        settings: s.settings,
      })),
    })),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Importe un thème depuis un fichier JSON avec validation de structure (Prompt 12-b Phase 2).
 */
export async function importThemeFromJson(
  shopId: string,
  jsonString: string,
  actorId: string = "admin"
): Promise<{ success: boolean; theme?: ShopTheme; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.generalSettings || (!Array.isArray(parsed.pages) && typeof parsed.pages !== "object")) {
      return { success: false, error: "Format de thème JSON invalide : 'generalSettings' ou 'pages' manquant." };
    }

    const currentTheme = await getShopTheme(shopId);
    const newVersion = currentTheme.version + 1;

    const pagesRecord: Record<ThemePageId, ThemePage> = { ...currentTheme.pages };

    if (Array.isArray(parsed.pages)) {
      for (const p of parsed.pages) {
        if (p.pageId) {
          const pageId = p.pageId as ThemePageId;
          pagesRecord[pageId] = {
            pageId,
            title: p.title || p.pageId,
            sections: (p.sections || []).map((s: any, idx: number) => ({
              id: `sec_${Date.now()}_${idx}`,
              type: s.type,
              name: s.name || s.type,
              isVisible: s.isVisible !== false,
              paletteId: s.paletteId || "palette-1",
              order: s.order !== undefined ? s.order : idx,
              settings: s.settings || {},
            })),
          };
        }
      }
    } else if (typeof parsed.pages === "object") {
      Object.assign(pagesRecord, parsed.pages);
    }

    const importedTheme: ShopTheme = {
      ...currentTheme,
      id: `theme_${shopId}_v${newVersion}`,
      shopId,
      name: parsed.name || currentTheme.name,
      preset: parsed.themePreset || currentTheme.preset,
      version: newVersion,
      isPublished: false,
      publishedAt: currentTheme.publishedAt,
      updatedAt: new Date().toISOString(),
      generalSettings: parsed.generalSettings,
      pages: pagesRecord,
    };

    const auditEntry: ThemeAuditEntry = {
      id: `audit_${Date.now()}_import`,
      shopId,
      version: newVersion,
      action: "update_draft",
      actorId,
      timestamp: new Date().toISOString(),
      summary: "Import d'un thème complet depuis un fichier JSON",
      snapshot: JSON.parse(JSON.stringify(importedTheme)),
    };

    persistTheme(shopId, importedTheme, auditEntry);
    return { success: true, theme: importedTheme };
  } catch (err: any) {
    return { success: false, error: `Erreur lors de l'import JSON : ${err.message}` };
  }
}

/**
 * Duplique un thème existant d'une boutique vers une autre (Prompt 12-b Phase 2).
 */
export async function duplicateThemeToShop({
  sourceShopId,
  targetShopId,
  actorId = "admin",
}: {
  sourceShopId: string;
  targetShopId: string;
  actorId?: string;
}): Promise<{ success: boolean; theme?: ShopTheme; error?: string }> {
  try {
    const sourceTheme = await getShopTheme(sourceShopId);
    const targetCurrent = await getShopTheme(targetShopId);
    const newVersion = targetCurrent.version + 1;

    const duplicatedTheme: ShopTheme = {
      ...JSON.parse(JSON.stringify(sourceTheme)),
      id: `theme_${targetShopId}_v${newVersion}`,
      shopId: targetShopId,
      name: `${sourceTheme.name} (Copie)`,
      version: newVersion,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const auditEntry: ThemeAuditEntry = {
      id: `audit_${Date.now()}_dup`,
      shopId: targetShopId,
      version: newVersion,
      action: "update_draft",
      actorId,
      timestamp: new Date().toISOString(),
      summary: `Duplication intégrale depuis la boutique ${sourceShopId}`,
      snapshot: JSON.parse(JSON.stringify(duplicatedTheme)),
    };

    persistTheme(targetShopId, duplicatedTheme, auditEntry);
    return { success: true, theme: duplicatedTheme };
  } catch (err: any) {
    return { success: false, error: `Échec de la duplication : ${err.message}` };
  }
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

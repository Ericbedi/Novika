/**
 * Magasin de données et logique métier pour la gestion et modification des boutiques (Prompt 05-M).
 *
 * RÈGLES DE SÉCURITÉ & D'INTÉGRITÉ :
 * - Permissions strictes via src/config/permissions.ts (Refus par défaut).
 * - Verrouillage strict du pays et de la devise si orderCount > 0.
 * - Validation du slug (3-40 car, minuscules/chiffres/tirets, unique) avec redirection 301 conservée 90 jours.
 * - Suppression réservée au propriétaire avec confirmation par saisie exacte du nom de la boutique.
 * - Protection contre les modifications simultanées (verrouillage optimiste via version).
 * - Journal d'audit complet de chaque modification.
 */

import { UserRole } from "./types";
import {
  canEditStore,
  canChangeStoreSlug,
  canDeleteStore,
  canChangeStoreCountry,
} from "@/config/permissions";
import { getCountryByCode } from "@/config/countries";

export interface StoreRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  country: string; // ISO 3166-1 alpha-2
  countryName: string;
  flag: string;
  currency: string;
  whatsappNumber: string;
  contactEmail: string;
  logo?: string;
  role: UserRole;
  status: "active" | "archived" | "pending_deletion";
  orderCount: number;
  productCount: number;
  deletionDate?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlugRedirectRecord {
  oldSlug: string;
  newSlug: string;
  storeId: string;
  createdAt: string;
  expiresAt: string; // 90 jours
}

export interface StoreAuditLogEntry {
  id: string;
  storeId: string;
  userId: string;
  userRole: UserRole;
  timestamp: string;
  changes: { field: string; oldValue: unknown; newValue: unknown }[];
}

// Magasin en mémoire (simulant PostgreSQL / Supabase)
const STORES_STORE: Map<string, StoreRecord> = new Map();
const SLUG_REDIRECTS_STORE: Map<string, SlugRedirectRecord> = new Map();
const STORE_AUDIT_LOGS: StoreAuditLogEntry[] = [];

/**
 * Initialisation des données : Aucune boutique de démonstration injectée au démarrage.
 * Seules les boutiques réelles créées par l'utilisateur sont enregistrées.
 */
function seedInitialStores() {
  // Démarrage propre avec zéro boutique de démonstration
}

seedInitialStores();

/**
 * Récupère la liste de toutes les boutiques
 */
export function registerStore(store: StoreRecord): void {
  STORES_STORE.set(store.id, store);
}

export function getAllStores(): StoreRecord[] {
  return Array.from(STORES_STORE.values());
}

/**
 * Recherche une boutique par son identifiant
 */
export function getStoreById(id: string): StoreRecord | undefined {
  return STORES_STORE.get(id);
}

/**
 * Recherche une boutique par son slug
 */
export function getStoreBySlug(slug: string): StoreRecord | undefined {
  const clean = slug.toLowerCase().trim();
  for (const store of STORES_STORE.values()) {
    if (store.slug.toLowerCase() === clean) {
      return store;
    }
  }
  return undefined;
}

/**
 * Vérifie si un slug est disponible (Prompt 05-M # Slug 3-40 car, unique)
 */
export function isSlugAvailable(slug: string, currentStoreId?: string): boolean {
  const clean = slug.toLowerCase().trim();
  // Format : 3 à 40 caractères, minuscules, chiffres et tirets
  if (!/^[a-z0-9-]{3,40}$/.test(clean)) {
    return false;
  }

  for (const store of STORES_STORE.values()) {
    if (store.slug.toLowerCase() === clean && store.id !== currentStoreId) {
      return false;
    }
  }
  return true;
}

/**
 * Redirection 301 conservée pendant 90 jours (Prompt 05-M)
 */
export function addSlugRedirect(oldSlug: string, newSlug: string, storeId: string): SlugRedirectRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const record: SlugRedirectRecord = {
    oldSlug: oldSlug.toLowerCase().trim(),
    newSlug: newSlug.toLowerCase().trim(),
    storeId,
    createdAt: now.toISOString(),
    expiresAt,
  };
  SLUG_REDIRECTS_STORE.set(record.oldSlug, record);
  return record;
}

/**
 * Récupère une éventuelle redirection 301 active pour un ancien slug
 */
export function getSlugRedirect(slug: string): SlugRedirectRecord | null {
  const record = SLUG_REDIRECTS_STORE.get(slug.toLowerCase().trim());
  if (!record) return null;
  // Vérifie si les 90 jours sont expirés
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    SLUG_REDIRECTS_STORE.delete(slug);
    return null;
  }
  return record;
}

/**
 * Modifie une boutique avec toutes les règles de sécurité du Prompt 05-M
 */
export function updateStore(params: {
  storeId: string;
  userRole: UserRole;
  userId: string;
  updates: Partial<StoreRecord>;
  clientVersion?: number;
}): { success: boolean; error?: string; store?: StoreRecord; redirectCreated?: boolean } {
  const { storeId, userRole, userId, updates, clientVersion } = params;

  // 1. Contrôle des permissions (src/config/permissions.ts)
  if (!canEditStore(userRole)) {
    return {
      success: false,
      error: "Accès refusé : Votre rôle ne vous autorise pas à modifier les paramètres de la boutique.",
    };
  }

  const store = STORES_STORE.get(storeId);
  if (!store) {
    return { success: false, error: "Boutique introuvable" };
  }

  // 2. Protection contre les modifications simultanées (Verrouillage optimiste)
  if (clientVersion !== undefined && clientVersion < store.version) {
    return {
      success: false,
      error: "Cette boutique a été modifiée par quelqu'un d'autre, rechargez la page.",
    };
  }

  // 3. Verrouillage strict du pays et de la devise si orderCount > 0
  if (updates.country && updates.country !== store.country) {
    if (!canChangeStoreCountry(userRole, store.orderCount)) {
      return {
        success: false,
        error: `Le pays et la devise ne peuvent pas être modifiés car cette boutique possède déjà ${store.orderCount} commandes. Pour vendre dans un autre pays, dupliquez la boutique.`,
      };
    }
  }

  // 4. Validation du Slug
  let redirectCreated = false;
  if (updates.slug && updates.slug !== store.slug) {
    // Seul le propriétaire peut modifier le slug
    if (!canChangeStoreSlug(userRole)) {
      return {
        success: false,
        error: "Accès refusé : Seul l'administrateur propriétaire peut modifier le lien (slug) de la boutique.",
      };
    }

    const cleanSlug = updates.slug.toLowerCase().trim();
    if (!/^[a-z0-9-]{3,40}$/.test(cleanSlug)) {
      return {
        success: false,
        error: "Le lien de la boutique (slug) doit contenir entre 3 et 40 caractères minuscules, chiffres ou tirets.",
      };
    }

    if (!isSlugAvailable(cleanSlug, storeId)) {
      return {
        success: false,
        error: `Le slug "${cleanSlug}" est déjà utilisé par une autre boutique. Veuillez en choisir un autre.`,
      };
    }

    // Création de la redirection 301 pour 90 jours
    addSlugRedirect(store.slug, cleanSlug, storeId);
    redirectCreated = true;
  }

  // 5. Validation du numéro WhatsApp
  if (updates.whatsappNumber) {
    const cleanPhone = updates.whatsappNumber.replace(/\s+/g, "");
    if (!/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
      return {
        success: false,
        error: "Numéro WhatsApp invalide. Le numéro doit être au format international E.164 (ex: +22890123456).",
      };
    }
  }

  // 6. Application des modifications et traçabilité (Journal d'audit)
  const auditChanges: { field: string; oldValue: unknown; newValue: unknown }[] = [];

  // Si pays changé (autorisé uniquement si 0 commande)
  if (updates.country && updates.country !== store.country) {
    const countryConfig = getCountryByCode(updates.country);
    if (countryConfig) {
      auditChanges.push({
        field: "country",
        oldValue: store.country,
        newValue: countryConfig.code,
      });
      store.country = countryConfig.code;
      store.countryName = countryConfig.name;
      store.currency = countryConfig.currency;
    }
  }

  const allowedFields: (keyof StoreRecord)[] = [
    "name",
    "description",
    "logo",
    "slug",
    "whatsappNumber",
    "contactEmail",
    "status",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined && updates[field] !== store[field]) {
      auditChanges.push({
        field,
        oldValue: store[field],
        newValue: updates[field],
      });
      (store as unknown as Record<string, unknown>)[field] = updates[field];
    }
  }

  // Incrément de version et mise à jour de date
  store.version += 1;
  store.updatedAt = new Date().toISOString();

  // Enregistrement au journal d'audit
  if (auditChanges.length > 0) {
    STORE_AUDIT_LOGS.unshift({
      id: `aud_store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      storeId,
      userId,
      userRole,
      timestamp: new Date().toISOString(),
      changes: auditChanges,
    });
  }

  return {
    success: true,
    store,
    redirectCreated,
  };
}

/**
 * Suppression sécurisée d'une boutique (Prompt 05-M # Suppression)
 */
export function deleteStore(params: {
  storeId: string;
  userRole: UserRole;
  confirmName: string;
}): { success: boolean; error?: string } {
  const { storeId, userRole, confirmName } = params;

  // 1. Réservé exclusivement à l'admin propriétaire
  if (!canDeleteStore(userRole)) {
    return {
      success: false,
      error: "Accès refusé : Seul l'administrateur propriétaire (owner) peut supprimer une boutique.",
    };
  }

  const store = STORES_STORE.get(storeId);
  if (!store) {
    return { success: false, error: "Boutique introuvable" };
  }

  // 2. Confirmation obligatoire par saisie du nom exact de la boutique
  if (confirmName.trim().toLowerCase() !== store.name.trim().toLowerCase()) {
    return {
      success: false,
      error: `Nom de confirmation incorrect. Vous devez taper exactement "${store.name}" pour confirmer.`,
    };
  }

  // 3. Règle absolue si la boutique possède des commandes :
  // Déplacer vers l'état 'pending_deletion' avec délai de grâce de 30 jours au lieu d'une purge immédiate
  if (store.orderCount > 0) {
    store.status = "pending_deletion";
    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");
    store.deletionDate = deletionDate;
    store.version += 1;
    store.updatedAt = new Date().toISOString();

    return {
      success: true,
    };
  }

  // Si 0 commande, suppression définitive immédiate
  STORES_STORE.delete(storeId);
  return { success: true };
}

/**
 * Récupère le journal d'audit des modifications d'une boutique
 */
export function getStoreAuditLogs(storeId: string): StoreAuditLogEntry[] {
  return STORE_AUDIT_LOGS.filter((l) => l.storeId === storeId);
}

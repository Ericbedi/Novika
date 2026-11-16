/**
 * Table et magasin de données pour l'éligibilité des pays par boutique (`shop_countries`).
 * Conforme à Prompt 05-P :
 * - Table `shop_countries` : shop_id, country_code, enabled, updated_by, updated_at
 * - RLS / Contrôle serveur : écriture réservée à l'admin propriétaire (owner)
 * - Règle stricte : au moins un pays doit rester activé pour chaque boutique
 */

import { UserRole } from "./types";
import { canManageShopCountries } from "@/config/permissions";
import {
  ALL_54_AFRICAN_COUNTRIES,
  AfricanCountryConfig,
  getCountryByCode,
  getSortedAfricanCountries,
} from "@/config/countries";

export interface ShopCountryRecord {
  shopId: string;
  countryCode: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt: string;
}

// Magasin en mémoire partagé (simulant la table PostgreSQL Supabase shop_countries)
const SHOP_COUNTRIES_STORE: Map<string, Map<string, ShopCountryRecord>> = new Map();

/**
 * Initialise les pays pour une boutique donnée si non configurée.
 * Par défaut, les marchés francophones d'Afrique de l'Ouest et Centrale principaux sont activés.
 */
function initShopCountries(shopId: string): Map<string, ShopCountryRecord> {
  const defaultEnabled = new Set(["TG", "CI", "BJ", "SN", "BF", "ML", "CM"]);
  const map = new Map<string, ShopCountryRecord>();
  const now = new Date().toISOString();

  for (const country of ALL_54_AFRICAN_COUNTRIES) {
    map.set(country.code, {
      shopId,
      countryCode: country.code,
      enabled: defaultEnabled.has(country.code),
      updatedBy: "system_init",
      updatedAt: now,
    });
  }

  SHOP_COUNTRIES_STORE.set(shopId, map);
  return map;
}

/**
 * Récupère tous les enregistrements `shop_countries` pour une boutique
 */
export function getShopCountries(shopId: string): ShopCountryRecord[] {
  let map = SHOP_COUNTRIES_STORE.get(shopId);
  if (!map) {
    map = initShopCountries(shopId);
  }
  return Array.from(map.values());
}

/**
 * Récupère uniquement la liste des pays activés pour une boutique, triés alphabétiquement (Intl.Collator)
 */
export function getEnabledCountriesForShop(shopId: string): AfricanCountryConfig[] {
  const records = getShopCountries(shopId);
  const enabledCodes = new Set(records.filter((r) => r.enabled).map((r) => r.countryCode));
  const sorted = getSortedAfricanCountries();
  return sorted.filter((c) => enabledCodes.has(c.code));
}

/**
 * Vérifie si un pays donné est activé pour la boutique
 */
export function isCountryEnabledForShop(shopId: string, countryCode: string): boolean {
  const records = getShopCountries(shopId);
  const found = records.find((r) => r.countryCode === countryCode.toUpperCase());
  return found ? found.enabled : false;
}

/**
 * Modifie l'état d'activation d'un pays pour une boutique.
 * Applique strictement les règles de Prompt 05-P :
 * 1. Écriture réservée à l'administrateur propriétaire (owner)
 * 2. Au moins un pays doit rester activé (impossible de tout désactiver)
 */
export function updateShopCountryEligibility(
  shopId: string,
  countryCode: string,
  enabled: boolean,
  userRole: UserRole,
  userId: string = "user_current"
): { success: boolean; error?: string; record?: ShopCountryRecord } {
  // 1. RLS / Sécurité : Seul le propriétaire peut modifier l'éligibilité
  if (!canManageShopCountries(userRole)) {
    return {
      success: false,
      error: "Accès refusé : Seul l'administrateur propriétaire de la boutique peut modifier l'éligibilité des pays.",
    };
  }

  let map = SHOP_COUNTRIES_STORE.get(shopId);
  if (!map) {
    map = initShopCountries(shopId);
  }

  const codeUpper = countryCode.toUpperCase();
  const existing = map.get(codeUpper);

  if (!existing) {
    const validCountry = getCountryByCode(codeUpper);
    if (!validCountry) {
      return { success: false, error: `Code pays ISO invalide : ${countryCode}` };
    }
  }

  // 2. Règle absolue Prompt 05-P : Au moins un pays doit rester activé
  if (!enabled) {
    let activeCount = 0;
    for (const [c, r] of map.entries()) {
      if (c !== codeUpper && r.enabled) {
        activeCount++;
      }
    }
    if (activeCount === 0) {
      return {
        success: false,
        error: "Au moins un pays doit rester activé pour la boutique. Impossible de désactiver tous les pays.",
      };
    }
  }

  const updatedRecord: ShopCountryRecord = {
    shopId,
    countryCode: codeUpper,
    enabled,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  map.set(codeUpper, updatedRecord);

  return {
    success: true,
    record: updatedRecord,
  };
}

import { CURRENCY_MAP } from "@/mock-data/currencies";
import { ShopCurrencySettings } from "@/server/data/currency-types";

/**
 * Convertit un montant décimal saisi par l'utilisateur en entier de la plus petite unité.
 * Ex: 10 000 FCFA (0 décimale) -> 10000
 * Ex: 15.50 NGN (2 décimales) -> 1550 (kobos)
 * Ex: 12.350 TND (3 décimales) -> 12350 (millimes)
 */
export function toSmallestUnit(displayAmount: number, currencyCode: string): number {
  const info = CURRENCY_MAP[currencyCode] || { decimals: 0 };
  const factor = Math.pow(10, info.decimals);
  return Math.round(displayAmount * factor);
}

/**
 * Convertit un entier de la plus petite unité en montant décimal pour l'affichage.
 */
export function fromSmallestUnit(smallestUnitInteger: number, currencyCode: string): number {
  const info = CURRENCY_MAP[currencyCode] || { decimals: 0 };
  const factor = Math.pow(10, info.decimals);
  return smallestUnitInteger / factor;
}

/**
 * Formate un montant stocké en entier de la plus petite unité selon les normes locales :
 * Séparateur d'espace pour les milliers, décimales exactes selon ISO 4217, code devise.
 * Exemple XOF: 15000 -> "15 000 FCFA" (ou "15 000 XOF")
 * Exemple NGN: 1550 -> "15,50 ₦" (ou "15,50 NGN")
 * Exemple TND: 12350 -> "12,350 DT"
 */
export function formatMoneyInteger(
  smallestUnitInteger: number,
  currencyCode: string,
  options?: {
    useSymbol?: boolean;
    useCode?: boolean;
    locale?: string;
  }
): string {
  const info = CURRENCY_MAP[currencyCode] || {
    decimals: 0,
    symbol: currencyCode,
    code: currencyCode,
  };

  const amount = fromSmallestUnit(smallestUnitInteger, currencyCode);

  const formattedNumber = new Intl.NumberFormat(options?.locale || "fr-FR", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(amount);

  const currencyLabel = options?.useCode ? info.code : info.symbol;

  return `${formattedNumber} ${currencyLabel}`;
}

/**
 * Règle de verrouillage :
 * Une boutique ne peut plus changer sa devise principale dès lors qu'elle a enregistré sa 1ère commande.
 */
export function canChangeStoreCurrency(settings: ShopCurrencySettings): {
  allowed: boolean;
  reason?: string;
} {
  if (settings.hasOrders) {
    return {
      allowed: false,
      reason:
        "La devise principale est verrouillée car des commandes ont déjà été enregistrées dans cette devise. Modifier la devise corromprait l'historique comptable et les rapports de ventes.",
    };
  }
  return { allowed: true };
}

/**
 * Vérifie si deux devises sont interchangeables à parité 1:1 dans la Common Monetary Area (CMA).
 * Le Rand ZAR est accepté en Namibie (NAD), au Lesotho (LSL) et en Eswatini (SZL) à parité exacte 1:1.
 */
export function areCmaParityCurrencies(currA: string, currB: string): boolean {
  if (currA === currB) return true;
  const cmaCurrencies = ["ZAR", "NAD", "SZL", "LSL"];
  return cmaCurrencies.includes(currA) && cmaCurrencies.includes(currB);
}

/**
 * Consolidation organisationnelle : convertit un montant d'une devise vers la devise de l'organisation
 * en utilisant un taux de change entier scaled (multiplié par 1 000 000).
 */
export function convertMoneyScaled(
  amountSmallestUnit: number,
  rateScaled: number, // 1 000 000 = parité 1.0
  fromDecimals: number,
  toDecimals: number
): number {
  // Ajustement des puissances de 10 selon le différentiel de décimales
  const decimalAdjustment = Math.pow(10, toDecimals - fromDecimals);
  const converted = (BigInt(amountSmallestUnit) * BigInt(rateScaled)) / BigInt(1_000_000);
  return Number(converted) * decimalAdjustment;
}

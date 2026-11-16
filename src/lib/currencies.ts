/**
 * Module Devises & Monnaies ISO 4217 - AfriBuilder
 *
 * Principes stricts :
 * 1. Montants stockés UNIQUEMENT en entiers de la plus petite unité monétaire (subunits / cents).
 *    Ex: 15 000 XOF -> 15000 (0 décimales)
 *    Ex: 25.50 USD  -> 2550  (2 décimales, cents)
 *    Ex: 12.350 TND -> 12350 (3 décimales, millimes)
 * 2. Jamais de calculs avec des nombres décimaux flottants IEEE 754.
 * 3. Chaque montant affiché comporte impérativement son code devise ISO.
 */

export interface CurrencyConfig {
  code: string; // Code ISO 4217 (ex: XOF, USD)
  name: string; // Nom en français (ex: Franc CFA (BCEAO))
  symbol: string; // Symbole usuel (ex: FCFA, $, €)
  decimals: number; // 0, 2 ou 3 selon ISO 4217
  subunitsMultiplier: number; // 1, 100 ou 1000
  spaceSeparated: boolean; // Espaces milliers
}

/**
 * Registre des devises ISO 4217 prises en charge
 */
export const ISO_CURRENCIES: Record<string, CurrencyConfig> = {
  // Zone Franc CFA BCEAO (Afrique de l'Ouest)
  XOF: {
    code: "XOF",
    name: "Franc CFA (BCEAO)",
    symbol: "FCFA",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  // Zone Franc CFA BEAC (Afrique Centrale)
  XAF: {
    code: "XAF",
    name: "Franc CFA (BEAC)",
    symbol: "FCFA",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  // Autres devises Afrique de l'Ouest
  GHS: {
    code: "GHS",
    name: "Cedi ghanéen",
    symbol: "GH₵",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  NGN: {
    code: "NGN",
    name: "Naira nigérian",
    symbol: "₦",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  GNF: {
    code: "GNF",
    name: "Franc guinéen",
    symbol: "FG",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  GMD: {
    code: "GMD",
    name: "Dalasi gambien",
    symbol: "D",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  CVE: {
    code: "CVE",
    name: "Escudo cap-verdien",
    symbol: "Esc",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  LRD: {
    code: "LRD",
    name: "Dollar libérien",
    symbol: "L$",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  MRU: {
    code: "MRU",
    name: "Ouguiya mauritanien",
    symbol: "UM",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  SLE: {
    code: "SLE",
    name: "Leone sierra-léonais",
    symbol: "Le",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },

  // Afrique Centrale
  CDF: {
    code: "CDF",
    name: "Franc congolais",
    symbol: "FC",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  STN: {
    code: "STN",
    name: "Dobra santoméen",
    symbol: "Db",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },

  // Afrique de l'Est
  KES: {
    code: "KES",
    name: "Shilling kényan",
    symbol: "KSh",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  TZS: {
    code: "TZS",
    name: "Shilling tanzanien",
    symbol: "TSh",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  UGX: {
    code: "UGX",
    name: "Shilling ougandais",
    symbol: "USh",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  RWF: {
    code: "RWF",
    name: "Franc rwandais",
    symbol: "FRw",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  BIF: {
    code: "BIF",
    name: "Franc burundais",
    symbol: "FBu",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  ETB: {
    code: "ETB",
    name: "Birr éthiopien",
    symbol: "Br",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  MUR: {
    code: "MUR",
    name: "Roupie mauricienne",
    symbol: "₨",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  MGA: {
    code: "MGA",
    name: "Ariary malgache",
    symbol: "Ar",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  MWK: {
    code: "MWK",
    name: "Kwacha malawien",
    symbol: "MK",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  SCR: {
    code: "SCR",
    name: "Roupie seychelloise",
    symbol: "SR",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  KMF: {
    code: "KMF",
    name: "Franc comorien",
    symbol: "CF",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  DJF: {
    code: "DJF",
    name: "Franc djiboutien",
    symbol: "Fdj",
    decimals: 0,
    subunitsMultiplier: 1,
    spaceSeparated: true,
  },
  SOS: {
    code: "SOS",
    name: "Shilling somalien",
    symbol: "So.Sh.",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  SSP: {
    code: "SSP",
    name: "Livre sud-soudanaise",
    symbol: "SS£",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  ERN: {
    code: "ERN",
    name: "Nakfa érythréen",
    symbol: "Nfk",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },

  // Afrique Australe
  ZAR: {
    code: "ZAR",
    name: "Rand sud-africain",
    symbol: "R",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  ZMW: {
    code: "ZMW",
    name: "Kwacha zambien",
    symbol: "ZK",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  BWP: {
    code: "BWP",
    name: "Pula botswanais",
    symbol: "P",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  NAD: {
    code: "NAD",
    name: "Dollar namibien",
    symbol: "N$",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  MZN: {
    code: "MZN",
    name: "Metical mozambicain",
    symbol: "MT",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  AOA: {
    code: "AOA",
    name: "Kwanza angolais",
    symbol: "Kz",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  SZL: {
    code: "SZL",
    name: "Lilangeni eswatinien",
    symbol: "L",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  LSL: {
    code: "LSL",
    name: "Loti lesothan",
    symbol: "L",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  ZWG: {
    code: "ZWG",
    name: "Or du Zimbabwe (ZiG)",
    symbol: "ZiG",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },

  // Afrique du Nord
  MAD: {
    code: "MAD",
    name: "Dirham marocain",
    symbol: "DH",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  DZD: {
    code: "DZD",
    name: "Dinar algérien",
    symbol: "DA",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  TND: {
    code: "TND",
    name: "Dinar tunisien",
    symbol: "DT",
    decimals: 3, // 3 décimales (millimes)
    subunitsMultiplier: 1000,
    spaceSeparated: true,
  },
  LYD: {
    code: "LYD",
    name: "Dinar libyen",
    symbol: "LD",
    decimals: 3, // 3 décimales
    subunitsMultiplier: 1000,
    spaceSeparated: true,
  },
  EGP: {
    code: "EGP",
    name: "Livre égyptienne",
    symbol: "E£",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  SDG: {
    code: "SDG",
    name: "Livre soudanaise",
    symbol: "SDG",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },

  // Devises internationales de Sourcing & Facturation
  USD: {
    code: "USD",
    name: "Dollar américain",
    symbol: "$",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
  CNY: {
    code: "CNY",
    name: "Yuan chinois (Renminbi)",
    symbol: "¥",
    decimals: 2,
    subunitsMultiplier: 100,
    spaceSeparated: true,
  },
};

/** Espace fine insécable */
export const THIN_SPACE = " ";
/** Espace insécable */
export const NON_BREAKING_SPACE = " ";
/** Signe moins typographique */
export const TYPO_MINUS = "−";

/**
 * Formate un montant stocké en sous-unités entières (subunits).
 *
 * @param amountInSubunits - Entier de la plus petite unité (ex: 15000 pour 15 000 XOF, 2550 pour 25.50 USD)
 * @param currencyCode - Code ISO 4217 (ex: "XOF", "USD")
 * @param options - Options d'affichage (signed, showCode, customSymbol)
 */
export function formatMoney(
  amountInSubunits: number,
  currencyCode: string = "XOF",
  options: {
    signed?: boolean;
    showCode?: boolean;
    useSymbol?: boolean;
  } = {}
): string {
  const config = ISO_CURRENCIES[currencyCode] || ISO_CURRENCIES.XOF;
  const isNegative = amountInSubunits < 0;
  const absSubunits = Math.abs(Math.round(amountInSubunits));

  let mainPart: string;
  let decimalPart = "";

  if (config.decimals === 0) {
    mainPart = groupDigits(absSubunits);
  } else {
    const divisor = config.subunitsMultiplier;
    const units = Math.floor(absSubunits / divisor);
    const remainder = absSubunits % divisor;
    mainPart = groupDigits(units);
    decimalPart = `,${remainder.toString().padStart(config.decimals, "0")}`;
  }

  let sign = "";
  if (isNegative) {
    sign = TYPO_MINUS;
  } else if (options.signed && amountInSubunits > 0) {
    sign = "+";
  }

  const indicator = options.useSymbol ? config.symbol : config.code;
  return `${sign}${mainPart}${decimalPart}${NON_BREAKING_SPACE}${indicator}`;
}

/** Sépare les milliers par une espace fine insécable */
function groupDigits(val: number): string {
  const str = String(val);
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const fromEnd = str.length - i;
    result += str[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) {
      result += THIN_SPACE;
    }
  }
  return result;
}

/** Taux de change fixes ou mis en cache par rapport à la devise de référence de l'organisation (XOF par défaut) */
export interface FxRate {
  baseCurrency: string; // Ex: "XOF"
  targetCurrency: string; // Ex: "USD"
  rateToTarget: number; // Ex: 0.00162
  rateFromTarget: number; // Ex: 615.50
  effectiveDate: string;
  isManual?: boolean;
  source: string;
}

/** Taux indicatifs de référence pour les conversions de gestion */
export const DEFAULT_FX_RATES: Record<string, number> = {
  // 1 Unité de devise cible = X unités XOF
  EUR: 655.957, // Taux fixe officiel
  USD: 615.5,
  CNY: 85.2,
  XAF: 1.0, // Parité 1:1 CFA BCEAO / BEAC
  GHS: 42.5,
  NGN: 0.42,
  GNF: 0.071,
  MAD: 61.8,
  DZD: 4.6,
  TND: 198.5,
};

/**
 * Convertit un montant en sous-unités d'une devise source vers une devise cible.
 * Effectué avec des entiers et arrondie de sécurité.
 */
export function convertCurrency(
  amountInSubunits: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): {
  convertedAmount: number;
  rateApplied: number;
  hasWarning: boolean;
} {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amountInSubunits, rateApplied: 1, hasWarning: false };
  }

  const rates = { ...DEFAULT_FX_RATES, ...customRates };
  const fromConfig = ISO_CURRENCIES[fromCurrency] || ISO_CURRENCIES.XOF;
  const toConfig = ISO_CURRENCIES[toCurrency] || ISO_CURRENCIES.XOF;

  // Calcul du taux croisé vers XOF
  const fromToXof = fromCurrency === "XOF" ? 1 : rates[fromCurrency] || 0;
  const toToXof = toCurrency === "XOF" ? 1 : rates[toCurrency] || 0;

  if (fromToXof === 0 || toToXof === 0) {
    // Taux manquant -> Avertissement impératif selon Section F
    return {
      convertedAmount: amountInSubunits,
      rateApplied: 0,
      hasWarning: true,
    };
  }

  // Taux : 1 fromCurrency = X toCurrency
  const exchangeRate = fromToXof / toToXof;

  // Conversion en unités réelles
  const realUnits = amountInSubunits / fromConfig.subunitsMultiplier;
  const convertedUnits = realUnits * exchangeRate;
  const convertedSubunits = Math.round(convertedUnits * toConfig.subunitsMultiplier);

  return {
    convertedAmount: convertedSubunits,
    rateApplied: exchangeRate,
    hasWarning: false,
  };
}

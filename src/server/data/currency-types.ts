export interface CurrencyInfo {
  code: string; // ISO 4217 code (ex: XOF, NGN, KES)
  name: string; // Nom en français (ex: "Franc CFA UEMOA")
  symbol: string; // Symbole ou abréviation (ex: "FCFA", "₦", "KSh")
  decimals: number; // 0, 2 ou 3
  smallestUnitName: string; // Nom de la plus petite unité (ex: "centime", "franc")
  isAfrican: boolean;
  countries: string[]; // Liste des codes pays ISO 3166-1 alpha-2 associés
  cmaCommonMonetaryArea?: boolean; // Échangeable à parité 1:1 avec le Rand ZAR
  isInternational?: boolean; // USD, EUR
  disabledByDefault?: boolean;
}

export interface ShopCurrencySettings {
  shopId: string;
  primaryCurrency: string; // ISO 4217 code
  allowForeignExchangeQuotes?: boolean;
  hasOrders: boolean; // Si true, la devise est verrouillée
  lockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateScaled: number; // Taux multiplié par 1 000 000 pour éviter les flottants
  effectiveDate: string; // YYYY-MM-DD
}

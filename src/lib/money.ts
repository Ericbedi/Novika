/**
 * Montants en FCFA (XOF/XAF) : entiers, sans décimales.
 * Format d'affichage : « 14 900 FCFA »
 *  - espace fine insécable (U+202F) entre les milliers ;
 *  - espace insécable (U+00A0) avant « FCFA » ;
 *  - signe moins typographique (U+2212) pour les valeurs négatives.
 * C'est le seul endroit qui formate des montants (le composant <Money> l'utilise).
 */

export const THIN_NBSP = " ";
export const NBSP = " ";
export const MINUS = "−";

/** Taux fixe de la parité FCFA/euro. */
export const EUR_TO_XOF = 655.957;

export type Currency = "XOF" | "XAF";

function groupDigits(value: number): string {
  const digits = String(Math.abs(Math.round(value)));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += THIN_NBSP;
  }
  return out;
}

/** 14900 → « 14 900 » */
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? MINUS : "";
  return sign + groupDigits(rounded);
}

/** 14900 → « 14 900 FCFA » ; avec signe : « +14 900 FCFA ». */
export function formatFcfa(value: number, options: { signed?: boolean } = {}): string {
  const rounded = Math.round(value);
  let sign = "";
  if (rounded < 0) sign = MINUS;
  else if (options.signed && rounded > 0) sign = "+";
  return `${sign}${groupDigits(rounded)}${NBSP}FCFA`;
}

/**
 * Forme compacte pour les axes de graphiques : 0, 950, 12 k, 1,5 M.
 * Jamais pour un montant isolé (cartes KPI) : là, on écrit le montant entier.
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? MINUS : "";
  const trim = (n: number) =>
    (Math.round(n * 10) / 10).toString().replace(".", ",").replace(/,0$/, "");
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}${NBSP}M`;
  if (abs >= 10_000) return `${sign}${trim(abs / 1_000)}${NBSP}k`;
  return formatNumber(value);
}

/** Saisie libre (« 14 900 », « 14.900 F ») → 14900 ; null si aucun chiffre. */
export function parseAmount(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Conversion d'une dépense pub payée en devise étrangère.
 * EUR : parité fixe. Autres devises (USD…) : taux saisi par le vendeur.
 */
export function convertToFcfa(
  amount: number,
  currency: "EUR" | "USD" | "XOF" | "XAF",
  fxRate?: number,
): number {
  if (currency === "XOF" || currency === "XAF") return Math.round(amount);
  if (currency === "EUR") return Math.round(amount * EUR_TO_XOF);
  if (!fxRate || fxRate <= 0) throw new Error("FX_RATE_REQUIRED");
  return Math.round(amount * fxRate);
}

/** Part en pourcentage, arrondie à une décimale ; null si le dénominateur est nul. */
export function percent(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

/** 12.5 → « 12,5 % » ; null → « — » */
export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toString().replace(".", ",")}${NBSP}%`;
}

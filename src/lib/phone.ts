import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";

/**
 * Téléphones : stockés en E.164 (+22890123456), affichés au format national.
 * Pays ouverts au lancement. Le Bénin est passé à 10 chiffres fin 2024
 * (préfixe 01) : les anciens numéros à 8 chiffres sont refusés.
 */
export const SUPPORTED_COUNTRIES = ["TG", "CI", "SN", "BJ"] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export const DIAL_CODES: Record<SupportedCountry, string> = {
  TG: "+228",
  CI: "+225",
  SN: "+221",
  BJ: "+229",
};

export type PhoneResult =
  | { ok: true; e164: string; national: string; country: SupportedCountry }
  | { ok: false; reason: "empty" | "invalid" | "not_mobile" | "wrong_country" };

export function isSupportedCountry(value: string): value is SupportedCountry {
  return (SUPPORTED_COUNTRIES as readonly string[]).includes(value);
}

/**
 * Normalise une saisie (« 90 12 34 56 », « 00228… », « +228… »)
 * et exige un numéro **mobile** valide du pays choisi.
 */
export function normalizePhone(raw: string, country: SupportedCountry): PhoneResult {
  const input = raw.trim();
  if (!input) return { ok: false, reason: "empty" };
  const parsed = parsePhoneNumberFromString(input, country as CountryCode);
  if (!parsed || !parsed.isValid()) return { ok: false, reason: "invalid" };
  if (parsed.country !== country) return { ok: false, reason: "wrong_country" };
  const type = parsed.getType();
  if (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
    return { ok: false, reason: "not_mobile" };
  }
  return {
    ok: true,
    e164: parsed.number,
    national: formatNational(parsed.number),
    country,
  };
}

/** Indicatif du pays d'un numéro E.164 (null si hors périmètre). */
export function countryOf(e164: string): SupportedCountry | null {
  const parsed = parsePhoneNumberFromString(e164);
  const country = parsed?.country;
  return country && isSupportedCountry(country) ? country : null;
}

/**
 * Format national lisible, par paires comme on l'écrit sur place :
 * TG « 90 12 34 56 », CI/BJ « 07 07 07 07 07 », SN « 77 123 45 67 ».
 */
export function formatNational(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return e164;
  const national = parsed.nationalNumber.toString();
  const country = parsed.country;
  // CI et BJ gardent le 0 initial dans le numéro national à 10 chiffres.
  if (country === "SN" && national.length === 9) {
    return `${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 7)} ${national.slice(7)}`;
  }
  return national.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** « +228 90 12 34 56 » */
export function formatInternational(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return e164;
  return `+${parsed.countryCallingCode} ${formatNational(e164)}`;
}

/** Lien d'appel : tel:+22890123456 */
export function telLink(e164: string): string {
  return `tel:${e164}`;
}

/** Lien WhatsApp (click-to-chat), message prérempli facultatif. */
export function whatsappLink(e164: string, text?: string): string {
  const digits = e164.replace(/[^\d]/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

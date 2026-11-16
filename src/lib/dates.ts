import { tz } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Fuseaux horaires IANA des boutiques COD Afrique.
 */
export const DEFAULT_TIMEZONE = "Africa/Lome";

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "last7"
  | "last30"
  | "last90"
  | "last365"
  | "thisMonth"
  | "lastMonth"
  | "last12Months"
  | "allTime"
  | "custom";

export interface PeriodPresetConfig {
  id: PeriodPreset;
  label: string;
  description: string;
}

export const PERIOD_PRESETS: PeriodPresetConfig[] = [
  { id: "today", label: "Aujourd'hui", description: "Journée en cours" },
  { id: "yesterday", label: "Hier", description: "Journée précédente" },
  { id: "thisWeek", label: "Cette semaine", description: "Du lundi au jour actuel" },
  { id: "lastWeek", label: "Semaine dernière", description: "Du lundi au dimanche dernier" },
  { id: "last7", label: "7 derniers jours", description: "7 derniers jours glissants" },
  { id: "last30", label: "30 derniers jours", description: "30 derniers jours glissants" },
  { id: "last90", label: "90 derniers jours", description: "3 derniers mois glissants" },
  { id: "last365", label: "365 derniers jours", description: "1 an glissant" },
  { id: "thisMonth", label: "Ce mois-ci", description: "Mois calendaire en cours" },
  { id: "lastMonth", label: "Le mois dernier", description: "Mois calendaire précédent" },
  { id: "last12Months", label: "12 derniers mois", description: "12 derniers mois complets" },
  { id: "allTime", label: "Tout le temps", description: "Depuis la création de la boutique" },
];

export type DateRange = { from: Date; to: Date };

/** Clé de jour « 2026-11-15 » dans le fuseau donné. */
export function dayKey(date: Date, timeZone: string = DEFAULT_TIMEZONE): string {
  return format(date, "yyyy-MM-dd", { in: tz(timeZone) });
}

export function dayStart(date: Date, timeZone: string = DEFAULT_TIMEZONE): Date {
  return new Date(startOfDay(date, { in: tz(timeZone) }).getTime());
}

export function shiftDays(date: Date, days: number, timeZone: string = DEFAULT_TIMEZONE): Date {
  return new Date(addDays(date, days, { in: tz(timeZone) }).getTime());
}

/**
 * Calcul précis des bornes pour les 12 presets en tenant compte du fuseau IANA
 */
export function presetRange(
  preset: PeriodPreset,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
  orgCreatedAt: Date = new Date("2024-01-01T00:00:00Z")
): DateRange {
  const today = dayStart(now, timeZone);
  const tomorrow = shiftDays(today, 1, timeZone);

  switch (preset) {
    case "today":
      return { from: today, to: tomorrow };

    case "yesterday":
      return { from: shiftDays(today, -1, timeZone), to: today };

    case "thisWeek": {
      // Semaine débutant le lundi
      const monday = new Date(startOfWeek(today, { weekStartsOn: 1, in: tz(timeZone) }).getTime());
      return { from: monday, to: tomorrow };
    }

    case "lastWeek": {
      const prevWeekDay = shiftDays(today, -7, timeZone);
      const prevMonday = new Date(startOfWeek(prevWeekDay, { weekStartsOn: 1, in: tz(timeZone) }).getTime());
      const prevSundayEnd = shiftDays(prevMonday, 7, timeZone);
      return { from: prevMonday, to: prevSundayEnd };
    }

    case "last7":
      return { from: shiftDays(today, -6, timeZone), to: tomorrow };

    case "last30":
      return { from: shiftDays(today, -29, timeZone), to: tomorrow };

    case "last90":
      return { from: shiftDays(today, -89, timeZone), to: tomorrow };

    case "last365":
      return { from: shiftDays(today, -364, timeZone), to: tomorrow };

    case "thisMonth":
      return {
        from: new Date(startOfMonth(now, { in: tz(timeZone) }).getTime()),
        to: tomorrow,
      };

    case "lastMonth": {
      const prevMonthDate = subMonths(now, 1);
      const startOfPrevMonth = new Date(startOfMonth(prevMonthDate, { in: tz(timeZone) }).getTime());
      const endOfPrevMonth = shiftDays(new Date(endOfMonth(prevMonthDate, { in: tz(timeZone) }).getTime()), 1, timeZone);
      return { from: startOfPrevMonth, to: endOfPrevMonth };
    }

    case "last12Months": {
      const startOf12M = new Date(startOfMonth(subMonths(now, 12), { in: tz(timeZone) }).getTime());
      return { from: startOf12M, to: tomorrow };
    }

    case "allTime":
      return {
        from: dayStart(orgCreatedAt, timeZone),
        to: tomorrow,
      };

    case "custom":
    default:
      return { from: shiftDays(today, -29, timeZone), to: tomorrow };
  }
}

/** Période personnalisée à partir de deux clés de jour incluses (YYYY-MM-DD). */
export function customRange(fromKey: string, toKey: string, timeZone: string = DEFAULT_TIMEZONE): DateRange {
  const from = keyToDate(fromKey, timeZone);
  const to = shiftDays(keyToDate(toKey, timeZone), 1, timeZone);
  return { from, to };
}

/**
 * La période de même durée qui précède immédiatement (pour les comparaisons A/B).
 */
export function previousRange(range: DateRange): DateRange {
  const length = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - length), to: range.from };
}

export function isInRange(date: Date, range: DateRange): boolean {
  const t = date.getTime();
  return t >= range.from.getTime() && t < range.to.getTime();
}

/** Toutes les clés de jour de la période, dans l'ordre. */
export function eachDayKey(range: DateRange, timeZone: string = DEFAULT_TIMEZONE): string[] {
  const keys: string[] = [];
  let cursor = range.from;
  while (cursor.getTime() < range.to.getTime()) {
    keys.push(dayKey(cursor, timeZone));
    cursor = shiftDays(cursor, 1, timeZone);
  }
  return keys;
}

/** Minuit (fuseau de la boutique) du jour « 2026-11-15 ». */
export function keyToDate(key: string, timeZone: string = DEFAULT_TIMEZONE): Date {
  const [y, m, d] = key.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12));
  return dayStart(noonUtc, timeZone);
}

/**
 * Formatage de date multilingue/timezone avec styles prédéfinis.
 */
export function formatDate(
  date: Date,
  timeZone: string = DEFAULT_TIMEZONE,
  style: "full" | "time" | "short" = "full"
): string {
  if (style === "full") {
    return format(date, "d MMMM yyyy", { locale: fr, in: tz(timeZone) });
  }
  if (style === "time") {
    return format(date, "HH:mm", { in: tz(timeZone) });
  }
  return format(date, "d MMM yyyy", { locale: fr, in: tz(timeZone) });
}

/**
 * Formatage en français standard (ex: « 1 oct. 2025 »)
 */
export function formatDateFr(date: Date, formatStr: string = "d MMM yyyy"): string {
  return format(date, formatStr, { locale: fr });
}

/**
 * Libellé lisible pour le bouton du sélecteur
 */
export function getRangeDisplayLabel(
  preset: PeriodPreset,
  range: DateRange,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  if (preset !== "custom") {
    const found = PERIOD_PRESETS.find((p) => p.id === preset);
    if (found) return found.label;
  }
  // Pour custom : « 1 oct. 2025 - 15 nov. 2025 »
  const fromStr = formatDateFr(range.from);
  const inclusiveTo = shiftDays(range.to, -1, timeZone);
  const toStr = formatDateFr(inclusiveTo);
  return `${fromStr} - ${toStr}`;
}

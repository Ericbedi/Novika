import { describe, expect, it } from "vitest";
import {
  customRange,
  dayKey,
  eachDayKey,
  formatDate,
  isInRange,
  presetRange,
  previousRange,
} from "./dates";

const ABIDJAN = "Africa/Abidjan"; // UTC+0
const PORTO_NOVO = "Africa/Porto-Novo"; // UTC+1
const now = new Date("2026-11-15T10:00:00Z");

describe("dayKey", () => {
  it("dépend du fuseau de la boutique", () => {
    const lateEvening = new Date("2026-11-14T23:30:00Z");
    expect(dayKey(lateEvening, ABIDJAN)).toBe("2026-11-14");
    expect(dayKey(lateEvening, PORTO_NOVO)).toBe("2026-11-15");
  });
});

describe("presetRange", () => {
  it("couvre 7 jours, aujourd'hui inclus (UTC+0)", () => {
    const r = presetRange("last7", now, ABIDJAN);
    expect(r.from.toISOString()).toBe("2026-11-09T00:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
  it("décale les bornes au Bénin (UTC+1)", () => {
    const r = presetRange("today", now, PORTO_NOVO);
    expect(r.from.toISOString()).toBe("2026-11-14T23:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-11-15T23:00:00.000Z");
  });
  it("calcule hier et le mois en cours", () => {
    expect(presetRange("yesterday", now, ABIDJAN).from.toISOString()).toBe("2026-11-14T00:00:00.000Z");
    expect(presetRange("thisMonth", now, ABIDJAN).from.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("plages", () => {
  it("construit une plage personnalisée inclusive", () => {
    const r = customRange("2026-11-01", "2026-11-03", ABIDJAN);
    expect(eachDayKey(r, ABIDJAN)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
  });
  it("donne la période précédente de même durée", () => {
    const r = presetRange("last7", now, ABIDJAN);
    const p = previousRange(r);
    expect(p.from.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(p.to.toISOString()).toBe(r.from.toISOString());
  });
  it("exclut la borne de fin", () => {
    const r = presetRange("today", now, ABIDJAN);
    expect(isInRange(r.from, r)).toBe(true);
    expect(isInRange(r.to, r)).toBe(false);
  });
});

describe("formatDate", () => {
  it("écrit les dates en français", () => {
    expect(formatDate(now, ABIDJAN, "full")).toBe("15 novembre 2026");
    expect(formatDate(now, ABIDJAN, "time")).toBe("10:00");
  });
});

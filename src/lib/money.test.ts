import { describe, expect, it } from "vitest";
import {
  convertToFcfa,
  formatCompact,
  formatFcfa,
  formatNumber,
  formatPercent,
  parseAmount,
  percent,
} from "./money";

const T = " "; // espace fine insécable
const N = " "; // espace insécable

describe("formatFcfa", () => {
  it("formate selon la convention « 14 900 FCFA »", () => {
    expect(formatFcfa(14900)).toBe(`14${T}900${N}FCFA`);
  });
  it("gère zéro, les grands montants et l'arrondi", () => {
    expect(formatFcfa(0)).toBe(`0${N}FCFA`);
    expect(formatFcfa(1234567)).toBe(`1${T}234${T}567${N}FCFA`);
    expect(formatFcfa(999)).toBe(`999${N}FCFA`);
    expect(formatFcfa(14900.6)).toBe(`14${T}901${N}FCFA`);
  });
  it("affiche un vrai signe moins et un + optionnel", () => {
    expect(formatFcfa(-2500)).toBe(`−2${T}500${N}FCFA`);
    expect(formatFcfa(2500, { signed: true })).toBe(`+2${T}500${N}FCFA`);
    expect(formatFcfa(0, { signed: true })).toBe(`0${N}FCFA`);
  });
});

describe("formatNumber / formatCompact", () => {
  it("groupe les milliers", () => {
    expect(formatNumber(100000)).toBe(`100${T}000`);
  });
  it("compacte pour les axes", () => {
    expect(formatCompact(950)).toBe("950");
    expect(formatCompact(9500)).toBe(`9${T}500`);
    expect(formatCompact(12000)).toBe(`12${N}k`);
    expect(formatCompact(1500000)).toBe(`1,5${N}M`);
    expect(formatCompact(2000000)).toBe(`2${N}M`);
  });
});

describe("parseAmount", () => {
  it("lit une saisie libre", () => {
    expect(parseAmount(" 14 900 F")).toBe(14900);
    expect(parseAmount("14.900")).toBe(14900);
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("convertToFcfa", () => {
  it("utilise la parité fixe pour l'euro", () => {
    expect(convertToFcfa(100, "EUR")).toBe(65596);
  });
  it("exige un taux pour le dollar", () => {
    expect(convertToFcfa(10, "USD", 605)).toBe(6050);
    expect(() => convertToFcfa(10, "USD")).toThrow("FX_RATE_REQUIRED");
  });
});

describe("percent", () => {
  it("renvoie null quand le dénominateur est nul", () => {
    expect(percent(5, 0)).toBeNull();
    expect(formatPercent(null)).toBe("—");
  });
  it("arrondit à une décimale", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(formatPercent(33.3)).toBe(`33,3${N}%`);
  });
});

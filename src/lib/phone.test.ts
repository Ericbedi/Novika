import { describe, expect, it } from "vitest";
import {
  countryOf,
  formatInternational,
  formatNational,
  normalizePhone,
  telLink,
  whatsappLink,
} from "./phone";

describe("normalizePhone", () => {
  it("accepte les mobiles des 4 pays sous différentes saisies", () => {
    expect(normalizePhone("90 12 34 56", "TG")).toMatchObject({ ok: true, e164: "+22890123456" });
    expect(normalizePhone("00228 90 12 34 56", "TG")).toMatchObject({ ok: true, e164: "+22890123456" });
    expect(normalizePhone("07 07 07 07 07", "CI")).toMatchObject({ ok: true, e164: "+2250707070707" });
    expect(normalizePhone("+225 05 05 05 05 05", "CI")).toMatchObject({ ok: true });
    expect(normalizePhone("77 123 45 67", "SN")).toMatchObject({ ok: true, e164: "+221771234567" });
    expect(normalizePhone("01 90 12 34 56", "BJ")).toMatchObject({ ok: true, e164: "+2290190123456" });
  });

  it("refuse les anciens numéros béninois à 8 chiffres", () => {
    expect(normalizePhone("97 12 34 56", "BJ")).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuse les fixes, les saisies vides et les numéros d'un autre pays", () => {
    expect(normalizePhone("22 21 23 45", "TG")).toEqual({ ok: false, reason: "not_mobile" });
    expect(normalizePhone("33 821 12 34", "SN")).toEqual({ ok: false, reason: "not_mobile" });
    expect(normalizePhone("   ", "CI")).toEqual({ ok: false, reason: "empty" });
    expect(normalizePhone("+221 77 123 45 67", "TG")).toEqual({ ok: false, reason: "wrong_country" });
    expect(normalizePhone("12", "TG")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("affichage", () => {
  it("formate par paires selon l'usage local", () => {
    expect(formatNational("+22890123456")).toBe("90 12 34 56");
    expect(formatNational("+2250707070707")).toBe("07 07 07 07 07");
    expect(formatNational("+2290190123456")).toBe("01 90 12 34 56");
    expect(formatNational("+221771234567")).toBe("77 123 45 67");
    expect(formatInternational("+22890123456")).toBe("+228 90 12 34 56");
  });

  it("retrouve le pays d'un numéro", () => {
    expect(countryOf("+2250707070707")).toBe("CI");
    expect(countryOf("+33612345678")).toBeNull();
  });
});

describe("liens de contact", () => {
  it("construit les liens d'appel et WhatsApp", () => {
    expect(telLink("+22890123456")).toBe("tel:+22890123456");
    expect(whatsappLink("+22890123456")).toBe("https://wa.me/22890123456");
    expect(whatsappLink("+22890123456", "Bonjour Ama, votre commande")).toBe(
      "https://wa.me/22890123456?text=Bonjour%20Ama%2C%20votre%20commande",
    );
  });
});

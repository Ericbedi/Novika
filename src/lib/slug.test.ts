import { describe, it, expect } from "vitest";
import { cleanSlug, safeDecode } from "./slug";

describe("cleanSlug", () => {
  it("retire ™, accents et tirets longs", () => {
    expect(cleanSlug("CrystalRestore™ – Restaure la brillance et la couleur d'origine")).toBe("crystalrestore-restaure-la-brillance-et-la-couleur-d-origine");
  });
  it("retombe sur un défaut", () => {
    expect(cleanSlug("™™")).toBe("produit");
  });
});
describe("safeDecode", () => {
  it("décode un identifiant encodé", () => {
    expect(safeDecode("crystalrestore%E2%84%A2-x")).toBe("crystalrestore™-x");
    expect(safeDecode("100%")).toBe("100%");
  });
});

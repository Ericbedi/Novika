import { describe, it, expect } from "vitest";
import { readableTextOn, slugifyShopName, WIZARD_COUNTRIES } from "./store-wizard-presets";

describe("assistant de création de boutique", () => {
  it("choisit un texte lisible selon la couleur", () => {
    expect(readableTextOn("#111827")).toBe("#FFFFFF");
    expect(readableTextOn("#FDE047")).toBe("#111111");
  });
  it("fabrique un lien propre à partir du nom", () => {
    expect(slugifyShopName("  Faras Bags !  ")).toBe("faras-bags");
    expect(slugifyShopName("Café Élégance")).toBe("cafe-elegance");
    expect(slugifyShopName("???")).toBe("boutique");
  });
  it("propose le Togo en premier avec le FCFA", () => {
    expect(WIZARD_COUNTRIES[0]).toMatchObject({ code: "TG", dial: "+228", currency: "XOF" });
  });
});

import { describe, expect, it } from "vitest";
import { sanitizePageBlocks } from "./page-sections";
import { applyHomeConfig, sanitizeHomeConfig } from "./storefront-home-config";
import { createEmptyStorefront } from "./storefront-resolver";
import { contentOrder } from "./studio-catalog";

describe("blocs de page", () => {
  it("rejette les types inconnus, les images intégrées et les liens dangereux", () => {
    const out = sanitizePageBlocks([
      { type: "script", text: "x" },
      { type: "image", imageUrl: "data:image/png;base64,AAA" },
      { type: "button", text: "Go", url: "javascript:alert(1)" },
      { type: "text", text: "Bonjour" },
    ]);
    expect(out.map((b) => b.type)).toEqual(["image", "button", "text"]);
    expect(out[0].imageUrl).toBe("");
    expect(out[1].url).toBe("");
  });
  it("limite à 40 blocs", () => {
    expect(sanitizePageBlocks(Array.from({ length: 80 }, () => ({ type: "text", text: "a" }))).length).toBe(40);
  });
});

describe("ordre des sections", () => {
  it("garde un ordre valide et complète les sections manquantes", () => {
    const cfg = sanitizeHomeConfig({ order: ["sec_brand_story", "BAD ID", "sec_hero"] });
    expect(cfg.order).toEqual(["sec_brand_story", "sec_hero"]);
    expect(contentOrder(cfg)[0]).toBe("sec_brand_story");
    expect(contentOrder(cfg).length).toBe(7);
  });
  it("applique l'ordre à la vitrine", () => {
    const sf = applyHomeConfig(createEmptyStorefront("x", "X"), { order: ["sec_hero"] });
    expect(sf.homeOrder).toEqual(["sec_hero"]);
  });
});

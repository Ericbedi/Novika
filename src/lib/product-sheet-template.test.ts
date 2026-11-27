import { describe, it, expect } from "vitest";
import { PRODUCT_SHEET_BLOCKS, productSheetTemplateHtml } from "./product-sheet-template";

describe("trame fiche produit", () => {
  it("compte 13 blocs", () => expect(PRODUCT_SHEET_BLOCKS.length).toBe(13));
  it("génère du HTML avec chaque titre", () => {
    const h = productSheetTemplateHtml();
    for (const [t] of PRODUCT_SHEET_BLOCKS) expect(h).toContain(`<h3>${t}</h3>`);
  });
});

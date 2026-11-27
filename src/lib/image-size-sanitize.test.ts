import { describe, it, expect } from "vitest";
import { sanitizeProductDescription } from "./server-html-sanitizer";

describe("taille d'image enregistrée", () => {
  it("garde les tailles w25/w50/w75 et rejette le reste", () => {
    const ok = sanitizeProductDescription('<p>x</p><img src="https://a.com/i.jpg" data-size="w50" data-ratio="1-1">');
    expect(ok.cleanedHtml).toContain('data-size="w50"');
    const ko = sanitizeProductDescription('<img src="https://a.com/i.jpg" data-size="w999">');
    expect(ko.cleanedHtml).not.toContain("data-size");
  });
});

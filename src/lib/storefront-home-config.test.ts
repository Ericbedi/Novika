import { describe, it, expect } from "vitest";
import { createEmptyStorefront } from "./storefront-resolver";
import { applyHomeConfig, buildHomeConfig, sanitizeHomeConfig } from "./storefront-home-config";

describe("Personnalisation de la page d'accueil", () => {
  it("applique les textes, la police et les couleurs enregistrés", () => {
    const base = createEmptyStorefront("demo", "Demo");
    const out = applyHomeConfig(base, {
      sections: { sec_hero: { content: { headline: "Mon titre" } } },
      typography: { fontFamily: "Playfair Display", headingFont: "Playfair Display" },
      colors: { primary: "#112233" },
      announcementBar: { text: "Promo !" },
    });
    expect(out.sections.find((s) => s.id === "sec_hero")?.content.headline).toBe("Mon titre");
    expect(out.sections.find((s) => s.id === "sec_hero")?.content.ctaText).toBe("Découvrir la collection");
    expect(out.activeTheme.typography.fontFamily).toBe("Playfair Display");
    expect(out.activeTheme.colors.primary).toBe("#112233");
    expect(out.announcementBar.text).toBe("Promo !");
  });

  it("rejette les valeurs dangereuses (police inconnue, couleur invalide, image intégrée)", () => {
    const c = sanitizeHomeConfig({
      typography: { fontFamily: "Comic Hack" },
      colors: { primary: "red; background:url(x)" },
      sections: { sec_brand_story: { content: { imageUrl: "data:image/png;base64,AAAA", text: "ok" } }, "Bad Id!": { content: { a: "b" } } },
    });
    expect(c.typography?.fontFamily).toBeUndefined();
    expect(c.colors?.primary).toBeUndefined();
    expect(c.sections?.sec_brand_story?.content).toEqual({ text: "ok" });
    expect(c.sections?.["Bad Id!"]).toBeUndefined();
  });

  it("reprend la configuration d'une vitrine modifiée sans perte", () => {
    const base = createEmptyStorefront("demo", "Demo", { tagline: "Mon slogan" });
    expect(base.sections.find((s) => s.id === "sec_hero")?.content.headline).toBe("Mon slogan");
    const cfg = buildHomeConfig(base);
    expect(applyHomeConfig(createEmptyStorefront("demo", "Demo"), cfg).sections.find((s) => s.id === "sec_hero")?.content.headline).toBe("Mon slogan");
  });
});

describe("Bannières d'accueil", () => {
  it("garde uniquement les images https ou du site, 5 au maximum", () => {
    const c = sanitizeHomeConfig({
      banners: [
        { id: "a", imageUrl: "https://cdn.exemple.com/a.jpg", mobileImageUrl: "https://cdn.exemple.com/a-m.jpg", linkUrl: "/boutique/x/catalogue" },
        { id: "b", imageUrl: "javascript:alert(1)" },
        { id: "c", imageUrl: "data:image/png;base64,AAAA" },
        { id: "d", imageUrl: "/banners/hero.jpg", linkUrl: "javascript:alert(1)" },
        ...Array.from({ length: 8 }, (_, i) => ({ id: `z${i}`, imageUrl: `https://cdn.exemple.com/${i}.jpg` })),
      ],
    });
    expect(c.banners?.length).toBe(5);
    expect(c.banners?.[0].mobileImageUrl).toBe("https://cdn.exemple.com/a-m.jpg");
    expect(c.banners?.find((b) => b.id === "d")?.linkUrl).toBeUndefined();
    expect(c.banners?.some((b) => b.imageUrl.startsWith("data:") || b.imageUrl.startsWith("javascript"))).toBe(false);
  });

  it("applique les bannières sur la vitrine et les retire quand la liste est vide", () => {
    const base = createEmptyStorefront("demo", "Demo");
    const withB = applyHomeConfig(base, { banners: [{ id: "a", imageUrl: "https://cdn.exemple.com/a.jpg" }] });
    expect(withB.homeBanners?.length).toBe(1);
    expect(applyHomeConfig(withB, { banners: [] }).homeBanners).toEqual([]);
  });
});

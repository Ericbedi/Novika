import { describe, it, expect, beforeEach } from "vitest";
import {
  SECTION_SCHEMAS,
  isSectionEmpty,
  validateComparisonParity,
  announcementBarSchema,
  heroBannerSchema,
  multiColumnsSchema,
  featuredProductsSchema,
  comparisonTableSchema,
  faqSchema,
  reassuranceSchema,
} from "./schemas";
import { THEME_PRESETS } from "./presets";
import { createDefaultNewShopTheme, createLomeGlowDemoTheme } from "./default-theme";
import {
  getShopTheme,
  saveDraftTheme,
  publishTheme,
  restoreThemeVersion,
  getThemeAuditHistory,
} from "./store";

describe("Prompt 12 : Moteur de Thème « Novika Classique »", () => {
  describe("1. Schémas Zod des Sections", () => {
    it("valide une bannière d'accueil (Hero) avec paramètres conformes", () => {
      const validHero = {
        desktopImage: "/banners/hero.jpg",
        overlayOpacity: 35,
        height: "large",
        textAlignment: "center",
        textVerticalPosition: "center",
        headline: "Cosmétique naturelle d'Afrique",
        subheadline: "Paiement en espèces à la livraison",
        button1Text: "Commander maintenant",
        button1Link: "#catalog",
      };

      const result = heroBannerSchema.safeParse(validHero);
      expect(result.success).toBe(true);
    });

    it("valide les limites du calque sombre (0 à 90%)", () => {
      expect(heroBannerSchema.safeParse({ overlayOpacity: 95 }).success).toBe(false);
      expect(heroBannerSchema.safeParse({ overlayOpacity: -5 }).success).toBe(false);
      expect(heroBannerSchema.safeParse({ overlayOpacity: 50 }).success).toBe(true);
    });

    it("valide un bandeau d'annonce avec au maximum 5 messages", () => {
      const messages = [
        { text: "Livraison 24h" },
        { text: "Paiement COD" },
        { text: "Service WhatsApp" },
      ];
      expect(announcementBarSchema.safeParse({ messages }).success).toBe(true);

      const tooManyMessages = [
        { text: "1" },
        { text: "2" },
        { text: "3" },
        { text: "4" },
        { text: "5" },
        { text: "6" },
      ];
      expect(announcementBarSchema.safeParse({ messages: tooManyMessages }).success).toBe(false);
    });

    it("valide les colonnes d'information avec un maximum de 4 colonnes", () => {
      const validCols = [
        { title: "Col 1", text: "Description 1" },
        { title: "Col 2", text: "Description 2" },
      ];
      expect(multiColumnsSchema.safeParse({ columns: validCols }).success).toBe(true);

      const tooManyCols = [
        { title: "1" },
        { title: "2" },
        { title: "3" },
        { title: "4" },
        { title: "5" },
      ];
      expect(multiColumnsSchema.safeParse({ columns: tooManyCols }).success).toBe(false);
    });

    it("valide les produits en vedette et leurs badges automatiques", () => {
      const result = featuredProductsSchema.safeParse({
        title: "Nos Produits Vedettes",
        productIds: ["prod_01", "prod_02"],
        columnsDesktop: 4,
        columnsMobile: 2,
        showDiscountBadge: true,
        showLowStockBadge: true,
      });
      expect(result.success).toBe(true);
    });

    it("vérifie que les 16 types de sections possèdent tous un schéma Zod enregistré", () => {
      const expectedSections = [
        "announcement_bar",
        "hero_banner",
        "image_with_text",
        "multi_columns",
        "featured_collections",
        "featured_products",
        "marquee",
        "reassurance",
        "verified_reviews",
        "testimonials",
        "comparison_table",
        "faq",
        "rich_text",
        "divider",
        "video",
        "whatsapp_block",
        "footer",
      ];

      expectedSections.forEach((type) => {
        expect(SECTION_SCHEMAS[type as keyof typeof SECTION_SCHEMAS]).toBeDefined();
      });
    });
  });

  describe("2. Règle de Masquage des Sections Vides (Prompt 08 & Prompt 12)", () => {
    it("détecte une section hero vide et renvoie isSectionEmpty = true", () => {
      const emptyHero = {
        headline: "",
        subheadline: "",
        desktopImage: "",
      };
      expect(isSectionEmpty("hero_banner", emptyHero)).toBe(true);

      const filledHero = {
        headline: "Grand Titre",
        subheadline: "Sous-titre",
      };
      expect(isSectionEmpty("hero_banner", filledHero)).toBe(false);
    });

    it("détecte un bandeau d'annonce vide si aucun message ou messages vides", () => {
      expect(isSectionEmpty("announcement_bar", { messages: [] })).toBe(true);
      expect(isSectionEmpty("announcement_bar", { messages: [{ text: "   " }] })).toBe(true);
      expect(isSectionEmpty("announcement_bar", { messages: [{ text: "Offre Spéciale" }] })).toBe(false);
    });

    it("détecte une FAQ vide", () => {
      expect(isSectionEmpty("faq", { items: [] })).toBe(true);
      expect(isSectionEmpty("faq", { items: [{ question: "", answer: "" }] })).toBe(true);
      expect(isSectionEmpty("faq", { items: [{ question: "Délai ?", answer: "24h" }] })).toBe(false);
    });

    it("détecte des colonnes d'information vides", () => {
      expect(isSectionEmpty("multi_columns", { columns: [] })).toBe(true);
      expect(isSectionEmpty("multi_columns", { columns: [{ title: "Support" }] })).toBe(false);
    });
  });

  describe("3. Règle du Tableau Comparatif : Avertissement de Parité", () => {
    it("avertit l'admin si aucun critère n'est à égalité ou neutre", () => {
      const biasedRows = [
        { criterion: "Paiement à la livraison", ourShopValue: true, competitorValue: false, isParity: false },
        { criterion: "Qualité bio", ourShopValue: true, competitorValue: false, isParity: false },
        { criterion: "Service client", ourShopValue: true, competitorValue: false, isParity: false },
      ];

      const check = validateComparisonParity(biasedRows);
      expect(check.hasParity).toBe(false);
      expect(check.warning).toContain("Conseil de crédibilité commerciale");
    });

    it("valide la parité si au moins une ligne est équitable ou possède isParity=true", () => {
      const balancedRows = [
        { criterion: "Paiement à la livraison", ourShopValue: true, competitorValue: false, isParity: false },
        { criterion: "Garantie 48h", ourShopValue: true, competitorValue: false, isParity: false },
        { criterion: "Service client WhatsApp", ourShopValue: true, competitorValue: true, isParity: true },
      ];

      const check = validateComparisonParity(balancedRows);
      expect(check.hasParity).toBe(true);
      expect(check.warning).toBeUndefined();
    });
  });

  describe("4. Nouvelle Boutique : Modèle de Départ Totalement Vide", () => {
    it("crée un thème pour une nouvelle boutique avec des sections VIDES", () => {
      const newShopTheme = createDefaultNewShopTheme("shop_new_123", "Boutique Test");
      expect(newShopTheme.isPublished).toBe(false);
      expect(newShopTheme.pages.home.sections.length).toBeGreaterThan(0);

      // Vérifier que toutes les sections de contenu sont vides de texte factice
      newShopTheme.pages.home.sections.forEach((sec) => {
        if (sec.type === "announcement_bar") {
          expect(isSectionEmpty("announcement_bar", sec.settings)).toBe(true);
        }
        if (sec.type === "hero_banner") {
          expect(isSectionEmpty("hero_banner", sec.settings)).toBe(true);
        }
        if (sec.type === "faq") {
          expect(isSectionEmpty("faq", sec.settings)).toBe(true);
        }
        if (sec.type === "reassurance") {
          expect(isSectionEmpty("reassurance", sec.settings)).toBe(true);
        }
        if (sec.type === "comparison_table") {
          expect(isSectionEmpty("comparison_table", sec.settings)).toBe(true);
        }
        if (sec.type === "multi_columns") {
          expect(isSectionEmpty("multi_columns", sec.settings)).toBe(true);
        }
      });
    });
  });

  describe("5. Préréglages et 5 Palettes de Couleurs", () => {
    it("vérifie que chaque préréglage contient jusqu'à 5 palettes configurées", () => {
      const presets = Object.values(THEME_PRESETS);
      expect(presets.length).toBe(5);

      presets.forEach((preset) => {
        expect(preset.generalSettings.palettes.length).toBe(5);
        preset.generalSettings.palettes.forEach((p) => {
          expect(p.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(p.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(p.button).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });

    it("vérifie que les polices proposées sont des polices libres (Poppins, Inter, Plus Jakarta Sans)", () => {
      const validFonts = ["Poppins", "Inter", "Plus Jakarta Sans", "Montserrat"];
      Object.values(THEME_PRESETS).forEach((p) => {
        expect(validFonts).toContain(p.generalSettings.typography.headingFont);
        expect(validFonts).toContain(p.generalSettings.typography.bodyFont);
      });
    });
  });

  describe("6. Persistance, Publication et Restauration (Rollback)", () => {
    const testShopId = "test-store-isolation";

    it("enregistre un brouillon et incrémente la version", async () => {
      const initial = await getShopTheme(testShopId);
      const v1 = initial.version;

      const saveRes = await saveDraftTheme(
        testShopId,
        {
          name: "Boutique Modifiée",
        },
        "owner"
      );

      expect(saveRes.success).toBe(true);
      expect(saveRes.theme.version).toBe(v1 + 1);
      expect(saveRes.theme.name).toBe("Boutique Modifiée");
    });

    it("publie le thème et enregistre la date de publication", async () => {
      const pubRes = await publishTheme(testShopId, "owner");
      expect(pubRes.success).toBe(true);
      expect(pubRes.theme.isPublished).toBe(true);
      expect(pubRes.theme.publishedAt).toBeDefined();
    });

    it("génère un journal d'audit et permet la restauration", async () => {
      const history = await getThemeAuditHistory(testShopId);
      expect(history.length).toBeGreaterThan(0);

      const firstVersion = history[history.length - 1].version;
      const restoreRes = await restoreThemeVersion(testShopId, firstVersion, "owner");
      expect(restoreRes.success).toBe(true);
      expect(restoreRes.theme?.version).toBeGreaterThan(firstVersion);
    });
  });

  describe("7. Règle de Propriété Absolue", () => {
    it("ne contient aucun terme tiers interdit (Zendrop, Dawn, Liquid)", () => {
      const sourceString = JSON.stringify(THEME_PRESETS) + JSON.stringify(createDefaultNewShopTheme("test"));
      expect(sourceString.toLowerCase()).not.toContain("zendrop");
      expect(sourceString.toLowerCase()).not.toContain("dawn");
      expect(sourceString.toLowerCase()).not.toContain("liquid");
    });
  });
});

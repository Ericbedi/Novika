import { describe, it, expect, beforeEach } from "vitest";
import {
  featuredBlogPostsSchema,
  isSectionEmpty,
  SECTION_SCHEMAS,
} from "./schemas";
import {
  exportThemeToJson,
  importThemeFromJson,
  duplicateThemeToShop,
  getShopTheme,
} from "./store";
import { getCountriesInSameCurrencyZone } from "@/config/countries";
import {
  getShopBlogPosts,
  getBlogPostBySlug,
  saveShopBlogPost,
  clearShopBlogMemory,
  BlogPost,
} from "../blog-store";

describe("Prompt 12-b Phase 2 : Vitrine Novika Classique (Phase 2 Tests Unitaires)", () => {
  beforeEach(() => {
    clearShopBlogMemory();
  });

  describe("1. Section d'accueil : featured_blog_posts", () => {
    it("valide les réglages de la section blog en vedette", () => {
      const validSettings = {
        title: "Derniers articles de beauté",
        subtitle: "Nos conseils d'experts",
        limit: 3,
        showDate: true,
        showAuthor: true,
        showReadingTime: true,
      };
      const result = featuredBlogPostsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it("rejette une limite supérieure à 6", () => {
      expect(featuredBlogPostsSchema.safeParse({ limit: 10 }).success).toBe(false);
      expect(featuredBlogPostsSchema.safeParse({ limit: 0 }).success).toBe(false);
      expect(featuredBlogPostsSchema.safeParse({ limit: 4 }).success).toBe(true);
    });

    it("détecte une section vide si title et subtitle sont vides", () => {
      expect(
        isSectionEmpty("featured_blog_posts", {
          title: "",
          subtitle: "",
        })
      ).toBe(true);

      expect(
        isSectionEmpty("featured_blog_posts", {
          title: "Le Blog",
          subtitle: "",
        })
      ).toBe(false);
    });

    it("vérifie que featured_blog_posts est bien dans SECTION_SCHEMAS", () => {
      expect(SECTION_SCHEMAS.featured_blog_posts).toBeDefined();
    });
  });

  describe("2. Blog Data Store (src/lib/blog-store.ts)", () => {
    it("renvoie les articles de démonstration pour lome-glow avec commentaires désactivés par défaut", () => {
      const posts = getShopBlogPosts("lome-glow");
      expect(posts.length).toBeGreaterThan(0);
      posts.forEach((p) => {
        expect(p.commentsEnabled).toBe(false);
        expect(p.status).toBe("published");
        expect(p.slug).toBeTruthy();
      });
    });

    it("recherche un article par slug exact sans jamais se replier sur un autre article", () => {
      const post = getBlogPostBySlug({
        shopSlug: "lome-glow",
        slug: "5-rituels-naturels-pour-illuminer-votre-teint",
      });
      expect(post).not.toBeNull();
      expect(post?.title).toContain("5 rituels naturels");

      const unknown = getBlogPostBySlug({
        shopSlug: "lome-glow",
        slug: "article-inexistant-xyz",
      });
      expect(unknown).toBeNull();
    });

    it("isole les articles par boutique", () => {
      const postsOther = getShopBlogPosts("boutique-vide");
      expect(postsOther.length).toBe(0);

      const newPost: BlogPost = {
        id: "post_test",
        storeSlug: "boutique-vide",
        title: "Article Spécifique",
        slug: "article-specifique",
        excerpt: "Extrait de test",
        content: "<p>Contenu test</p>",
        authorName: "Auteur Test",
        publishedAt: new Date().toISOString(),
        readingTimeMinutes: 2,
        tags: ["Test"],
        associatedProductIds: [],
        status: "published",
        commentsEnabled: false,
      };

      saveShopBlogPost("boutique-vide", newPost);

      expect(getShopBlogPosts("boutique-vide").length).toBe(1);
      expect(getBlogPostBySlug({ shopSlug: "boutique-vide", slug: "article-specifique" })).not.toBeNull();
      // Toujours introuvable dans lome-glow
      expect(getBlogPostBySlug({ shopSlug: "lome-glow", slug: "article-specifique" })).toBeNull();
    });
  });

  describe("3. Sélecteur de pays et zone monétaire (Prompt 12-b)", () => {
    it("filtre strictement les pays de la zone monétaire partagée (XOF = 8 pays UEMOA)", () => {
      const xofCountries = getCountriesInSameCurrencyZone("XOF");
      expect(xofCountries.length).toBe(8);
      const codes = xofCountries.map((c) => c.code);
      expect(codes).toContain("TG"); // Togo
      expect(codes).toContain("BJ"); // Bénin
      expect(codes).toContain("CI"); // Côte d'Ivoire
      expect(codes).toContain("SN"); // Sénégal
      expect(codes).not.toContain("CM"); // Cameroun (XAF)
      expect(codes).not.toContain("GN"); // Guinée (GNF)
    });

    it("filtre strictement les pays de la zone CEMAC (XAF = 6 pays)", () => {
      const xafCountries = getCountriesInSameCurrencyZone("XAF");
      expect(xafCountries.length).toBe(6);
      const codes = xafCountries.map((c) => c.code);
      expect(codes).toContain("CM"); // Cameroun
      expect(codes).toContain("GA"); // Gabon
      expect(codes).not.toContain("CI"); // Côte d'Ivoire (XOF)
    });

    it("renvoie uniquement la Guinée pour GNF", () => {
      const gnfCountries = getCountriesInSameCurrencyZone("GNF");
      expect(gnfCountries.length).toBe(1);
      expect(gnfCountries[0].code).toBe("GN");
    });

    it("renvoie une liste vide pour une devise inconnue", () => {
      expect(getCountriesInSameCurrencyZone("UNKNOWN").length).toBe(0);
    });
  });

  describe("4. Exportation, Importation et Duplication de Thème", () => {
    const shopId = "lome-glow";

    it("exporte un JSON propre sans données privées ni PII", async () => {
      const jsonStr = await exportThemeToJson(shopId);
      expect(typeof jsonStr).toBe("string");

      const parsed = JSON.parse(jsonStr);
      expect(parsed.schemaVersion).toBe("1.0");
      expect(parsed.themePreset).toBeDefined();
      expect(parsed.generalSettings).toBeDefined();
      expect(Array.isArray(parsed.pages)).toBe(true);

      // Vérifier l'absence de PII ou de tokens sensibles
      expect(jsonStr).not.toContain("supabase");
      expect(jsonStr).not.toContain("clientSecret");
      expect(jsonStr).not.toContain("password");
    });

    it("importe un thème JSON valide et incrémente la version", async () => {
      const originalTheme = await getShopTheme(shopId);
      const vBefore = originalTheme.version;

      const exported = await exportThemeToJson(shopId);
      const importResult = await importThemeFromJson("target-shop-import", exported, "test-admin");

      expect(importResult.success).toBe(true);
      expect(importResult.theme).toBeDefined();
      expect(importResult.theme?.shopId).toBe("target-shop-import");
    });

    it("rejette un JSON corrompu ou incomplet", async () => {
      const badJson = JSON.stringify({ broken: true });
      const res = await importThemeFromJson("target-shop-fail", badJson);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("duplique un thème d'une boutique source vers une boutique cible", async () => {
      const dupResult = await duplicateThemeToShop({
        sourceShopId: "lome-glow",
        targetShopId: "abidjan-dup",
        actorId: "owner",
      });

      expect(dupResult.success).toBe(true);
      expect(dupResult.theme?.shopId).toBe("abidjan-dup");
      expect(dupResult.theme?.name).toContain("Lomé Glow");
    });
  });
});

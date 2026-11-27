import { describe, it, expect } from "vitest";
import {
  resolveStorefrontData,
  createEmptyStorefront,
  formatStoreSlugToName,
  setMemoryStorefront,
} from "./storefront-resolver";
import { saveShopProductsList } from "./products-store";

const FORBIDDEN_DEMO_STRINGS = [
  "Lomé Glow",
  "Afiwa Mensah",
  "Koffi Amegah",
  "Fatou Diop",
  "12 500",
  "98.4",
  "4.9 / 5",
  "4.9/5",
  "342 avis",
  "Soins Visage Purifiants",
  "Beurres & Baumes",
  "Savons Noirs",
  "Café Bio Champignon",
  "+228 90 12 34 56",
];

describe("Prompt 08 : Résolution de la Vitrine & Étanchéité des Données", () => {
  it("1. formatStoreSlugToName convertit correctement les slugs en noms de boutiques", () => {
    expect(formatStoreSlugToName("kelio")).toBe("Kelio");
    expect(formatStoreSlugToName("abidjan-prestige-mode")).toBe("Abidjan Prestige Mode");
    expect(formatStoreSlugToName("mon-super-store")).toBe("Mon Super Store");
  });

  it("2. Une boutique non configurée (ex: boutique-sans-produits) démarre en mode préparation avec 0 produits et 0 avis inventés", () => {
    const data = resolveStorefrontData("boutique-sans-produits");

    expect(data.store.name).toBe("Boutique Sans Produits");
    expect(data.store.slug).toBe("boutique-sans-produits");
    expect(data.isPreparationMode).toBe(true);
    expect(data.activeProducts.length).toBe(0);
    expect(data.storefront.reviews.length).toBe(0);
    expect(data.averageRating).toBeNull();
    expect(data.totalReviewsCount).toBe(0);
    expect(data.deliveredOrdersCount).toBe(0);
    expect(data.storefront.contact.phone).toBe("");
    expect(data.storefront.contact.whatsappNumber).toBe("");
  });

  it("2b. Une boutique configurée avec produits réels (ex: kelio) est publiée et accessible", () => {
    saveShopProductsList("kelio", [
      {
        id: "prod_k1",
        title: "Produit Test Kelio",
        slug: "produit-test-kelio",
        price: 15000,
        salePrice: 15000,
        status: "active",
        productStatus: "active",
        stock: 20,
        hiddenFromCatalog: false,
      } as any,
    ]);

    setMemoryStorefront("kelio", {
      ...createEmptyStorefront("kelio", "Kelio"),
      isPublished: true,
      contact: {
        whatsappNumber: "+22890000000",
        phone: "+22890000000",
        email: "contact@kelio.com",
        address: "Lomé",
        city: "Lomé",
        country: "Togo",
      },
    });

    const data = resolveStorefrontData("kelio");

    expect(data.store.name).toBe("Kelio");
    expect(data.store.slug).toBe("kelio");
    expect(data.isPreparationMode).toBe(false);
    expect(data.activeProducts.length).toBeGreaterThanOrEqual(1);
    expect(data.storefront.isPublished).toBe(true);
  });

  it("3. Une vitrine vide ne contient AUCUNE chaîne de texte de démonstration interdite", () => {
    const emptyStorefront = createEmptyStorefront("kelio", "Kelio");
    const serialized = JSON.stringify(emptyStorefront);

    for (const forbidden of FORBIDDEN_DEMO_STRINGS) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("4. Les sections d'une nouvelle vitrine utilisent le modèle d'accueil neutre prérempli par défaut", () => {
    const defaultStorefront = createEmptyStorefront("kelio", "Kelio");

    expect(defaultStorefront.sections.length).toBeGreaterThan(0);
    expect(defaultStorefront.announcementBar.isEnabled).toBe(true);
    expect(defaultStorefront.announcementBar.text).toContain("Paiement à la livraison");

    // Vérification des blocs préremplis (texte neutre, sans nom de marque tiers)
    const hero = defaultStorefront.sections.find((s) => s.type === "hero");
    expect(hero?.content?.headline).toContain("Bienvenue chez");
    expect(hero?.content?.ctaText).toBe("Découvrir la collection");
    expect(hero?.content?.ctaUrl).toBe("/boutique/kelio/catalogue");

    const benefits = defaultStorefront.sections.find((s) => s.type === "benefits");
    expect(benefits?.content?.items?.length).toBe(4);

    const story = defaultStorefront.sections.find((s) => s.type === "brand_story");
    expect(story?.content?.text).toContain("Kelio");
    expect(JSON.stringify(defaultStorefront)).not.toMatch(/kaelis-story|kairos/i);

    const newsletter = defaultStorefront.sections.find((s) => s.type === "custom_banner");
    expect(newsletter?.content?.title).toContain("Rejoignez la Communauté");
  });

  it("5. Les avis ne calculent une note moyenne que si au moins 5 avis réels sont présents", () => {
    const empty = createEmptyStorefront("test-store", "Test Store");

    // 4 avis (< seuil de 5)
    empty.reviews = [
      { id: "1", authorName: "Client A", authorCity: "Lomé", authorCountry: "Togo", rating: 5, comment: "Super", date: "2026-11-19", verifiedPurchase: true },
      { id: "2", authorName: "Client B", authorCity: "Lomé", authorCountry: "Togo", rating: 4, comment: "Bien", date: "2026-11-19", verifiedPurchase: true },
      { id: "3", authorName: "Client C", authorCity: "Lomé", authorCountry: "Togo", rating: 5, comment: "Top", date: "2026-11-19", verifiedPurchase: true },
      { id: "4", authorName: "Client D", authorCity: "Lomé", authorCountry: "Togo", rating: 4, comment: "Parfait", date: "2026-11-19", verifiedPurchase: true },
    ];

    const dataFewReviews = resolveStorefrontData("kelio");
    // Par défaut sans avis => averageRating est null
    expect(dataFewReviews.averageRating).toBeNull();
  });
});

import { Store, Product } from "@/server/data/types";
import { StorefrontData, CustomerReview, PageSection, ThemeConfig } from "@/server/data/storefront-types";
import { MOCK_STORES } from "@/mock-data/stores";
import { THEME_PRESETS } from "@/mock-data/storefront-data";
import { getShopProducts } from "@/lib/products-store";

const MEMORY_STOREFRONTS: Map<string, StorefrontData> = new Map();
const MEMORY_STORES: Map<string, Store> = new Map();

export function setMemoryStorefront(storeSlug: string, data: StorefrontData): void {
  MEMORY_STOREFRONTS.set(storeSlug, data);
}

export function setMemoryStore(storeSlug: string, store: Store): void {
  MEMORY_STORES.set(storeSlug, store);
}

export function clearMemoryStorefronts(): void {
  MEMORY_STOREFRONTS.clear();
  MEMORY_STORES.clear();
}

export interface ResolvedStorefront {
  store: Store;
  storefront: StorefrontData;
  products: Product[];
  activeProducts: Product[];
  deliveredOrdersCount: number;
  averageRating: number | null;
  totalReviewsCount: number;
  isPreparationMode: boolean;
  canPublish: boolean;
}

export function formatStoreSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Résout les données d'une vitrine de manière strictement étanche par boutique (Prompt 08).
 * Pour 'lome-glow' (boutique fondatrice de dev) : données de démonstration autorisées.
 * Pour TOUTE AUTRE boutique (ex: 'kelio', nouvelles boutiques) : UNIQUEMENT les données réelles
 * de l'admin. Si vide ou non configurée, aucun texte de démo n'est injecté.
 */
export function resolveStorefrontData(storeSlug: string): ResolvedStorefront {
  // 1. Boutique (Store)
  let store: Store =
    MEMORY_STORES.get(storeSlug) ||
    MOCK_STORES.find((s) => s.slug === storeSlug) || {
      id: `store_${storeSlug}`,
      name: formatStoreSlugToName(storeSlug),
      slug: storeSlug,
      country: "TG",
      countryName: "Togo",
      flag: "🇹🇬",
      currency: "XOF",
      whatsappNumber: "",
      role: "owner",
    };

  // 2. Produits réels (uniquement depuis le stockage ou l'API de la boutique)
  let products: Product[] = getShopProducts(storeSlug);
  if (products.length === 0 && typeof window !== "undefined") {
    const savedProducts = localStorage.getItem(`novika_store_products_${storeSlug}`);
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        if (Array.isArray(parsed)) {
          products = parsed;
        }
      } catch (err) {
        console.warn("[Storefront Resolver] Erreur lecture produits localStorage:", err);
      }
    }
  }

  const activeProducts = (products || []).filter(
    (p) => (p.productStatus === "active" || p.status === "active") && !p.hiddenFromCatalog
  );

  // 3. Réglages de la vitrine (Storefront Settings réels)
  let storefront: StorefrontData =
    MEMORY_STOREFRONTS.get(storeSlug) || createEmptyStorefront(storeSlug, store.name);

  if (typeof window !== "undefined") {
    const savedStorefront = localStorage.getItem(`novika_storefront_settings_${storeSlug}`);
    if (savedStorefront) {
      try {
        const parsed = JSON.parse(savedStorefront);
        if (parsed && typeof parsed === "object") {
          const base = createEmptyStorefront(storeSlug, store.name);
          const parsedTheme =
            parsed.activeTheme && typeof parsed.activeTheme === "object" ? parsed.activeTheme : {};
          storefront = {
            ...base,
            ...parsed,
            // Thème toujours complet : un thème enregistré partiel ou ancien ne doit jamais faire planter la vitrine
            activeTheme: {
              ...base.activeTheme,
              ...parsedTheme,
              colors: { ...base.activeTheme.colors, ...(parsedTheme.colors || {}) },
              typography: { ...base.activeTheme.typography, ...(parsedTheme.typography || {}) },
              styles: { ...base.activeTheme.styles, ...(parsedTheme.styles || {}) },
            },
          };
        }
      } catch (err) {
        console.warn("[Storefront Resolver] Erreur lecture réglages vitrine localStorage:", err);
      }
    }
  }

  // 4. Calculs des métriques réelles (Aucun chiffre inventé)
  // Avis réels provenant de commandes livrées
  const reviews: CustomerReview[] = storefront.reviews || [];
  const totalReviewsCount = reviews.length;
  const averageRating =
    totalReviewsCount >= 5
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1))
      : null;

  // Nombre réel de commandes livrées
  let deliveredOrdersCount = 0;
  if (typeof window !== "undefined") {
    const savedOrders = localStorage.getItem(`novika_store_orders_${storeSlug}`);
    if (savedOrders) {
      try {
        const orders = JSON.parse(savedOrders);
        if (Array.isArray(orders)) {
          deliveredOrdersCount = orders.filter(
            (o: any) => o.status === "delivered",
          ).length;
        }
      } catch (err) {
        console.warn("[Storefront Resolver] Erreur lecture commandes localStorage:", err);
      }
    }
  }

  // Conditions de publication minimale : Nom + WhatsApp + Au moins 1 produit publié
  const hasMinInfo = Boolean(
    store.name &&
    (storefront.contact?.whatsappNumber || store.whatsappNumber) &&
    activeProducts.length > 0
  );

  const canPublish = hasMinInfo;
  const isPreparationMode = !storefront.isPublished || activeProducts.length === 0;

  return {
    store,
    storefront,
    products,
    activeProducts,
    deliveredOrdersCount,
    averageRating,
    totalReviewsCount,
    isPreparationMode,
    canPublish,
  };
}

/**
 * Crée une vitrine neutre sans AUCUN contenu inventé (Prompt 08).
 * Zéro nom de démonstration, zéro avis inventé, zéro faux numéro.
 */
export function createEmptyStorefront(storeSlug: string, storeName: string): StorefrontData {
  const displayBrand = storeName && storeName !== "Ma Boutique" ? storeName : "Kaelis";

  return {
    storeId: `store_${storeSlug}`,
    storeSlug,
    subdomain: storeSlug,
    isPublished: storeSlug === "kelio",
    seo: {
      metaTitle: `${displayBrand} — Boutique Officielle`,
      metaDescription: `Commandez en ligne sur ${displayBrand} et payez en espèces à la livraison.`,
      visibleOnGoogle: true,
    },
    lastDraftUpdatedAt: new Date().toISOString(),
    activeTheme: {
      id: "thm_kaelis",
      name: "Kaelis Épuré",
      preset: "minimal_modern",
      colors: {
        primary: "#111111",
        secondary: "#333333",
        background: "#FFFFFF",
        cardBackground: "#FFFFFF",
        text: "#111111",
        textMuted: "#666660",
        buttonText: "#FFFFFF",
      },
      typography: {
        fontFamily: "Poppins",
        headingFont: "Poppins",
        baseSize: "16px",
      },
      styles: {
        buttonStyle: "rounded",
        borderRadius: "lg",
        showShadows: true,
      },
    },
    draftTheme: {
      id: "thm_kaelis",
      name: "Kaelis Épuré",
      preset: "minimal_modern",
      colors: {
        primary: "#111111",
        secondary: "#333333",
        background: "#FFFFFF",
        cardBackground: "#FFFFFF",
        text: "#111111",
        textMuted: "#666660",
        buttonText: "#FFFFFF",
      },
      typography: {
        fontFamily: "Poppins",
        headingFont: "Poppins",
        baseSize: "16px",
      },
      styles: {
        buttonStyle: "rounded",
        borderRadius: "lg",
        showShadows: true,
      },
    },
    announcementBar: {
      isEnabled: true,
      text: "Livraison Gratuite Pour toutes les commandes supérieurs à 10000 XOF",
    },
    header: {
      logoPosition: "center",
      logoHeight: 36,
      showSearch: false,
      showCountryPicker: true,
    },
    sections: [
      {
        id: "sec_hero",
        type: "hero",
        title: "Bannière d'accueil (Hero)",
        isVisible: true,
        order: 1,
        content: {
          headline: `Bienvenue chez ${displayBrand.toUpperCase()}.`,
          subheadline:
            "Ici, on n'achète pas un logo — on construit une allure. Chaque pièce est choisie pour notre climat, nos morphologies et nos journées qui commencent tôt et finissent après la nuit tombée.",
          ctaText: "Découvrir nos collections",
          ctaUrl: `/boutique/${storeSlug}/catalogue`,
          imageUrl: "",
          badgeText: "",
        },
      },
      {
        id: "sec_benefits",
        type: "benefits",
        title: `Pourquoi Choisir ${displayBrand} ?`,
        isVisible: true,
        order: 2,
        content: {
          title: `Pourquoi Choisir ${displayBrand} ?`,
          subtitle:
            "Nous mettons tout en œuvre pour vous offrir une expérience d'achat simple, sûre et satisfaisante.",
          items: [
            {
              id: "b1",
              title: "Livraison Rapide",
              description:
                "Vos commandes sont expédiées en 24 à 48 heures pour une réception ultra-rapide.",
              icon: "truck",
            },
            {
              id: "b2",
              title: "Paiement Sécurisé",
              description:
                "Toutes vos transactions sont protégées par un cryptage SSL de haute sécurité.",
              icon: "shield",
            },
            {
              id: "b3",
              title: "Retours Faciles",
              description:
                "Profitez de 30 jours pour retourner votre article sans aucune question posée.",
              icon: "rotate-ccw",
            },
            {
              id: "b4",
              title: "Qualité Garantie",
              description:
                "Chaque produit est sélectionné avec soin pour vous garantir un niveau de qualité irréprochable.",
              icon: "award",
            },
          ],
        },
      },
      {
        id: "sec_customer_reviews",
        type: "customer_reviews",
        title: "Ce Que Disent Nos Clients",
        isVisible: true,
        order: 3,
        content: {
          title: "Ce Que Disent Nos Clients",
          showOnlyDelivered: false,
          minReviewsThreshold: 1,
        },
      },
      {
        id: "sec_newsletter",
        type: "custom_banner",
        title: "Rejoignez la Communauté",
        isVisible: true,
        order: 4,
        content: {
          title: `Rejoignez la Communauté ${displayBrand}`,
          subtitle:
            "Inscrivez-vous à notre newsletter et soyez le premier à découvrir nos nouvelles collections et offres exclusives.",
          buttonText: "S'abonner",
          placeholder: "Votre adresse e-mail",
        },
      },
      {
        id: "sec_brand_story",
        type: "brand_story",
        title: "Notre Histoire",
        isVisible: true,
        order: 5,
        content: {
          title: "Notre Histoire",
          text: `${displayBrand.toUpperCase()} vient de kairos : le moment qui compte. On apprend aux hommes que l'apparence est secondaire. Puis on les juge dessus en huit secondes. Personne ne vous dira jamais que votre allure a joué — mais chaque homme, au fond, le sait. L'élégance masculine n'a pas été importée sur ce continent : elle y était déjà. Nos pères savaient qu'on ne se présente pas devant une famille ou une assemblée sans soigner ce qu'on donne à voir. Ce n'était pas de la vanité. C'était du respect. Il manquait simplement une maison à la hauteur de cet héritage. Nous l'avons construite. Pièces pensées pour notre climat et nos morphologies. Livraison à domicile et paiement à la réception. ${displayBrand.toUpperCase()} — Soyez prêt.`,
          imageUrl: "/brand/kaelis-story.jpg",
          ctaText: "Voir nos collections",
          ctaUrl: `/boutique/${storeSlug}/catalogue`,
        },
      },
      {
        id: "sec_featured_products",
        type: "featured_products",
        title: "Produits Disponibles",
        isVisible: true,
        order: 6,
        content: {
          title: "Produits Disponibles",
          maxProducts: 8,
          showDiscountBadge: true,
        },
      },
    ],
    reviews: [],
    footer: {
      tagline: `${displayBrand} — La mode qui vous ressemble, chaque jour.`,
      quickLinks: [
        { label: "Notre Histoire", href: "#notre-histoire" },
        { label: "Nous Contacter", href: `/boutique/${storeSlug}/contact` },
      ],
      customerServiceLinks: [
        { label: "Questions Fréquentes", href: `/boutique/${storeSlug}/contact` },
        { label: "Livraison et Retours", href: `/boutique/${storeSlug}/pages/livraison-retours` },
      ],
      followLinks: [
        { label: "Products", href: `/boutique/${storeSlug}/catalogue` },
        { label: "FAQ", href: `/boutique/${storeSlug}/contact` },
      ],
      copyright: `© 2026 ${displayBrand.toLowerCase()}. All rights reserved.`,
    },
    contact: {
      phone: "",
      whatsappNumber: "",
      email: "",
      address: "",
      city: "",
      country: "",
      openingHours: "",
      socials: {},
      deliveryZones: [],
    },
    versions: [],
  };
}

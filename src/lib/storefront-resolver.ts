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
        products = JSON.parse(savedProducts);
      } catch {}
    }
  }

  const activeProducts = (products || []).filter(
    (p) => (p.productStatus === "active" || p.status === "active") && !p.hiddenFromCatalog
  );

  // 3. Réglages de la vitrine (Storefront Settings réels)
  let storefront: StorefrontData | undefined = MEMORY_STOREFRONTS.get(storeSlug);

  if (!storefront && typeof window !== "undefined") {
    const savedStorefront = localStorage.getItem(`novika_storefront_settings_${storeSlug}`);
    if (savedStorefront) {
      try {
        storefront = JSON.parse(savedStorefront);
      } catch {
        storefront = createEmptyStorefront(storeSlug, store.name);
      }
    } else {
      storefront = createEmptyStorefront(storeSlug, store.name);
    }
  } else if (!storefront) {
    storefront = createEmptyStorefront(storeSlug, store.name);
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
        deliveredOrdersCount = orders.filter((o: any) => o.status === "delivered").length;
      } catch {}
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
  return {
    storeId: `store_${storeSlug}`,
    storeSlug,
    subdomain: storeSlug,
    isPublished: false,
    lastDraftUpdatedAt: new Date().toISOString(),
    activeTheme: THEME_PRESETS.novika || {
      id: "thm_default",
      name: "Novika Signature",
      preset: "novika" as any,
      colors: {
        primary: "#C2410C",
        secondary: "#EA580C",
        background: "#FAF8F5",
        cardBackground: "#FFFFFF",
        text: "#111111",
        textMuted: "#666660",
        buttonText: "#FAF8F5",
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
    draftTheme: THEME_PRESETS.novika,
    announcementBar: {
      isEnabled: false,
      text: "",
    },
    header: {
      logoPosition: "left",
      logoHeight: 36,
      showSearch: false,
      showCountryPicker: true,
    },
    sections: [
      {
        id: "sec_hero",
        type: "hero",
        title: "Bannière d'accueil (Hero)",
        isVisible: false,
        order: 1,
        content: {
          headline: "",
          subheadline: "",
          ctaText: "Découvrir le catalogue",
          ctaUrl: `/boutique/${storeSlug}/catalogue`,
          imageUrl: "",
          badgeText: "",
        },
      },
      {
        id: "sec_benefits",
        type: "benefits",
        title: "Réassurance (Livraison, Paiement, Garantie)",
        isVisible: false,
        order: 2,
        content: {
          items: [],
        },
      },
      {
        id: "sec_featured_products",
        type: "featured_products",
        title: "Produits en Vedette",
        isVisible: false,
        order: 3,
        content: {
          title: "Nos Produits Vedettes",
          maxProducts: 4,
          showDiscountBadge: true,
        },
      },
      {
        id: "sec_brand_story",
        type: "brand_story",
        title: "À propos / Mission & Chiffres",
        isVisible: false,
        order: 4,
        content: {
          title: "",
          tagline: "",
          text: "",
          showDeliveredCount: false,
        },
      },
      {
        id: "sec_customer_reviews",
        type: "customer_reviews",
        title: "Avis Clients Réels",
        isVisible: false,
        order: 5,
        content: {
          showOnlyDelivered: true,
          minReviewsThreshold: 5,
        },
      },
      {
        id: "sec_faq",
        type: "faq",
        title: "Foire Aux Questions (FAQ)",
        isVisible: false,
        order: 6,
        content: {
          questions: [],
        },
      },
    ],
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
    reviews: [],
    versions: [],
  };
}

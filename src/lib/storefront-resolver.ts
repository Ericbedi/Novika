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
export function createEmptyStorefront(
  storeSlug: string,
  storeName: string,
  brand: { tagline?: string; description?: string } = {},
): StorefrontData {
  const displayBrand = storeName && storeName !== "Ma Boutique" ? storeName : "Ma Boutique";

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
      text: "Paiement à la livraison — Commandez maintenant !",
    },
    header: {
      logoPosition: "center",
      logoHeight: 36,
      showSearch: true,
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
          headline: brand.tagline || `Bienvenue chez ${displayBrand}`,
          subheadline:
            brand.description ||
            `Chez ${displayBrand}, chaque produit est sélectionné pour vous offrir qualité et confort au quotidien.`,
          ctaText: "Découvrir la collection",
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
              title: "Paiement à la Livraison",
              description:
                "Vous réglez en espèces au livreur, après avoir vérifié votre colis.",
              icon: "shield",
            },
            {
              id: "b2",
              title: "Livraison à Domicile",
              description:
                "Votre commande est livrée directement chez vous, là où vous êtes.",
              icon: "truck",
            },
            {
              id: "b3",
              title: "Service Client à l'Écoute",
              description:
                "Une question sur votre commande ? Notre équipe vous répond sur WhatsApp.",
              icon: "rotate-ccw",
            },
            {
              id: "b4",
              title: "Qualité Sélectionnée",
              description:
                "Chaque produit est choisi avec soin pour vous offrir satisfaction au quotidien.",
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
            "Inscrivez-vous à notre newsletter et soyez le premier à découvrir nos nouvelles arrivées et offres exclusives.",
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
          text: brand.description
            ? `${brand.description}`
            : `Chez ${displayBrand}, nous sélectionnons avec soin chaque produit pour vous garantir une expérience de qualité au quotidien. Commandez en ligne, recevez chez vous et payez à la livraison.`,
          imageUrl: "",
          ctaText: "Voir nos produits",
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
      tagline: `${displayBrand} — Commandez en ligne, payez à la livraison.`,
      quickLinks: [
        { label: "Notre Histoire", href: "#notre-histoire" },
        { label: "Nous Contacter", href: `/boutique/${storeSlug}/contact` },
      ],
      customerServiceLinks: [
        { label: "Questions Fréquentes", href: `/boutique/${storeSlug}/contact` },
        { label: "Livraison et Retours", href: `/boutique/${storeSlug}/pages/livraison-retours` },
      ],
      followLinks: [
        { label: "Catalogue", href: `/boutique/${storeSlug}/catalogue` },
        { label: "Contact", href: `/boutique/${storeSlug}/contact` },
      ],
      copyright: `© ${new Date().getFullYear()} ${displayBrand}. Tous droits réservés.`,
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

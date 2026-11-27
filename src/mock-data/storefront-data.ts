import {
  StorefrontData,
  ThemeConfig,
  PageSection,
  StoreContactInfo,
  CustomerReview,
  OnboardingStepState,
} from "@/server/data/storefront-types";
import { Product, Store, Order } from "@/server/data/types";

export const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "administrator",
  "support",
  "mail",
  "auth",
  "login",
  "billing",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "webhook",
  "smtp",
  "pop",
  "imap",
  "ftp",
  "root",
  "help",
  "checkout",
  "pay",
  "payment",
];

export function validateSubdomain(subdomain: string): { isValid: boolean; error?: string } {
  const normalized = subdomain.toLowerCase().trim();
  if (!normalized) {
    return { isValid: false, error: "Le sous-domaine ne peut pas être vide." };
  }
  if (normalized.length < 3 || normalized.length > 40) {
    return { isValid: false, error: "Le sous-domaine doit comporter entre 3 et 40 caractères." };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized)) {
    return {
      isValid: false,
      error: "Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets, sans tiret au début ou à la fin.",
    };
  }
  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    return {
      isValid: false,
      error: `Le sous-domaine « ${normalized} » est un mot réservé par la plateforme Kelio.`,
    };
  }
  return { isValid: true };
}

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  novika: {
    id: "thm_novika",
    name: "Kelio Signature",
    preset: "novika" as any,
    colors: {
      primary: "#0B1521",
      secondary: "#F26522",
      background: "#FAF8F5",
      cardBackground: "#FFFFFF",
      text: "#0B1521",
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
  nuit: {
    id: "thm_nuit",
    name: "Nuit (Sombre)",
    preset: "nuit" as any,
    colors: {
      primary: "#F26522",
      secondary: "#4DB8B8",
      background: "#0B1220",
      cardBackground: "#111B2B",
      text: "#FAF8F5",
      textMuted: "#94A3B8",
      buttonText: "#0B1220",
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
  terracotta: {
    id: "thm_terracotta",
    name: "Terre cuite",
    preset: "terracotta" as any,
    colors: {
      primary: "#C2410C",
      secondary: "#0F766E",
      background: "#FAF8F5",
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
  banner_hero: {
    id: "thm_banner_hero",
    name: "Bannière Hero Impact",
    preset: "banner_hero",
    colors: {
      primary: "#111111",
      secondary: "#059669",
      background: "#F3EFE6",
      cardBackground: "#FAF8F5",
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
      borderRadius: "md",
      showShadows: true,
    },
  },
  visual_gallery: {
    id: "thm_visual_gallery",
    name: "Galerie Visuelle",
    preset: "visual_gallery",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      background: "#FAF8F5",
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
  editorial: {
    id: "thm_editorial",
    name: "Éditorial & Storytelling",
    preset: "editorial",
    colors: {
      primary: "#92400E",
      secondary: "#B45309",
      background: "#FFFBEB",
      cardBackground: "#FFFFFF",
      text: "#1C1917",
      textMuted: "#78716C",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans",
      headingFont: "Plus Jakarta Sans",
      baseSize: "16px",
    },
    styles: {
      buttonStyle: "rounded",
      borderRadius: "md",
      showShadows: false,
    },
  },
  express_cod: {
    id: "thm_express_cod",
    name: "Vitrine Express COD",
    preset: "express_cod",
    colors: {
      primary: "#2563EB",
      secondary: "#1D4ED8",
      background: "#F8FAFC",
      cardBackground: "#FFFFFF",
      text: "#0F172A",
      textMuted: "#64748B",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Montserrat",
      headingFont: "Montserrat",
      baseSize: "15px",
    },
    styles: {
      buttonStyle: "pill",
      borderRadius: "full",
      showShadows: true,
    },
  },
  minimal_modern: {
    id: "thm_minimal_modern",
    name: "Minimaliste Moderne",
    preset: "minimal_modern",
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      background: "#FFFFFF",
      cardBackground: "#F4F4F5",
      text: "#09090B",
      textMuted: "#71717A",
      buttonText: "#FFFFFF",
    },
    typography: {
      fontFamily: "Inter",
      headingFont: "Inter",
      baseSize: "15px",
    },
    styles: {
      buttonStyle: "square",
      borderRadius: "sm",
      showShadows: false,
    },
  },
};

export const DEFAULT_CONTACT_LOME: StoreContactInfo = {
  phone: "",
  whatsappNumber: "",
  email: "",
  address: "",
  city: "",
  country: "",
  openingHours: "",
  socials: {},
  deliveryZones: [],
};

export const DEFAULT_REVIEWS_LOME: CustomerReview[] = [];

export const DEFAULT_SECTIONS_LOME: PageSection[] = [];

export const MOCK_STOREFRONT_LOME: StorefrontData = {
  storeId: "store_lome_glow",
  storeSlug: "lome-glow",
  subdomain: "lome-glow",
  isPublished: false,
  lastDraftUpdatedAt: new Date().toISOString(),
  activeTheme: THEME_PRESETS.novika,
  draftTheme: THEME_PRESETS.novika,
  announcementBar: {
    isEnabled: false,
    text: "",
  },
  header: {
    logoPosition: "center",
    logoHeight: 40,
    showSearch: true,
    showCountryPicker: true,
  },
  versions: [],
  sections: [],
  contact: DEFAULT_CONTACT_LOME,
  reviews: [],
  onboarding: {
    hasProducts: false,
    hasConfiguredPayment: false,
    hasConfiguredDelivery: false,
    hasCustomDomain: false,
    hasCompletedTutorial: false,
  },
};

export function calculateOnboardingProgress(
  store: Store,
  products: Product[],
  orders: Order[],
  storefront: StorefrontData,
  manualDismissedOptional: boolean = false
): {
  steps: OnboardingStepState[];
  completedCount: number;
  totalCount: number;
  percent: number;
  isAllCompleted: boolean;
} {
  const isCountryCurrencyDone = Boolean(store.country && store.currency);
  const isFirstProductDone = products.some((p) => p.productStatus === "active");
  const isHomepageDone = (storefront.sections || []).filter((s) => s.isVisible).length >= 2;
  const isThemeDone = Boolean(storefront.activeTheme?.colors?.primary);
  const isContactDone = Boolean(storefront.contact?.whatsappNumber && storefront.contact?.email);
  const isDomainDone = Boolean(storefront.customDomain || manualDismissedOptional);
  const isTestOrderAndPublishDone = Boolean((orders || []).length > 0 && storefront.isPublished);

  const steps: OnboardingStepState[] = [
    {
      id: 1,
      key: "country_currency",
      title: "Pays et devise",
      subtitle: `${store.countryName || store.country} (${store.currency}) configuré pour vos ventes locales.`,
      isCompleted: isCountryCurrencyDone,
      actionUrl: `/app/${store.slug}/reglages`,
      actionLabel: isCountryCurrencyDone ? "Modifier" : "Démarrer",
    },
    {
      id: 2,
      key: "first_product",
      title: "Ajoutez votre premier produit",
      subtitle: isFirstProductDone
        ? `${products.filter((p) => p.productStatus === "active").length} produit(s) actif(s) en catalogue.`
        : "Créez votre première fiche produit (ou générez-la avec l'IA).",
      isCompleted: isFirstProductDone,
      actionUrl: `/app/${store.slug}/produits?action=new`,
      actionLabel: isFirstProductDone ? "Gérer" : "Ajouter un produit",
    },
    {
      id: 3,
      key: "homepage",
      title: "Créez votre page d'accueil",
      subtitle: isHomepageDone
        ? `${(storefront.sections || []).filter((s) => s.isVisible).length} sections configurées pour votre vitrine.`
        : "Personnalisez la bannière, les avantages COD et les blocs de vente.",
      isCompleted: isHomepageDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne?tab=sections`,
      actionLabel: isHomepageDone ? "Éditer" : "Démarrer",
    },
    {
      id: 4,
      key: "theme",
      title: "Personnalisez votre thème",
      subtitle: `Thème actif : ${storefront.activeTheme?.name || "Kelio Signature"} (Couleurs, typographie et boutons).`,
      isCompleted: isThemeDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne?tab=theme`,
      actionLabel: isThemeDone ? "Modifier" : "Personnaliser",
    },
    {
      id: 5,
      key: "whatsapp_contact",
      title: "WhatsApp et contact",
      subtitle: isContactDone
        ? `WhatsApp : ${storefront.contact?.whatsappNumber} et e-mail configurés.`
        : "Renseignez votre numéro WhatsApp vendeur, e-mail et horaires.",
      isCompleted: isContactDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne?tab=contact`,
      actionLabel: isContactDone ? "Vérifier" : "Démarrer",
    },
    {
      id: 6,
      key: "custom_domain",
      title: "Ajoutez un domaine personnalisé",
      subtitle: storefront.customDomain
        ? `Domaine connecté : ${storefront.customDomain}`
        : "Connectez votre propre nom de domaine .com, .store ou .africa.",
      isCompleted: isDomainDone,
      isOptional: true,
      actionUrl: `/app/${store.slug}/reglages?tab=domaine`,
      actionLabel: isDomainDone ? "Gérer" : "Passer",
    },
    {
      id: 7,
      key: "test_order_publish",
      title: "Passez une commande test, puis publiez",
      subtitle: isTestOrderAndPublishDone
        ? "Votre boutique en ligne est publiée et prête à recevoir des commandes réelles."
        : "Simulez une commande COD pour vérifier le formulaire, puis activez la vitrine.",
      isCompleted: isTestOrderAndPublishDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne`,
      actionLabel: isTestOrderAndPublishDone ? "Voir la vitrine" : "Finaliser & Publier",
    },
  ];

  const totalCount = steps.length;
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    percent,
    isAllCompleted,
  };
}

export function canPublishStorefront(
  store: Store,
  products: Product[],
  storefront: StorefrontData
): {
  allowed: boolean;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  const hasActiveProduct = (products || []).some((p) => p.productStatus === "active");
  if (!hasActiveProduct) {
    missingRequirements.push("Au moins un produit actif et publié en catalogue.");
  }

  const hasContact = Boolean(storefront.contact?.whatsappNumber || storefront.contact?.email);
  if (!hasContact) {
    missingRequirements.push("Un moyen de contact renseigné (Numéro WhatsApp ou E-mail).");
  }

  const hasCurrency = Boolean(store.currency);
  if (!hasCurrency) {
    missingRequirements.push("Une devise principale configurée pour la boutique.");
  }

  return {
    allowed: missingRequirements.length === 0,
    missingRequirements,
  };
}

export const MOCK_STOREFRONT_KELIO: StorefrontData = {
  storeId: "store_kelio",
  storeSlug: "kelio",
  subdomain: "kelio",
  isPublished: false,
  lastDraftUpdatedAt: new Date().toISOString(),
  activeTheme: THEME_PRESETS.novika,
  draftTheme: THEME_PRESETS.novika,
  announcementBar: {
    isEnabled: false,
    text: "",
  },
  header: {
    logoPosition: "center",
    logoHeight: 40,
    showSearch: true,
    showCountryPicker: true,
  },
  versions: [],
  sections: [],
  contact: DEFAULT_CONTACT_LOME,
  reviews: [],
  onboarding: {
    hasProducts: false,
    hasConfiguredPayment: false,
    hasConfiguredDelivery: false,
    hasCustomDomain: false,
    hasCompletedTutorial: false,
  },
};

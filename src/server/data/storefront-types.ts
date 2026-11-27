/**
 * Types pour le module Boutique en Ligne (Vitrine publique, Éditeur CMS & Onboarding).
 */

export interface ThemeColors {
  primary: string; // Couleur d'accentuation (boutons, badges)
  secondary: string; // Couleur secondaire
  background: string; // Fond de page
  cardBackground: string; // Fond des cartes produits/sections
  text: string; // Couleur du texte principal
  textMuted: string; // Couleur du texte secondaire
  buttonText: string; // Couleur texte sur bouton principal
}

export type ThemeFontFamily = "Poppins" | "Plus Jakarta Sans" | "Inter" | "Montserrat" | "Playfair Display";
export type ButtonStyle = "rounded" | "square" | "pill";
export type CardBorderRadius = "none" | "sm" | "md" | "lg" | "full";

export interface ThemeConfig {
  id: string;
  name: string;
  preset:
    | "afriglow"
    | "dakar_prestige"
    | "lome_modern"
    | "bantu_nature"
    | "banner_hero"
    | "visual_gallery"
    | "editorial"
    | "express_cod"
    | "minimal_modern";
  colors: ThemeColors;
  typography: {
    fontFamily: ThemeFontFamily;
    headingFont: ThemeFontFamily;
    baseSize: string;
  };
  styles: {
    buttonStyle: ButtonStyle;
    borderRadius: CardBorderRadius;
    showShadows: boolean;
    hideHeaderMenu?: boolean; // Option pour masquer le menu de l'en-tête
    hideCatalog?: boolean; // Option pour masquer le catalogue complet
  };
}

export type SectionType =
  | "hero"
  | "benefits"
  | "featured_collections"
  | "featured_products"
  | "brand_story"
  | "customer_reviews"
  | "faq"
  | "custom_banner";

export interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  order: number;
  content: Record<string, any>;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  authorCity: string;
  authorCountry: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  productName?: string;
  verifiedPurchase: boolean;
}

export interface StoreContactInfo {
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  country: string;
  openingHours?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  deliveryZones?: Array<{
    country: string;
    city: string;
    delayDays: string;
    fee: number; // En sous-unités (FCFA)
  }>;
}

export interface OnboardingStepState {
  id: number;
  key:
    | "country_currency"
    | "first_product"
    | "homepage"
    | "theme"
    | "whatsapp_contact"
    | "custom_domain"
    | "test_order_publish";
  title: string;
  subtitle: string;
  isCompleted: boolean;
  isOptional?: boolean;
  actionUrl: string;
  actionLabel: string;
}

export interface StorefrontVersion {
  id: string;
  versionNumber: number;
  name: string;
  createdAt: string;
  createdBy: string;
  themeConfig: ThemeConfig;
  sections: PageSection[];
  isPublished: boolean;
}

export interface StorefrontFooterConfig {
  tagline?: string;
  quickLinks?: Array<{ label: string; href: string }>;
  customerServiceLinks?: Array<{ label: string; href: string }>;
  followLinks?: Array<{ label: string; href: string }>;
  copyright?: string;
}

export interface HomeBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  altText?: string;
}

export interface StorefrontData {
  homeBanners?: HomeBanner[]; // Bannières de la page d'accueil (carrousel, jusqu'à 5)
  homeOrder?: string[]; // Ordre d'affichage des sections de l'accueil
  storeId: string;
  storeSlug: string;
  subdomain: string;
  customDomain?: string;
  isPublished: boolean;
  publishedAt?: string;
  lastDraftUpdatedAt: string;
  activeTheme: ThemeConfig;
  draftTheme: ThemeConfig;
  announcementBar: {
    isEnabled: boolean;
    text: string;
    linkUrl?: string;
    bgColor?: string;
    textColor?: string;
  };
  header: {
    logoUrl?: string;
    logoPosition: "left" | "center";
    logoHeight: number;
    showSearch: boolean;
    showCountryPicker: boolean;
    hideHeaderMenu?: boolean; // Masquer les liens de navigation de l'en-tête
  };
  footer?: StorefrontFooterConfig;
  hideCatalog?: boolean; // Masquer la page catalogue complète (Mode tunnel direct)
  sections: PageSection[];
  contact: StoreContactInfo;
  reviews: CustomerReview[];
  versions: StorefrontVersion[];
  onboarding?: any;
  seo?: {
    visibleOnGoogle?: boolean;
    metaTitle?: string;
    metaDescription?: string;
  };
  previewToken?: {
    token: string;
    expiresAt: string;
    isRevoked: boolean;
  };
}

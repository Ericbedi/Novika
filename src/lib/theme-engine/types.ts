/**
 * Types TypeScript du Moteur de Thème « Novika Classique » (Prompt 12)
 * Architecture 100% originale : composants React + Tailwind, zéro code Liquid tiers.
 */

export type ThemePresetKey =
  | "novika-classique"
  | "sombre-or"
  | "pastel-nature"
  | "terre-cacao"
  | "elegance-ivoire";

export type ThemePaletteId =
  | "palette-1"
  | "palette-2"
  | "palette-3"
  | "palette-4"
  | "palette-5";

export interface ThemeColorPalette {
  id: ThemePaletteId;
  name: string;
  background: string; // Couleur de fond (#RRGGBB)
  text: string; // Couleur du texte (#RRGGBB)
  button: string; // Fond du bouton d'action (#RRGGBB)
  buttonText: string; // Texte du bouton (#RRGGBB)
  accent: string; // Couleur d'accentuation (#RRGGBB)
  cardBackground?: string; // Fond des cartes/blocs (#RRGGBB)
  borderColor?: string; // Bordure subtile (#RRGGBB)
}

export type ThemeFontFamily =
  | "Poppins"
  | "Inter"
  | "Plus Jakarta Sans"
  | "Montserrat";

export type PageWidthOption = "narrow" | "standard" | "wide" | "full";
export type BorderRadiusOption = "none" | "sm" | "md" | "lg" | "full";
export type SectionSpacingOption = "compact" | "normal" | "spacious";

export interface ThemeGeneralSettings {
  palettes: ThemeColorPalette[];
  activeDefaultPalette: ThemePaletteId;
  typography: {
    headingFont: ThemeFontFamily;
    bodyFont: ThemeFontFamily;
    baseSize: "14px" | "15px" | "16px";
  };
  layout: {
    pageWidth: PageWidthOption;
    cardRadius: BorderRadiusOption;
    buttonRadius: BorderRadiusOption;
    sectionSpacing: SectionSpacingOption;
    logoUrl?: string;
    logoWidth?: number;
    faviconUrl?: string;
  };
  badges?: {
    showDiscountBadge: boolean;
    showLowStockBadge: boolean;
    discountBadgeColor?: string;
    lowStockBadgeColor?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
    twitter?: string;
    snapchat?: string;
    pinterest?: string;
  };
  currency?: {
    showCurrencyCode: boolean;
    roundIntegersOnly: boolean;
  };
}

export type ThemeSectionType =
  | "announcement_bar"
  | "header"
  | "hero_banner"
  | "slideshow"
  | "image_with_text"
  | "multi_columns"
  | "multi_lines"
  | "image_collage"
  | "featured_collections"
  | "featured_products"
  | "featured_product"
  | "marquee"
  | "reassurance"
  | "verified_reviews"
  | "testimonials"
  | "comparison_table"
  | "faq"
  | "rich_text"
  | "divider"
  | "video"
  | "whatsapp_block"
  | "builder_block"
  | "contact_form"
  | "newsletter_signup"
  | "footer";

export type ProductPageTemplateType = "standard" | "long_form" | "minimal";

export interface ThemeSection<T = Record<string, any>> {
  id: string;
  type: ThemeSectionType;
  name: string;
  isVisible: boolean;
  paletteId: ThemePaletteId;
  order: number;
  settings: T;
}

export type ThemePageId = "home" | "product" | "collection" | "header" | "footer";

export interface ThemePage {
  pageId: ThemePageId;
  title: string;
  sections: ThemeSection[];
}

export interface ShopTheme {
  id: string;
  shopId: string;
  name: string;
  preset: ThemePresetKey;
  generalSettings: ThemeGeneralSettings;
  pages: Record<ThemePageId, ThemePage>;
  isPublished: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ThemeAuditEntry {
  id: string;
  shopId: string;
  version: number;
  action: "create" | "update_draft" | "publish" | "restore";
  actorId: string;
  timestamp: string;
  summary: string;
  snapshot: ShopTheme;
}

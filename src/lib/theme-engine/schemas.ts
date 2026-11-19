/**
 * Schémas Zod et Validations du Moteur de Thème « Novika Classique » (Prompt 12)
 *
 * RÈGLES FORMELLES :
 * 1. Zéro bloc de code libre (« HTML ou JavaScript personnalisé » interdit).
 * 2. Section vide = masquée pour le public (isSectionEmpty).
 * 3. Tableau comparatif : avertit l'admin si aucun critère n'est à égalité.
 * 4. Avis vérifiés : uniquement liés à des commandes réelles livrées.
 * 5. Témoignages : étiquetés « Témoignage », jamais « Achat vérifié ».
 */

import { z } from "zod";
import { ThemeSectionType } from "./types";

// ============================================================================
// 1. BANDEAU D'ANNONCE (Announcement Bar)
// ============================================================================
export const announcementItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  text: z.string().max(160, "Le texte ne doit pas dépasser 160 caractères"),
  linkUrl: z.string().url("URL invalide").or(z.string().startsWith("/")).optional().or(z.literal("")),
});

export const announcementBarSchema = z.object({
  messages: z.array(announcementItemSchema).max(5, "Maximum 5 messages"),
  infiniteScroll: z.boolean().default(false),
  speed: z.enum(["slow", "normal", "fast"]).default("normal"),
  enabled: z.boolean().default(true),
});
export type AnnouncementBarSettings = z.infer<typeof announcementBarSchema>;

// ============================================================================
// 2. BANNIÈRE D'ACCUEIL (Hero Banner)
// ============================================================================
export const heroBannerSchema = z.object({
  desktopImage: z.string().url("URL de l'image ordinateur invalide").or(z.string().startsWith("/")).optional().or(z.literal("")),
  mobileImage: z.string().url("URL de l'image mobile invalide").or(z.string().startsWith("/")).optional().or(z.literal("")),
  overlayOpacity: z.number().min(0).max(90).default(30), // 0 à 90%
  height: z.enum(["small", "medium", "large", "full"]).default("medium"),
  textAlignment: z.enum(["left", "center", "right"]).default("center"),
  textVerticalPosition: z.enum(["top", "center", "bottom"]).default("center"),
  badgeText: z.string().max(40).optional().or(z.literal("")),
  headline: z.string().max(120, "Titre trop long (max 120 caractères)").default(""),
  subheadline: z.string().max(250, "Sous-titre trop long (max 250 caractères)").default(""),
  button1Text: z.string().max(35).default(""),
  button1Link: z.string().default(""),
  button2Text: z.string().max(35).optional().or(z.literal("")),
  button2Link: z.string().optional().or(z.literal("")),
});
export type HeroBannerSettings = z.infer<typeof heroBannerSchema>;

// ============================================================================
// 3. IMAGE AVEC TEXTE (Image with Text)
// ============================================================================
export const imageWithTextSchema = z.object({
  imageUrl: z.string().url("URL d'image invalide").or(z.string().startsWith("/")).default(""),
  imageAlt: z.string().max(100).default(""),
  imagePosition: z.enum(["left", "right"]).default("left"),
  imageWidth: z.enum(["33", "50", "66"]).default("50"),
  title: z.string().max(100).default(""),
  badge: z.string().max(40).optional().or(z.literal("")),
  bodyText: z.string().max(1000).default(""),
  buttonText: z.string().max(35).default(""),
  buttonLink: z.string().default(""),
});
export type ImageWithTextSettings = z.infer<typeof imageWithTextSchema>;

// ============================================================================
// 4. COLONNES D'INFORMATION (Multi-columns / Feature Grid)
// ============================================================================
export const multiColumnItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  iconName: z.string().max(40).default("Truck"),
  imageUrl: z.string().optional().or(z.literal("")),
  title: z.string().max(60).default(""),
  text: z.string().max(250).default(""),
  linkUrl: z.string().optional().or(z.literal("")),
  linkLabel: z.string().max(30).optional().or(z.literal("")),
});

export const multiColumnsSchema = z.object({
  title: z.string().max(100).default(""),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  columns: z.array(multiColumnItemSchema).min(0).max(4, "Maximum 4 colonnes").default([]),
  mobileSwipe: z.boolean().default(true), // Balayage horizontal tactile sur mobile
});
export type MultiColumnsSettings = z.infer<typeof multiColumnsSchema>;

// ============================================================================
// 5. COLLECTIONS EN VEDETTE (Featured Collections)
// ============================================================================
export const featuredCollectionsSchema = z.object({
  title: z.string().max(100).default(""),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  collectionIds: z.array(z.string()).default([]),
  columnsDesktop: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  imageRatio: z.enum(["1:1", "3:4", "16:9"]).default("1:1"),
});
export type FeaturedCollectionsSettings = z.infer<typeof featuredCollectionsSchema>;

// ============================================================================
// 6. PRODUITS EN VEDETTE (Featured Products)
// ============================================================================
export const featuredProductsSchema = z.object({
  title: z.string().max(100).default(""),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  collectionId: z.string().optional().or(z.literal("")),
  productIds: z.array(z.string()).default([]),
  maxProducts: z.number().min(2).max(12).default(4),
  columnsDesktop: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  columnsMobile: z.union([z.literal(1), z.literal(2)]).default(2),
  showDiscountBadge: z.boolean().default(true), // « Promo » si compareAt > price
  showLowStockBadge: z.boolean().default(true), // « Stock bas » si stock <= 10
});
export type FeaturedProductsSettings = z.infer<typeof featuredProductsSchema>;

// ============================================================================
// 7. BANDEAU DÉFILANT (Marquee)
// ============================================================================
export const marqueeSchema = z.object({
  textItems: z.array(z.string().max(80)).min(0).max(10).default([]),
  speed: z.enum(["slow", "normal", "fast"]).default("normal"),
  textSize: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  separatorIcon: z.string().max(30).default("Sparkles"),
  reverse: z.boolean().default(false),
});
export type MarqueeSettings = z.infer<typeof marqueeSchema>;

// ============================================================================
// 8. RÉASSURANCE COD (Reassurance / Benefits)
// ============================================================================
export const reassuranceItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  icon: z.string().max(30).default("ShieldCheck"),
  title: z.string().max(50).default(""),
  description: z.string().max(160).default(""),
});

export const reassuranceSchema = z.object({
  title: z.string().max(80).optional().or(z.literal("")),
  items: z.array(reassuranceItemSchema).min(0).max(4, "3 à 4 blocs recommandés").default([]),
});
export type ReassuranceSettings = z.infer<typeof reassuranceSchema>;

// ============================================================================
// 9. AVIS VÉRIFIÉS (Verified Reviews - Réservé aux commandes livrées réelles)
// ============================================================================
export const verifiedReviewsSchema = z.object({
  title: z.string().max(80).default("Avis vérifiés de nos clients"),
  subtitle: z.string().max(180).default("Retours authentiques collectés auprès d'acheteurs ayant réceptionné leur commande COD."),
  maxReviews: z.number().min(3).max(12).default(6),
  showRatingSummary: z.boolean().default(true),
  showDeliveredBadgeOnly: z.boolean().default(true), // Strictement réservé aux livraisons confirmées
});
export type VerifiedReviewsSettings = z.infer<typeof verifiedReviewsSchema>;

// ============================================================================
// 10. TÉMOIGNAGES (Testimonials - Saisis par l'admin, jamais étiquetés « Vérifié »)
// ============================================================================
export const testimonialItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  authorName: z.string().max(50).default(""),
  authorRoleOrCity: z.string().max(50).default(""),
  quote: z.string().max(350).default(""),
  rating: z.number().min(1).max(5).default(5),
});

export const testimonialsSchema = z.object({
  title: z.string().max(80).default("Témoignages"),
  subtitle: z.string().max(180).default("Ce que nos clients partagent sur leur expérience."),
  items: z.array(testimonialItemSchema).min(0).max(6).default([]),
});
export type TestimonialsSettings = z.infer<typeof testimonialsSchema>;

// ============================================================================
// 11. TABLEAU COMPARATIF (Comparison Table)
// ============================================================================
export const comparisonRowSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  criterion: z.string().max(80).default(""),
  ourShopValue: z.union([z.boolean(), z.string().max(50)]).default(true),
  competitorValue: z.union([z.boolean(), z.string().max(50)]).default(false),
  isParity: z.boolean().default(false), // Vrai si le critère est à égalité ou équitable
});

export const comparisonTableSchema = z.object({
  title: z.string().max(100).default("Pourquoi nous choisir ?"),
  subtitle: z.string().max(200).default("Comparatif clair de nos engagements face aux offres génériques."),
  ourLabel: z.string().max(40).default("Notre boutique"),
  competitorLabel: z.string().max(40).default("Autres boutiques"),
  rows: z.array(comparisonRowSchema).min(0).max(10).default([]),
});
export type ComparisonTableSettings = z.infer<typeof comparisonTableSchema>;

// ============================================================================
// 12. QUESTIONS FRÉQUENTES (FAQ)
// ============================================================================
export const faqItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  question: z.string().max(150).default(""),
  answer: z.string().max(600).default(""),
});

export const faqSchema = z.object({
  title: z.string().max(100).default("Questions fréquentes"),
  subtitle: z.string().max(200).default("Tout ce que vous devez savoir avant de passer commande."),
  items: z.array(faqItemSchema).min(0).max(12).default([]),
});
export type FaqSettings = z.infer<typeof faqSchema>;

// ============================================================================
// 13. TEXTE RICHE (Rich Text)
// ============================================================================
export const richTextSchema = z.object({
  title: z.string().max(100).default(""),
  badge: z.string().max(40).optional().or(z.literal("")),
  content: z.string().max(3000).default(""),
  alignment: z.enum(["left", "center"]).default("center"),
});
export type RichTextSettings = z.infer<typeof richTextSchema>;

// ============================================================================
// 14. SÉPARATEUR (Divider)
// ============================================================================
export const dividerSchema = z.object({
  style: z.enum(["solid", "dashed", "wave", "spacer"]).default("solid"),
  spacing: z.enum(["small", "medium", "large"]).default("medium"),
});
export type DividerSettings = z.infer<typeof dividerSchema>;

// ============================================================================
// 15. VIDÉO (Video - YouTube, Vimeo ou MP4 direct)
// ============================================================================
export const videoSchema = z.object({
  title: z.string().max(100).default(""),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  videoUrl: z.string().url("URL vidéo invalide").default(""),
  aspectRatio: z.enum(["16:9", "9:16", "4:3"]).default("16:9"),
});
export type VideoSettings = z.infer<typeof videoSchema>;

// ============================================================================
// 16. BLOC WHATSAPP (WhatsApp Direct Contact)
// ============================================================================
export const whatsappBlockSchema = z.object({
  title: z.string().max(80).default("Besoin d'aide ou d'un conseil ?"),
  subtitle: z.string().max(160).default("Notre équipe est disponible directement sur WhatsApp pour répondre à vos questions."),
  phoneNumber: z.string().max(25).default(""),
  defaultMessage: z.string().max(200).default("Bonjour, j'aimerais avoir plus d'informations sur vos produits."),
  buttonLabel: z.string().max(40).default("Discuter sur WhatsApp"),
  openingHours: z.string().max(60).default("Lun - Sam : 08h00 - 19h00"),
});
export type WhatsAppBlockSettings = z.infer<typeof whatsappBlockSchema>;

// ============================================================================
// 17. PIED DE PAGE (Footer)
// ============================================================================
export const footerLinkSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  label: z.string().max(40),
  url: z.string().max(200),
});

export const footerSchema = z.object({
  aboutText: z.string().max(300).default(""),
  links: z.array(footerLinkSchema).default([]),
  showSocials: z.boolean().default(true),
  showPaymentBadges: z.boolean().default(true), // Badges COD, Wave, Orange Money, MoMo
  copyrightText: z.string().max(120).default(""),
});
export type FooterSettings = z.infer<typeof footerSchema>;

// ============================================================================
// REGISTRE DE SCHÉMAS PAR TYPE DE SECTION
// ============================================================================
export const SECTION_SCHEMAS: Record<ThemeSectionType, z.ZodTypeAny> = {
  announcement_bar: announcementBarSchema,
  hero_banner: heroBannerSchema,
  image_with_text: imageWithTextSchema,
  multi_columns: multiColumnsSchema,
  featured_collections: featuredCollectionsSchema,
  featured_products: featuredProductsSchema,
  marquee: marqueeSchema,
  reassurance: reassuranceSchema,
  verified_reviews: verifiedReviewsSchema,
  testimonials: testimonialsSchema,
  comparison_table: comparisonTableSchema,
  faq: faqSchema,
  rich_text: richTextSchema,
  divider: dividerSchema,
  video: videoSchema,
  whatsapp_block: whatsappBlockSchema,
  footer: footerSchema,
};

/**
 * Règle Prompt 08 / Prompt 12 :
 * Vérifie si une section est vide de contenu.
 * Si vide, elle est MASQUÉE pour le public.
 */
export function isSectionEmpty(type: ThemeSectionType, settings: any): boolean {
  if (!settings) return true;

  switch (type) {
    case "announcement_bar": {
      const messages = settings.messages || [];
      return messages.length === 0 || messages.every((m: any) => !m?.text?.trim());
    }
    case "hero_banner": {
      return !settings.headline?.trim() && !settings.desktopImage?.trim() && !settings.subheadline?.trim();
    }
    case "image_with_text": {
      return !settings.title?.trim() && !settings.imageUrl?.trim() && !settings.bodyText?.trim();
    }
    case "multi_columns": {
      const cols = settings.columns || [];
      return cols.length === 0 || cols.every((c: any) => !c?.title?.trim() && !c?.text?.trim());
    }
    case "featured_collections": {
      const colls = settings.collectionIds || [];
      return colls.length === 0;
    }
    case "featured_products": {
      const prods = settings.productIds || [];
      return prods.length === 0 && !settings.collectionId;
    }
    case "marquee": {
      const items = settings.textItems || [];
      return items.length === 0 || items.every((i: any) => !String(i).trim());
    }
    case "reassurance": {
      const items = settings.items || [];
      return items.length === 0 || items.every((i: any) => !i?.title?.trim());
    }
    case "verified_reviews": {
      // Les avis dépendent des commandes livrées réelles
      return false; // Géré dynamiquement selon les commandes livrées
    }
    case "testimonials": {
      const items = settings.items || [];
      return items.length === 0 || items.every((i: any) => !i?.quote?.trim() && !i?.authorName?.trim());
    }
    case "comparison_table": {
      const rows = settings.rows || [];
      return rows.length === 0 || rows.every((r: any) => !r?.criterion?.trim());
    }
    case "faq": {
      const items = settings.items || [];
      return items.length === 0 || items.every((i: any) => !i?.question?.trim());
    }
    case "rich_text": {
      return !settings.title?.trim() && !settings.content?.trim();
    }
    case "divider": {
      return false; // Un séparateur a toujours un style par défaut
    }
    case "video": {
      return !settings.videoUrl?.trim();
    }
    case "whatsapp_block": {
      return !settings.phoneNumber?.trim();
    }
    case "footer": {
      return !settings.aboutText?.trim() && (!settings.links || settings.links.length === 0);
    }
    default:
      return false;
  }
}

/**
 * Règle Prompt 12 : Tableau comparatif
 * Avertit l'admin si aucun critère n'est à égalité (transparence et crédibilité).
 */
export function validateComparisonParity(rows: Array<{
  criterion?: string;
  ourShopValue?: boolean | string;
  competitorValue?: boolean | string;
  isParity?: boolean;
}>): { hasParity: boolean; warning?: string } {
  if (!rows || rows.length === 0) {
    return { hasParity: true };
  }

  const hasParityRow = rows.some((r) => {
    if (r.isParity) return true;
    if (r.ourShopValue === r.competitorValue) return true;
    return false;
  });

  if (!hasParityRow) {
    return {
      hasParity: false,
      warning:
        "Conseil de crédibilité commerciale : aucun critère n'est à égalité avec la concurrence. Pour maximiser la confiance des clients COD, incluez au moins un point d'équité ou standard du marché.",
    };
  }

  return { hasParity: true };
}

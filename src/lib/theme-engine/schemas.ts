/**
 * Schémas Zod et Validations du Moteur de Thème « Kelio Classique » (Prompt 12)
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
// 18. DIAPORAMA (Slideshow / Curseur d'images - Prompt 12-b)
// ============================================================================
export const slideItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  headline: z.string().max(80).default(""),
  subheadline: z.string().max(160).optional().or(z.literal("")),
  desktopImage: z.string().default(""),
  mobileImage: z.string().optional().or(z.literal("")),
  button1Label: z.string().max(30).optional().or(z.literal("")),
  button1Url: z.string().max(200).optional().or(z.literal("")),
  button2Label: z.string().max(30).optional().or(z.literal("")),
  button2Url: z.string().max(200).optional().or(z.literal("")),
  overlayOpacity: z.number().min(0).max(90).default(30),
});

export const slideshowSchema = z.object({
  slides: z.array(slideItemSchema).min(1).max(5).default([]),
  autoplaySpeed: z.number().min(3).max(10).default(5),
  showArrows: z.boolean().default(true),
});
export type SlideshowSettings = z.infer<typeof slideshowSchema>;

// ============================================================================
// 19. MULTI-LIGNES (Multi-lines - Prompt 12-b)
// ============================================================================
export const multiLineItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  title: z.string().max(80).default(""),
  text: z.string().max(400).default(""),
  imageUrl: z.string().default(""),
  imagePosition: z.enum(["left", "right"]).default("left"),
});

export const multiLinesSchema = z.object({
  title: z.string().max(100).optional().or(z.literal("")),
  lines: z.array(multiLineItemSchema).min(1).max(6).default([]),
});
export type MultiLinesSettings = z.infer<typeof multiLinesSchema>;

// ============================================================================
// 20. COLLAGE D'IMAGES (Image Collage - Prompt 12-b)
// ============================================================================
export const collageItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  imageUrl: z.string().default(""),
  caption: z.string().max(80).optional().or(z.literal("")),
  linkUrl: z.string().max(200).optional().or(z.literal("")),
});

export const imageCollageSchema = z.object({
  title: z.string().max(100).optional().or(z.literal("")),
  images: z.array(collageItemSchema).min(2).max(4).default([]),
});
export type ImageCollageSettings = z.infer<typeof imageCollageSchema>;

// ============================================================================
// 21. PRODUIT UNIQUE EN VEDETTE (Featured Product - Prompt 12-b)
// ============================================================================
export const featuredProductSchema = z.object({
  productId: z.string().default(""),
  showCodForm: z.boolean().default(true),
  showReviews: z.boolean().default(true),
});
export type FeaturedProductSettings = z.infer<typeof featuredProductSchema>;

// ============================================================================
// 22. FORMULAIRE DE CONTACT (Contact Form - Prompt 12-b)
// ============================================================================
export const contactFormSchema = z.object({
  title: z.string().max(100).default("Contactez-nous"),
  subtitle: z.string().max(200).default("Notre équipe vous répond sous 24h ou immédiatement par WhatsApp."),
  whatsappNumber: z.string().max(25).default(""),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  openingHours: z.string().max(80).default("Lun - Sam : 08h00 - 18h30"),
});
export type ContactFormSettings = z.infer<typeof contactFormSchema>;

// ============================================================================
// 23. INSCRIPTION AUX OFFRES (Newsletter Signup - Prompt 12-b)
// ============================================================================
export const newsletterSignupSchema = z.object({
  title: z.string().max(80).default("Offres exclusives & Ventes privées"),
  subtitle: z.string().max(160).default("Recevez nos réductions WhatsApp avant tout le monde."),
  buttonLabel: z.string().max(30).default("S'inscrire aux offres"),
  consentText: z.string().max(200).default("En vous inscrivant, vous acceptez de recevoir nos offres promotionnelles par message. Désinscription possible en un clic."),
});
export type NewsletterSignupSettings = z.infer<typeof newsletterSignupSchema>;

// ============================================================================
// 24. CONSTRUCTEUR MODULAIRE (Builder Block - Prompt 12-b, ZÉRO HTML LIBRE)
// ============================================================================
export const builderBlockItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 9)),
  type: z.enum(["text", "accordion", "image", "columns", "icon_text"]),
  title: z.string().max(100).optional().or(z.literal("")),
  content: z.string().max(1500).optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
});

export const builderBlockSchema = z.object({
  title: z.string().max(100).optional().or(z.literal("")),
  blocks: z.array(builderBlockItemSchema).min(1).max(8).default([]),
});
export type BuilderBlockSettings = z.infer<typeof builderBlockSchema>;

// ============================================================================
// 25. EN-TÊTE DE VITRINE (Header - Prompt 12-b)
// ============================================================================
export const headerSchema = z.object({
  logoPosition: z.enum(["left", "center"]).default("left"),
  isSticky: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  showWhatsAppButton: z.boolean().default(true),
  showCountrySelector: z.boolean().default(false),
});
export type HeaderSettings = z.infer<typeof headerSchema>;

// ============================================================================
// 26. ARTICLES DE BLOG EN VEDETTE (Featured Blog Posts - Prompt 12-b Phase 2)
// ============================================================================
export const featuredBlogPostsSchema = z.object({
  title: z.string().max(100).default("Nos Derniers Conseils & Articles"),
  subtitle: z.string().max(200).default("Guides pratiques, santé naturelle et conseils d'utilisation."),
  postCount: z.number().min(1).max(6).default(3),
  limit: z.number().min(1).max(6).optional(),
  showDate: z.boolean().default(true),
  showAuthor: z.boolean().default(true),
});
export type FeaturedBlogPostsSettings = z.infer<typeof featuredBlogPostsSchema>;

// ============================================================================
// REGISTRE DE SCHÉMAS PAR TYPE DE SECTION
// ============================================================================
export const SECTION_SCHEMAS: Record<ThemeSectionType, z.ZodTypeAny> = {
  announcement_bar: announcementBarSchema,
  header: headerSchema,
  hero_banner: heroBannerSchema,
  slideshow: slideshowSchema,
  image_with_text: imageWithTextSchema,
  multi_columns: multiColumnsSchema,
  multi_lines: multiLinesSchema,
  image_collage: imageCollageSchema,
  featured_collections: featuredCollectionsSchema,
  featured_products: featuredProductsSchema,
  featured_product: featuredProductSchema,
  featured_blog_posts: featuredBlogPostsSchema,
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
  builder_block: builderBlockSchema,
  contact_form: contactFormSchema,
  newsletter_signup: newsletterSignupSchema,
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
    case "slideshow": {
      const slides = settings.slides || [];
      return slides.length === 0 || slides.every((s: any) => !s?.headline?.trim() && !s?.desktopImage?.trim());
    }
    case "multi_lines": {
      const lines = settings.lines || [];
      return lines.length === 0 || lines.every((l: any) => !l?.title?.trim() && !l?.text?.trim());
    }
    case "image_collage": {
      const images = settings.images || [];
      return images.length === 0 || images.every((img: any) => !img?.imageUrl?.trim());
    }
    case "featured_product": {
      return !settings.productId?.trim();
    }
    case "contact_form": {
      return !settings.whatsappNumber?.trim() && !settings.recipientEmail?.trim();
    }
    case "newsletter_signup": {
      return !settings.title?.trim();
    }
    case "builder_block": {
      const blocks = settings.blocks || [];
      return blocks.length === 0 || blocks.every((b: any) => !b?.title?.trim() && !b?.content?.trim());
    }
    case "featured_blog_posts": {
      return !settings.title?.trim() && !settings.subtitle?.trim();
    }
    case "header": {
      return false; // L'en-tête est toujours fonctionnel
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

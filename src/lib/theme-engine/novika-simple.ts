/**
 * Modèle « Novika Simple » (Prompt 21-b)
 *
 * Vitrine épurée en 8 sections modifiables :
 * 1. Barre annonce (livraison, paiement cash)
 * 2. Héros (titre, sous-titre, image via ImagePicker, bouton d'action)
 * 3. Coups de cœur (produits phares du catalogue)
 * 4. Bannière promotionnelle (offre spéciale avec image)
 * 5. Notre histoire (texte de présentation & réassurance)
 * 6. Pourquoi nous choisir (3 arguments forts avec icônes)
 * 7. Avis réels de clients (commandes livrées)
 * 8. Appel final (commande directe ou contact WhatsApp)
 *
 * RÈGLES FORMELLES :
 * - Masquage automatique des sections vides pour les visiteurs publics (zéro bloc vide orphelin).
 * - Restauration du contenu d'origine par section.
 * - ImagePicker intégré dans toutes les sections contenant des images.
 */

import { ThemeSection, ThemeSectionType } from "./types";

export interface NovikaSimpleDefaultContent {
  type: ThemeSectionType;
  name: string;
  paletteId: "palette-1" | "palette-2" | "palette-3" | "palette-4" | "palette-5";
  settings: Record<string, any>;
}

export const NOVIKA_SIMPLE_DEFAULTS: Record<string, NovikaSimpleDefaultContent> = {
  announcement_bar: {
    type: "announcement_bar",
    name: "Barre d'annonce",
    paletteId: "palette-2",
    settings: {
      messages: [
        {
          id: "msg_ann_1",
          text: "🚚 Livraison express & Règlement 100% en espèces à la livraison (COD)",
          linkUrl: "",
        },
        {
          id: "msg_ann_2",
          text: "⭐ Produits authentiques et garantis — Commandez en toute confiance",
          linkUrl: "",
        },
      ],
      infiniteScroll: true,
      speed: "normal",
      enabled: true,
    },
  },
  hero_banner: {
    type: "hero_banner",
    name: "Héros",
    paletteId: "palette-1",
    settings: {
      headline: "Découvrez notre sélection exclusive",
      subheadline: "Commandez en ligne en 30 secondes et payez en espèces à la livraison.",
      badgeText: "Nouveauté COD",
      height: "medium",
      overlayOpacity: 25,
      textAlignment: "center",
      textVerticalPosition: "center",
      button1Text: "Voir les produits",
      button1Link: "#catalog-section",
      desktopImage: "/banners/hero-lome.jpg",
      mobileImage: "",
    },
  },
  featured_products: {
    type: "featured_products",
    name: "Coups de cœur",
    paletteId: "palette-1",
    settings: {
      title: "Nos Coups de Cœur",
      subtitle: "Les produits les plus demandés et recommandés par nos clients.",
      maxProducts: 4,
      columnsDesktop: 4,
      columnsMobile: 2,
      showDiscountBadge: true,
      showLowStockBadge: true,
      productIds: [],
    },
  },
  image_with_text: {
    type: "image_with_text",
    name: "Bannière promotionnelle",
    paletteId: "palette-3",
    settings: {
      title: "Offre Spéciale du Moment",
      badge: "Livraison Offerte",
      bodyText: "Profitez de nos offres exclusives dès aujourd'hui. Expédition express à domicile ou sur votre lieu de travail avec vérification du colis avant paiement.",
      buttonText: "Commander maintenant",
      buttonLink: "#catalog-section",
      imagePosition: "right",
      imageWidth: "50",
      imageUrl: "/banners/promo-lome.jpg",
      imageAlt: "Bannière promotionnelle",
    },
  },
  rich_text: {
    type: "rich_text",
    name: "Notre histoire",
    paletteId: "palette-1",
    settings: {
      title: "Notre Engagement & Notre Histoire",
      subtitle: "La qualité au meilleur prix, livré en toute confiance.",
      content: "<p>Nous sélectionnons rigoureusement des articles de haute qualité pour vous apporter entière satisfaction. Grâce à notre formule de paiement à la réception, vous avez la certitude de payer uniquement ce que vous avez entre les mains.</p>",
      textAlignment: "center",
    },
  },
  reassurance: {
    type: "reassurance",
    name: "Pourquoi nous choisir",
    paletteId: "palette-3",
    settings: {
      title: "Pourquoi nous choisir",
      subtitle: "Nos 3 garanties absolues pour chaque commande",
      items: [
        {
          id: "rea_1",
          iconName: "Truck",
          title: "Livraison Rapide",
          description: "Expédition express en 24h à 48h directement chez vous.",
        },
        {
          id: "rea_2",
          iconName: "ShieldCheck",
          title: "Paiement à la Livraison",
          description: "Réglez en espèces au livreur uniquement après vérification du colis.",
        },
        {
          id: "rea_3",
          iconName: "PhoneCall",
          title: "Support WhatsApp Réactif",
          description: "Une équipe dédiée vous accompagne du lundi au samedi.",
        },
      ],
    },
  },
  verified_reviews: {
    type: "verified_reviews",
    name: "Avis clients réels",
    paletteId: "palette-1",
    settings: {
      title: "Avis Clients Vérifiés",
      subtitle: "Avis authentiques collectés après livraison effective.",
      maxReviews: 6,
      showRatingSummary: true,
      showDeliveredBadgeOnly: true,
    },
  },
  whatsapp_block: {
    type: "whatsapp_block",
    name: "Appel à l'action final",
    paletteId: "palette-4",
    settings: {
      title: "Une Question ou Commande Directe ?",
      subtitle: "Notre équipe WhatsApp vous répond en quelques minutes.",
      phoneNumber: "+22890001122",
      defaultMessage: "Bonjour, je souhaite commander un article de votre boutique.",
      buttonLabel: "Commander sur WhatsApp",
      openingHours: "Disponible du lundi au samedi de 08h à 19h",
    },
  },
};

/**
 * Génère les 8 sections initiales du modèle « Novika Simple »
 */
export function createNovikaSimpleSections(): ThemeSection[] {
  const keys: ThemeSectionType[] = [
    "announcement_bar",
    "hero_banner",
    "featured_products",
    "image_with_text",
    "rich_text",
    "reassurance",
    "verified_reviews",
    "whatsapp_block",
  ];

  return keys.map((type, index) => {
    const def = NOVIKA_SIMPLE_DEFAULTS[type];
    return {
      id: `sec_novika_simple_${type}`,
      type,
      name: def?.name || type,
      isVisible: true,
      paletteId: def?.paletteId || "palette-1",
      order: index + 1,
      settings: JSON.parse(JSON.stringify(def?.settings || {})),
    };
  });
}

/**
 * Récupère le contenu par défaut pour réinitialiser une section (« Restaurer le contenu d'origine »)
 */
export function getSectionDefaultSettings(sectionType: ThemeSectionType): Record<string, any> | null {
  const def = NOVIKA_SIMPLE_DEFAULTS[sectionType];
  return def ? JSON.parse(JSON.stringify(def.settings)) : null;
}

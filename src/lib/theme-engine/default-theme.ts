/**
 * Thème de départ « Novika Classique » pour nouvelle boutique (Prompt 12)
 *
 * CRITÈRE D'ACCEPTATION NON NÉGOCIABLE :
 * - Les modèles de départ d'une nouvelle boutique contiennent des sections VIDES.
 * - Aucun texte factice, aucun faux produit, aucun faux avis n'est affiché au public.
 * - Pour le visiteur public, toute section vide est automatiquement masquée (isSectionEmpty = true).
 * - Pour l'admin en mode édition, elle affiche un bloc d'invitation avec contour pointillé.
 */

import { ShopTheme, ThemeSection } from "./types";
import { THEME_PRESETS } from "./presets";

export function createDefaultNewShopTheme(shopId: string, shopName = "Ma Boutique"): ShopTheme {
  const basePreset = THEME_PRESETS["novika-classique"];

  // Sections initiales de la page d'accueil (VIDES de contenu par défaut)
  const homeSections: ThemeSection[] = [
    {
      id: "sec_announcement",
      type: "announcement_bar",
      name: "Bandeau d'annonce",
      isVisible: true,
      paletteId: "palette-2", // Sombre contrasté
      order: 1,
      settings: {
        messages: [], // VIDE : masqué pour le public jusqu'à ce que l'admin écrive un message
        infiniteScroll: false,
        speed: "normal",
        enabled: true,
      },
    },
    {
      id: "sec_hero",
      type: "hero_banner",
      name: "Bannière d'accueil (Hero)",
      isVisible: true,
      paletteId: "palette-1",
      order: 2,
      settings: {
        desktopImage: "",
        mobileImage: "",
        overlayOpacity: 30,
        height: "medium",
        textAlignment: "center",
        textVerticalPosition: "center",
        headline: "", // VIDE
        subheadline: "",
        button1Text: "",
        button1Link: "",
      },
    },
    {
      id: "sec_reassurance",
      type: "reassurance",
      name: "Réassurance COD",
      isVisible: true,
      paletteId: "palette-3", // Doux ambré
      order: 3,
      settings: {
        title: "",
        items: [], // VIDE : l'admin renseigne ses vrais engagements (ex: Paiement à la livraison, Délai réel)
      },
    },
    {
      id: "sec_featured_products",
      type: "featured_products",
      name: "Produits en vedette",
      isVisible: true,
      paletteId: "palette-1",
      order: 4,
      settings: {
        title: "",
        subtitle: "",
        productIds: [], // VIDE : dépend des vrais produits ajoutés au catalogue
        maxProducts: 4,
        columnsDesktop: 4,
        columnsMobile: 2,
        showDiscountBadge: true,
        showLowStockBadge: true,
      },
    },
    {
      id: "sec_multi_columns",
      type: "multi_columns",
      name: "Colonnes d'information",
      isVisible: true,
      paletteId: "palette-1",
      order: 5,
      settings: {
        title: "",
        subtitle: "",
        columns: [], // VIDE
        mobileSwipe: true,
      },
    },
    {
      id: "sec_comparison_table",
      type: "comparison_table",
      name: "Tableau comparatif",
      isVisible: true,
      paletteId: "palette-5",
      order: 6,
      settings: {
        title: "",
        subtitle: "",
        ourLabel: shopName,
        competitorLabel: "Autres boutiques",
        rows: [], // VIDE
      },
    },
    {
      id: "sec_verified_reviews",
      type: "verified_reviews",
      name: "Avis vérifiés",
      isVisible: true,
      paletteId: "palette-1",
      order: 7,
      settings: {
        title: "Avis vérifiés",
        subtitle: "Avis authentiques collectés après livraison.",
        maxReviews: 6,
        showRatingSummary: true,
        showDeliveredBadgeOnly: true, // UNIQUEMENT des commandes réelles livrées
      },
    },
    {
      id: "sec_faq",
      type: "faq",
      name: "Questions fréquentes",
      isVisible: true,
      paletteId: "palette-1",
      order: 8,
      settings: {
        title: "",
        subtitle: "",
        items: [], // VIDE
      },
    },
    {
      id: "sec_whatsapp",
      type: "whatsapp_block",
      name: "Assistance WhatsApp",
      isVisible: true,
      paletteId: "palette-4", // Émeraude WhatsApp
      order: 9,
      settings: {
        title: "",
        subtitle: "",
        phoneNumber: "", // VIDE
        defaultMessage: `Bonjour ${shopName}, j'aimerais avoir plus d'informations.`,
        buttonLabel: "Discuter sur WhatsApp",
        openingHours: "Lun - Sam : 08h00 - 19h00",
      },
    },
    {
      id: "sec_footer",
      type: "footer",
      name: "Pied de page",
      isVisible: true,
      paletteId: "palette-2", // Sombre
      order: 10,
      settings: {
        aboutText: "",
        links: [],
        showSocials: true,
        showPaymentBadges: true,
        copyrightText: `© ${new Date().getFullYear()} ${shopName}. Tous droits réservés.`,
      },
    },
  ];

  return {
    id: `theme_${shopId}_v1`,
    shopId,
    name: `${shopName} — Thème Novika Classique`,
    preset: "novika-classique",
    generalSettings: basePreset.generalSettings,
    pages: {
      home: {
        pageId: "home",
        title: "Page d'accueil",
        sections: homeSections,
      },
      product: {
        pageId: "product",
        title: "Page produit",
        sections: [],
      },
      collection: {
        pageId: "collection",
        title: "Catalogue & Collections",
        sections: [],
      },
      header: {
        pageId: "header",
        title: "En-tête",
        sections: [],
      },
      footer: {
        pageId: "footer",
        title: "Pied de page",
        sections: [],
      },
    },
    isPublished: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Crée un thème initial pour Lomé Glow (boutique de démonstration)
 * avec des contenus de démonstration réels mais conformes à la charte.
 */
export function createLomeGlowDemoTheme(): ShopTheme {
  const theme = createDefaultNewShopTheme("lome-glow", "Lomé Glow Cosmétiques");
  theme.isPublished = true;
  theme.publishedAt = new Date().toISOString();

  // Remplir quelques sections avec du contenu de démonstration propre
  const home = theme.pages.home;
  home.sections = home.sections.map((sec) => {
    if (sec.id === "sec_announcement") {
      return {
        ...sec,
        settings: {
          messages: [
            { id: "m1", text: "🚚 Livraison express 24h à Lomé — Paiement en espèces à la livraison (COD) !", linkUrl: "" },
            { id: "m2", text: "⭐ Produits 100% naturels et testés dermatologiquement en Afrique de l'Ouest", linkUrl: "" },
          ],
          infiniteScroll: false,
          speed: "normal",
          enabled: true,
        },
      };
    }
    if (sec.id === "sec_hero") {
      return {
        ...sec,
        settings: {
          desktopImage: "/banners/hero-lome.jpg",
          mobileImage: "",
          overlayOpacity: 25,
          height: "large",
          textAlignment: "center",
          textVerticalPosition: "center",
          badgeText: "Nouveauté Cosmétique COD",
          headline: "Révélez l'éclat naturel de votre peau",
          subheadline: "Formules pures adaptées au climat tropical. Commandez en 1 clic et réglez en toute confiance à la réception.",
          button1Text: "Commander avec paiement à la livraison",
          button1Link: "#catalog-section",
        },
      };
    }
    if (sec.id === "sec_reassurance") {
      return {
        ...sec,
        settings: {
          title: "Vos garanties de commande",
          items: [
            { id: "r1", icon: "Truck", title: "Paiement à la livraison", description: "Vous inspectez votre colis avant de régler le livreur en espèces." },
            { id: "r2", icon: "Clock", title: "Livraison rapide 24h-48h", description: "Expédition immédiate sur Lomé, Cotonou, Abidjan et Dakar." },
            { id: "r3", icon: "ShieldCheck", title: "Qualité certifiée", description: "Ingrédients d'origine contrôlée, sans hydroquinone ni perturbateurs." },
            { id: "r4", icon: "Phone", title: "Confirmation téléphonique", description: "Notre équipe vous appelle sous 15 minutes pour valider vos coordonnées." },
          ],
        },
      };
    }
    if (sec.id === "sec_comparison_table") {
      return {
        ...sec,
        settings: {
          title: "Pourquoi commander sur Lomé Glow ?",
          subtitle: "La garantie d'un service transparent et d'un suivi sur mesure.",
          ourLabel: "Lomé Glow",
          competitorLabel: "Vendeurs informels",
          rows: [
            { id: "c1", criterion: "Paiement en espèces à la remise", ourShopValue: true, competitorValue: false, isParity: false },
            { id: "c2", criterion: "Traçabilité des ingrédients", ourShopValue: true, competitorValue: false, isParity: false },
            { id: "c3", criterion: "Service client WhatsApp joignable", ourShopValue: true, competitorValue: true, isParity: true }, // POINT DE PARITÉ
            { id: "c4", criterion: "Échange gratuit si colis abîmé", ourShopValue: true, competitorValue: false, isParity: false },
          ],
        },
      };
    }
    if (sec.id === "sec_faq") {
      return {
        ...sec,
        settings: {
          title: "Foire aux questions",
          subtitle: "Tout comprendre sur le paiement à la livraison et nos délais.",
          items: [
            { id: "q1", question: "Dois-je payer avant la livraison ?", answer: "Non, absolument pas. Vous ne payez qu'à la réception de votre colis entre les mains de notre livreur partenaire." },
            { id: "q2", question: "Puis-je ouvrir et vérifier le paquet ?", answer: "Oui, vous avez le droit de vérifier l'intégrité de l'emballage et du produit en présence du livreur avant de régler." },
            { id: "q3", question: "Quels sont les modes de paiement acceptés ?", answer: "Vous pouvez régler en espèces (FCFA) ou par Mobile Money (T-Money, Flooz, Wave, Orange Money) directement au livreur." },
          ],
        },
      };
    }
    if (sec.id === "sec_whatsapp") {
      return {
        ...sec,
        settings: {
          title: "Une question avant de commander ?",
          subtitle: "Écrivez-nous sur WhatsApp pour un conseil personnalisé sur nos produits.",
          phoneNumber: "+22890000000",
          defaultMessage: "Bonjour Lomé Glow, j'aimerais avoir un conseil pour ma peau.",
          buttonLabel: "Discuter avec notre conseillère",
          openingHours: "Lun - Sam : 08h00 - 19h00",
        },
      };
    }
    if (sec.id === "sec_footer") {
      return {
        ...sec,
        settings: {
          aboutText: "Lomé Glow est votre boutique de référence pour des soins naturels d'exception avec garantie de paiement à la livraison.",
          links: [
            { id: "l1", label: "Catalogue", url: "/boutique/lome-glow/catalogue" },
            { id: "l2", label: "Conditions de livraison", url: "/boutique/lome-glow/contact" },
            { id: "l3", label: "Nous contacter", url: "/boutique/lome-glow/contact" },
          ],
          showSocials: true,
          showPaymentBadges: true,
          copyrightText: "© 2026 Lomé Glow Cosmétiques. Propulsé par Novika.",
        },
      };
    }
    return sec;
  });

  return theme;
}

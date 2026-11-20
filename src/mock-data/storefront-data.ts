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
      error: `Le sous-domaine « ${normalized} » est un mot réservé par la plateforme Novika.`,
    };
  }
  return { isValid: true };
}

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  novika: {
    id: "thm_novika",
    name: "Novika Signature",
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
      primary: "#111111", // Noir puissant avec fort contraste
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
      primary: "#059669", // Émeraude profond beauté
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
      primary: "#92400E", // Ambre terreux chaleureux
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
      primary: "#2563EB", // Bleu royal conversion direct
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
      primary: "#18181B", // Noir zinc épuré
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
  phone: "+228 90 12 34 56",
  whatsappNumber: "+22890123456",
  email: "contact@lomeglowing.com",
  address: "Boulevard du 13 Janvier, Face Échangeur Nyékonakpoè",
  city: "Lomé",
  country: "Togo",
  openingHours: "Lundi au Samedi : 08h00 - 19h30 | Dimanche : Fermé",
  socials: {
    facebook: "https://facebook.com/lomeglowing",
    instagram: "https://instagram.com/lomeglowing",
    tiktok: "https://tiktok.com/@lomeglowing",
  },
  deliveryZones: [
    { country: "Togo", city: "Lomé (Intra-muros)", delayDays: "Livraison le jour même (2h-4h)", fee: 1000 },
    { country: "Togo", city: "Agoè, Baguida & Périphérie", delayDays: "Livraison 24h", fee: 1500 },
    { country: "Côte d'Ivoire", city: "Abidjan (Cocody, Yopougon, Marcory)", delayDays: "24h - 48h chrono", fee: 2000 },
    { country: "Sénégal", city: "Dakar & Almadies", delayDays: "48h express", fee: 2500 },
    { country: "Bénin", city: "Cotonou & Calavi", delayDays: "24h chrono", fee: 1500 },
  ],
};

export const DEFAULT_REVIEWS_LOME: CustomerReview[] = [
  {
    id: "rev_01",
    authorName: "Afiwa Mensah",
    authorCity: "Lomé",
    authorCountry: "Togo",
    rating: 5,
    comment:
      "J'étais sceptique sur le café aux champignons mais après 2 semaines je ressens une clarté d'esprit incroyable et plus aucun coup de fatigue à 14h. Le livreur est venu à Agoè en moins de 3 heures et j'ai payé en cash après vérification !",
    date: "12 nov. 2026",
    productName: "Café Bio Champignon Vitality",
    verifiedPurchase: true,
  },
  {
    id: "rev_02",
    authorName: "Koffi Amegah",
    authorCity: "Lomé",
    authorCountry: "Togo",
    rating: 5,
    comment:
      "Service impeccable. La closeuse m'a appelé 5 minutes après ma commande pour confirmer mon adresse. Produit authentique, bien emballé dans du papier kraft renforcé.",
    date: "09 nov. 2026",
    productName: "Sérum Visage Anti-Taches & Éclat",
    verifiedPurchase: true,
  },
  {
    id: "rev_03",
    authorName: "Fatou Diop",
    authorCity: "Dakar",
    authorCountry: "Sénégal",
    rating: 5,
    comment:
      "Commande livrée aux Mamelles en 48h. Emballage soigné, odeur très agréable, ma peau est beaucoup plus hydratée et lumineuse. Je recommande les yeux fermés.",
    date: "02 nov. 2026",
    productName: "Sérum Visage Anti-Taches & Éclat",
    verifiedPurchase: true,
  },
];

export const DEFAULT_SECTIONS_LOME: PageSection[] = [
  {
    id: "sec_hero",
    type: "hero",
    title: "Bannière Principale (Hero)",
    subtitle: "Titre d'accroche, appel à l'action et visuel d'impact",
    isVisible: true,
    order: 1,
    content: {
      headline: "Révélez Votre Éclat Naturel & Votre Vitalité Quotidienne",
      subheadline:
        "Formules cosmétiques et bien-être d'exception, testées et certifiées. Commandez en 1 clic et payez en espèces à la livraison directement chez vous.",
      ctaText: "Découvrir la Sélection Vedette",
      ctaUrl: "/boutique/lome-glow/catalogue",
      imageUrl: "/banners/hero-glow-africa.jpg",
      badgeText: "🌿 100% Ingrédients Naturels & Éthiques",
    },
  },
  {
    id: "sec_benefits",
    type: "benefits",
    title: "Bandeau d'Avantages (Piliers COD)",
    subtitle: "Paiement à la livraison, délais rapides et contact WhatsApp",
    isVisible: true,
    order: 2,
    content: {
      items: [
        {
          icon: "ShieldCheck",
          title: "Paiement à la Livraison (COD)",
          description: "Inspectez votre colis chez vous avant de remettre l'argent au livreur en toute sérénité.",
        },
        {
          icon: "Truck",
          title: "Expédition Express 24h/48h",
          description: "Livraison locale ultra-rapide à Lomé, Abidjan, Dakar et Cotonou par nos livreurs dédiés.",
        },
        {
          icon: "MessageCircle",
          title: "Assistance WhatsApp 7j/7",
          description: "Une question ? Nos conseillères vous répondent directement sur WhatsApp en quelques minutes.",
        },
        {
          icon: "Award",
          title: "Garantie Authenticité & Échange",
          description: "Formules pures et originales. Échange gratuit sous 7 jours en cas de problème.",
        },
      ],
    },
  },
  {
    id: "sec_featured_products",
    type: "featured_products",
    title: "Sélection Vedette & Meilleures Ventes",
    subtitle: "Nos produits phares plébiscités par plus de 5 000 clientes",
    isVisible: true,
    order: 3,
    content: {
      title: "Nos Best-Sellers du Moment",
      subtitle: "Des résultats visibles dès les premières semaines d'utilisation.",
      maxProducts: 4,
      showDiscountBadge: true,
      showQuickOrder: true,
    },
  },
  {
    id: "sec_brand_story",
    type: "brand_story",
    title: "Présentation de la Marque & Histoire",
    subtitle: "Créer la confiance par un storytelling authentique",
    isVisible: true,
    order: 4,
    content: {
      title: "Conçu pour la Peau et l'Énergie Africaine",
      tagline: "Notre mission chez Lomé Glow",
      text: "Nous croyons que le bien-être et la beauté ne doivent pas être un luxe inaccessible. Chaque ingrédient est méticuleusement sourcé pour répondre au climat chaud et humide, en renforçant la barrière cutanée et la vitalité naturelle sans compromis sur la santé.",
      imageUrl: "/brand/storytelling-lome.jpg",
      statValue: "+12 500",
      statLabel: "Colis livrés avec succès en Afrique de l'Ouest",
    },
  },
  {
    id: "sec_customer_reviews",
    type: "customer_reviews",
    title: "Avis Clients Réels & Témoignages",
    subtitle: "Retours d'expérience authentiques vérifiés par commande",
    isVisible: true,
    order: 5,
    content: {
      title: "Ce Que Nos Clientes Disent de Nous",
      subtitle: "Avis collectés auprès de vraies acheteuses après livraison.",
      showRatingScore: true,
      averageScore: 4.9,
      totalCount: 342,
    },
  },
  {
    id: "sec_faq",
    type: "faq",
    title: "Foire Aux Questions (FAQ)",
    subtitle: "Doutes levés sur le paiement, la livraison et l'authenticité",
    isVisible: true,
    order: 6,
    content: {
      title: "Questions Fréquentes",
      subtitle: "Tout ce que vous devez savoir avant de passer commande.",
      questions: [
        {
          q: "Comment fonctionne le paiement à la livraison ?",
          a: "Vous passez votre commande sans rien payer d'avance. Notre équipe vous contacte sur WhatsApp pour confirmer votre adresse et convenir de l'heure. Lorsque le livreur arrive, vous ouvrez le colis pour vérifier son contenu puis vous lui remettez le montant exact en espèces.",
        },
        {
          q: "Combien de temps prend la livraison à Lomé ?",
          a: "Pour toutes les commandes passées avant 14h, la livraison s'effectue le jour même en 2 à 4 heures. Après 14h, la livraison a lieu le lendemain matin.",
        },
        {
          q: "Puis-je commander pour une autre ville ou un autre pays ?",
          a: "Oui ! Nous livrons également en Côte d'Ivoire (Abidjan), au Sénégal (Dakar) et au Bénin (Cotonou) via notre réseau de partenaires logistiques agréés.",
        },
        {
          q: "Que faire si le produit ne me convient pas ?",
          a: "Nous offrons une garantie satisfaction de 7 jours. Contactez simplement notre support WhatsApp pour un échange ou des conseils personnalisés.",
        },
      ],
    },
  },
];

export const MOCK_STOREFRONT_LOME: StorefrontData = {
  storeId: "store_tg_01",
  storeSlug: "lome-glow",
  subdomain: "lome-glow",
  customDomain: "lomeglowing.com",
  isPublished: true,
  publishedAt: "14 nov. 2026 à 18:30",
  lastDraftUpdatedAt: "15 nov. 2026 à 14:15",
  activeTheme: THEME_PRESETS.banner_hero,
  draftTheme: THEME_PRESETS.banner_hero,
  announcementBar: {
    isEnabled: true,
    text: "✨ Paiement à la livraison garanti partout au Togo & Côte d'Ivoire | Expédition express 24h !",
    linkUrl: "/boutique/lome-glow/catalogue",
    bgColor: "#111111",
    textColor: "#FAF8F5",
  },
  header: {
    logoUrl: "/logo-lome-glow.svg",
    logoPosition: "left",
    logoHeight: 36,
    showSearch: true,
    showCountryPicker: true,
  },
  sections: DEFAULT_SECTIONS_LOME,
  contact: DEFAULT_CONTACT_LOME,
  reviews: DEFAULT_REVIEWS_LOME,
  versions: [
    {
      id: "ver_01",
      versionNumber: 1,
      name: "Version Initiale de Lancement",
      createdAt: "10 nov. 2026 à 10:00",
      createdBy: "Promises Bedi",
      themeConfig: THEME_PRESETS.banner_hero,
      sections: DEFAULT_SECTIONS_LOME,
      isPublished: true,
    },
  ],
  previewToken: {
    token: "prv_tok_98eca996b0bb_lome_glow",
    expiresAt: "2026-11-18T23:59:59Z",
    isRevoked: false,
  },
};

/**
 * Calcul dynamique côté serveur de l'état d'onboarding à partir des données réelles.
 */
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
  // 1. Pays et devise : pays configuré et devise définie
  const isCountryCurrencyDone = Boolean(store.country && store.currency);

  // 2. Ajoutez votre premier produit : au moins un produit actif
  const isFirstProductDone = products.some((p) => p.productStatus === "active");

  // 3. Créez votre page d'accueil : au moins 2 sections visibles
  const isHomepageDone = storefront.sections.filter((s) => s.isVisible).length >= 2;

  // 4. Personnalisez votre thème : thème défini avec couleur ou logo
  const isThemeDone = Boolean(storefront.activeTheme?.colors?.primary);

  // 5. WhatsApp et contact : numéro WhatsApp et email renseignés
  const isContactDone = Boolean(storefront.contact?.whatsappNumber && storefront.contact?.email);

  // 6. Domaine personnalisé : optionnel, validé si domaine personnalisé présent ou passé
  const isDomainDone = Boolean(storefront.customDomain || manualDismissedOptional);

  // 7. Passez une commande test, puis publiez la boutique : au moins une commande ET boutique publiée
  const isTestOrderAndPublishDone = Boolean(orders.length > 0 && storefront.isPublished);

  const steps: OnboardingStepState[] = [
    {
      id: 1,
      key: "country_currency",
      title: "Pays et devise",
      subtitle: `${store.countryName} (${store.currency}) configuré pour vos ventes locales.`,
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
        ? `${storefront.sections.filter((s) => s.isVisible).length} sections configurées pour votre vitrine.`
        : "Personnalisez la bannière, les avantages COD et les blocs de vente.",
      isCompleted: isHomepageDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne?tab=sections`,
      actionLabel: isHomepageDone ? "Éditer" : "Démarrer",
    },
    {
      id: 4,
      key: "theme",
      title: "Personnalisez votre thème",
      subtitle: `Thème actif : ${storefront.activeTheme.name} (Couleurs, typographie et boutons).`,
      isCompleted: isThemeDone,
      actionUrl: `/app/${store.slug}/boutique-en-ligne?tab=theme`,
      actionLabel: isThemeDone ? "Modifier" : "Personnaliser",
    },
    {
      id: 5,
      key: "whatsapp_contact",
      title: "WhatsApp et contact",
      subtitle: isContactDone
        ? `WhatsApp : ${storefront.contact.whatsappNumber} et e-mail configurés.`
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
  const percent = Math.round((completedCount / totalCount) * 100);
  const isAllCompleted = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    percent,
    isAllCompleted,
  };
}

/**
 * Règle serveur de publication : vérifie que les 3 conditions obligatoires sont remplies.
 */
export function canPublishStorefront(
  store: Store,
  products: Product[],
  storefront: StorefrontData
): {
  allowed: boolean;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  const hasActiveProduct = products.some((p) => p.productStatus === "active");
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
  storeId: "b7e5c920-410a-4a2f-98f1-85e8d3810001",
  storeSlug: "kelio",
  subdomain: "kelio",
  isPublished: true,
  lastDraftUpdatedAt: "2026-02-01T15:00:00Z",
  activeTheme: THEME_PRESETS.novika,
  draftTheme: THEME_PRESETS.novika,
  announcementBar: {
    isEnabled: true,
    text: "📦 Livraison express partout au Togo · Paiement sécurisé en espèces à la livraison",
  },
  header: {
    logoPosition: "left",
    logoHeight: 36,
    showSearch: true,
    showCountryPicker: true,
  },
  sections: [
    {
      id: "sec_hero",
      type: "hero",
      title: "Bannière Principale",
      isVisible: true,
      order: 1,
      content: {
        headline: "Accompagnez votre vitalité et votre équilibre naturel",
        subheadline:
          "Formules ciblées et compléments d'exception pour soutenir votre santé au quotidien. Commandez facilement et payez en espèces à la livraison au Togo.",
        ctaText: "Découvrir le catalogue",
        ctaUrl: "/boutique/kelio/catalogue",
        imageUrl: "/products/serum-eclat.png",
        badgeText: "🌿 Formule Naturelle & Contrôlée",
      },
    },
    {
      id: "sec_benefits",
      type: "benefits",
      title: "Garanties de Confiance",
      isVisible: true,
      order: 2,
      content: {
        items: [
          {
            icon: "ShieldCheck",
            title: "Paiement à la Livraison",
            description: "Payez en toute sérénité en espèces au livreur après réception de votre commande.",
          },
          {
            icon: "Truck",
            title: "Livraison Partout au Togo",
            description: "Expédition rapide à Lomé et dans toutes les préfectures sous 24h à 48h.",
          },
          {
            icon: "MessageCircle",
            title: "Conseillers WhatsApp Dédiés",
            description: "Notre équipe est à votre écoute pour vous conseiller et suivre votre colis.",
          },
        ],
      },
    },
    {
      id: "sec_featured_products",
      type: "featured_products",
      title: "Nos Produits Vedettes",
      isVisible: true,
      order: 3,
      content: {
        title: "Notre Sélection",
        maxProducts: 4,
        showDiscountBadge: true,
      },
    },
  ],
  contact: {
    phone: "+22890000000",
    whatsappNumber: "+22890000000",
    email: "contact@kelio.com",
    address: "Boulevard du 13 Janvier",
    city: "Lomé",
    country: "Togo",
  },
  reviews: [],
  onboarding: {
    hasProducts: true,
    hasConfiguredPayment: true,
    hasConfiguredDelivery: true,
    hasCustomDomain: false,
    hasCompletedTutorial: true,
  },
};

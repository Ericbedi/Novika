import {
  MessageTemplate,
  PlanBillingTier,
  StorefrontTheme,
  StoreUsageMetrics,
  TrackingTokenInfo,
} from "@/server/data/vague1-types";

// Jetons de suivi mockés
export const MOCK_TRACKING_TOKENS: TrackingTokenInfo[] = [
  {
    id: "trk_01",
    orderId: "ord_10482",
    orderNumber: "CMD-10482",
    tokenHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
    rawToken: "tok_secure_awa_traore_abidjan_20261115_valid",
    expiresAt: "2026-12-15T23:59:59Z",
    createdAt: "2026-11-15T10:42:00Z",
    accessCount: 3,
    lastAccessedAt: "2026-11-15T14:20:00Z",
    isRevoked: false,
  },
  {
    id: "trk_02",
    orderId: "ord_10480",
    orderNumber: "CMD-10480",
    tokenHash: "b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1",
    rawToken: "tok_secure_fatou_diop_dakar_20261114_delivered",
    expiresAt: "2026-12-14T23:59:59Z",
    createdAt: "2026-11-14T16:30:00Z",
    accessCount: 8,
    lastAccessedAt: "2026-11-15T09:10:00Z",
    isRevoked: false,
  },
  {
    id: "trk_03_expired",
    orderId: "ord_expired_test",
    orderNumber: "CMD-EXP-001",
    tokenHash: "c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
    rawToken: "tok_expired_sample_token_30days_passed",
    expiresAt: "2026-10-01T00:00:00Z", // Date passée
    createdAt: "2026-09-01T10:00:00Z",
    accessCount: 1,
    isRevoked: false,
  },
];

// Modèles de messages prédéfinis pour WhatsApp
export const MOCK_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl_tracking",
    storeId: "store_lome_01",
    title: "Lien de suivi client",
    category: "delivery_tracking",
    bodyTemplate:
      "Bonjour {client} ! 📦 Votre commande {produit} ({montant}) a bien été prise en compte par {boutique}. Vous pouvez suivre son statut en temps réel ici : {lien_suivi}. Merci pour votre confiance !",
    variables: ["client", "produit", "montant", "boutique", "lien_suivi"],
    isDefault: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "tpl_confirm",
    storeId: "store_lome_01",
    title: "Confirmation de rendez-vous livraison",
    category: "confirmation",
    bodyTemplate:
      "Bonjour {client}, nous confirmons votre livraison pour {produit} demain. Le montant à remettre au livreur est de {montant} (paiement à la livraison). Êtes-vous bien disponible à {ville} ?",
    variables: ["client", "produit", "montant", "ville"],
    isDefault: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "tpl_followup",
    storeId: "store_lome_01",
    title: "Relance injoignable",
    category: "followup",
    bodyTemplate:
      "Bonjour {client}, nous avons essayé de vous joindre au sujet de votre commande de {produit}. Pouvez-vous nous confirmer votre disponibilité ou un créneau qui vous arrange ? Merci !",
    variables: ["client", "produit"],
    isDefault: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "tpl_pricing",
    storeId: "store_lome_01",
    title: "Offre promotionnelle & Tarif",
    category: "pricing",
    bodyTemplate:
      "Bonjour {client} ! Le pack {produit} est actuellement au tarif promotionnel de {montant} avec livraison offerte. Paiement en espèces à la livraison. Voulez-vous qu'on vous l'expédie aujourd'hui ?",
    variables: ["client", "produit", "montant"],
    isDefault: false,
    createdAt: "2026-11-01T00:00:00Z",
  },
];

// Catalogue des 5 Thèmes validés pour la vitrine en ligne (K5)
export const MOCK_THEMES_CATALOG: StorefrontTheme[] = [
  {
    id: "banner_hero",
    name: "Bannière Hero Impact",
    tagline: "Présentation dynamique avec visuel plein écran immersif",
    description:
      "Parfait pour les lancements mono-produit et les offres phares avec une vidéo ou grande photo en arrière-plan.",
    badge: "Le plus immersif",
    previewThumbnail: "/themes/theme-banner-hero.png",
    primaryColor: "#111111",
    backgroundColor: "#F3EFE6",
    fontFamily: "Poppins",
    layoutStyle: "hero_banner",
    features: ["Hero vidéo/photo plein format", "Compte à rebours promotionnel", "Bandeau d'avantages réassurance"],
  },
  {
    id: "visual_gallery",
    name: "Galerie Visuelle",
    tagline: "Mise en avant visuelle façon boutique lifestyle",
    description:
      "Idéal pour la beauté, les cosmétiques et les vêtements avec carrousels photos et zooms produits instantanés.",
    badge: "Mode & Beauté",
    previewThumbnail: "/themes/theme-visual-gallery.png",
    primaryColor: "#059669",
    backgroundColor: "#FAF8F5",
    fontFamily: "Poppins",
    layoutStyle: "grid_masonry",
    features: ["Grille photo responsive", "Avis clients en carrousel", "Filtre par collection express"],
  },
  {
    id: "editorial",
    name: "Éditorial & Storytelling",
    tagline: "Racontez l'histoire et les bienfaits de vos produits",
    description:
      "Conçu pour valoriser les produits naturels, santé et bien-être avec typographie soignée et témoignages détaillés.",
    badge: "Santé & Bio",
    previewThumbnail: "/themes/theme-editorial.png",
    primaryColor: "#92400E",
    backgroundColor: "#FFFBEB",
    fontFamily: "Poppins",
    layoutStyle: "split_editorial",
    features: ["Sections avant/après", "Bloc ingrédients & certifications", "Guide d'utilisation interactif"],
  },
  {
    id: "express_cod",
    name: "Vitrine Express COD",
    tagline: "Tunnel ultra-rapide optimisé pour la commande mobile",
    description:
      "Optimisé pour maximiser le taux de conversion en Afrique francophone avec bouton WhatsApp persistant et formulaire COD 1 clic.",
    badge: "Conversion Maximale",
    previewThumbnail: "/themes/theme-express-cod.png",
    primaryColor: "#2563EB",
    backgroundColor: "#F8FAFC",
    fontFamily: "Poppins",
    layoutStyle: "sticky_conversion",
    features: ["Sticky CTA Commander en bas d'écran", "Formulaire COD 3 champs", "Badge livraison 24h garanti"],
  },
  {
    id: "minimal_modern",
    name: "Minimaliste Moderne",
    tagline: "Clarté, sobriété et fluidité extrême",
    description:
      "Un design épuré noir, blanc et beige qui charge instantanément même sur réseau mobile 3G.",
    badge: "Ultra Rapide",
    previewThumbnail: "/themes/theme-minimal-modern.png",
    primaryColor: "#18181B",
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins",
    layoutStyle: "zen_minimal",
    features: ["Temps de chargement < 500ms", "Mode données réduites natif", "Contraste élevé lisible en plein soleil"],
  },
];

// Formules, quotas et facturation à l'usage (K6)
export const MOCK_BILLING_PLANS: PlanBillingTier[] = [
  {
    id: "usage",
    name: "Formule à l'Usage",
    billingPeriod: "monthly",
    priceMonthly: 0,
    priceYearlyDiscounted: 0,
    currency: "XOF",
    deliveredOrdersIncluded: 20, // 20 premières livraisons offertes
    overageFeePerDelivered: 150, // 150 FCFA par commande livrée
    freeInitialOrders: 20,
    maxStores: 1,
    maxMembers: 3,
    aiCreditsMonthly: 50,
    features: [
      "20 premières commandes livrées offertes",
      "Facturation uniquement sur les commandes LIVRÉES (0 FCFA si rejetée)",
      "1 boutique COD incluse",
      "3 membres d'équipe (Closeuse, Livreur)",
      "Paiement Mobile Money ou Carte",
    ],
  },
  {
    id: "starter",
    name: "Starter Croissance",
    billingPeriod: "monthly",
    priceMonthly: 14900,
    priceYearlyDiscounted: 11900, // avec remise 20%
    currency: "XOF",
    deliveredOrdersIncluded: 150,
    overageFeePerDelivered: 100,
    freeInitialOrders: 0,
    maxStores: 2,
    maxMembers: 5,
    aiCreditsMonthly: 200,
    features: [
      "150 commandes livrées incluses par mois",
      "100 FCFA par livraison supplémentaire",
      "2 boutiques et multi-pays",
      "5 membres d'équipe avec rôles RLS",
      "Thèmes vitrine illimités",
      "Suivi client temps réel sans logo AfriBuilder",
    ],
    isPopular: true,
  },
  {
    id: "pro",
    name: "Pro Volume",
    billingPeriod: "monthly",
    priceMonthly: 39900,
    priceYearlyDiscounted: 31900,
    currency: "XOF",
    deliveredOrdersIncluded: 500,
    overageFeePerDelivered: 80,
    freeInitialOrders: 0,
    maxStores: 5,
    maxMembers: 15,
    aiCreditsMonthly: 600,
    features: [
      "500 commandes livrées incluses par mois",
      "80 FCFA par livraison supplémentaire",
      "5 boutiques et multi-devises",
      "15 membres d'équipe",
      "Assistant IA et commande rapide illimité",
      "Support prioritaire WhatsApp 7j/7",
    ],
  },
  {
    id: "scale",
    name: "Scale Entreprise",
    billingPeriod: "monthly",
    priceMonthly: 89900,
    priceYearlyDiscounted: 71900,
    currency: "XOF",
    deliveredOrdersIncluded: 1500,
    overageFeePerDelivered: 60,
    freeInitialOrders: 0,
    maxStores: 15,
    maxMembers: 50,
    aiCreditsMonthly: 2000,
    features: [
      "1500 commandes livrées incluses par mois",
      "60 FCFA par livraison supplémentaire",
      "Boutiques illimitées",
      "Membres illimités",
      "Preuve de livraison par code OTP & géolocalisation",
      "Accompagnement dédié & intégrations sur mesure",
    ],
  },
];

// Métriques d'usage réelles pour la boutique active (lome-glow)
export const MOCK_STORE_USAGE: StoreUsageMetrics = {
  storeId: "store_lome_01",
  billingPeriodStart: "2026-11-01T00:00:00Z",
  billingPeriodEnd: "2026-11-30T23:59:59Z",
  planId: "usage",
  deliveredOrdersCount: 18,
  receivedOrdersCount: 35, // 35 reçues, mais SEULES 18 livrées sont comptabilisées !
  deliveredOrdersBillable: 0, // 18 <= 20 offertes -> 0 FCFA facturé pour le moment !
  freeOrdersRemaining: 2, // 20 - 18 = 2
  aiCreditsUsed: 24,
  aiCreditsLimit: 50,
  storesCount: 1,
  storesLimit: 1,
  membersCount: 3,
  membersLimit: 3,
  currentCycleInvoiceAmount: 0,
  isOverQuota: false,
};

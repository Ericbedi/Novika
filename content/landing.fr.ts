import { brandConfig } from "@/config/brand";

const APP_NAME = brandConfig.name;
const LAUNCH_REGION = "Afrique de l'Ouest";

export interface CountryItem {
  name: string;
  flag: string;
  currency: string;
}

export interface DifficultyItem {
  title: string;
  desc: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

export interface StepItem {
  step: string;
  title: string;
  desc: string;
}

export interface RoleItem {
  role: string;
  badge: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const landingContent = {
  meta: {
    title: `${APP_NAME} — Plateforme COD pour vendeurs africains`,
    description: "Boutique, commandes, closeuses, livreurs, stock et finances dans un seul outil pour vendre en paiement à la livraison en Afrique. Bêta privée.",
  },
  announcement: {
    text: `La plateforme du paiement à la livraison, pensée pour les vendeurs africains (${LAUNCH_REGION}).`,
    badge: "BÊTA PRIVÉE",
  },
  hero: {
    badge: "Conçu exclusivement pour le commerce en Afrique",
    title: "Vendez en paiement à la livraison. Suivez chaque commande jusqu'à l'argent encaissé.",
    subtitle: "Boutique, closeuses, livreurs, stock et finances au même endroit, dans la devise de votre pays.",
    ctaPrimary: "Demander mon accès",
    ctaSecondary: "Voir comment ça marche",
    guarantee: "Accès gratuit sur invitation pendant la phase bêta privée · Sans carte bancaire",
    pills: [
      { text: "Le client paie à la livraison", icon: "CheckCircle2" },
      { text: "Livraison gratuite automatique par zone", icon: "Truck" },
      { text: "Aucune commande bloquée · Fiche closeuse", icon: "ShieldCheck" },
    ],
  },
  countriesBand: {
    title: "Prêt pour les marchés majeurs du continent",
    countries: [
      { name: "Togo", flag: "🇹🇬", currency: "FCFA (XOF)" },
      { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "FCFA (XOF)" },
      { name: "Bénin", flag: "🇧🇯", currency: "FCFA (XOF)" },
      { name: "Sénégal", flag: "🇸🇳", currency: "FCFA (XOF)" },
      { name: "Cameroun", flag: "🇨🇲", currency: "FCFA (XAF)" },
      { name: "Burkina Faso", flag: "🇧🇫", currency: "FCFA (XOF)" },
      { name: "Mali", flag: "🇲🇱", currency: "FCFA (XOF)" },
      { name: "Niger", flag: "🇳🇪", currency: "FCFA (XOF)" },
    ] as CountryItem[],
  },
  problemSolution: {
    title: "Vendre sur Meta et TikTok est devenu facile. Livrer et encaisser, beaucoup moins.",
    subtitle: "Le paiement à la livraison apporte des volumes massifs, mais sans outillage dédié, les opérations virent au désordre.",
    difficulties: [
      {
        title: "Clients injoignables après commande",
        desc: "Les commandes s'accumulent sans certitude de confirmation ni de créneau d'appel.",
      },
      {
        title: "Statuts de livraison jamais à jour",
        desc: "Les livreurs ont des dizaines de colis mais vous ignorez lesquels sont livrés, retardés ou refusés.",
      },
      {
        title: "Feuilles de calcul désynchronisées",
        desc: "Des classeurs Excel et Google Sheets multi-pays qui se perdent, créent des doublons et des erreurs de calcul.",
      },
      {
        title: "Argent des livreurs difficile à réconcilier",
        desc: "Personne ne sait exactement combien d'espèces chaque coursier ou agence doit vous reverser.",
      },
    ] as DifficultyItem[],
    consequence: "Résultat : des colis retournés, des marges qui fondent, et du temps perdu à tout recoller.",
    solution: `${APP_NAME} réunit votre boutique, vos commandes, vos closeuses, vos livreurs et vos finances dans un seul outil, pensé pour le paiement à la livraison.`,
  },
  features: {
    title: "Tout ce dont vous avez besoin pour vendre et livrer",
    items: [
      {
        icon: "ShoppingCart",
        title: "Formulaire de commande direct",
        desc: "Formulaire court sans panier compliqué, ville saisie librement avec détection de zone, pensé pour WhatsApp et mobile.",
      },
      {
        icon: "Users",
        title: "Répartition entre closeuses",
        desc: "Attribution automatique ou manuelle des commandes, traitement des appels et calcul du taux de confirmation.",
      },
      {
        icon: "Truck",
        title: "Gestion de flotte & livreurs",
        desc: "Invitez vos coursiers ou vos agences partenaires. Suivi des tournées en temps réel sans partager vos marges.",
      },
      {
        icon: "ShieldCheck",
        title: "Preuves de livraison",
        desc: "Confirmation de remise par code sécurisé ou photo pour clore les litiges et sécuriser les encaissements.",
      },
      {
        icon: "Wallet",
        title: "Caisse & Remises d'espèces",
        desc: "Suivi au franc près de l'argent détenu par chaque livreur et validation des reversements en un clic.",
      },
      {
        icon: "Target",
        title: "Objectifs de CA encaissé",
        desc: "Barre de progression en 3 segments : encaissé réel, livré en attente de remise, et programmé pondéré.",
      },
    ] as FeatureItem[],
  },
  steps: {
    title: "Comment fonctionne Novika",
    list: [
      {
        step: "01",
        title: "Créez votre boutique",
        desc: "Ajoutez vos produits avec photos, variantes et offres de quantité. Votre vitrine est prête en 5 minutes.",
      },
      {
        step: "02",
        title: "Recevez les commandes",
        desc: "Vos clients commandent via un formulaire fluide optimisé pour le paiement à la livraison.",
      },
      {
        step: "03",
        title: "Confirmez et assignez",
        desc: "Vos closeuses appellent les clients puis attribuent les colis à vos livreurs ou agences partenaires.",
      },
      {
        step: "04",
        title: "Encaissez et suivez",
        desc: "Le livreur encaisse l'argent à la remise, transmet la preuve, et remet les fonds dans votre caisse.",
      },
    ] as StepItem[],
  },
  roles: {
    title: "Une interface sur mesure pour chaque membre de votre équipe",
    list: [
      {
        role: "Admin (Propriétaire)",
        badge: "Accès complet",
        desc: "Vision à 360° : produits, stock, finances réelles, paramètres, objectifs et gestion complète des boutiques.",
      },
      {
        role: "Closeuse",
        badge: "Espace Ventes",
        desc: "Espace dédié pour traiter les commandes, appeler les clients, assigner les livreurs et envoyer les reçus.",
      },
      {
        role: "Livreur",
        badge: "Espace Terrain",
        desc: "Vue mobile épurée avec les adresses, boutons d'appel WhatsApp et validation de livraison par code ou photo.",
      },
      {
        role: "Agence de livraison",
        badge: "Espace Partenaire",
        desc: "Gestion de ses propres livreurs, acceptation des commandes transmises et déclaration de remises d'espèces.",
      },
    ] as RoleItem[],
  },
  pricing: {
    title: "Une tarification simple et transparente",
    subtitle: "Pendant la phase bêta privée, l'accès à Novika est entièrement gratuit pour les vendeurs sélectionnés.",
    plan: {
      name: "Pionnier Bêta",
      price: "0 FCFA",
      period: "pendant la bêta privée",
      features: [
        "Jusqu'à 3 boutiques multi-pays",
        "Commandes et produits illimités",
        "Accès closeuses, livreurs et agences",
        "Formulaire COD & détection de zones",
        "Reçus de livraison dédiés",
        "Objectifs de CA encaissé & Caisse",
        "Support direct par WhatsApp",
      ],
      cta: "Rejoindre la cohorte",
    },
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        q: `${APP_NAME} est-il adapté au paiement à la livraison (COD) ?`,
        a: `Oui, ${APP_NAME} a été conçu spécifiquement pour le modèle COD en Afrique. Chaque statut, du premier appel de confirmation jusqu'à la remise physique de l'argent par le livreur, est pris en charge.`,
      },
      {
        q: "Comment mes livreurs reçoivent-ils leurs courses ?",
        a: "Chaque livreur dispose d'un accès mobile restreint. Il ne voit que les commandes qui lui sont assignées avec les coordonnées du client et le montant exact à encaisser.",
      },
      {
        q: `${APP_NAME} est-il une alternative aux boutiques généralistes ?`,
        a: `${APP_NAME} se concentre sur les particularités du commerce africain : formulaires de commande sans friction, coordination des closeuses, preuves de livraison et suivi de la caisse d'espèces.`,
      },
      {
        q: "Mes données financières sont-elles visibles par mon équipe ?",
        a: "Non. Grâce à la matrice stricte des rôles et permissions, les closeuses et livreurs ne voient jamais vos prix de revient, vos marges ni le solde de votre trésorerie.",
      },
      {
        q: "Comment fonctionne la détection de zone ?",
        a: "Le client saisit librement sa ville ou son quartier. Le serveur analyse le texte pour identifier si la zone est desservie en livraison locale gratuite ou si elle nécessite une expédition.",
      },
      {
        q: "Puis-je gérer plusieurs boutiques dans plusieurs pays ?",
        a: "Oui, vous pouvez gérer vos boutiques au Togo, en Côte d'Ivoire, au Sénégal, etc., chacune avec sa devise locale (XOF, XAF, NGN, GHS).",
      },
      {
        q: "Comment rejoindre la bêta privée ?",
        a: "Remplissez simplement le formulaire de demande d'accès ci-dessous. Nous ouvrons les places par cohortes régulières pour accompagner chaque vendeur personnellement.",
      },
    ] as FaqItem[],
  },
  ctaSection: {
    title: "Prêt à reprendre le contrôle de vos livraisons ?",
    subtitle: `Rejoignez les vendeurs qui utilisent ${APP_NAME} pour sécuriser chaque franc encaissé.`,
    buttonText: "Demander mon accès bêta",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} ${APP_NAME}. Tous droits réservés.`,
    tagline: "Plateforme COD pour vendeurs africains.",
  },
};

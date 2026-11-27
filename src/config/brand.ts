// Configuration de marque centrale pour Kelio
// Source unique de vérité pour le nom, les chemins et la palette de marque

export const brandConfig = {
  name: "Kelio",
  slug: "kelio",
  shortName: "Kelio",
  altText: "Logo Kelio",
  slogan: "La plateforme du paiement à la livraison, pensée pour les vendeurs africains.",
  tagline: "Vendez en paiement à la livraison. Suivez chaque commande jusqu'à l'argent encaissé.",
  description: "Boutique, commandes, closeuses, livreurs, stock et finances dans un seul outil pour vendre en paiement à la livraison en Afrique.",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "novika.app",
  storefrontDomain: process.env.NEXT_PUBLIC_STORE_DOMAIN || "novika.store",
  contact: {
    supportEmail: "support@novika.app",
    securityEmail: "security@novika.app",
    contactEmail: "contact@novika.app",
    whatsapp: "+228 90 00 00 00",
  },
  colors: {
    navy900: "#1F3A26",    // Vert forêt (Fonds, thème)
    brandOrange: "#C8F26B", // Vert citron (accent, graphiques, icônes)
    brand600: "#1F3A26",    // Vert forêt (Boutons, contraste garanti avec texte blanc)
    teal300: "#4DB8B8",     // Turquoise clair (Uniquement sur fond sombre)
    teal700: "#007A7A",     // Turquoise foncé (Uniquement sur fond clair)
    gold: "#F3B61F"         // Or (Célébrations, badges)
  },
  paths: {
    icon: "/brand/kelio-icon.svg",
    wordmarkDark: "/brand/kelio-wordmark-dark.svg",   // Pour fonds sombres (texte blanc/clair)
    wordmarkLight: "/brand/kelio-wordmark-light.svg", // Pour fonds clairs (texte bleu nuit)
    fullDark: "/brand/kelio-logo-full-dark.svg",
    fullLight: "/brand/kelio-logo-full-light.svg",
    iconMono: "/brand/kelio-icon-mono.svg",
    favicon: "/brand/kelio-favicon.svg",
    fallback: "/brand/kelio-fallback.svg"             // Carré arrondi couleur de marque avec un "N"
  }
};

export type BrandConfig = typeof brandConfig;
export const APP_NAME = brandConfig.name;

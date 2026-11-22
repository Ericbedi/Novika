// Configuration de marque centrale pour Novika
// Source unique de vérité pour le nom, les chemins et la palette de marque

export const brandConfig = {
  name: "Novika",
  slug: "novika",
  shortName: "Novika",
  altText: "Logo Novika",
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
    navy900: "#0B1521",    // Bleu nuit profond (Fonds)
    brandOrange: "#F26522", // Orange décoratif (Graphiques, icônes)
    brand600: "#D35400",    // Orange accessible (Boutons, contraste garanti > 4.5:1 avec texte blanc)
    teal300: "#4DB8B8",     // Turquoise clair (Uniquement sur fond sombre)
    teal700: "#007A7A",     // Turquoise foncé (Uniquement sur fond clair)
    gold: "#F3B61F"         // Or (Célébrations, badges)
  },
  paths: {
    icon: "/brand/novika-icon.svg",
    wordmarkDark: "/brand/novika-wordmark-dark.svg",   // Pour fonds sombres (texte blanc/clair)
    wordmarkLight: "/brand/novika-wordmark-light.svg", // Pour fonds clairs (texte bleu nuit)
    fullDark: "/brand/novika-logo-full-dark.svg",
    fullLight: "/brand/novika-logo-full-light.svg",
    iconMono: "/brand/novika-icon-mono.svg",
    favicon: "/brand/novika-favicon.svg",
    fallback: "/brand/novika-fallback.svg"             // Carré arrondi couleur de marque avec un "N"
  }
};

export type BrandConfig = typeof brandConfig;
export const APP_NAME = brandConfig.name;

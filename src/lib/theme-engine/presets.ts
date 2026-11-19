/**
 * Préréglages et Palettes de couleurs pour le Moteur de Thème « Novika Classique » (Prompt 12)
 *
 * Chaque thème supporte jusqu'à 5 palettes de couleurs complètes :
 * - palette-1 : Défaut (Fond principal, texte, bouton d'action)
 * - palette-2 : Inverse / Sombre (Pour sections d'accroche ou pieds de page)
 * - palette-3 : Douce / Pastel (Pour réassurance ou témoignages)
 * - palette-4 : Accent / Intense (Pour promotions ou offres limitées)
 * - palette-5 : Contrastée (Pour séparateurs ou tableaux)
 */

import { ThemeColorPalette, ThemePresetKey, ThemeGeneralSettings } from "./types";

export const PRESET_NOVIKA_CLASSIQUE_PALETTES: ThemeColorPalette[] = [
  {
    id: "palette-1",
    name: "Clair & Orange Novika",
    background: "#FAF8F5",
    text: "#111111",
    button: "#C2410C", // Orange signature Novika
    buttonText: "#FFFFFF",
    accent: "#F97316",
    cardBackground: "#FFFFFF",
    borderColor: "#E5E0D8",
  },
  {
    id: "palette-2",
    name: "Sombre Intense",
    background: "#111111",
    text: "#FAF8F5",
    button: "#C2410C",
    buttonText: "#FFFFFF",
    accent: "#FB923C",
    cardBackground: "#1A1A1A",
    borderColor: "#333333",
  },
  {
    id: "palette-3",
    name: "Ambre Doux",
    background: "#FFFBEB",
    text: "#78350F",
    button: "#D97706",
    buttonText: "#FFFFFF",
    accent: "#B45309",
    cardBackground: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  {
    id: "palette-4",
    name: "Émeraude Confiance",
    background: "#F0FDF4",
    text: "#14532D",
    button: "#059669",
    buttonText: "#FFFFFF",
    accent: "#10B981",
    cardBackground: "#DCFCE7",
    borderColor: "#BBF7D0",
  },
  {
    id: "palette-5",
    name: "Gris Moderne",
    background: "#F4F4F5",
    text: "#18181B",
    button: "#18181B",
    buttonText: "#FFFFFF",
    accent: "#71717A",
    cardBackground: "#FFFFFF",
    borderColor: "#E4E4E7",
  },
];

export const PRESET_SOMBRE_OR_PALETTES: ThemeColorPalette[] = [
  {
    id: "palette-1",
    name: "Noir & Or Impérial",
    background: "#0F0F11",
    text: "#F5F5F7",
    button: "#D4AF37", // Or noble
    buttonText: "#0F0F11",
    accent: "#E5C158",
    cardBackground: "#19191D",
    borderColor: "#2D2D35",
  },
  {
    id: "palette-2",
    name: "Carbone & Bronze",
    background: "#18181B",
    text: "#FAFAFA",
    button: "#C5A059",
    buttonText: "#18181B",
    accent: "#E6CA85",
    cardBackground: "#27272A",
    borderColor: "#3F3F46",
  },
  {
    id: "palette-3",
    name: "Or Velours",
    background: "#2A2416",
    text: "#FDF8ED",
    button: "#E5C158",
    buttonText: "#1C170E",
    accent: "#F3DA8E",
    cardBackground: "#38301E",
    borderColor: "#4F442A",
  },
  {
    id: "palette-4",
    name: "Ivoire Clair",
    background: "#FAF7F0",
    text: "#1E1B18",
    button: "#99732B",
    buttonText: "#FFFFFF",
    accent: "#B88E3E",
    cardBackground: "#FFFFFF",
    borderColor: "#E8E2D5",
  },
  {
    id: "palette-5",
    name: "Noir Nuit",
    background: "#000000",
    text: "#FFFFFF",
    button: "#D4AF37",
    buttonText: "#000000",
    accent: "#E5C158",
    cardBackground: "#121212",
    borderColor: "#262626",
  },
];

export const PRESET_PASTEL_NATURE_PALETTES: ThemeColorPalette[] = [
  {
    id: "palette-1",
    name: "Sauge & Crème",
    background: "#F4F7F4",
    text: "#1A2E20",
    button: "#2D6A4F",
    buttonText: "#FFFFFF",
    accent: "#52B788",
    cardBackground: "#FFFFFF",
    borderColor: "#D8E2DC",
  },
  {
    id: "palette-2",
    name: "Forêt Tropicale",
    background: "#1B4332",
    text: "#E9F5ED",
    button: "#74C69D",
    buttonText: "#081C15",
    accent: "#95D5B2",
    cardBackground: "#2D6A4F",
    borderColor: "#40916C",
  },
  {
    id: "palette-3",
    name: "Argile Douce",
    background: "#FAF3EB",
    text: "#4A3728",
    button: "#B07D62",
    buttonText: "#FFFFFF",
    accent: "#DDBEA9",
    cardBackground: "#FFFFFF",
    borderColor: "#EAD7C7",
  },
  {
    id: "palette-4",
    name: "Menthe Fraîche",
    background: "#E8F5E9",
    text: "#1B5E20",
    button: "#2E7D32",
    buttonText: "#FFFFFF",
    accent: "#4CAF50",
    cardBackground: "#FFFFFF",
    borderColor: "#C8E6C9",
  },
  {
    id: "palette-5",
    name: "Blanc Pur Bio",
    background: "#FFFFFF",
    text: "#212529",
    button: "#2D6A4F",
    buttonText: "#FFFFFF",
    accent: "#40916C",
    cardBackground: "#F8F9FA",
    borderColor: "#E9ECEF",
  },
];

export const PRESET_TERRE_CACAO_PALETTES: ThemeColorPalette[] = [
  {
    id: "palette-1",
    name: "Terre Cuite & Cacao",
    background: "#F8F4EE",
    text: "#2C1B10",
    button: "#A0522D",
    buttonText: "#FFFFFF",
    accent: "#C86A3E",
    cardBackground: "#FFFFFF",
    borderColor: "#E6DDD0",
  },
  {
    id: "palette-2",
    name: "Chocolat Ébène",
    background: "#2C1B10",
    text: "#F8F4EE",
    button: "#C86A3E",
    buttonText: "#FFFFFF",
    accent: "#E28B5E",
    cardBackground: "#3D2719",
    borderColor: "#543724",
  },
  {
    id: "palette-3",
    name: "Safran & Cannelle",
    background: "#FEF7EE",
    text: "#6B3A0E",
    button: "#D97706",
    buttonText: "#FFFFFF",
    accent: "#F59E0B",
    cardBackground: "#FFF1DC",
    borderColor: "#FCE0B8",
  },
  {
    id: "palette-4",
    name: "Sable Chaud",
    background: "#F5EBE1",
    text: "#433422",
    button: "#7C532D",
    buttonText: "#FFFFFF",
    accent: "#A8764B",
    cardBackground: "#FFFFFF",
    borderColor: "#D9C3AD",
  },
  {
    id: "palette-5",
    name: "Ocre Solaire",
    background: "#FFF9F2",
    text: "#44280E",
    button: "#B45309",
    buttonText: "#FFFFFF",
    accent: "#D97706",
    cardBackground: "#FFFFFF",
    borderColor: "#F0DFC9",
  },
];

export const PRESET_ELEGANCE_IVOIRE_PALETTES: ThemeColorPalette[] = [
  {
    id: "palette-1",
    name: "Blanc Minéral & Carbone",
    background: "#FFFFFF",
    text: "#111111",
    button: "#111111",
    buttonText: "#FFFFFF",
    accent: "#4B5563",
    cardBackground: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  {
    id: "palette-2",
    name: "Carbone Minimaliste",
    background: "#111111",
    text: "#FFFFFF",
    button: "#FFFFFF",
    buttonText: "#111111",
    accent: "#9CA3AF",
    cardBackground: "#1F2937",
    borderColor: "#374151",
  },
  {
    id: "palette-3",
    name: "Gris Perle",
    background: "#F3F4F6",
    text: "#1F2937",
    button: "#374151",
    buttonText: "#FFFFFF",
    accent: "#6B7280",
    cardBackground: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  {
    id: "palette-4",
    name: "Ardoise Bleutée",
    background: "#F8FAFC",
    text: "#0F172A",
    button: "#1E293B",
    buttonText: "#FFFFFF",
    accent: "#475569",
    cardBackground: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  {
    id: "palette-5",
    name: "Noir Contrasté",
    background: "#0A0A0A",
    text: "#EDEDED",
    button: "#EDEDED",
    buttonText: "#0A0A0A",
    accent: "#A1A1AA",
    cardBackground: "#141414",
    borderColor: "#27272A",
  },
];

export interface ThemePresetDefinition {
  key: ThemePresetKey;
  name: string;
  tagline: string;
  description: string;
  generalSettings: ThemeGeneralSettings;
}

export const THEME_PRESETS: Record<ThemePresetKey, ThemePresetDefinition> = {
  "novika-classique": {
    key: "novika-classique",
    name: "Novika Classique",
    tagline: "Le standard e-commerce COD en Afrique",
    description: "Design épuré et ultra-lisible, optimisé pour les téléphones 390px et le paiement à la livraison.",
    generalSettings: {
      palettes: PRESET_NOVIKA_CLASSIQUE_PALETTES,
      activeDefaultPalette: "palette-1",
      typography: {
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        baseSize: "15px",
      },
      layout: {
        pageWidth: "standard",
        cardRadius: "md",
        buttonRadius: "md",
        sectionSpacing: "normal",
      },
    },
  },
  "sombre-or": {
    key: "sombre-or",
    name: "Sombre & Or",
    tagline: "Luxe, cosmétique & prestige",
    description: "Arrière-plan sombre et accents dorés élégants pour valoriser des gammes cosmétiques ou parfums haut de gamme.",
    generalSettings: {
      palettes: PRESET_SOMBRE_OR_PALETTES,
      activeDefaultPalette: "palette-1",
      typography: {
        headingFont: "Poppins",
        bodyFont: "Inter",
        baseSize: "15px",
      },
      layout: {
        pageWidth: "standard",
        cardRadius: "lg",
        buttonRadius: "full",
        sectionSpacing: "spacious",
      },
    },
  },
  "pastel-nature": {
    key: "pastel-nature",
    name: "Pastel & Nature",
    tagline: "Santé bio, bien-être & douceur",
    description: "Nuances vert sauge et crème pour les produits naturels, compléments alimentaires et soins doux.",
    generalSettings: {
      palettes: PRESET_PASTEL_NATURE_PALETTES,
      activeDefaultPalette: "palette-1",
      typography: {
        headingFont: "Poppins",
        bodyFont: "Inter",
        baseSize: "15px",
      },
      layout: {
        pageWidth: "standard",
        cardRadius: "lg",
        buttonRadius: "md",
        sectionSpacing: "normal",
      },
    },
  },
  "terre-cacao": {
    key: "terre-cacao",
    name: "Terre & Cacao",
    tagline: "Terroir africain, café & artisanat",
    description: "Chaleur des terres d'Afrique, tons chocolat et terracotta pour le café, cacao et produits d'artisanat.",
    generalSettings: {
      palettes: PRESET_TERRE_CACAO_PALETTES,
      activeDefaultPalette: "palette-1",
      typography: {
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        baseSize: "15px",
      },
      layout: {
        pageWidth: "standard",
        cardRadius: "sm",
        buttonRadius: "sm",
        sectionSpacing: "normal",
      },
    },
  },
  "elegance-ivoire": {
    key: "elegance-ivoire",
    name: "Élégance Ivoire",
    tagline: "Minimalisme éditorial & netteté",
    description: "Contrastes nets noir et blanc, typographie moderne pour marques épurées et produits high-tech.",
    generalSettings: {
      palettes: PRESET_ELEGANCE_IVOIRE_PALETTES,
      activeDefaultPalette: "palette-1",
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
        baseSize: "15px",
      },
      layout: {
        pageWidth: "wide",
        cardRadius: "none",
        buttonRadius: "none",
        sectionSpacing: "compact",
      },
    },
  },
};

/**
 * Utilitaires de sécurité et de conformité WCAG AA pour les palettes de thèmes AfriBuilder.
 * Règle de sécurité : Enregistrement sous forme de jetons hexadécimaux #RRGGBB stricts.
 * Aucun CSS libre n'est autorisé.
 */

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  primary: string; // #RRGGBB
  primaryHover: string;
  accent?: string;
  isPopular?: boolean;
}

export const PRESET_THEME_PALETTES: ThemePalette[] = [
  {
    id: "terre_cuite",
    name: "Terre cuite",
    description: "Chaleur, dynamisme, ancrage artisanal africain",
    primary: "#C2410C",
    primaryHover: "#9A3412",
    isPopular: true,
  },
  {
    id: "foret",
    name: "Forêt",
    description: "Nature, cosmétique bio, santé, plantes médicinales",
    primary: "#166534",
    primaryHover: "#14532D",
  },
  {
    id: "ocean",
    name: "Océan",
    description: "Sérénité, confiance, technologie, électronique",
    primary: "#0369A1",
    primaryHover: "#075985",
  },
  {
    id: "turquoise",
    name: "Turquoise",
    description: "Fraîcheur, bien-être, modernité énergique",
    primary: "#0F766E",
    primaryHover: "#115E59",
  },
  {
    id: "safran",
    name: "Safran",
    description: "Épices, gastronomie, vitalité chaleureuse",
    primary: "#B45309",
    primaryHover: "#92400E",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soins féminins, maquillage, délicatesse",
    primary: "#BE185D",
    primaryHover: "#9D174D",
  },
  {
    id: "bordeaux",
    name: "Bordeaux",
    description: "Luxe, maroquinerie haut de gamme, intemporel",
    primary: "#9F1239",
    primaryHover: "#881337",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Prestige, créativité, parfums raffinés",
    primary: "#6D28D9",
    primaryHover: "#5B21B6",
  },
  {
    id: "ardoise",
    name: "Ardoise",
    description: "Minimalisme sobre, mode urbaine, neutre chic",
    primary: "#334155",
    primaryHover: "#1E293B",
  },
  {
    id: "nuit_or",
    name: "Nuit et or",
    description: "Joaillerie, montres, exclusivité d'élite",
    primary: "#111827",
    primaryHover: "#030712",
    accent: "#CA8A04",
  },
];

/**
 * Valide strictement un code couleur hexadécimal #RRGGBB.
 * Rejette toute chaîne malveillante (CSS injection, code JS, etc.).
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6})$/.test(hex.trim());
}

/**
 * Convertit un code hexadécimal en composantes RVB normalisées [0..1].
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(hex)) return null;
  const cleanHex = hex.trim().replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { r, g, b };
}

/**
 * Calcule la luminance relative standard WCAG 2.1.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const adjust = (val: number) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  const R = adjust(r);
  const G = adjust(g);
  const B = adjust(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calcule le ratio de contraste standard entre deux couleurs hexadécimales.
 * Retourne un nombre entre 1 (aucun contraste) et 21 (noir sur blanc pur).
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;

  const lumA = getRelativeLuminance(rgbA.r, rgbA.g, rgbA.b);
  const lumB = getRelativeLuminance(rgbB.r, rgbB.g, rgbB.b);

  const brighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Vérifie si le ratio satisfait la norme WCAG AA (au moins 4.5:1 pour texte normal).
 */
export function checkWcagAaCompliance(
  foregroundHex: string,
  backgroundHex: string
): {
  ratio: number;
  isCompliant: boolean;
  scoreText: string;
} {
  const ratio = Math.round(getContrastRatio(foregroundHex, backgroundHex) * 10) / 10;
  const isCompliant = ratio >= 4.5;
  return {
    ratio,
    isCompliant,
    scoreText: `${ratio}:1 ${isCompliant ? "(Conforme WCAG AA)" : "(Contraste insuffisant < 4.5:1)"}`,
  };
}

/**
 * Détermine si le texte d'un bouton coloré doit être blanc ou sombre pour un contraste optimal.
 */
export function getBestTextColorForBackground(bgHex: string): "#FFFFFF" | "#111111" {
  const contrastWithWhite = getContrastRatio(bgHex, "#FFFFFF");
  const contrastWithBlack = getContrastRatio(bgHex, "#111111");
  return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#111111";
}

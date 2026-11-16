import { ProductThemePalette } from "@/server/data/product-page-types";

// Validation stricte du format hexadécimal (#RRGGBB uniquement)
export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

export function isValidHexColor(hex: string): boolean {
  return HEX_COLOR_REGEX.test(hex.trim());
}

/**
 * Calcule la luminance relative d'une couleur hex selon la spécification WCAG 2.1.
 */
export function getRelativeLuminance(hex: string): number {
  if (!isValidHexColor(hex)) return 0;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calcule le contraste entre deux couleurs hex selon WCAG (1:1 à 21:1).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Choisit la couleur de texte (#FFFFFF ou #111111) assurant au moins 4.5:1 de contraste.
 */
export function getAccessibleTextColor(backgroundHex: string): "#FFFFFF" | "#111111" {
  const contrastWithWhite = getContrastRatio(backgroundHex, "#FFFFFF");
  const contrastWithBlack = getContrastRatio(backgroundHex, "#111111");

  if (contrastWithWhite >= 4.5) return "#FFFFFF";
  if (contrastWithBlack >= 4.5) return "#111111";
  return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#111111";
}

/**
 * Assombrit légèrement une couleur hex pour le survol (:hover).
 */
export function darkenHex(hex: string, percent = 15): string {
  if (!isValidHexColor(hex)) return "#000000";
  const clean = hex.replace("#", "");
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Génère une teinte très douce (fond de carte) à partir de la couleur principale.
 */
export function getSoftBackgroundHex(hex: string): string {
  if (!isValidHexColor(hex)) return "#FAF8F5";
  const clean = hex.replace("#", "");
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);

  // Mixer 92% de blanc (#FAF8F5 / #FFFFFF) avec 8% de la couleur
  r = Math.min(255, Math.floor(r * 0.08 + 250 * 0.92));
  g = Math.min(255, Math.floor(g * 0.08 + 248 * 0.92));
  b = Math.min(255, Math.floor(b * 0.08 + 245 * 0.92));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Palettes prédéfinies de haute qualité dérivées d'images produits types.
 */
export const PRESET_PRODUCT_PALETTES: Record<string, ProductThemePalette[]> = {
  cosmetics: [
    {
      id: "pal_rose_gold",
      productId: "prod_serum",
      primary: "#C06C84",
      hover: "#A8536C",
      contrastText: "#FFFFFF",
      softBg: "#FCF5F7",
      border: "#F3D8E0",
      accent: "#E5989B",
      isDerivedFromImage: true,
    },
    {
      id: "pal_amber_glow",
      productId: "prod_serum",
      primary: "#D48B38",
      hover: "#BA7425",
      contrastText: "#111111",
      softBg: "#FCF8F2",
      border: "#F5E4D0",
      accent: "#E09F4C",
      isDerivedFromImage: true,
    },
    {
      id: "pal_emerald_nature",
      productId: "prod_serum",
      primary: "#2D6A4F",
      hover: "#1E4734",
      contrastText: "#FFFFFF",
      softBg: "#F2F8F5",
      border: "#D3E8DD",
      accent: "#40916C",
      isDerivedFromImage: true,
    },
  ],
  vitality: [
    {
      id: "pal_coffee_earth",
      productId: "prod_coffee",
      primary: "#6F4E37",
      hover: "#533A29",
      contrastText: "#FFFFFF",
      softBg: "#F9F6F4",
      border: "#E5DAD3",
      accent: "#A07855",
      isDerivedFromImage: true,
    },
    {
      id: "pal_gold_vitality",
      productId: "prod_coffee",
      primary: "#B8860B",
      hover: "#996E07",
      contrastText: "#111111",
      softBg: "#FCFAF2",
      border: "#EFE5C6",
      accent: "#DAA520",
      isDerivedFromImage: true,
    },
    {
      id: "pal_deep_forest",
      productId: "prod_coffee",
      primary: "#1B4332",
      hover: "#133024",
      contrastText: "#FFFFFF",
      softBg: "#F1F6F3",
      border: "#CFDFD6",
      accent: "#2D6A4F",
      isDerivedFromImage: true,
    },
  ],
};

/**
 * Construit un objet ProductThemePalette complet et sécurisé à partir d'une couleur principale.
 */
export function buildProductThemePalette(
  productId: string,
  primaryHex: string,
  accentHex?: string,
  isDerived = true
): ProductThemePalette {
  const safePrimary = isValidHexColor(primaryHex) ? primaryHex : "#111111";
  const safeAccent = accentHex && isValidHexColor(accentHex) ? accentHex : safePrimary;

  return {
    id: `pal_${productId}_${Date.now()}`,
    productId,
    primary: safePrimary,
    hover: darkenHex(safePrimary, 15),
    contrastText: getAccessibleTextColor(safePrimary),
    softBg: getSoftBackgroundHex(safePrimary),
    border: darkenHex(getSoftBackgroundHex(safePrimary), 8),
    accent: safeAccent,
    isDerivedFromImage: isDerived,
  };
}

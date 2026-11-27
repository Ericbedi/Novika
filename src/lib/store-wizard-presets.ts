export const WIZARD_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F97316", "#F43F5E", "#111827"] as const;

export type WizardStyleKey = "minimal" | "bold" | "elegant" | "rounded" | "natural" | "sleek";

export const WIZARD_STYLES: { key: WizardStyleKey; label: string; hint: string; titleClass: string; radius: string }[] = [
  { key: "minimal", label: "Minimal", hint: "Épuré et moderne", titleClass: "font-semibold", radius: "8px" },
  { key: "bold", label: "Affirmé", hint: "Fort et percutant", titleClass: "font-black", radius: "4px" },
  { key: "elegant", label: "Élégant", hint: "Luxe et raffiné", titleClass: "font-serif", radius: "2px" },
  { key: "rounded", label: "Arrondi", hint: "Chaleureux et convivial", titleClass: "font-bold", radius: "999px" },
  { key: "natural", label: "Naturel", hint: "Organique et apaisant", titleClass: "font-medium", radius: "14px" },
  { key: "sleek", label: "Technique", hint: "Net et précis", titleClass: "font-bold tracking-tight", radius: "6px" },
];

export interface WizardCountry {
  code: string;
  name: string;
  flag: string;
  dial: string;
  currency: string;
  capital: string;
}

export const WIZARD_COUNTRIES: WizardCountry[] = [
  { code: "TG", name: "Togo", flag: "🇹🇬", dial: "+228", currency: "XOF", capital: "Lomé" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", dial: "+229", currency: "XOF", capital: "Cotonou" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dial: "+225", currency: "XOF", capital: "Abidjan" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dial: "+221", currency: "XOF", capital: "Dakar" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226", currency: "XOF", capital: "Ouagadougou" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dial: "+223", currency: "XOF", capital: "Bamako" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dial: "+237", currency: "XAF", capital: "Douala" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", dial: "+241", currency: "XAF", capital: "Libreville" },
];

/** Texte lisible sur une couleur de fond (noir ou blanc). */
export function readableTextOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#FFFFFF";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111111" : "#FFFFFF";
}

export function slugifyShopName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "boutique"
  );
}

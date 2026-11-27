/**
 * Catalogue des sections modifiables dans le Studio Kelio.
 * Chaque section décrit ses champs ; le Studio lit/écrit la configuration d'accueil (HomeConfig).
 */
import type { HomeConfig } from "./storefront-home-config";

export type FieldKind = "text" | "textarea" | "image" | "url" | "toggle" | "number" | "select";

export interface Field {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  hint?: string;
}

export const ICON_OPTIONS = [
  { value: "shield", label: "Bouclier" },
  { value: "truck", label: "Livraison" },
  { value: "rotate-ccw", label: "Retour" },
  { value: "award", label: "Qualité" },
  { value: "heart", label: "Cœur" },
  { value: "star", label: "Étoile" },
  { value: "zap", label: "Éclair" },
  { value: "gift", label: "Cadeau" },
];

export type SectionGroup = "header" | "content" | "footer";
export type SectionKind = "announcement" | "header" | "banners" | "content" | "footer";

export interface ItemsField {
  /** Clé du tableau dans le contenu de la section (ou "banners") */
  key: string;
  label: string;
  addLabel: string;
  max: number;
  fields: Field[];
  blank: () => Record<string, unknown>;
}

export interface SectionDef {
  id: string;
  label: string;
  group: SectionGroup;
  kind: SectionKind;
  /** Peut être masquée par le vendeur */
  canHide: boolean;
  /** Peut être déplacée */
  movable: boolean;
  fields: Field[];
  items?: ItemsField;
}

const uid = () => `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const SECTION_CATALOG: SectionDef[] = [
  {
    id: "announcement",
    label: "Barre d'annonce",
    group: "header",
    kind: "announcement",
    canHide: false,
    movable: false,
    fields: [
      { key: "isEnabled", label: "Afficher la barre", kind: "toggle" },
      { key: "text", label: "Message", kind: "text" },
      { key: "linkUrl", label: "Lien (facultatif)", kind: "url" },
    ],
  },
  {
    id: "header",
    label: "En-tête",
    group: "header",
    kind: "header",
    canHide: false,
    movable: false,
    fields: [
      { key: "logoUrl", label: "Logo", kind: "image" },
      { key: "showSearch", label: "Afficher la recherche", kind: "toggle" },
    ],
  },
  {
    id: "banners",
    label: "Bannières",
    group: "content",
    kind: "banners",
    canHide: false,
    movable: true,
    fields: [],
    items: {
      key: "banners",
      label: "Bannières (5 maximum)",
      addLabel: "Ajouter une bannière",
      max: 5,
      fields: [
        { key: "imageUrl", label: "Image (ordinateur)", kind: "image" },
        { key: "mobileImageUrl", label: "Image mobile (facultatif)", kind: "image" },
        { key: "linkUrl", label: "Lien au clic", kind: "url" },
        { key: "altText", label: "Texte alternatif", kind: "text" },
      ],
      blank: () => ({ id: uid(), imageUrl: "" }),
    },
  },
  {
    id: "sec_hero",
    label: "Hero",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [
      { key: "headline", label: "Titre", kind: "textarea" },
      { key: "subheadline", label: "Sous-titre", kind: "textarea" },
      { key: "ctaText", label: "Texte du bouton", kind: "text" },
      { key: "ctaUrl", label: "Lien du bouton", kind: "url" },
      { key: "imageUrl", label: "Image de fond", kind: "image" },
      { key: "overlay", label: "Assombrir l'image (%)", kind: "number", min: 0, max: 80 },
    ],
  },
  {
    id: "sec_benefits",
    label: "Avantages",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [
      { key: "title", label: "Titre", kind: "text" },
      { key: "subtitle", label: "Sous-titre", kind: "textarea" },
    ],
    items: {
      key: "items",
      label: "Avantages",
      addLabel: "Ajouter un avantage",
      max: 8,
      fields: [
        { key: "icon", label: "Icône", kind: "select", options: ICON_OPTIONS },
        { key: "title", label: "Titre", kind: "text" },
        { key: "description", label: "Description", kind: "textarea" },
      ],
      blank: () => ({ id: uid(), title: "Nouvel avantage", description: "", icon: "star" }),
    },
  },
  {
    id: "sec_featured_products",
    label: "Grille de produits",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [
      { key: "title", label: "Titre", kind: "text" },
      { key: "subtitle", label: "Sous-titre", kind: "text" },
      { key: "maxProducts", label: "Nombre de produits affichés", kind: "number", min: 1, max: 24 },
    ],
  },
  {
    id: "sec_customer_reviews",
    label: "Témoignages",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [{ key: "title", label: "Titre", kind: "text", hint: "Visible seulement s'il existe de vrais avis clients." }],
  },
  {
    id: "sec_newsletter",
    label: "Newsletter",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [
      { key: "title", label: "Titre", kind: "text" },
      { key: "subtitle", label: "Sous-titre", kind: "textarea" },
      { key: "buttonText", label: "Texte du bouton", kind: "text" },
      { key: "placeholder", label: "Texte du champ e-mail", kind: "text" },
    ],
  },
  {
    id: "sec_brand_story",
    label: "Notre histoire",
    group: "content",
    kind: "content",
    canHide: true,
    movable: true,
    fields: [
      { key: "title", label: "Titre", kind: "text" },
      { key: "text", label: "Texte", kind: "textarea" },
      { key: "imageUrl", label: "Image", kind: "image" },
      { key: "ctaText", label: "Texte du bouton", kind: "text" },
      { key: "ctaUrl", label: "Lien du bouton", kind: "url" },
    ],
  },
  {
    id: "footer",
    label: "Pied de page",
    group: "footer",
    kind: "footer",
    canHide: false,
    movable: false,
    fields: [
      { key: "tagline", label: "Phrase de présentation", kind: "textarea" },
      { key: "copyright", label: "Mention de droits", kind: "text" },
    ],
  },
];

export const GROUP_LABELS: Record<SectionGroup, string> = { header: "EN-TÊTE", content: "CONTENU", footer: "PIED DE PAGE" };

export const CONTENT_ORDER_DEFAULT = ["banners", "sec_hero", "sec_benefits", "sec_featured_products", "sec_customer_reviews", "sec_newsletter", "sec_brand_story"];

/** Ordre effectif des sections de contenu (les sections inconnues sont ajoutées à la fin). */
export function contentOrder(cfg: HomeConfig): string[] {
  const saved = (cfg.order || []).filter((id) => CONTENT_ORDER_DEFAULT.includes(id));
  return [...saved, ...CONTENT_ORDER_DEFAULT.filter((id) => !saved.includes(id))];
}

type Obj = Record<string, unknown>;

export function readValue(cfg: HomeConfig, def: SectionDef, key: string): unknown {
  switch (def.kind) {
    case "announcement": return (cfg.announcementBar as Obj | undefined)?.[key];
    case "header": return (cfg.header as Obj | undefined)?.[key];
    case "footer": return (cfg.footer as Obj | undefined)?.[key];
    case "content": return cfg.sections?.[def.id]?.content?.[key];
    default: return undefined;
  }
}

export function writeValue(cfg: HomeConfig, def: SectionDef, key: string, value: unknown): HomeConfig {
  switch (def.kind) {
    case "announcement": return { ...cfg, announcementBar: { ...(cfg.announcementBar as Obj), [key]: value } as HomeConfig["announcementBar"] };
    case "header": return { ...cfg, header: { ...(cfg.header as Obj), [key]: value } as HomeConfig["header"] };
    case "footer": return { ...cfg, footer: { ...(cfg.footer as Obj), [key]: value } as HomeConfig["footer"] };
    case "content": {
      const cur = cfg.sections?.[def.id] || {};
      return { ...cfg, sections: { ...(cfg.sections || {}), [def.id]: { ...cur, content: { ...(cur.content || {}), [key]: value } } } };
    }
    default: return cfg;
  }
}

export function readItems(cfg: HomeConfig, def: SectionDef): Obj[] {
  if (!def.items) return [];
  if (def.kind === "banners") return ((cfg.banners as unknown as Obj[]) || []);
  const v = cfg.sections?.[def.id]?.content?.[def.items.key];
  return Array.isArray(v) ? (v as Obj[]) : [];
}

export function writeItems(cfg: HomeConfig, def: SectionDef, items: Obj[]): HomeConfig {
  if (!def.items) return cfg;
  if (def.kind === "banners") return { ...cfg, banners: items as unknown as HomeConfig["banners"] };
  return writeValue(cfg, def, def.items.key, items);
}

export function isSectionVisible(cfg: HomeConfig, def: SectionDef): boolean {
  if (def.kind === "announcement") return cfg.announcementBar?.isEnabled !== false;
  if (def.kind === "banners") return (cfg.banners?.length || 0) > 0;
  return cfg.sections?.[def.id]?.isVisible !== false;
}

export function setSectionVisible(cfg: HomeConfig, def: SectionDef, visible: boolean): HomeConfig {
  if (def.kind === "announcement") return writeValue(cfg, def, "isEnabled", visible);
  const cur = cfg.sections?.[def.id] || {};
  return { ...cfg, sections: { ...(cfg.sections || {}), [def.id]: { ...cur, isVisible: visible } } };
}

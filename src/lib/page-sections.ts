/** Blocs d'une page personnalisée (texte, titre, image, bouton). Validés avant enregistrement et à l'affichage. */
import { safeImageUrl, safeLinkUrl } from "./storefront-home-config";

export type PageBlockType = "heading" | "text" | "image" | "button";

export interface PageBlock {
  id: string;
  type: PageBlockType;
  text?: string;
  imageUrl?: string;
  alt?: string;
  url?: string;
  align?: "left" | "center";
}

export const PAGE_BLOCK_LABELS: Record<PageBlockType, string> = {
  heading: "Titre",
  text: "Texte",
  image: "Image",
  button: "Bouton",
};

export function sanitizePageBlocks(input: unknown): PageBlock[] {
  if (!Array.isArray(input)) return [];
  const out: PageBlock[] = [];
  for (const raw of input) {
    if (out.length >= 40) break;
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const type = r.type;
    if (type !== "heading" && type !== "text" && type !== "image" && type !== "button") continue;
    const id = typeof r.id === "string" && /^[a-z0-9_]{1,40}$/i.test(r.id) ? r.id : `b${out.length}_${Math.random().toString(36).slice(2, 7)}`;
    const b: PageBlock = { id, type };
    if (typeof r.text === "string") b.text = r.text.slice(0, 4000);
    if (typeof r.alt === "string") b.alt = r.alt.slice(0, 200);
    if (typeof r.imageUrl === "string") b.imageUrl = safeImageUrl(r.imageUrl) || "";
    if (typeof r.url === "string") b.url = safeLinkUrl(r.url) || "";
    b.align = r.align === "center" ? "center" : "left";
    out.push(b);
  }
  return out;
}

export function newPageBlock(type: PageBlockType): PageBlock {
  const id = `b_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  switch (type) {
    case "heading": return { id, type, text: "Nouveau titre", align: "left" };
    case "text": return { id, type, text: "Écrivez votre texte ici.", align: "left" };
    case "image": return { id, type, imageUrl: "", alt: "", align: "center" };
    default: return { id, type: "button", text: "Voir les produits", url: "", align: "left" };
  }
}

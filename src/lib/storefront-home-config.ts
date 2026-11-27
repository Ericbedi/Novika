/**
 * Personnalisation de la page d'accueil d'une boutique, enregistrée en base (shops.home_config).
 * Identique sur mobile et navigateur : la vitrine et l'éditeur lisent la même source.
 */
import type { HomeBanner, PageSection, StorefrontData, ThemeFontFamily } from "@/server/data/storefront-types";

export const HOME_FONTS = ["Playfair Display", "Inter", "Poppins", "Montserrat", "Plus Jakarta Sans"] as const;

export interface HomeConfig {
  sections?: Record<string, { isVisible?: boolean; content?: Record<string, unknown> }>;
  announcementBar?: { isEnabled?: boolean; text?: string; linkUrl?: string };
  header?: { showSearch?: boolean; logoUrl?: string };
  footer?: { tagline?: string; copyright?: string };
  typography?: { fontFamily?: string; headingFont?: string };
  colors?: { primary?: string; background?: string; text?: string };
  banners?: HomeBanner[];
  order?: string[];
}

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Image acceptée : adresse https ou chemin du site, jamais d'image intégrée ni de script. */
export const safeImageUrl = (v: unknown): string | undefined =>
  typeof v === "string" && v.length <= 600 && (/^https:\/\//i.test(v) || /^\/(?!\/)/.test(v)) ? v : undefined;
/** Lien accepté : chemin du site, https ou lien WhatsApp. */
export const safeLinkUrl = (v: unknown): string | undefined =>
  typeof v === "string" && v.length <= 600 && (/^https:\/\//i.test(v) || /^\/(?!\/)/.test(v) || /^#/.test(v)) ? v : undefined;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

/** Ne garde que les champs connus, avec des longueurs bornées (la configuration est publique). */
export function sanitizeHomeConfig(input: unknown): HomeConfig {
  const c = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const out: HomeConfig = {};

  if (c.sections && typeof c.sections === "object") {
    out.sections = {};
    for (const [id, v] of Object.entries<any>(c.sections).slice(0, 20)) {
      if (!/^[a-z0-9_]{1,40}$/.test(id) || !v || typeof v !== "object") continue;
      const entry: { isVisible?: boolean; content?: Record<string, unknown> } = {};
      if (typeof v.isVisible === "boolean") entry.isVisible = v.isVisible;
      if (v.content && typeof v.content === "object") {
        const content: Record<string, unknown> = {};
        for (const [k, val] of Object.entries<any>(v.content).slice(0, 30)) {
          if (!/^[A-Za-z0-9_]{1,40}$/.test(k)) continue;
          if (typeof val === "string") {
            if (val.startsWith("data:")) continue; // jamais d'image intégrée dans la configuration
            content[k] = val.slice(0, 4000);
          }
          else if (typeof val === "number" || typeof val === "boolean") content[k] = val;
          else if (Array.isArray(val)) {
            content[k] = val.slice(0, 12).map((it) =>
              it && typeof it === "object"
                ? Object.fromEntries(
                    Object.entries<any>(it)
                      .slice(0, 8)
                      .filter(([ik, iv]) => /^[A-Za-z0-9_]{1,30}$/.test(ik) && ["string", "number", "boolean"].includes(typeof iv))
                      .map(([ik, iv]) => [ik, typeof iv === "string" ? iv.slice(0, 600) : iv])
                  )
                : String(it).slice(0, 600)
            );
          }
        }
        entry.content = content;
      }
      out.sections[id] = entry;
    }
  }

  if (c.announcementBar && typeof c.announcementBar === "object") {
    out.announcementBar = {};
    if (typeof c.announcementBar.isEnabled === "boolean") out.announcementBar.isEnabled = c.announcementBar.isEnabled;
    const t = str(c.announcementBar.text, 200);
    if (t !== undefined) out.announcementBar.text = t;
    const l = str(c.announcementBar.linkUrl, 300);
    if (l !== undefined) out.announcementBar.linkUrl = l;
  }
  if (c.header && typeof c.header === "object") {
    out.header = {};
    if (typeof c.header.showSearch === "boolean") out.header.showSearch = c.header.showSearch;
    const u = str(c.header.logoUrl, 500);
    if (u !== undefined) out.header.logoUrl = u;
  }
  if (c.footer && typeof c.footer === "object") {
    out.footer = {};
    const t = str(c.footer.tagline, 200);
    if (t !== undefined) out.footer.tagline = t;
    const cp = str(c.footer.copyright, 200);
    if (cp !== undefined) out.footer.copyright = cp;
  }
  if (c.typography && typeof c.typography === "object") {
    out.typography = {};
    for (const k of ["fontFamily", "headingFont"] as const) {
      if ((HOME_FONTS as readonly string[]).includes(c.typography[k])) out.typography[k] = c.typography[k];
    }
  }
  if (Array.isArray(c.banners)) {
    out.banners = [];
    for (const b of c.banners) {
      if (out.banners.length >= 5) break;
      const imageUrl = safeImageUrl(b?.imageUrl);
      if (!imageUrl) continue;
      const id = typeof b.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(b.id) ? b.id : `bn_${out.banners.length + 1}`;
      out.banners.push({
        id,
        imageUrl,
        ...(safeImageUrl(b.mobileImageUrl) ? { mobileImageUrl: safeImageUrl(b.mobileImageUrl) } : {}),
        ...(safeLinkUrl(b.linkUrl) ? { linkUrl: safeLinkUrl(b.linkUrl) } : {}),
        ...(str(b.altText, 160) ? { altText: str(b.altText, 160) } : {}),
      });
    }
  }
  if (Array.isArray(c.order)) {
    out.order = c.order.filter((x: unknown): x is string => typeof x === "string" && /^[a-z0-9_]{1,40}$/.test(x)).slice(0, 20);
  }
  if (c.colors && typeof c.colors === "object") {
    out.colors = {};
    for (const k of ["primary", "background", "text"] as const) {
      if (typeof c.colors[k] === "string" && HEX.test(c.colors[k])) out.colors[k] = c.colors[k];
    }
  }
  return out;
}

/** Applique la personnalisation enregistrée sur la vitrine par défaut. */
export function applyHomeConfig(storefront: StorefrontData, raw: unknown): StorefrontData {
  const cfg = sanitizeHomeConfig(raw);
  if (!Object.keys(cfg).length) return storefront;

  const sections: PageSection[] = (storefront.sections || []).map((s) => {
    const o = cfg.sections?.[s.id];
    if (!o) return s;
    return {
      ...s,
      isVisible: o.isVisible ?? s.isVisible,
      content: { ...s.content, ...(o.content || {}) },
    };
  });

  const theme = (t: StorefrontData["activeTheme"]) => ({
    ...t,
    colors: { ...t.colors, ...(cfg.colors?.primary ? { primary: cfg.colors.primary, secondary: cfg.colors.primary } : {}), ...(cfg.colors?.background ? { background: cfg.colors.background, cardBackground: cfg.colors.background } : {}), ...(cfg.colors?.text ? { text: cfg.colors.text } : {}) },
    typography: {
      ...t.typography,
      ...(cfg.typography?.fontFamily ? { fontFamily: cfg.typography.fontFamily as ThemeFontFamily } : {}),
      ...(cfg.typography?.headingFont ? { headingFont: cfg.typography.headingFont as ThemeFontFamily } : {}),
    },
  });

  return {
    ...storefront,
    sections,
    activeTheme: theme(storefront.activeTheme),
    draftTheme: theme(storefront.draftTheme),
    announcementBar: { ...storefront.announcementBar, ...(cfg.announcementBar || {}) },
    header: { ...storefront.header, ...(cfg.header || {}) },
    footer: { ...(storefront.footer || {}), ...(cfg.footer || {}) },
    homeBanners: cfg.banners ?? storefront.homeBanners ?? [],
    homeOrder: cfg.order ?? storefront.homeOrder,
  };
}

/** Pile de polices CSS pour chaque police proposée (chargées dans le layout racine). */
export function storefrontFontStack(font?: string): string {
  switch (font) {
    case "Playfair Display":
      return 'var(--font-playfair), "Playfair Display", Georgia, serif';
    case "Poppins":
      return 'var(--font-poppins), "Poppins", system-ui, sans-serif';
    case "Montserrat":
      return 'var(--font-montserrat), "Montserrat", system-ui, sans-serif';
    case "Plus Jakarta Sans":
      return 'var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif';
    default:
      return 'var(--font-inter), "Inter", system-ui, sans-serif';
  }
}

/** Extrait la personnalisation (textes, visibilité, police, couleurs) d'une vitrine modifiée dans l'éditeur. */
export function buildHomeConfig(sf: StorefrontData): HomeConfig {
  const sections: NonNullable<HomeConfig["sections"]> = {};
  for (const s of sf.sections || []) sections[s.id] = { isVisible: s.isVisible, content: s.content as Record<string, unknown> };
  return sanitizeHomeConfig({
    sections,
    announcementBar: { isEnabled: sf.announcementBar?.isEnabled, text: sf.announcementBar?.text, linkUrl: sf.announcementBar?.linkUrl },
    header: { showSearch: sf.header?.showSearch, logoUrl: sf.header?.logoUrl },
    footer: { tagline: sf.footer?.tagline, copyright: sf.footer?.copyright },
    typography: { fontFamily: sf.activeTheme?.typography?.fontFamily, headingFont: sf.activeTheme?.typography?.headingFont },
    banners: sf.homeBanners,
    order: sf.homeOrder,
    colors: { primary: sf.activeTheme?.colors?.primary, background: sf.activeTheme?.colors?.background, text: sf.activeTheme?.colors?.text },
  });
}

/** Enregistre la personnalisation en base (identique sur mobile et navigateur). */
export async function saveHomeConfig(storeSlug: string, config: HomeConfig): Promise<boolean> {
  try {
    const r = await fetch("/api/stores/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeSlug, config }),
    });
    const d = await r.json();
    return !!d?.success;
  } catch {
    return false;
  }
}

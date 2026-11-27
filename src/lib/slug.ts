/** Slug d'URL propre : minuscules, sans accents ni symboles (™, ®, –, emoji…), tirets simples, 80 caractères max. */
export function cleanSlug(input: string, fallback = "produit"): string {
  const s = String(input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || fallback;
}

/** Décode un identifiant d'URL (même encodé deux fois) sans jamais lever d'erreur. */
export function safeDecode(v: string): string {
  let out = String(v || "");
  for (let i = 0; i < 2; i++) {
    try {
      const d = decodeURIComponent(out);
      if (d === out) break;
      out = d;
    } catch {
      break;
    }
  }
  return out;
}

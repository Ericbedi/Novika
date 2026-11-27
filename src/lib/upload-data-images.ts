import type { Product } from "@/server/data/types";

/**
 * Les images ajoutées à un produit sont d'abord conservées en base64 dans le navigateur.
 * Ces fonctions les envoient vers le stockage réel (adresse publique), indispensable pour que
 * la vitrine, le catalogue et les autres appareils puissent les afficher.
 */

export const isDataImage = (u: unknown): u is string => typeof u === "string" && u.startsWith("data:image/");

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/gif" ? "gif" : blob.type === "image/jpeg" ? "jpg" : "webp";
  return new File([blob], `${name}.${ext}`, { type: blob.type });
}

/** Envoie une image base64 vers le stockage ; renvoie l'adresse publique, ou null en cas d'échec. */
export async function uploadDataImage(storeSlug: string, dataUrl: string, altText = ""): Promise<string | null> {
  try {
    const file = await dataUrlToFile(dataUrl, "produit");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("storeSlug", storeSlug);
    fd.append("altText", altText);
    fd.append("contextType", "product");
    const res = await fetch("/api/media/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    const url: string | undefined = data?.url || data?.media?.url || data?.file?.url;
    return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Remplace les images base64 d'un produit (images + mediaItems) par des adresses publiques.
 * Renvoie le produit mis à jour et `changed` si au moins une image a été envoyée.
 */
export async function ensureProductImagesRemote(
  storeSlug: string,
  product: Product
): Promise<{ product: Product; changed: boolean; failed: number }> {
  const cache = new Map<string, string | null>();
  const resolve = async (u: string, alt: string) => {
    if (!cache.has(u)) cache.set(u, await uploadDataImage(storeSlug, u, alt));
    return cache.get(u) ?? null;
  };

  let changed = false;
  let failed = 0;
  const title = (product as { title?: string }).title || product.name || "Produit";

  const images: string[] = [];
  for (const u of product.images || []) {
    if (isDataImage(u)) {
      const url = await resolve(u, title);
      if (url) {
        images.push(url);
        changed = true;
      } else {
        images.push(u);
        failed++;
      }
    } else images.push(u);
  }

  const items = (product as { mediaItems?: { url: string }[] }).mediaItems;
  let mediaItems = items;
  if (Array.isArray(items)) {
    mediaItems = [];
    for (const m of items) {
      if (isDataImage(m?.url)) {
        const url = await resolve(m.url, title);
        mediaItems.push(url ? { ...m, url } : m);
        if (url) changed = true;
      } else mediaItems.push(m);
    }
  }

  if (!changed) return { product, changed: false, failed };
  return { product: { ...product, images, ...(mediaItems ? { mediaItems } : {}) } as Product, changed: true, failed };
}

/** Envoie les images base64 d'une liste de produits (au plus `limit` produits par appel). */
export async function ensureListImagesRemote(
  storeSlug: string,
  products: Product[],
  limit = 50
): Promise<{ products: Product[]; changed: boolean; failed: number }> {
  let changed = false;
  let failed = 0;
  let done = 0;
  const out: Product[] = [];
  for (const p of products) {
    const hasData =
      (p.images || []).some(isDataImage) ||
      ((p as { mediaItems?: { url: string }[] }).mediaItems || []).some((m) => isDataImage(m?.url));
    if (hasData && done < limit) {
      done++;
      const r = await ensureProductImagesRemote(storeSlug, p);
      failed += r.failed;
      if (r.changed) changed = true;
      out.push(r.product);
    } else out.push(p);
  }
  return { products: out, changed, failed };
}

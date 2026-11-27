import type { Product } from "@/server/data/types";
import { getShopProductsRaw, saveShopProductsList } from "@/lib/products-store";
import { ensureListImagesRemote } from "@/lib/upload-data-images";
import { shortSlug } from "@/lib/slug";

export interface PublishResult {
  ok: boolean;
  /** Nouveaux produits réellement mis en ligne */
  count: number;
  error?: string;
}

/**
 * Met en ligne (base de données) tous les produits actifs de la boutique qui ne sont pas masqués.
 * Sans cela, un produit n'existe que sur l'appareil où il a été créé : introuvable depuis un téléphone ou par un client.
 * L'envoi est idempotent : un produit déjà en ligne est seulement mis à jour.
 */
export async function publishActiveProducts(storeSlug: string, role?: string): Promise<PublishResult> {
  try {
    let all = getShopProductsRaw(storeSlug) as Product[];
    // Adresses démesurées (> 60 caractères) : raccourcies une fois, sans collision avec une autre fiche
    if (all.some((p) => p?.slug && p.slug.length > 60)) {
      const used = new Set(all.map((p) => (p?.slug || "").toLowerCase()));
      all = all.map((p) => {
        if (!p?.slug || p.slug.length <= 60) return p;
        let next = shortSlug(p.slug);
        let n = 2;
        while (used.has(next) && next !== p.slug) next = `${shortSlug(p.slug).slice(0, 36)}-${n++}`;
        used.add(next);
        return { ...p, slug: next };
      });
      saveShopProductsList(storeSlug, all);
    }
    const active = all.filter(
      (p) => p && !p.deletedAt && (p.productStatus || "active") === "active" && p.published_to_storefront !== false && !p.hiddenFromCatalog
    );
    if (active.length === 0) return { ok: true, count: 0 };
    const rescued = await ensureListImagesRemote(storeSlug, active);
    if (rescued.changed) {
      const byId = new Map(rescued.products.map((p) => [p.id, p]));
      saveShopProductsList(storeSlug, all.map((p) => byId.get(p.id) || p));
    }
    const res = await fetch("/api/products/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeSlug, products: rescued.products, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) return { ok: false, count: 0, error: data.error || "Publication impossible." };
    return { ok: true, count: Number(data.report?.synced_count) || 0 };
  } catch {
    return { ok: false, count: 0, error: "Connexion impossible." };
  }
}

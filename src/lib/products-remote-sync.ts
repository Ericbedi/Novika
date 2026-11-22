import type { Product } from "@/server/data/types";
import { getShopProductsRaw, saveShopProductsList } from "@/lib/products-store";

/**
 * Synchronisation du catalogue admin entre appareils (mobile / navigateur).
 * Le catalogue reste en cache local (rapide, hors-ligne) mais la base est la référence partagée.
 */

type RemoteItem = (Product & { __deleted?: boolean }) | { id: string; __deleted: true; updatedAt?: string };

const pending = new Map<string, Map<string, unknown>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function stripHeavy(value: unknown): unknown {
  if (typeof value === "string") return value.startsWith("data:") ? "" : value;
  if (Array.isArray(value)) {
    return value
      .map(stripHeavy)
      .filter((v) => !(typeof v === "string" && v === "" ));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripHeavy(v);
    return out;
  }
  return value;
}

/** File d'attente d'envoi (regroupée) : produits modifiés et suppressions. */
export function queueRemoteProducts(shopSlug: string, items: unknown[]): void {
  if (typeof window === "undefined" || items.length === 0) return;
  let map = pending.get(shopSlug);
  if (!map) {
    map = new Map();
    pending.set(shopSlug, map);
  }
  for (const it of items) {
    const id = (it as { id?: string }).id;
    if (id) map.set(id, stripHeavy(it));
  }
  const prev = timers.get(shopSlug);
  if (prev) clearTimeout(prev);
  timers.set(
    shopSlug,
    setTimeout(() => void flushRemoteProducts(shopSlug), 800)
  );
}

export async function flushRemoteProducts(shopSlug: string): Promise<void> {
  const map = pending.get(shopSlug);
  if (!map || map.size === 0) return;
  const batch = Array.from(map.values());
  map.clear();
  try {
    const res = await fetch("/api/products/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeSlug: shopSlug, products: batch }),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    // En cas d'échec (hors-ligne, session expirée) : on remet en file pour la prochaine tentative
    const m = pending.get(shopSlug) ?? new Map();
    for (const it of batch) {
      const id = (it as { id?: string }).id;
      if (id && !m.has(id)) m.set(id, it);
    }
    pending.set(shopSlug, m);
  }
}

const ts = (v?: string) => (v ? Date.parse(v) || 0 : 0);

/** Récupère le catalogue partagé et le fusionne avec le cache local (le plus récent gagne). */
export async function pullAndMergeProducts(shopSlug: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  let remote: RemoteItem[] = [];
  try {
    const res = await fetch(`/api/products/store?storeSlug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.products)) return false;
    remote = data.products;
  } catch {
    return false;
  }

  const local = getShopProductsRaw(shopSlug);
  const byId = new Map<string, Product>(local.map((p) => [p.id, p]));
  const remoteIds = new Set<string>();
  let changed = false;

  for (const r of remote) {
    remoteIds.add(r.id);
    const l = byId.get(r.id);
    if ((r as { __deleted?: boolean }).__deleted) {
      if (l) {
        byId.delete(r.id);
        changed = true;
      }
      continue;
    }
    const rp = r as Product;
    if (!l) {
      byId.set(rp.id, rp);
      changed = true;
    } else if (ts(rp.updatedAt) > ts(l.updatedAt)) {
      // Conserve les images locales (base64) si la version distante n'en a pas
      const images = rp.images && rp.images.length ? rp.images : l.images;
      byId.set(rp.id, { ...rp, images });
      changed = true;
    }
  }

  if (changed) {
    saveShopProductsList(shopSlug, Array.from(byId.values()), { fromRemote: true });
  }

  // Produits présents seulement ici (ou plus récents ici) : envoyés au partage
  const toPush = Array.from(byId.values()).filter((p) => {
    if (!remoteIds.has(p.id)) return true;
    const r = remote.find((x) => x.id === p.id) as Product | undefined;
    return r && !(r as { __deleted?: boolean }).__deleted && ts(p.updatedAt) > ts(r.updatedAt);
  });
  if (toPush.length) queueRemoteProducts(shopSlug, toPush);

  return changed;
}

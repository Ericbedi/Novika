/** Résolution d'un nom de domaine vers sa boutique (utilisée par le middleware, compatible Edge). */

export interface HostMatch {
  storeSlug: string;
  isPrimary: boolean;
  redirectToPrimary?: boolean;
  primaryDomain?: string;
}

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: HostMatch | null }>();

export async function resolveHostToShop(rawHost: string): Promise<HostMatch | null> {
  const host = rawHost.toLowerCase().split(":")[0].trim();
  if (!/^[a-z0-9.-]{3,253}$/.test(host)) return null;
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/shop_domain_resolve`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_host: host }),
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return null; // erreur temporaire : on ne met pas en cache
    const d = await r.json();
    const value: HostMatch | null = d?.slug
      ? { storeSlug: d.slug, isPrimary: !!d.isPrimary, redirectToPrimary: !!d.redirectToPrimary, primaryDomain: d.primaryDomain || undefined }
      : null;
    cache.set(host, { at: Date.now(), value });
    if (cache.size > 500) cache.clear();
    return value;
  } catch {
    return null;
  }
}

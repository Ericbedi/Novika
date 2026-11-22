import { permanentRedirect } from "next/navigation";

/**
 * Route historique singulière (/boutique/[store]/produit/[id]).
 * Redirige définitivement (301/308) vers la route canonique plurielle
 * (/boutique/[store]/produits/[id]) en conservant les paramètres (utm_*, fbclid…).
 * Composant serveur : aucun import de module serveur dans un composant client.
 */
export default async function LegacySingularProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { store, id } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp || {})) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value !== undefined) qs.set(key, value);
  }
  const query = qs.toString() ? `?${qs.toString()}` : "";
  permanentRedirect(`/boutique/${encodeURIComponent(store)}/produits/${encodeURIComponent(id)}${query}`);
}
